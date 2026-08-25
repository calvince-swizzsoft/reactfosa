import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaBoxOpen } from "react-icons/fa";
import { createPackageType, updatePackageType } from "./api";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyForm = { Name: "", Remarks: "" };

// Per Areas/Package Types.md: just name + remarks — no lock/unlock, no
// other fields described.
export default function PackageTypeDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setForm({ Name: item.Name || "", Remarks: item.Remarks || "" });
    } else {
      setForm(emptyForm);
    }
  }, [open, item]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Name.trim()) {
      Swal.fire("Missing Field", "Enter the package type's name.", "warning");
      return;
    }
    setSaving(true);
    try {
      if (item) {
        await updatePackageType(item.Id, form);
      } else {
        await createPackageType(form);
      }
      Swal.fire("Success", `Package type ${item ? "updated" : "created"} successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaBoxOpen /> {item ? "Edit" : "Add"} Package Type</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <FieldGroup label="Name">
                  <Input value={form.Name} onChange={(e) => handleChange("Name", e.target.value)} required placeholder="e.g. Crate, Carton, Pallet" />
                </FieldGroup>

                <FieldGroup label="Remarks">
                  <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
                </FieldGroup>
              </div>

              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Saving..." : item ? "Update Package Type" : "Create Package Type"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
