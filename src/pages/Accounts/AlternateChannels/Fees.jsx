import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaMobileAlt } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { getAlternateChannelChargeOptions, getAlternateChannelTypeCommissions, replaceAlternateChannelTypeCommissions } from "./api";
import PickerList from "../lib/PickerList";
import FieldHelp from "../SavingsProducts/FieldHelp";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, help, children }) {
  return <div><div className="mb-1 flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}

export default function AlternateChannelFees() {
  const [options, setOptions] = useState({ AlternateChannelTypes: [], KnownChargeTypes: [], ChargeBenefactors: [] });
  const [type, setType] = useState("");
  const [knownChargeType, setKnownChargeType] = useState("");
  const [chargeBenefactor, setChargeBenefactor] = useState(0);
  const [allCommissions, setAllCommissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAlternateChannelChargeOptions(), apiJson(`${FIN_BASE}/api/accounts/commissions`)]).then(([optionData, commissionData]) => {
      setOptions(optionData);
      setAllCommissions(normalizeList(commissionData).filter((item) => !item.IsLocked));
    }).catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load alternate channel charge configuration."), "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (type === "" || knownChargeType === "") return;
    setLoadingMapping(true);
    getAlternateChannelTypeCommissions(type, knownChargeType).then((mapping) => {
      const availableIds = new Set(allCommissions.map((item) => item.Id));
      setSelectedIds(new Set((mapping?.CommissionIds || []).filter((id) => availableIds.has(id))));
      setChargeBenefactor(Number(mapping?.ChargeBenefactor ?? 0));
    }).catch((error) => {
      setSelectedIds(new Set());
      Swal.fire("Load Error", apiErrorMessage(error, "Unable to load the selected charge mapping."), "error");
    }).finally(() => setLoadingMapping(false));
  }, [type, knownChargeType, allCommissions]);

  const toggle = (id) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSave = async (event) => {
    event.preventDefault();
    if (type === "" || !options.AlternateChannelTypes.some((item) => item.Value === Number(type))) return Swal.fire("Channel Required", "Select a supported alternate channel type.", "warning");
    if (knownChargeType === "" || !options.KnownChargeTypes.some((item) => item.Value === Number(knownChargeType))) return Swal.fire("Charge Type Required", "Select a supported alternate channel charge type.", "warning");
    if (!options.ChargeBenefactors.some((item) => item.Value === chargeBenefactor)) return Swal.fire("Charge Bearer Required", "Select who bears the charges.", "warning");
    if (selectedIds.size === 0) return Swal.fire("Applicable Charge Required", "Select at least one applicable charge.", "warning");
    setSaving(true);
    try {
      const response = await replaceAlternateChannelTypeCommissions(type, { knownChargeType: Number(knownChargeType), chargeBenefactor, commissionIds: [...selectedIds] });
      Swal.fire("Success", response?.message || "Alternate channel charges updated successfully.", "success");
    } catch (error) {
      Swal.fire("Update Failed", apiErrorMessage(error, "Unable to update the alternate channel charges."), "error");
    } finally { setSaving(false); }
  };

  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-indigo-800 px-6 py-3"><FaMobileAlt className="text-xl text-white" /><div><h1 className="text-xl font-bold text-white">Alternate Channel Charges</h1><p className="text-xs text-indigo-100">Map alternate-channel operations to charges not determined automatically elsewhere.</p></div></div>
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldGroup label="Alternate Channel Type" help="The third-party or institution-operated banking environment. Every customer link of this channel type shares this charge mapping."><Select value={type} onValueChange={setType} disabled={loading}><SelectTrigger><SelectValue placeholder="Select channel type" /></SelectTrigger><SelectContent>{options.AlternateChannelTypes.map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select></FieldGroup>
        <FieldGroup label="Charge Type" help="The channel operation that invokes the charges, such as withdrawal, deposit, airtime, balance inquiry, linking, renewal, or PIN reset. Sacco Link-specific operations are also supplied by the domain."><Select value={knownChargeType} onValueChange={setKnownChargeType} disabled={loading}><SelectTrigger><SelectValue placeholder="Select charge type" /></SelectTrigger><SelectContent className="max-h-72 overflow-y-auto">{options.KnownChargeTypes.map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select></FieldGroup>
      </div>
      <FieldGroup label="Charges Borne By" help="Customer debits the customer's product G/L account. Institution debits the institution settlement G/L account. This bearer applies to every selected charge in the mapping."><Select value={String(chargeBenefactor)} onValueChange={(value) => setChargeBenefactor(Number(value))} disabled={type === "" || knownChargeType === "" || loadingMapping}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.ChargeBenefactors.map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent></Select></FieldGroup>
      <FieldGroup label={`Applicable Charges${selectedIds.size ? ` (${selectedIds.size} selected)` : ""}`} help="Existing unlocked Accounts charges whose scales, caps, rounding, G/L splits, and levies are applied when this channel operation runs."><PickerList items={allCommissions} selectedIds={selectedIds} onToggle={toggle} getLabel={(item) => item.Description} getSublabel={(item) => item.MaximumCharge > 0 ? `Maximum ${item.MaximumCharge}` : "Uncapped"} emptyText={loading ? "Loading charges..." : "No unlocked charges are available."} /></FieldGroup>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Updating fully replaces the mapping for the selected channel and charge type. Locked charges cannot be assigned and are skipped by tariff calculation.</div>
      <Button type="submit" disabled={loading || loadingMapping || saving || type === "" || knownChargeType === ""} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Updating..." : "Update Alternate Channel Charges"}</Button>
    </form>
  </div>;
}
