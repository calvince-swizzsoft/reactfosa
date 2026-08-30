import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaLink } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";
import FieldHelp from "../SavingsProducts/FieldHelp";
import { ChargeType } from "../lib/chargeType";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts`;
const WELL_KNOWN_BASE = `${BASE}/well-known-charges`;

function FieldGroup({ label, help, children }) {
  return <div><div className="mb-1 flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}

export default function WellKnownCharges() {
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [systemTransactionType, setSystemTransactionType] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [complementType, setComplementType] = useState(ChargeType.Percentage);
  const [complementPercentage, setComplementPercentage] = useState(0);
  const [complementFixedAmount, setComplementFixedAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiJson(`${WELL_KNOWN_BASE}/transaction-types`),
      apiJson(`${BASE}/commissions`),
    ]).then(([typeData, commissionData]) => {
      setTransactionTypes(normalizeList(typeData));
      setCommissions(normalizeList(commissionData).filter((item) => !item.IsLocked));
    }).catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load well-known charge configuration."), "error"))
      .finally(() => setLoading(false));
  }, []);

  const selectTransactionType = async (value) => {
    setSystemTransactionType(value);
    setSelectedIds(new Set());
    setComplementType(ChargeType.Percentage);
    setComplementPercentage(0);
    setComplementFixedAmount(0);
    setLoadingMapping(true);
    try {
      const response = await apiJson(`${WELL_KNOWN_BASE}/${value}`);
      const mapping = response?.data ?? response;
      const availableIds = new Set(commissions.map((item) => item.Id));
      setSelectedIds(new Set((mapping?.CommissionIds || []).filter((id) => availableIds.has(id))));
      setComplementType(mapping?.ComplementType ?? ChargeType.Percentage);
      setComplementPercentage(Number(mapping?.ComplementPercentage) || 0);
      setComplementFixedAmount(Number(mapping?.ComplementFixedAmount) || 0);
    } catch (error) {
      Swal.fire("Load Error", apiErrorMessage(error, "Unable to load the selected transaction mapping."), "error");
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
    if (!systemTransactionType) {
      Swal.fire("Transaction Type Required", "Select a predefined system transaction type.", "warning");
      return;
    }
    if (selectedIds.size === 0) {
      Swal.fire("Charge Required", "Select at least one applicable charge.", "warning");
      return;
    }
    const value = complementType === ChargeType.Percentage ? complementPercentage : complementFixedAmount;
    if (!Number.isFinite(value) || value <= 0 || (complementType === ChargeType.Percentage && value > 100)) {
      Swal.fire("Invalid Contribution", complementType === ChargeType.Percentage ? "Employer contribution must be greater than 0% and no more than 100%." : "Employer contribution must be greater than zero.", "warning");
      return;
    }

    setSaving(true);
    try {
      const response = await apiJson(`${WELL_KNOWN_BASE}/${systemTransactionType}`, {
        method: "PUT",
        body: JSON.stringify({
          CommissionIds: [...selectedIds],
          ComplementType: complementType,
          ComplementPercentage: complementType === ChargeType.Percentage ? complementPercentage : 0,
          ComplementFixedAmount: complementType === ChargeType.FixedAmount ? complementFixedAmount : 0,
        }),
      });
      Swal.fire("Success", response?.message || "Well-known charges updated successfully.", "success");
    } catch (error) {
      Swal.fire("Update Failed", apiErrorMessage(error, "Unable to update well-known charges."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-indigo-800 px-6 py-3">
        <FaLink className="text-xl text-white" />
        <div><h1 className="text-xl font-bold text-white">Well-Known Charges</h1><p className="text-xs text-indigo-100">Link predefined system events to operational charges and employer contributions.</p></div>
      </div>

      <form onSubmit={save} className="max-w-3xl space-y-6">
        <FieldGroup label="System Transaction Type" help="A predefined event recognised by the domain, such as PAYE, NSSF, NHIF, provident fund, or membership termination processing. The mapping tells the system which configured charges apply to that event.">
          <Select value={systemTransactionType} onValueChange={selectTransactionType} disabled={loading}>
            <SelectTrigger><SelectValue placeholder={loading ? "Loading transaction types..." : "Select transaction type"} /></SelectTrigger>
            <SelectContent className="max-h-72 overflow-y-auto">{transactionTypes.map((item) => <SelectItem key={item.Value} value={String(item.Value)}>{item.Description}</SelectItem>)}</SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label={`Applicable Charges${selectedIds.size ? ` (${selectedIds.size} selected)` : ""}`} help="Existing Accounts charges that will be evaluated for the selected system transaction. Locked charges are excluded because the tariff engine skips them.">
          <PickerList items={commissions} selectedIds={selectedIds} onToggle={toggleCommission} getLabel={(item) => item.Description} getSublabel={(item) => item.MaximumCharge > 0 ? `Maximum ${item.MaximumCharge}` : "Uncapped"} emptyText={loading ? "Loading charges..." : "No unlocked charges are available."} />
        </FieldGroup>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldGroup label="Employer Contribution Type" help="Defines the complementary employer contribution stored with this transaction mapping. It is separate from the customer charge and is consumed by payroll statutory-contribution processing.">
            <Select value={String(complementType)} onValueChange={(value) => { setComplementType(Number(value)); setComplementPercentage(0); setComplementFixedAmount(0); }} disabled={!systemTransactionType || loadingMapping}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={String(ChargeType.Percentage)}>Percentage</SelectItem><SelectItem value={String(ChargeType.FixedAmount)}>Fixed Amount</SelectItem></SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Employer Contribution Value" help={complementType === ChargeType.Percentage ? "Percentage of the applicable payroll chargeable amount contributed by the employer." : "Fixed monetary amount contributed by the employer for this system transaction."}>
            <Input type="number" min="0" max={complementType === ChargeType.Percentage ? "100" : undefined} step="0.01" disabled={!systemTransactionType || loadingMapping} value={complementType === ChargeType.Percentage ? complementPercentage : complementFixedAmount} onChange={(event) => complementType === ChargeType.Percentage ? setComplementPercentage(Number(event.target.value)) : setComplementFixedAmount(Number(event.target.value))} />
          </FieldGroup>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Selecting another transaction type loads its current mapping. Updating performs a full replacement for that transaction type.</div>
        <Button type="submit" disabled={loading || loadingMapping || saving || !systemTransactionType} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Updating..." : "Update Well-Known Charges"}</Button>
      </form>
    </div>
  );
}
