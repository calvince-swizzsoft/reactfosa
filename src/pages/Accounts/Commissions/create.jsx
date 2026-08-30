import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPercentage } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, apiJson, apiErrorMessage, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";
import SplitRows from "../lib/SplitRows";
import GraduatedScaleRows from "../lib/GraduatedScaleRows";
import FieldHelp from "../SavingsProducts/FieldHelp";
import { ChargeType } from "../lib/chargeType";

// Areas/Accounts/Controllers/CommissionController.cs — docs/api/commission-api-spec.md §5.4.
// GraduatedScales/Splits/Levies are all OPTIONAL at create — a commission
// can be staged before its rate/split/levy structure is finalized (unlike
// ChequeTypeController's Create, which requires at least one commission
// and product). Splits, when non-empty, must sum to 100% — enforced
// server-side, previewed client-side by SplitRows' own running total.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const COMMISSIONS_BASE = `${BASE}/api/accounts/commissions`;

const ROUNDING_TYPE_OPTIONS = [
  { value: 0, label: "No Rounding" },
  { value: 1, label: "Midpoint To Even" },
  { value: 2, label: "Midpoint Away From Zero" },
  { value: 3, label: "Round Up" },
  { value: 4, label: "Round Down" },
];

const emptyForm = { Description: "", MaximumCharge: 0, RoundingType: 0, IsLocked: false };

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1"><Label>{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>
      {children}
    </div>
  );
}

