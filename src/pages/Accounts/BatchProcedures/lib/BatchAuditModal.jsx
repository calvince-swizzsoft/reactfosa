import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FaTimes } from "react-icons/fa";

// Shared Audit/Authorize remarks modal — request shape { option: 1|2, remarks,
// moduleNavigationItemCode } is identical across all 9 batch types
// (BatchAuthOption/JournalVoucherAuthOption/GeneralLedgerAuthOption are
// separate C# enums with identical values: 1=Post, 2=Reject).
export default function BatchAuditModal({ open, title, postLabel = "Post", onSubmit, onClose }) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (option) => {
    setLoading(true);
    try {
      await onSubmit(option, remarks);
      setRemarks("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Remarks</Label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-2">
            <Button disabled={loading} onClick={() => submit(1)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Working..." : postLabel}
            </Button>
            <Button disabled={loading} onClick={() => submit(2)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
