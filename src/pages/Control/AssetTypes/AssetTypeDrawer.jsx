import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaCubes } from "react-icons/fa";
import { createAssetType, updateAssetType } from "./api";
import { DepreciationMethodOptions } from "../lib/controlEnums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyForm = {
  Name: "",
  DepreciationMethod: "",
  UsefulLife: 1,
  IsTangible: false,
};

// Per Areas/Asset Types.md: create/edit an asset type (name, depreciation
// method picked from a dropdown, useful life in years, and a tangible/
// intangible checkbox). No lock/unlock affordance is described in the doc,
// unlike Suppliers — kept out rather than guessed in.
export default function AssetTypeDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setForm({
        Name: item.Name || "",
        DepreciationMethod: item.DepreciationMethod ? String(item.DepreciationMethod) : "",
        UsefulLife: item.UsefulLife || 1,
        IsTangible: Boolean(item.IsTangible),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, item]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Name.trim()) {
      Swal.fire("Missing Field", "Enter the asset type's name.", "warning");
      return;
    }
    if (!form.DepreciationMethod) {
      Swal.fire("Missing Field", "Select a depreciation method.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, DepreciationMethod: Number(form.DepreciationMethod), UsefulLife: Number(form.UsefulLife) };
      if (item) {
        await updateAssetType(item.Id, payload);
      } else {
        await createAssetType(payload);
      }
      Swal.fire("Success", `Asset type ${item ? "updated" : "created"} successfully.`, "success");
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
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaCubes /> {item ? "Edit" : "Add"} Asset Type</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <FieldGroup label="Name">
                  <Input value={form.Name} onChange={(e) => handleChange("Name", e.target.value)} required placeholder="e.g. Motor Vehicles" />
                </FieldGroup>

                <FieldGroup label="Depreciation Method">
                  <Select value={form.DepreciationMethod ? String(form.DepreciationMethod) : ""} onValueChange={(v) => handleChange("DepreciationMethod", v)}>
                    <SelectTrigger><SelectValue placeholder="Select depreciation method" /></SelectTrigger>
                    <SelectContent>
                      {DepreciationMethodOptions.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                <FieldGroup label="Useful Life (Years)">
                  <Input type="number" min={1} value={form.UsefulLife} onChange={(e) => handleChange("UsefulLife", e.target.value)} required />
                </FieldGroup>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.IsTangible} onChange={(e) => handleChange("IsTangible", e.target.checked)} />
                  Tangible
                </label>
              </div>

              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Saving..." : item ? "Update Asset Type" : "Create Asset Type"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
