import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaBriefcase } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const COST_CENTERS_BASE = `${BASE}/api/accounts/costcenters`;

const emptyForm = { Description: "", IsLocked: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function CreateCostCenter() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`${COST_CENTERS_BASE}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      // Covers both 400 (missing Description) and 409 (duplicate
      // Description) — both come back as { success: false, message }.
      if (!res.ok) throw new Error(data.message || "Failed to create cost center");
      Swal.fire("Success", "Cost center created successfully", "success");
      setForm(emptyForm);
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
          <FaBriefcase className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Cost Center</h2>
        </div>
        <Link to="/Accounts/CostCenters" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Cost Centers
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Description">
          <Input
            value={form.Description}
            onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
            required
            placeholder="e.g. Nairobi Branch Operations"
          />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="costcenter-locked"
            checked={form.IsLocked}
            onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="costcenter-locked">Is Locked?</Label>
        </div>

        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Cost Center"}
        </Button>
      </form>
    </div>
  );
}
