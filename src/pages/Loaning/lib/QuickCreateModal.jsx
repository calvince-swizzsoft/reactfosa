import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaTimes } from "react-icons/fa";

// Small inline "+ New" modal for the Description/IsLocked master-data
// shape shared by LoanPurpose/LoaningRemark (and, elsewhere in this
// backend, UnPayReason) — lets a picker create a missing entry without
// leaving the drawer it's used from. `onCreate` does the actual API call;
// this component only owns the tiny form and the duplicate-Description
// gotcha (ErrorMessageResult set on an otherwise-successful response).
export default function QuickCreateModal({ title, onCreate, onCreated, onClose }) {
  const [description, setDescription] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      Swal.fire("Missing Field", "A description is required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const created = await onCreate({ Description: description.trim(), IsLocked: isLocked });
      if (created?.ErrorMessageResult) {
        Swal.fire("Not Created", created.ErrorMessageResult, "warning");
        return;
      }
      onCreated(created);
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[400px] z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Description</Label>
            <Input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
            Locked
          </label>
          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading ? "Creating..." : "Create"}
          </Button>
        </form>
      </div>
    </div>
  );
}
