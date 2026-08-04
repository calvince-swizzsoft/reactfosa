import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaTrash, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { statusBadgeClass } from "@/lib/workflowFormat";
import {
  CustomerAccountRemarkType,
  CustomerAccountManagementAction,
  activateCustomerAccount,
  freezeCustomerAccount,
  closeCustomerAccount,
  remarkCustomerAccount,
  setSigningInstructions,
  getCustomerAccountHistory,
} from "./managementApi";
import {
  SignatoryRelationship,
  listSignatories,
  addSignatory,
  removeSignatories,
} from "./signatoryApi";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "actions", label: "Actions" },
  { id: "history", label: "History" },
  { id: "signatories", label: "Signatories" },
];

const REMARK_TYPE_OPTIONS = [
  { value: CustomerAccountRemarkType.Actionable, label: "Actionable" },
  { value: CustomerAccountRemarkType.Informational, label: "Informational" },
];

// Reverse-lookup for GET /history rows — the five action endpoints hide the
// raw CustomerAccountManagementAction values from callers, but history rows
// come back with the raw int, so this is only needed here.
const MANAGEMENT_ACTION_LABELS = {
  [CustomerAccountManagementAction.Activation]: "Activated",
  [CustomerAccountManagementAction.Deactivation]: "Frozen",
  [CustomerAccountManagementAction.Remark]: "Remark",
  [CustomerAccountManagementAction.Closure]: "Closed",
  [CustomerAccountManagementAction.SigningInstructions]: "Signing Instructions Updated",
};

const MANAGEMENT_ACTION_FILTER_OPTIONS = [
  { value: CustomerAccountManagementAction.Activation, label: "Activation" },
  { value: CustomerAccountManagementAction.Deactivation, label: "Freeze" },
  { value: CustomerAccountManagementAction.Remark, label: "Remark" },
  { value: CustomerAccountManagementAction.Closure, label: "Closure" },
  { value: CustomerAccountManagementAction.SigningInstructions, label: "Signing Instructions" },
];

// Same values already confirmed for CustomerDTO in Registry/Customers/create.jsx
// (customer-api-spec.md §7) — re-declared here rather than imported since
// this drawer lives in a different module folder.
const SALUTATION_OPTIONS = [
  { value: 1, label: "Mr" }, { value: 2, label: "Mrs" }, { value: 3, label: "Miss" },
  { value: 4, label: "Dr" }, { value: 5, label: "Prof" }, { value: 6, label: "Rev" },
  { value: 7, label: "Eng" }, { value: 8, label: "Hon" },
];
const GENDER_OPTIONS = [
  { value: 1, label: "Male" }, { value: 2, label: "Female" }, { value: 3, label: "Non-Binary" },
];
const IDENTITY_CARD_TYPE_OPTIONS = [
  { value: 1, label: "National ID" }, { value: 2, label: "Passport" },
  { value: 3, label: "Alien ID" }, { value: 4, label: "Birth Certificate" },
];
const RELATIONSHIP_OPTIONS = [
  { value: SignatoryRelationship.Unknown, label: "Unknown" },
  { value: SignatoryRelationship.Father, label: "Father" },
  { value: SignatoryRelationship.Mother, label: "Mother" },
  { value: SignatoryRelationship.Brother, label: "Brother" },
  { value: SignatoryRelationship.Sister, label: "Sister" },
  { value: SignatoryRelationship.Wife, label: "Wife" },
  { value: SignatoryRelationship.Husband, label: "Husband" },
  { value: SignatoryRelationship.Son, label: "Son" },
  { value: SignatoryRelationship.Daughter, label: "Daughter" },
];

