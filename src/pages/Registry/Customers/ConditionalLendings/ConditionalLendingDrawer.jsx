import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaPlus, FaTrash, FaSearch, FaHandHoldingUsd } from "react-icons/fa";
import { listEntries, createConditionalLending, updateConditionalLending, replaceEntries } from "./api";
import LoanProductLookupModal from "./LoanProductLookupModal";
import CustomerLookupModal from "../Documents/CustomerLookupModal";

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

// Single drawer for create, edit, and viewing the customer list, same
// composition as ChargeExemptionDrawer.jsx — Areas/Registry/Conditional
// Lendings.md's create flow ("Add button to add more customers... repeat
// steps... then click create") stages entries locally and commits everything
// in one PUT .../entries call on submit.
export default function ConditionalLendingDrawer({ open, onClose, onSuccess, item }) {
  const [description, setDescription] = useState("");
  const [loanProduct, setLoanProduct] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loanProductPickerOpen, setLoanProductPickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setDescription(item.Description || "");
      setLoanProduct(item.LoanProductId ? { Id: item.LoanProductId, Description: item.LoanProductDescription } : null);
      setIsLocked(Boolean(item.IsLocked));
      setLoadingEntries(true);
      listEntries(item.Id)
        .then((rows) => setEntries(rows.map((r) => ({ key: r.Id, CustomerId: r.CustomerId, label: r.CustomerFullName?.trim(), accountNumber: r.CustomerReference1, Remarks: r.Remarks || "" }))))
        .catch((err) => Swal.fire("Error", err.message, "error"))
        .finally(() => setLoadingEntries(false));
    } else {
      setDescription("");
      setLoanProduct(null);
      setIsLocked(false);
      setEntries([]);
    }
  }, [open, item]);

  const handleAddCustomer = (customer) => {
    const customerId = customer.Id ?? customer.id;
    if (entries.some((e) => e.CustomerId === customerId)) {
      Swal.fire("Already Added", "This customer is already in the list.", "warning");
      return;
    }
    setEntries((prev) => [...prev, {
      key: `local-${customerId}`,
      CustomerId: customerId,
      label: customerName(customer),
      accountNumber: customer.Reference1 || customer.AccountNumber || "",
      Remarks: "",
    }]);
  };

  const handleRemoveCustomer = (key) => setEntries((prev) => prev.filter((e) => e.key !== key));

  const updateRemarks = (key, remarks) => setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, Remarks: remarks } : e)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      Swal.fire("Missing Field", "Enter a name for this conditional lending.", "warning");
      return;
    }
    if (!loanProduct) {
      Swal.fire("Missing Field", "Look up and select the loan product this applies to.", "warning");
      return;
    }
    setSaving(true);
    try {
      let conditionalLendingId;
      if (item) {
        await updateConditionalLending(item.Id, { loanProductId: loanProduct.Id, description, isLocked });
        conditionalLendingId = item.Id;
      } else {
        const created = await createConditionalLending({ loanProductId: loanProduct.Id, description });
        conditionalLendingId = created.Id;
      }

      await replaceEntries(conditionalLendingId, entries);

      Swal.fire("Success", `Conditional lending ${item ? "updated" : "created"} successfully.`, "success");
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
              <h2 className="font-bold text-lg text-white flex items-center gap-2"><FaHandHoldingUsd /> {item ? "Edit" : "Add"} Conditional Lending</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <FieldGroup label="Name">
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Staff Loan" />
                </FieldGroup>

                <FieldGroup label="Loan Product">
                  <button
                    type="button"
                    onClick={() => setLoanProductPickerOpen(true)}
                    className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <span className={loanProduct ? "text-gray-800" : "text-gray-400"}>
                      {loanProduct ? loanProduct.Description : "Look up loan product..."}
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Eligible Customers</p>

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
                              {entry.accountNumber && <p className="text-xs text-gray-500">Acc. {entry.accountNumber}</p>}
                            </div>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveCustomer(entry.key)}><FaTrash className="text-red-600" /></Button>
                          </div>
                          <Input value={entry.Remarks} onChange={(e) => updateRemarks(entry.key, e.target.value)} placeholder="Remarks (optional)" className="text-xs" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">No customers added yet.</p>
                  )}

                  <Button type="button" size="sm" onClick={() => setCustomerPickerOpen(true)} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-1">
                    <FaPlus /> Add Customer
                  </Button>
                </div>
              </div>

              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Saving..." : item ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </motion.div>

          {loanProductPickerOpen && (
            <LoanProductLookupModal onSelect={setLoanProduct} onClose={() => setLoanProductPickerOpen(false)} />
          )}

          {customerPickerOpen && (
            <CustomerLookupModal onSelect={handleAddCustomer} onClose={() => setCustomerPickerOpen(false)} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
