import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaIdBadge } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import TransactionThresholdEditor, { normalizeThresholds, validateThresholds } from "./TransactionThresholdEditor";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = { Description: "", TransactionThresholds: [], IsLocked: false };

export default function CreateDesignation() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const thresholdError = validateThresholds(form.TransactionThresholds);
    if (thresholdError) {
      Swal.fire("Check transaction thresholds", thresholdError, "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`${BASE}/api/humanresource/designations`, {
        method: "POST",
        body: JSON.stringify({ ...form, TransactionThresholds: normalizeThresholds(form.TransactionThresholds) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create designation");
      Swal.fire("Success", "Designation created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaIdBadge className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Designation</h2>
        </div>
        <Link to="/HumanResource/Designations" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Designations
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <div className="flex items-center gap-1.5"><Label>Description</Label><FieldHelp text="The job designation assigned to employees, such as Teller or Branch Manager. Transaction authority is inherited through this assignment." /></div>
          <Input
            value={form.Description}
            onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
            required
            placeholder="e.g. Teller"
          />
        </div>
        <TransactionThresholdEditor value={form.TransactionThresholds} onChange={(TransactionThresholds) => setForm((p) => ({ ...p, TransactionThresholds }))} disabled={loading} />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="desig-locked"
            checked={form.IsLocked}
            onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="desig-locked" className="flex items-center gap-1.5">Is Locked?<FieldHelp text="Prevents this designation from being treated as active configuration. Employees should be reassigned before locking it." /></Label>
        </div>
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Designation"}
        </Button>
      </form>
    </div>
  );
}