const emptySignatoryForm = {
  salutation: 1,
  gender: 1,
  relationship: SignatoryRelationship.Unknown,
  firstName: "",
  lastName: "",
  identityCardType: 1,
  identityCardNumber: "",
  addressAddressLine1: "",
  addressAddressLine2: "",
  addressStreet: "",
  addressPostalCode: "",
  addressCity: "",
  addressEmail: "",
  addressLandLine: "",
  addressMobileLine: "",
  remarks: "",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function EnumSelect({ value, options, onChange }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

export default function CustomerAccountDetailDrawer({ open, onClose, onSuccess, account }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Actions tab
  const [remarks, setRemarks] = useState("");
  const [remarkType, setRemarkType] = useState(CustomerAccountRemarkType.Actionable);
  const [actionLoading, setActionLoading] = useState("");

  // History tab
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  // Signatories tab
  const [signatories, setSignatories] = useState([]);
  const [loadingSignatories, setLoadingSignatories] = useState(false);
  const [signatoryPageIndex, setSignatoryPageIndex] = useState(0);
  const [signatoryPageSize] = useState(20);
  const [signatoryItemsCount, setSignatoryItemsCount] = useState(0);
  const [selectedSignatoryIds, setSelectedSignatoryIds] = useState([]);
  const [addSignatoryOpen, setAddSignatoryOpen] = useState(false);
  const [signatoryForm, setSignatoryForm] = useState(emptySignatoryForm);
  const [savingSignatory, setSavingSignatory] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab("overview");
    setRemarks("");
    setRemarkType(CustomerAccountRemarkType.Actionable);
    setHistoryFilter("");
    setHistory([]);
    setSignatories([]);
    setSelectedSignatoryIds([]);
    setAddSignatoryOpen(false);
    setSignatoryForm(emptySignatoryForm);
    setSignatoryPageIndex(0);
    setSignatoryItemsCount(0);
  }, [open, account]);

  const fetchHistory = () => {
    if (!account?.Id) return;
    setLoadingHistory(true);
    getCustomerAccountHistory(account.Id, { managementAction: historyFilter || undefined })
      .then((rows) => setHistory(rows || []))
      .catch((err) => { setHistory([]); Swal.fire("Error", err.message, "error"); })
      .finally(() => setLoadingHistory(false));
  };

  const fetchSignatories = () => {
    if (!account?.Id) return;
    setLoadingSignatories(true);
    listSignatories(account.Id, { pageIndex: signatoryPageIndex, pageSize: signatoryPageSize })
      .then((page) => {
        setSignatories(page?.pageCollection || page?.PageCollection || []);
        setSignatoryItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch((err) => { setSignatories([]); setSignatoryItemsCount(0); Swal.fire("Error", err.message, "error"); })
      .finally(() => setLoadingSignatories(false));
  };

  useEffect(() => {
    if (!open || !account?.Id) return;
    if (activeTab === "history") fetchHistory();
    if (activeTab === "signatories") fetchSignatories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account, activeTab, historyFilter, signatoryPageIndex]);

  const runAction = async (key, fn, { confirmTitle, confirmText, successMessage }) => {
    if (confirmTitle) {
      const r = await Swal.fire({
        title: confirmTitle,
        text: confirmText,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Confirm",
      });
      if (!r.isConfirmed) return;
    }
    setActionLoading(key);
    try {
      await fn(account.Id, { remarks, remarkType });
      Swal.fire("Success", successMessage, "success");
      setRemarks("");
      onSuccess?.();
      if (activeTab === "history") fetchHistory();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setActionLoading("");
    }
  };

  const handleSignatoryFieldChange = (field, value) => setSignatoryForm((p) => ({ ...p, [field]: value }));

  const handleAddSignatory = async (e) => {
    e.preventDefault();
    if (!signatoryForm.firstName || !signatoryForm.lastName || !signatoryForm.identityCardNumber) {
      Swal.fire("Missing Fields", "First name, last name, and identity card number are required.", "warning");
      return;
    }
    setSavingSignatory(true);
    try {
      await addSignatory(account.Id, signatoryForm);
      Swal.fire("Success", "Signatory added successfully", "success");
      setSignatoryForm(emptySignatoryForm);
      setAddSignatoryOpen(false);
      fetchSignatories();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingSignatory(false);
    }
  };

  const toggleSignatorySelection = (id) =>
    setSelectedSignatoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleRemoveSignatories = async () => {
    if (selectedSignatoryIds.length === 0) return;
    const r = await Swal.fire({
      title: `Remove ${selectedSignatoryIds.length} signatory(ies)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Remove",
    });
    if (!r.isConfirmed) return;
    try {
      await removeSignatories(selectedSignatoryIds);
      Swal.fire("Removed", "Signatory(ies) removed successfully", "success");
      setSelectedSignatoryIds([]);
      fetchSignatories();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  if (!account) return null;

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
            className="fixed top-3 right-3 w-[85vw] max-w-[1050px] h-[92vh] max-h-[92vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2 shrink-0">
              <div>
                <h2 className="font-bold text-lg text-white">{account.FullAccountNumber || "Customer Account"}</h2>
                <p className="text-xs text-indigo-100">{account.CustomerFullName || account.CustomerId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="grid grid-cols-12 gap-3 px-3 pt-2 pb-3 flex-1 overflow-hidden">
              <aside className="col-span-3 bg-gray-200 p-3 rounded-lg overflow-y-auto">
                {TABS.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`p-3 mb-2 rounded-md cursor-pointer border text-sm font-medium transition-colors ${activeTab === tab.id
                      ? "bg-indigo-700 border-indigo-500 text-white"
                      : "bg-white border-transparent hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    {tab.label}
                  </div>
                ))}
              </aside>

              <main className="col-span-9 overflow-y-auto pr-1">
                {activeTab === "overview" && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup label="Account Number">
                      <p className="text-sm text-gray-700 mt-1">{account.FullAccountNumber || "—"}</p>
                    </FieldGroup>
                    <FieldGroup label="Customer">
                      <p className="text-sm text-gray-700 mt-1">{account.CustomerFullName || "—"}</p>
                      <p className="text-xs text-gray-400">{account.CustomerTypeDescription || "—"}</p>
                    </FieldGroup>
                    <FieldGroup label="Product">
                      <p className="text-sm text-gray-700 mt-1">{account.CustomerAccountTypeTargetProductDescription || "—"}</p>
                      <p className="text-xs text-gray-400">{account.TypeDescription || "—"}</p>
                    </FieldGroup>
                    <FieldGroup label="Book Balance">
                      <p className="text-sm text-gray-700 mt-1">
                        {typeof account.BookBalance === "number" ? account.BookBalance.toLocaleString() : "—"}
                      </p>
                    </FieldGroup>
                    <FieldGroup label="Status">
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass(account.StatusDescription)}`}>
                        {account.StatusDescription || "—"}
                      </span>
                    </FieldGroup>
                    <FieldGroup label="Record Status">
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass(account.RecordStatusDescription)}`}>
                        {account.RecordStatusDescription || "—"}
                      </span>
                    </FieldGroup>
                  </section>
                )}

                {activeTab === "actions" && (
                  <section className="space-y-4">
                    <FieldGroup label="Remarks">
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                        className="w-full border rounded-md p-2 text-sm"
                        placeholder="Enter remarks for this action..."
                      />
                    </FieldGroup>
                    <FieldGroup label="Remark Type">
                      <EnumSelect value={remarkType} options={REMARK_TYPE_OPTIONS} onChange={setRemarkType} />
                    </FieldGroup>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        type="button"
                        disabled={actionLoading !== ""}
                        onClick={() => runAction("activate", activateCustomerAccount, {
                          confirmTitle: "Activate this account?",
                          successMessage: "Account activated successfully",
                        })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === "activate" ? "Activating..." : "Activate"}
                      </Button>
                      <Button
                        type="button"
                        disabled={actionLoading !== ""}
                        onClick={() => runAction("freeze", freezeCustomerAccount, {
                          confirmTitle: "Freeze this account?",
                          confirmText: "This also notifies the member via a frozen-account alert.",
                          successMessage: "Account frozen successfully",
                        })}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {actionLoading === "freeze" ? "Freezing..." : "Freeze"}
                      </Button>
                      <Button
                        type="button"
                        disabled={actionLoading !== ""}
                        onClick={() => runAction("close", closeCustomerAccount, {
                          confirmTitle: "Close this account?",
                          confirmText: "This action changes the account's lifecycle state.",
                          successMessage: "Account closed successfully",
                        })}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {actionLoading === "close" ? "Closing..." : "Close"}
                      </Button>
                      <Button
                        type="button"
                        disabled={actionLoading !== ""}
                        onClick={() => runAction("signing-instructions", setSigningInstructions, {
                          confirmTitle: "Log a signing-instructions change?",
                          successMessage: "Signing instructions updated successfully",
                        })}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {actionLoading === "signing-instructions" ? "Saving..." : "Set Signing Instructions"}
                      </Button>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionLoading !== "" || !remarks}
                        onClick={() => runAction("remark", remarkCustomerAccount, {
                          successMessage: "Remark added successfully",
                        })}
                        className="w-full"
                      >
                        {actionLoading === "remark" ? "Saving..." : "Add Remark Only (no state change)"}
                      </Button>
                    </div>
                  </section>
                )}

                {activeTab === "history" && (
                  <section className="space-y-4">
                    <FieldGroup label="Filter by Action">
                      <Select value={historyFilter === "" ? "all" : String(historyFilter)} onValueChange={(v) => setHistoryFilter(v === "all" ? "" : Number(v))}>
                        <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          {MANAGEMENT_ACTION_FILTER_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldGroup>

                    {loadingHistory ? (
                      <p className="text-sm text-gray-400">Loading history...</p>
                    ) : history.length === 0 ? (
                      <p className="text-sm text-gray-400">No history entries found.</p>
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {history.map((h) => (
                          <div key={h.id} className="px-4 py-3">
                            <div className="flex justify-between items-start">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-600">
                                {MANAGEMENT_ACTION_LABELS[h.managementAction] || h.managementAction}
                              </span>
                              <span className="text-xs text-gray-400">{formatDate(h.createdDate)}</span>
                            </div>
                            {h.remarks && <p className="text-sm text-gray-700 mt-1">{h.remarks}</p>}
                            <p className="text-xs text-gray-400 mt-1">
                              {h.reference && <>Ref: {h.reference} · </>}By {h.createdBy || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {activeTab === "signatories" && (
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Who is authorized to sign/operate on this account.</p>
                      <div className="flex gap-2">
                        {selectedSignatoryIds.length > 0 && (
                          <Button type="button" variant="outline" className="text-red-600" onClick={handleRemoveSignatories}>
                            <FaTrash className="mr-2" /> Remove Selected ({selectedSignatoryIds.length})
                          </Button>
                        )}
                        <Button type="button" onClick={() => setAddSignatoryOpen((v) => !v)} className="bg-indigo-600 hover:bg-indigo-700">
                          <FaPlus className="mr-2" /> Add Signatory
                        </Button>
                      </div>
                    </div>

                    {addSignatoryOpen && (
                      <form onSubmit={handleAddSignatory} className="rounded-lg border p-4 bg-gray-50 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <FieldGroup label="First Name">
                            <Input value={signatoryForm.firstName} onChange={(e) => handleSignatoryFieldChange("firstName", e.target.value)} required />
                          </FieldGroup>
                          <FieldGroup label="Last Name">
                            <Input value={signatoryForm.lastName} onChange={(e) => handleSignatoryFieldChange("lastName", e.target.value)} required />
                          </FieldGroup>
                          <FieldGroup label="Relationship">
                            <EnumSelect value={signatoryForm.relationship} options={RELATIONSHIP_OPTIONS} onChange={(v) => handleSignatoryFieldChange("relationship", v)} />
                          </FieldGroup>
                          <FieldGroup label="Salutation">
                            <EnumSelect value={signatoryForm.salutation} options={SALUTATION_OPTIONS} onChange={(v) => handleSignatoryFieldChange("salutation", v)} />
                          </FieldGroup>
                          <FieldGroup label="Gender">
                            <EnumSelect value={signatoryForm.gender} options={GENDER_OPTIONS} onChange={(v) => handleSignatoryFieldChange("gender", v)} />
                          </FieldGroup>
                          <FieldGroup label="Identity Card Type">
                            <EnumSelect value={signatoryForm.identityCardType} options={IDENTITY_CARD_TYPE_OPTIONS} onChange={(v) => handleSignatoryFieldChange("identityCardType", v)} />
                          </FieldGroup>
                          <FieldGroup label="Identity Card Number">
                            <Input value={signatoryForm.identityCardNumber} onChange={(e) => handleSignatoryFieldChange("identityCardNumber", e.target.value)} required />
                          </FieldGroup>
                          <FieldGroup label="Mobile Line">
                            <Input value={signatoryForm.addressMobileLine} onChange={(e) => handleSignatoryFieldChange("addressMobileLine", e.target.value)} placeholder="+254712345678" />
                          </FieldGroup>
                          <FieldGroup label="Email">
                            <Input type="email" value={signatoryForm.addressEmail} onChange={(e) => handleSignatoryFieldChange("addressEmail", e.target.value)} />
                          </FieldGroup>
                          <FieldGroup label="City">
                            <Input value={signatoryForm.addressCity} onChange={(e) => handleSignatoryFieldChange("addressCity", e.target.value)} />
                          </FieldGroup>
                          <FieldGroup label="Address Line 1">
                            <Input value={signatoryForm.addressAddressLine1} onChange={(e) => handleSignatoryFieldChange("addressAddressLine1", e.target.value)} />
                          </FieldGroup>
                          <FieldGroup label="Remarks">
                            <Input value={signatoryForm.remarks} onChange={(e) => handleSignatoryFieldChange("remarks", e.target.value)} />
                          </FieldGroup>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" disabled={savingSignatory} className="bg-indigo-600 hover:bg-indigo-700">
                            {savingSignatory ? "Saving..." : "Save Signatory"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {loadingSignatories ? (
                      <p className="text-sm text-gray-400">Loading signatories...</p>
                    ) : signatories.length === 0 ? (
                      <p className="text-sm text-gray-400">No signatories added yet.</p>
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {signatories.map((s) => (
                          <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedSignatoryIds.includes(s.id)}
                              onChange={() => toggleSignatorySelection(s.id)}
                              className="w-4 h-4 accent-indigo-600"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-gray-400">{s.identityCardNumber} {s.addressMobileLine ? `· ${s.addressMobileLine}` : ""}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {signatories.length > 0 && (
                      <div className="flex justify-center items-center">
                        <Button
                          type="button"
                          size="sm"
                          disabled={signatoryPageIndex === 0}
                          onClick={() => setSignatoryPageIndex((p) => Math.max(0, p - 1))}
                          className="flex items-center gap-1 m-2"
                        >
                          <FaChevronLeft /> Prev
                        </Button>
                        <span className="text-sm text-gray-500">Page {signatoryPageIndex + 1}</span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={(signatoryPageIndex + 1) * signatoryPageSize >= signatoryItemsCount}
                          onClick={() => setSignatoryPageIndex((p) => p + 1)}
                          className="flex items-center gap-1 m-2"
                        >
                          Next <FaChevronRight />
                        </Button>
                      </div>
                    )}
                  </section>
                )}
              </main>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
