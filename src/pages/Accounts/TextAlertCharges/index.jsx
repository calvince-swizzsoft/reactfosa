import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaSms } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";
import FieldHelp from "../SavingsProducts/FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts`;
const ENDPOINT = `${BASE}/text-alert-charges`;

function FieldGroup({ label, help, children }) {
  return <div><div className="mb-1 flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}

export default function TextAlertCharges() {
  const [options, setOptions] = useState({ TransactionCodes: [], ChargeBenefactors: [] });
  const [commissions, setCommissions] = useState([]);
  const [transactionCode, setTransactionCode] = useState("");
  const [chargeBenefactor, setChargeBenefactor] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([apiJson(`${ENDPOINT}/options`), apiJson(`${BASE}/commissions`)]).then(([optionResponse, commissionResponse]) => {
      setOptions(optionResponse?.data ?? optionResponse);
      setCommissions(normalizeList(commissionResponse).filter((item) => !item.IsLocked));
    }).catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load text alert charge configuration."), "error"))
      .finally(() => setLoading(false));
  }, []);

  const selectTransactionCode = async (value) => {
    setTransactionCode(value);
    setSelectedIds(new Set());
    setChargeBenefactor(0);
    setLoadingMapping(true);
    try {
      const response = await apiJson(`${ENDPOINT}/${value}`);
      const mapping = response?.data ?? response;
      const availableIds = new Set(commissions.map((item) => item.Id));
      setSelectedIds(new Set((mapping?.CommissionIds || []).filter((id) => availableIds.has(id))));
      setChargeBenefactor(Number(mapping?.ChargeBenefactor ?? 0));
    } catch (error) {
      Swal.fire("Load Error", apiErrorMessage(error, "Unable to load the selected text alert charge mapping."), "error");
    } finally {
      setLoadingMapping(false);
    }
  };

  const toggleCommission = (id) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const save = async (event) => {
    event.preventDefault();
    if (transactionCode === "") return Swal.fire("Transaction Required", "Select a system transaction.", "warning");
    if (!options.TransactionCodes.some((item) => item.Value === Number(transactionCode))) return Swal.fire("Invalid Transaction", "Select a supported system transaction.", "warning");
    if (!options.ChargeBenefactors.some((item) => item.Value === chargeBenefactor)) return Swal.fire("Charge Bearer Required", "Select who bears the text alert charges.", "warning");
    if (selectedIds.size === 0) return Swal.fire("Charge Required", "Select at least one applicable charge.", "warning");

    setSaving(true);
    try {
      const response = await apiJson(`${ENDPOINT}/${transactionCode}`, { method: "PUT", body: JSON.stringify({ CommissionIds: [...selectedIds], ChargeBenefactor: chargeBenefactor }) });
      Swal.fire("Success", response?.message || "Text alert charges updated successfully.", "success");
    } catch (error) {
      Swal.fire("Update Failed", apiErrorMessage(error, "Unable to update text alert charges."), "error");
    } finally {
      setSaving(false);
    }
  };

  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-indigo-800 px-6 py-3"><FaSms className="text-xl text-white" /><div><h1 className="text-xl font-bold text-white">Text Alert Charges</h1><p className="text-xs text-indigo-100">Map SMS-triggering system events to their applicable charges.</p></div></div>
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <FieldGroup label="System Transaction" help="The business event whose text alert invokes this charge mapping. The available values come directly from the backend SystemTransactionCode domain enum.">
        <Select value={transactionCode} onValueChange={selectTransactionCode} disabled={loading}><SelectTrigger><SelectValue placeholder={loading ? "Loading transactions..." : "Select a system transaction"} /></SelectTrigger><SelectContent className="max-h-72 overflow-y-auto">{options.TransactionCodes.map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select>
      </FieldGroup>
      <FieldGroup label={`Applicable Charges${selectedIds.size ? ` (${selectedIds.size} selected)` : ""}`} help="Existing unlocked Accounts charges whose graduated scales, caps, rounding, G/L splits, and linked levies are evaluated for this text alert event.">
        <PickerList items={commissions} selectedIds={selectedIds} onToggle={toggleCommission} getLabel={(item) => item.Description} getSublabel={(item) => item.MaximumCharge > 0 ? `Maximum ${item.MaximumCharge}` : "Uncapped"} emptyText={loading ? "Loading charges..." : "No unlocked charges are available."} />
      </FieldGroup>
      <FieldGroup label="Charges Borne By" help="Customer debits the customer's product G/L account. Institution debits the institution settlement G/L account. The current domain supports one bearer for all charges in a transaction mapping.">
        <Select value={String(chargeBenefactor)} onValueChange={(value) => setChargeBenefactor(Number(value))} disabled={transactionCode === "" || loadingMapping}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.ChargeBenefactors.map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select>
      </FieldGroup>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Updating fully replaces the selected transaction's charge mapping. Locked charges cannot be assigned and are skipped by the tariff engine.</div>
      <Button type="submit" disabled={loading || loadingMapping || saving || transactionCode === ""} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Updating..." : "Update Text Alert Charges"}</Button>
    </form>
  </div>;
}
