import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

const emptyForm = { Code: "", Description: "", IsLocked: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function AddUnpayReasonDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        Code: Number(form.Code),
        Description: form.Description,
        IsLocked: form.IsLocked,
      };
      const res = await fetch(`${BASE}/api/unpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to create unpay reason");
      Swal.fire("Success", data.message || "Unpay reason created.", "success");
      setForm(emptyForm);
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-3 w-[400px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">New Unpay Reason</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FieldGroup label="Code">
                <Input
                  type="number"
                  value={form.Code}
                  onChange={(e) => handleChange("Code", e.target.value)}
                  placeholder="1"
                  required
                />
              </FieldGroup>
              <FieldGroup label="Description">
                <Input
                  value={form.Description}
                  onChange={(e) => handleChange("Description", e.target.value)}
                  placeholder="e.g. Suspicious Activity"
                  required
                />
              </FieldGroup>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isLocked"
                  checked={form.IsLocked}
                  onChange={(e) => handleChange("IsLocked", e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isLocked" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Is Locked
                </Label>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Add Unpay Reason"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function UnpayReasons() {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchReasons = () => {
    setLoading(true);
    fetch(`${BASE}/api/unpay`)
      .then((r) => r.json())
      .then((d) => setReasons(Array.isArray(d) ? d : []))
      .catch(() => setReasons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReasons(); }, []);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          + Add Unpay Reason
        </Button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-9 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
        <span className="col-span-1">Code</span>
        <span className="col-span-4">Description</span>
        <span className="col-span-3">Created Date</span>
        <span className="col-span-1">Status</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-9 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
              <div className="col-span-1"><div className="h-4 bg-gray-200 rounded w-8" /></div>
              <div className="col-span-4"><div className="h-4 bg-gray-200 rounded w-48" /></div>
              <div className="col-span-3"><div className="h-3 bg-gray-200 rounded w-28" /></div>
              <div className="col-span-1"><div className="h-5 bg-gray-100 rounded-full w-14" /></div>
            </div>
          ))}
        </div>
      ) : reasons.length > 0 ? (
        <div className="space-y-2">
          {reasons.map((r) => (
            <div key={r.Id} className="grid grid-cols-9 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border text-sm">
              <span className="col-span-1 font-mono font-bold text-gray-700">{r.PaddedCode || r.Code}</span>
              <span className="col-span-4 text-gray-800">{r.Description || "—"}</span>
              <span className="col-span-3 text-xs text-gray-400">
                {r.CreatedDate ? new Date(r.CreatedDate).toLocaleString() : "—"}
              </span>
              <span className="col-span-1">
                {r.IsLocked ? (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Locked</span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-10">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No unpay reasons found.</p>
        </div>
      )}

      <AddUnpayReasonDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchReasons} />
    </div>
  );
}