export default function CreateCommission() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [levies, setLevies] = useState([]);
  const [graduatedScales, setGraduatedScales] = useState([]);
  const [splits, setSplits] = useState([]);
  const [selectedLevyIds, setSelectedLevyIds] = useState(new Set());

  useEffect(() => {
    setLoadingLookups(true);
    Promise.all([
      apiJson(`${BASE}/api/accounts/chartofaccounts?pageSize=1000`),
      apiJson(`${BASE}/api/accounts/levies`),
    ]).then(([coaData, levyData]) => {
      setChartOfAccounts(normalizeList(coaData));
      setLevies(normalizeList(levyData));
    }).catch((error) => {
      setChartOfAccounts([]);
      setLevies([]);
      Swal.fire("Lookup Error", apiErrorMessage(error, "Unable to load G/L accounts and levies."), "error");
    }).finally(() => setLoadingLookups(false));
  }, []);

  const toggleLevy = (id) => setSelectedLevyIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const readinessIssues = [
    ...(graduatedScales.length === 0 ? ["No graduated scale can calculate the charge."] : []),
    ...(selectedLevyIds.size > 0 && !splits.some((row) => row.Leviable) ? ["Linked levies have no Leviable G/L split to use as their calculation base."] : []),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    if (!Number.isFinite(form.MaximumCharge) || form.MaximumCharge < 0) {
      Swal.fire("Invalid Maximum Charge", "Maximum Charge must be zero or a positive amount.", "warning");
      return;
    }
    if (!ROUNDING_TYPE_OPTIONS.some((option) => option.value === form.RoundingType)) {
      Swal.fire("Invalid Rounding Type", "Select a supported rounding type.", "warning");
      return;
    }
    const orderedScales = graduatedScales.map((row) => ({ ...row, lower: Number(row.RangeLowerLimit), upper: Number(row.RangeUpperLimit) })).sort((a, b) => a.lower - b.lower);
    const invalidScale = orderedScales.some((row) => !Number.isFinite(row.lower) || !Number.isFinite(row.upper) || row.lower < 0 || row.upper < row.lower ||
      (row.ChargeType === ChargeType.Percentage && (!Number.isFinite(row.ChargePercentage) || row.ChargePercentage <= 0 || row.ChargePercentage > 100)) ||
      (row.ChargeType === ChargeType.FixedAmount && (!Number.isFinite(row.ChargeFixedAmount) || row.ChargeFixedAmount <= 0)));
    if (invalidScale) {
      Swal.fire("Invalid Graduated Scale", "Each bracket needs a valid non-negative range and a positive percentage or fixed amount for its selected charge type.", "warning");
      return;
    }
    if (orderedScales.some((row, index) => index > 0 && row.lower <= orderedScales[index - 1].upper)) {
      Swal.fire("Overlapping Brackets", "Graduated-scale amount ranges cannot overlap.", "warning");
      return;
    }
    if (splits.some((row) => !row.ChartOfAccountId || !row.Description?.trim() || !Number.isFinite(Number(row.Percentage)) || Number(row.Percentage) <= 0 || Number(row.Percentage) > 100)) {
      Swal.fire("Invalid G/L Split", "Each split needs a G/L account, description, and percentage greater than 0 and no more than 100.", "warning");
      return;
    }
    if (splits.length === 0) {
      Swal.fire("G/L Splits Required", "Add at least one G/L split before creating this charge.", "warning");
      return;
    }
    const splitTotal = splits.reduce((sum, s) => sum + (Number(s.Percentage) || 0), 0);
    if (splits.length > 0 && Math.abs(splitTotal - 100) > 0.01) {
      Swal.fire("Splits Don't Balance", `Split percentages must sum to 100% (currently ${splitTotal}%).`, "warning");
      return;
    }
    if (readinessIssues.length > 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Save as an Incomplete Charge?",
        html: `<div style="text-align:left">${readinessIssues.map((issue) => `<div>• ${issue}</div>`).join("")}<p style="margin-top:12px">The charge can be saved as a draft, but it will not be fully operational until these items are configured.</p></div>`,
        showCancelButton: true,
        confirmButtonText: "Save Incomplete Charge",
        cancelButtonText: "Continue Editing",
        confirmButtonColor: "#4f46e5",
      });
      if (!result.isConfirmed) return;
    }

    setLoading(true);
    try {
      const payload = {
        Commission: form,
        GraduatedScales: graduatedScales,
        Splits: splits,
        Levies: [...selectedLevyIds].map((Id) => ({ Id })),
      };

      const res = await apiFetch(COMMISSIONS_BASE, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to create commission");

      Swal.fire("Success", data.message || "Commission created successfully", "success");
      setForm(emptyForm);
      setGraduatedScales([]);
      setSplits([]);
      setSelectedLevyIds(new Set());
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaPercentage className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Commission</h2>
        </div>
        <Link to="/Accounts/Commissions" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Commissions
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Description" help="The business-facing name used whenever this charge is selected or displayed in a transaction.">
            <Input
              value={form.Description}
              onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
              required
              placeholder="e.g. Cheque Handling Fee"
            />
          </FieldGroup>

          <FieldGroup label="Maximum Charge" help="Caps the computed charge at this amount. Use zero when the charge should have no monetary cap.">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.MaximumCharge}
              onChange={(e) => setForm((p) => ({ ...p, MaximumCharge: Number(e.target.value) }))}
              placeholder="e.g. 500"
            />
          </FieldGroup>

          <FieldGroup label="Rounding Type" help="Controls how fractional currency values are rounded after the charge is calculated.">
            <Select value={String(form.RoundingType)} onValueChange={(v) => setForm((p) => ({ ...p, RoundingType: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROUNDING_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="commission-locked"
              checked={form.IsLocked}
              onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <Label htmlFor="commission-locked">Is Locked?</Label>
            <FieldHelp label="Is Locked?">A locked charge remains configured but cannot be selected for new mappings or normal operational use.</FieldHelp>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1"><Label className="font-semibold text-gray-700">Graduated Scales (Optional)</Label><FieldHelp label="Graduated Scales">Defines different percentage or fixed charges for non-overlapping transaction-amount bands. Leave empty only when the rate will be configured later.</FieldHelp></div>
          <GraduatedScaleRows rows={graduatedScales} onChange={setGraduatedScales} />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1"><Label className="font-semibold text-gray-700">G/L Splits (Required)</Label><FieldHelp label="G/L Splits">Distributes the computed charge among posting accounts. At least one split is required and the percentages must total exactly 100%. Leviable portions form the basis for linked levies.</FieldHelp></div>
          <SplitRows
            rows={splits}
            onChange={setSplits}
            chartOfAccounts={chartOfAccounts}
            showLeviable
            loadingChartOfAccounts={loadingLookups}
          />
        </div>

        <FieldGroup label="Linked Levies (Optional)" help="Attaches existing levy definitions, such as excise duty, to this charge. A levy is computed only from split portions marked Leviable.">
          <PickerList
            items={levies}
            selectedIds={selectedLevyIds}
            onToggle={toggleLevy}
            getLabel={(l) => l.Description}
            getSublabel={(l) => l.ChargeTypeDescription}
            emptyText={loadingLookups ? "Loading levies..." : "No levies configured yet — create one under Accounts > Levies first."}
          />
        </FieldGroup>

        <div className={`rounded-lg border p-3 text-sm ${readinessIssues.length ? "border-amber-300 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-700"}`}>
          <p className="font-semibold">{readinessIssues.length ? "Configuration incomplete" : "Operational configuration ready"}</p>
          {readinessIssues.length > 0 && <ul className="mt-1 list-disc pl-5">{readinessIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        </div>

        <Button type="submit" disabled={loading || loadingLookups} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Commission"}
        </Button>
      </form>
    </div>
  );
}
