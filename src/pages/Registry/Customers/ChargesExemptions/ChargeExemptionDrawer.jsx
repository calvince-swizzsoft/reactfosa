import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaPlus, FaTrash, FaSearch, FaMoneyBillAlt } from "react-icons/fa";
import { listEntries, createExemption, updateExemption, replaceEntries, COMMISSIONS_BASE } from "./api";
import CustomerLookupModal from "../Documents/CustomerLookupModal";
import EntryPickerModal from "@/pages/Accounts/BatchProcedures/lib/EntryPickerModal";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

// Single drawer for create, edit, and "view/manage exempted customers" per
// Areas/Registry/Charges Exemptions.md — all three lead to the same screen
// there (create: name + charge lookup + add customers; edit: same fields,
// editable; "view exempted customers": the same customer list). Customer
// add/remove is staged locally and committed in one PUT .../entries call on
// submit, matching the doc's "adding or removing customers... click the
// update button to save changes" and this app's established
// AlertPreferencesDrawer full-replace-on-save pattern — not an immediate
// per-click API call.
export default function ChargeExemptionDrawer({ open, onClose, onSuccess, item }) {
  const [description, setDescription] = useState("");
  const [commission, setCommission] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chargePickerOpen, setChargePickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setDescription(item.Description || "");
      setCommission(item.CommissionId ? { Id: item.CommissionId, Description: item.CommissionDescription } : null);
      setIsLocked(Boolean(item.IsLocked));
      setLoadingEntries(true);
      listEntries(item.Id)
        .then((rows) => setEntries(rows.map((r) => ({ key: r.Id, CustomerId: r.CustomerId, label: r.CustomerFullName?.trim(), sublabel: r.CustomerReference2 || r.CustomerIndividualIdentityCardNumber, Remarks: r.Remarks || "" }))))
        .catch((err) => Swal.fire("Error", err.message, "error"))
        .finally(() => setLoadingEntries(false));
    } else {
      setDescription("");
      setCommission(null);
      setIsLocked(false);
      setEntries([]);
    }
  }, [open, item]);

  const handleAddCustomer = (customer) => {
    const customerId = customer.Id ?? customer.id;
    if (entries.some((e) => e.CustomerId === customerId)) {
      Swal.fire("Already Added", "This customer is already in the exemption list.", "warning");
      return;
    }
    setEntries((prev) => [...prev, { key: `local-${customerId}`, CustomerId: customerId, label: customerName(customer), sublabel: customer.IndividualIdentityCardNumber, Remarks: "" }]);
  };

  const handleRemoveCustomer = (key) => setEntries((prev) => prev.filter((e) => e.key !== key));

  const updateRemarks = (key, remarks) => setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, Remarks: remarks } : e)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      Swal.fire("Missing Field", "Enter a name for this charge exemption.", "warning");
      return;
    }
    if (!commission) {
      Swal.fire("Missing Field", "Look up and select the charge this exemption applies to.", "warning");
      return;
    }
    setSaving(true);
    try {
      let exemptionId;
      if (item) {
        await updateExemption(item.Id, { commissionId: commission.Id, description, isLocked });
        exemptionId = item.Id;
      } else {
        const created = await createExemption({ commissionId: commission.Id, description });
        exemptionId = created.Id;
      }

      await replaceEntries(exemptionId, entries);

      Swal.fire("Success", `Charge exemption ${item ? "updated" : "created"} successfully.`, "success");
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
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaMoneyBillAlt /> {item ? "Edit" : "Add"} Charge Exemption</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <FieldGroup label="Name">
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Staff commission waiver" />
                </FieldGroup>

                <FieldGroup label="Charge">
                  <button
                    type="button"
                    onClick={() => setChargePickerOpen(true)}
                    className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <span className={commission ? "text-gray-800" : "text-gray-400"}>
                      {commission ? commission.Description : "Look up charge..."}
                    </span>
                    <FaSearch className="text-gray-400" />
                  </button>
                </FieldGroup>

                {item && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} /> Locked
                  </label>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Exempted Customers</p>

                  {loadingEntries ? (
                    <div className="space-y-2 animate-pulse">
                      {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
                    </div>
                  ) : entries.length > 0 ? (
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <div key={entry.key} className="border rounded-lg p-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{entry.label || "—"}</p>
                              {entry.sublabel && <p className="text-xs text-gray-500">{entry.sublabel}</p>}
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveCustomer(entry.key)}><FaTrash className="text-red-600" /></Button>
                          </div>
                          <Input value={entry.Remarks} onChange={(e) => updateRemarks(entry.key, e.target.value)} placeholder="Remarks (optional)" className="text-xs" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">No customers exempted yet.</p>
                  )}

                  <Button type="button" size="sm" onClick={() => setCustomerPickerOpen(true)} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1">
                    <FaPlus /> Add Customer
                  </Button>
                </div>
              </div>

              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Saving..." : item ? "Update Exemption" : "Create Exemption"}
                </Button>
              </div>
            </form>
          </motion.div>

          {chargePickerOpen && (
            <EntryPickerModal
              title="Select Charge"
              fetchUrl={COMMISSIONS_BASE}
              getLabel={(c) => c.Description}
              onSelect={setCommission}
              onClose={() => setChargePickerOpen(false)}
            />
          )}

          {customerPickerOpen && (
            <CustomerLookupModal onSelect={handleAddCustomer} onClose={() => setCustomerPickerOpen(false)} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
