import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";
import FieldHelp from "./FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const PRODUCTS_BASE = `${BASE}/api/accounts/savingsproducts`;

function FieldGroup({ label, help, children }) {
  return <div><div className="mb-1 flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}

function dataOf(response) {
  return response?.data ?? response?.Data ?? response;
}

export function SavingsProductCharges({ productId }) {
  const [options, setOptions] = useState({ ChargeTypes: [], ChargeBenefactors: [] });
  const [commissions, setCommissions] = useState([]);
  const [knownChargeType, setKnownChargeType] = useState("");
  const [chargeBenefactor, setChargeBenefactor] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiJson(`${PRODUCTS_BASE}/configuration-options`),
      apiJson(`${BASE}/api/accounts/commissions`),
    ]).then(([optionResponse, commissionResponse]) => {
      setOptions(dataOf(optionResponse));
      setCommissions(normalizeList(commissionResponse).filter((item) => !item.IsLocked));
    }).catch((error) => Swal.fire("Unable to Load Charges", apiErrorMessage(error, "Unable to load savings-product charge configuration."), "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (knownChargeType === "") { setSelectedIds(new Set()); return; }
    setLoadingMapping(true);
    apiJson(`${PRODUCTS_BASE}/${productId}/commissions?knownChargeType=${knownChargeType}`)
      .then((response) => {
        const mapping = dataOf(response);
        const availableIds = new Set(commissions.map((item) => item.Id));
        setSelectedIds(new Set((mapping?.CommissionIds ?? []).filter((id) => availableIds.has(id))));
        setChargeBenefactor(Number(mapping?.ChargeBenefactor ?? 0));
      })
      .catch((error) => Swal.fire("Unable to Load Mapping", apiErrorMessage(error, "Unable to load this savings-product charge mapping."), "error"))
      .finally(() => setLoadingMapping(false));
  }, [knownChargeType, productId, commissions]);

  const toggle = (id) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const save = async () => {
    if (knownChargeType === "") return Swal.fire("Charge Type Required", "Select the savings-product event to configure.", "warning");
    if (!options.ChargeBenefactors?.some((item) => item.Value === chargeBenefactor)) return Swal.fire("Charge Bearer Required", "Select who bears the charges.", "warning");
    setSaving(true);
    try {
      const response = await apiJson(`${PRODUCTS_BASE}/${productId}/commissions`, {
        method: "PUT",
        body: JSON.stringify({ KnownChargeType: Number(knownChargeType), ChargeBenefactor: chargeBenefactor, CommissionIds: [...selectedIds] }),
      });
      Swal.fire("Charges Updated", response?.message || "Savings-product charges updated successfully.", "success");
    } catch (error) {
      Swal.fire("Unable to Update Charges", apiErrorMessage(error, "Unable to update savings-product charges."), "error");
    } finally { setSaving(false); }
  };

  return <div className="space-y-4">
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Each charge type is saved independently. Saving an empty selection clears the mapping for the selected event.</div>
    <FieldGroup label="Charge Type" help="The savings-product event that invokes the attached charges, such as deposit, withdrawal, account closure, statement printing, or standing order processing.">
      <Select value={knownChargeType} onValueChange={setKnownChargeType} disabled={loading}><SelectTrigger><SelectValue placeholder="Select charge type" /></SelectTrigger><SelectContent className="max-h-72 overflow-y-auto">{(options.ChargeTypes ?? []).map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select>
    </FieldGroup>
    <FieldGroup label="Charges Borne By" help="Customer charges the customer/product side; Institution charges the institution side. The selection applies to every charge attached to this event.">
      <Select value={String(chargeBenefactor)} onValueChange={(value) => setChargeBenefactor(Number(value))} disabled={knownChargeType === "" || loadingMapping}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(options.ChargeBenefactors ?? []).map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select>
    </FieldGroup>
    <FieldGroup label={`Applicable Charges${selectedIds.size ? ` (${selectedIds.size} selected)` : ""}`} help="Existing unlocked Accounts charges whose graduated scales, limits, G/L splits, and levies will be evaluated for this event.">
      <PickerList items={commissions} selectedIds={selectedIds} onToggle={toggle} getLabel={(item) => item.Description} getSublabel={(item) => item.MaximumCharge > 0 ? `Maximum ${item.MaximumCharge}` : "Uncapped"} emptyText={loading ? "Loading charges..." : "No unlocked charges are available."} />
    </FieldGroup>
    <Button type="button" onClick={save} disabled={loading || loadingMapping || saving || knownChargeType === ""} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving..." : "Save Charge Mapping"}</Button>
  </div>;
}

const numericFields = [
  ["MaximumAllowedWithdrawal", "Maximum withdrawal"], ["MaximumAllowedDeposit", "Maximum deposit"],
  ["MinimumBalance", "Minimum balance"], ["OperatingBalance", "Operating balance"],
  ["WithdrawalNoticeAmount", "Notice amount"], ["WithdrawalNoticePeriod", "Notice period"],
  ["WithdrawalInterval", "Withdrawal interval"], ["AnnualPercentageYield", "APY (%)"],
];

function newExemption(product) {
  return {
    BranchId: "", MaximumAllowedWithdrawal: product.MaximumAllowedWithdrawal ?? 0,
    MaximumAllowedDeposit: product.MaximumAllowedDeposit ?? 0, MinimumBalance: product.MinimumBalance ?? 0,
    OperatingBalance: product.OperatingBalance ?? 0, WithdrawalNoticeAmount: product.WithdrawalNoticeAmount ?? 0,
    WithdrawalNoticePeriod: product.WithdrawalNoticePeriod ?? 0, WithdrawalInterval: product.WithdrawalInterval ?? 0,
    AnnualPercentageYield: product.AnnualPercentageYield ?? 0,
  };
}

