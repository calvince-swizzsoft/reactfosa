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
import { apiFetch, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";
import SplitRows from "../lib/SplitRows";
import GraduatedScaleRows from "../lib/GraduatedScaleRows";

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

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
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
      apiFetch(`${BASE}/api/accounts/chartofaccounts?pageSize=1000`).then((r) => r.json()),
      apiFetch(`${BASE}/api/accounts/levies`).then((r) => r.json()),
    ]).then(([coaData, levyData]) => {
      setChartOfAccounts(normalizeList(coaData));
      setLevies(normalizeList(levyData));
    }).catch(() => { }).finally(() => setLoadingLookups(false));
  }, []);

  const toggleLevy = (id) => setSelectedLevyIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    const splitTotal = splits.reduce((sum, s) => sum + (Number(s.Percentage) || 0), 0);
    if (splits.length > 0 && Math.abs(splitTotal - 100) > 0.01) {
      Swal.fire("Splits Don't Balance", `Split percentages must sum to 100% (currently ${splitTotal}%).`, "warning");
      return;
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
          <FieldGroup label="Description">
            <Input
              value={form.Description}
              onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
              required
              placeholder="e.g. Cheque Handling Fee"
            />
          </FieldGroup>

          <FieldGroup label="Maximum Charge">
            <Input
              type="number"
              min="0"
              value={form.MaximumCharge}
              onChange={(e) => setForm((p) => ({ ...p, MaximumCharge: Number(e.target.value) }))}
              placeholder="e.g. 500"
            />
          </FieldGroup>

          <FieldGroup label="Rounding Type">
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
          </div>
        </div>

        <div>
          <Label className="font-semibold text-gray-700 mb-2 block">Graduated Scales (Optional)</Label>
          <p className="text-xs text-gray-400 mb-2">Rate brackets by transaction amount — leave empty to finalize the rate later.</p>
          <GraduatedScaleRows rows={graduatedScales} onChange={setGraduatedScales} />
        </div>

        <div>
          <Label className="font-semibold text-gray-700 mb-2 block">G/L Splits (Optional)</Label>
          <p className="text-xs text-gray-400 mb-2">How the computed amount divides across G/L accounts — must sum to 100% if any are added. Mark a split "Leviable" if it should feed a linked levy's calculation.</p>
          <SplitRows
            rows={splits}
            onChange={setSplits}
            chartOfAccounts={chartOfAccounts}
            showLeviable
            loadingChartOfAccounts={loadingLookups}
          />
        </div>

        <FieldGroup label="Linked Levies (Optional)">
          <PickerList
            items={levies}
            selectedIds={selectedLevyIds}
            onToggle={toggleLevy}
            getLabel={(l) => l.Description}
            getSublabel={(l) => l.ChargeTypeDescription}
            emptyText={loadingLookups ? "Loading levies..." : "No levies configured yet — create one under Accounts > Levies first."}
          />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingLookups} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Commission"}
        </Button>
      </form>
    </div>
  );
}
