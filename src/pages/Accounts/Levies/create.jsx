import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaLandmark } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import SplitRows from "../lib/SplitRows";
import { ChargeType } from "../lib/chargeType";

// Areas/Accounts/Controllers/LevyController.cs — docs/api/levy-api-spec.md §4.4.
// LevySplits are optional at create, same reasoning as Commission's own
// sub-resources — a levy can be staged before its G/L split is finalized.
// `LevySplitsTotalPercentage` is computed server-side from whatever
// `LevySplits` are actually sent — don't set it here, the backend
// overwrites it either way (see spec's history note on the reference app's
// hardcoded-100 bug this API deliberately doesn't repeat).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const LEVIES_BASE = `${BASE}/api/accounts/levies`;

const emptyForm = { Description: "", ChargeType: ChargeType.Percentage, ChargeValue: 0, IsLocked: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function CreateLevy() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loadingChartOfAccounts, setLoadingChartOfAccounts] = useState(true);
  const [levySplits, setLevySplits] = useState([]);

  useEffect(() => {
    setLoadingChartOfAccounts(true);
    apiFetch(`${BASE}/api/accounts/chartofaccounts?pageSize=1000`)
      .then((r) => r.json())
      .then((d) => setChartOfAccounts(normalizeList(d)))
      .catch(() => setChartOfAccounts([]))
      .finally(() => setLoadingChartOfAccounts(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    const splitTotal = levySplits.reduce((sum, s) => sum + (Number(s.Percentage) || 0), 0);
    if (levySplits.length > 0 && Math.abs(splitTotal - 100) > 0.01) {
      Swal.fire("Splits Don't Balance", `Split percentages must sum to 100% (currently ${splitTotal}%).`, "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = { Levy: form, LevySplits: levySplits };
      const res = await apiFetch(LEVIES_BASE, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to create levy");

      Swal.fire("Success", data.message || "Levy created successfully", "success");
      setForm(emptyForm);
      setLevySplits([]);
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
          <FaLandmark className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Levy</h2>
        </div>
        <Link to="/Accounts/Levies" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Levies
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Description">
            <Input
              value={form.Description}
              onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
              required
              placeholder="e.g. Excise Duty"
            />
          </FieldGroup>

          <FieldGroup label="Charge Type">
            <Select value={String(form.ChargeType)} onValueChange={(v) => setForm((p) => ({ ...p, ChargeType: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={String(ChargeType.Percentage)}>Percentage</SelectItem>
                <SelectItem value={String(ChargeType.FixedAmount)}>Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label={form.ChargeType === ChargeType.Percentage ? "Percentage" : "Fixed Amount"}>
            <Input
              type="number"
              min="0"
              value={form.ChargeValue}
              onChange={(e) => setForm((p) => ({ ...p, ChargeValue: Number(e.target.value) }))}
              placeholder={form.ChargeType === ChargeType.Percentage ? "e.g. 5" : "e.g. 50"}
            />
          </FieldGroup>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="levy-locked"
              checked={form.IsLocked}
              onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <Label htmlFor="levy-locked">Is Locked?</Label>
          </div>
        </div>

        <div>
          <Label className="font-semibold text-gray-700 mb-2 block">G/L Splits (Optional)</Label>
          <p className="text-xs text-gray-400 mb-2">How the computed levy amount divides across G/L accounts — must sum to 100% if any are added.</p>
          <SplitRows
            rows={levySplits}
            onChange={setLevySplits}
            chartOfAccounts={chartOfAccounts}
            showLeviable={false}
            loadingChartOfAccounts={loadingChartOfAccounts}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Levy"}
        </Button>
      </form>
    </div>
  );
}
