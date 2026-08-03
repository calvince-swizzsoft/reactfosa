import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MEMBERSHIP_BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;
const DIVISION_BASE = `${FIN_BASE}/api/registry/division`;

const emptyForm = {
  EmployerId: "",
  Description: "",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function DivisionDrawer({ open, onClose, onSuccess, division }) {
  const isEdit = Boolean(division);
  const [form, setForm] = useState(emptyForm);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  useEffect(() => {
    if (!open) return;
    setForm(
      isEdit
        ? { EmployerId: division.EmployerId || "", Description: division.Description || "" }
        : emptyForm
    );
    setLoadingData(true);
    apiFetch(`${MEMBERSHIP_BASE}/api/administration/employers`)
      .then((r) => r.json())
      .then((d) => setEmployers(normalizeList(d)))
      .catch(() => setEmployers([]))
      .finally(() => setLoadingData(false));
  }, [open, isEdit, division]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.EmployerId || !form.Description) {
      Swal.fire("Missing Fields", "Employer and Description are required.", "warning");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `${DIVISION_BASE}/${division.Id}` : DIVISION_BASE;
      const payload = isEdit
        ? { Id: division.Id, EmployerId: form.EmployerId, Description: form.Description }
        : { EmployerId: form.EmployerId, Description: form.Description };

      const res = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Failed to ${isEdit ? "update" : "create"} division`);
      }
      Swal.fire("Success", data.message || `Division ${isEdit ? "updated" : "created"} successfully`, "success");
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
            className="fixed top-3 right-3 w-[80vw] max-w-[600px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">{isEdit ? "Edit Division" : "New Division"}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <FieldGroup label="Employer">
                <Select value={form.EmployerId} onValueChange={(v) => handleChange("EmployerId", v)} disabled={loadingData}>
                  <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Employer"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {employers.map((e) => (
                      <SelectItem key={e.Id} value={e.Id}>{e.Description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Description">
                <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. Nairobi Region" />
              </FieldGroup>
              <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Division"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