function validateExemptions(rows) {
  const errors = [];
  const branchIds = rows.map((row) => row.BranchId).filter(Boolean);
  if (branchIds.length !== new Set(branchIds).size) errors.push("A branch can only have one exemption.");
  rows.forEach((row, index) => {
    const name = `Exemption ${index + 1}`;
    if (!row.BranchId) errors.push(`${name}: branch is required.`);
    numericFields.forEach(([field, label]) => {
      const value = Number(row[field]);
      if (!Number.isFinite(value)) errors.push(`${name}: ${label} must be a valid number.`);
      else if (value < 0) errors.push(`${name}: ${label} cannot be negative.`);
    });
    if (Number(row.MaximumAllowedWithdrawal) <= 0) errors.push(`${name}: maximum withdrawal must be greater than zero.`);
    if (Number(row.MaximumAllowedDeposit) <= 0) errors.push(`${name}: maximum deposit must be greater than zero.`);
    if (Number(row.OperatingBalance) < Number(row.MinimumBalance)) errors.push(`${name}: operating balance cannot be below minimum balance.`);
    if (Number(row.WithdrawalNoticeAmount) > Number(row.MaximumAllowedWithdrawal)) errors.push(`${name}: notice amount cannot exceed maximum withdrawal.`);
    if (Number(row.WithdrawalNoticeAmount) > 0 && Number(row.WithdrawalNoticePeriod) <= 0) errors.push(`${name}: notice period must be positive when a notice amount is configured.`);
    if (!Number.isInteger(Number(row.WithdrawalNoticePeriod)) || !Number.isInteger(Number(row.WithdrawalInterval))) errors.push(`${name}: notice period and withdrawal interval must be whole days.`);
    if (Number(row.WithdrawalNoticePeriod) > 32767 || Number(row.WithdrawalInterval) > 32767) errors.push(`${name}: day values cannot exceed 32,767.`);
    if (Number(row.AnnualPercentageYield) > 100) errors.push(`${name}: APY cannot exceed 100%.`);
  });
  return [...new Set(errors)];
}

export function SavingsProductExemptions({ product }) {
  const [branches, setBranches] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([apiJson(`${BASE}/api/administration/branches/all`), apiJson(`${PRODUCTS_BASE}/${product.Id}/exemptions`)])
      .then(([branchResponse, exemptionResponse]) => {
        setBranches(normalizeList(branchResponse));
        setRows(normalizeList(exemptionResponse));
      }).catch((error) => Swal.fire("Unable to Load Exemptions", apiErrorMessage(error, "Unable to load branch exemptions."), "error"))
      .finally(() => setLoading(false));
  }, [product.Id]);

  const update = (index, field, value) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const remove = (index) => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  const save = async () => {
    const errors = validateExemptions(rows);
    if (errors.length) return Swal.fire({ title: "Review Branch Exemptions", icon: "warning", html: `<div style="text-align:left">${errors.map((message) => `<div>• ${message}</div>`).join("")}</div>` });
    setSaving(true);
    try {
      const payload = rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => numericFields.some(([field]) => field === key) ? [key, Number(value)] : [key, value])));
      const response = await apiJson(`${PRODUCTS_BASE}/${product.Id}/exemptions`, { method: "PUT", body: JSON.stringify(payload) });
      Swal.fire("Exemptions Updated", response?.message || "Branch exemptions updated successfully.", "success");
    } catch (error) {
      Swal.fire("Unable to Update Exemptions", apiErrorMessage(error, "Unable to update branch exemptions."), "error");
    } finally { setSaving(false); }
  };

  return <div className="space-y-4">
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">A branch exemption replaces the product’s default transaction limits, balance rules, notice settings, interval, and APY for that branch. Saving an empty list removes all exemptions.</div>
    {rows.map((row, index) => <div key={row.Id || `${row.BranchId}-${index}`} className="space-y-3 rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-700">Branch exemption {index + 1}</p><Button type="button" variant="outline" size="sm" className="text-red-600" onClick={() => remove(index)}>Remove</Button></div>
      <FieldGroup label="Branch" help="The branch whose values override the product defaults."><Select value={row.BranchId || ""} onValueChange={(value) => update(index, "BranchId", value)}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent>{branches.map((branch) => <SelectItem key={branch.Id} value={branch.Id}>{branch.Code ? `${branch.Code} — ` : ""}{branch.Description}</SelectItem>)}</SelectContent></Select></FieldGroup>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{numericFields.map(([field, label]) => <FieldGroup key={field} label={label} help={`Branch-specific ${label.toLowerCase()} override.`}><Input type="number" min="0" max={field === "AnnualPercentageYield" ? 100 : undefined} step={field === "WithdrawalNoticePeriod" || field === "WithdrawalInterval" ? 1 : "any"} value={row[field] ?? ""} onChange={(event) => update(index, field, event.target.value)} /></FieldGroup>)}</div>
    </div>)}
    {!rows.length && <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">No branch exemptions. Product defaults apply everywhere.</p>}
    <Button type="button" variant="outline" onClick={() => setRows((current) => [...current, newExemption(product)])} disabled={loading}>Add Branch Exemption</Button>
    <Button type="button" onClick={save} disabled={loading || saving} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving..." : "Save Branch Exemptions"}</Button>
  </div>;
}
