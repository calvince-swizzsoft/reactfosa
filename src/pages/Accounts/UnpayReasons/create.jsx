import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaHandPaper } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { createUnpayReason } from "./api";
import PickerList from "../lib/PickerList";

// Areas/Accounts/Controllers/UnPayReasonController.cs §3.4 —
// docs/api/unpayreason-api-spec.md. Attached commissions are optional at
// create (sent as bare Guid[], the controller resolves each to a
// CommissionDTO{ Id } locally — no per-id lookup round trip needed).
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = { Code: "", Description: "", IsLocked: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateUnpayReason() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState(new Set());

  useEffect(() => {
    setLoadingCommissions(true);
    apiFetch(`${BASE}/api/accounts/commissions`)
      .then((r) => r.json())
      .then((d) => setCommissions(normalizeList(d)))
      .catch(() => setCommissions([]))
      .finally(() => setLoadingCommissions(false));
  }, []);

  const toggleCommission = (id) => setSelectedCommissionIds((prev) => {
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
    setLoading(true);
    try {
      const payload = {
        UnPayReason: {
          Code: Number(form.Code) || 0,
          Description: form.Description,
          IsLocked: form.IsLocked,
        },
        CommissionIds: [...selectedCommissionIds],
      };

      const data = await createUnpayReason(payload);
      Swal.fire("Success", data?.message || "Unpay reason created successfully", "success");
      setForm(emptyForm);
      setSelectedCommissionIds(new Set());
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
          <FaHandPaper className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Unpay Reason</h2>
        </div>
        <Link to="/Accounts/UnpayReasons" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Unpay Reasons
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Code">
            <Input type="number" value={form.Code} onChange={(e) => setForm((p) => ({ ...p, Code: e.target.value }))} placeholder="e.g. 1" />
          </FieldGroup>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="unpay-locked"
              checked={form.IsLocked}
              onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <Label htmlFor="unpay-locked">Is Locked?</Label>
          </div>
        </div>

        <FieldGroup label="Description">
          <Input
            value={form.Description}
            onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
            required
            placeholder="e.g. Suspicious Activity"
          />
        </FieldGroup>

        <FieldGroup label="Attached Commissions (Optional)">
          <PickerList
            items={commissions}
            selectedIds={selectedCommissionIds}
            onToggle={toggleCommission}
            getLabel={(c) => c.Description}
            getSublabel={(c) => c.RoundingTypeDescription}
            emptyText={loadingCommissions ? "Loading commissions..." : "No commissions configured yet — create one under Accounts > Commissions first."}
          />
        </FieldGroup>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Unpay Reason"}
        </Button>
      </form>
    </div>
  );
}
