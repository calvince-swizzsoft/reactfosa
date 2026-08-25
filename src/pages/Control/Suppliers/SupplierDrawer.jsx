import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaSearch, FaTruck } from "react-icons/fa";
import { createSupplier, updateSupplier, CHART_OF_ACCOUNTS_BASE } from "./api";
import EntryPickerModal from "@/pages/Accounts/BatchProcedures/lib/EntryPickerModal";

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
  AddressLine1: "",
  AddressLine2: "",
  Street: "",
  PostalCode: "",
  LandLine: "",
  MobileLine: "",
  Email: "",
  IsLocked: false,
};

// Per Areas/Suppliers.md: create/edit a supplier (name, address, contact
// details, and a G/L account picked via a lookup dialog — not a dropdown),
// plus a lock/unlock checkbox that blocks further posting for that supplier
// once ticked.
export default function SupplierDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [chartOfAccount, setChartOfAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setForm({
        Name: item.Name || "",
        AddressLine1: item.AddressLine1 || "",
        AddressLine2: item.AddressLine2 || "",
        Street: item.Street || "",
        PostalCode: item.PostalCode || "",
        LandLine: item.LandLine || "",
        MobileLine: item.MobileLine || "",
        Email: item.Email || "",
        IsLocked: Boolean(item.IsLocked),
      });
      setChartOfAccount(item.ChartOfAccountId ? { Id: item.ChartOfAccountId, AccountName: item.ChartOfAccountAccountName } : null);
    } else {
      setForm(emptyForm);
      setChartOfAccount(null);
    }
  }, [open, item]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Name.trim()) {
      Swal.fire("Missing Field", "Enter the supplier's name.", "warning");
      return;
    }
    if (!chartOfAccount) {
      Swal.fire("Missing Field", "Look up and select the supplier's G/L account.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, ChartOfAccountId: chartOfAccount.Id };
      if (item) {
        await updateSupplier(item.Id, payload);
      } else {
        await createSupplier(payload);
      }
      Swal.fire("Success", `Supplier ${item ? "updated" : "created"} successfully.`, "success");
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
          <motion.div className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaTruck /> {item ? "Edit" : "Add"} Supplier</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <FieldGroup label="Name">
                  <Input value={form.Name} onChange={(e) => handleChange("Name", e.target.value)} required placeholder="Individual or company name" />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Address Line 1">
                    <Input value={form.AddressLine1} onChange={(e) => handleChange("AddressLine1", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Address Line 2">
                    <Input value={form.AddressLine2} onChange={(e) => handleChange("AddressLine2", e.target.value)} />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Street">
                    <Input value={form.Street} onChange={(e) => handleChange("Street", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Postal Code">
                    <Input value={form.PostalCode} onChange={(e) => handleChange("PostalCode", e.target.value)} />
                  </FieldGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Land-Line">
                    <Input value={form.LandLine} onChange={(e) => handleChange("LandLine", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Mobile-Line">
                    <Input value={form.MobileLine} onChange={(e) => handleChange("MobileLine", e.target.value)} />
                  </FieldGroup>
                </div>

                <FieldGroup label="E-mail">
                  <Input value={form.Email} onChange={(e) => handleChange("Email", e.target.value)} placeholder="Separate multiple addresses with a comma" />
                </FieldGroup>

                <FieldGroup label="G/L Account">
                  <button
                    type="button"
                    onClick={() => setAccountPickerOpen(true)}
                    className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <span className={chartOfAccount ? "text-gray-800" : "text-gray-400"}>
                      {chartOfAccount ? (chartOfAccount.AccountName || chartOfAccount.ChartOfAccountAccountName) : "Look up G/L account..."}
                    </span>
                    <FaSearch className="text-gray-400" />
                  </button>
                </FieldGroup>

                {item && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.IsLocked} onChange={(e) => handleChange("IsLocked", e.target.checked)} />
                    Locked (blocks further posting for this supplier)
                  </label>
                )}
              </div>

              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Saving..." : item ? "Update Supplier" : "Create Supplier"}
                </Button>
              </div>
            </form>
          </motion.div>

          {accountPickerOpen && (
            <EntryPickerModal
              title="Select G/L Account"
              fetchUrl={CHART_OF_ACCOUNTS_BASE}
              getLabel={(c) => c.AccountName}
              getSublabel={(c) => c.AccountCode}
              onSelect={setChartOfAccount}
              onClose={() => setAccountPickerOpen(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
