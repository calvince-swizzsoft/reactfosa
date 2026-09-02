import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTimes, FaTrash, FaUpload, FaExchangeAlt, FaBan } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listCreditBatches, createCreditBatch, listCreditBatchEntries, addCreditBatchEntry,
  removeCreditBatchEntries, auditCreditBatch, authorizeCreditBatch, importCreditBatch,
  listCreditBatchDiscrepancies, matchCreditBatchDiscrepancy, rejectCreditBatchDiscrepancy,
} from "./creditBatchApi";
import { BatchStatus, CreditBatchType } from "../lib/batchEnums";
import BatchStatusBadge from "../lib/BatchStatusBadge";
import BatchAuditModal from "../lib/BatchAuditModal";
import EntryPickerModal from "../lib/EntryPickerModal";
import { runBatchAction } from "../lib/runBatchAction";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// Stage-level NavigationMenu codes (0x59D8 + 69/79/89) — per-type child
// codes are commented out server-side, so every batch type's actions pass
// one of these three, never a per-type code.
const MODULE_NAVIGATION_ITEM_CODE = { origination: 23069, verification: 23079, authorization: 23089 };

const CREDIT_TYPE_OPTIONS = [
  { value: CreditBatchType.Payout, label: "Payout" },
  { value: CreditBatchType.CheckOff, label: "Check-Off" },
  { value: CreditBatchType.CashPickup, label: "Cash Pickup" },
  { value: CreditBatchType.SundryPayments, label: "Sundry Payments" },
];

// Raw Column1..8 layout on a discrepancy row differs by CreditBatchType —
// transcribed from CreditBatchAppService.ParseCreditBatchImport, the only
// place these column meanings are defined server-side (they're bare
// "Column1".."Column8" strings on the wire, no field names).
const DISCREPANCY_FIELDS = {
  [CreditBatchType.CheckOff]: [
    ["Column1", "Department"], ["Column2", "Payroll No."], ["Column3", "Contribution"],
    ["Column4", "Product Balance"], ["Column5", "Beneficiary"], ["Column6", "Product Code"],
    ["Column7", "Entry Type"], ["Column8", "Reference"],
  ],
  [CreditBatchType.Payout]: [
    ["Column1", "Payroll No."], ["Column2", "Customer Name"], ["Column3", "Amount"],
    ["Column4", "Savings Product Code"], ["Column5", "Reference"],
  ],
};

const PRIORITY_OPTIONS = [
  { value: 0, label: "Lowest" }, { value: 1, label: "Very Low" }, { value: 2, label: "Low" },
  { value: 3, label: "Normal" }, { value: 4, label: "Above Normal" }, { value: 5, label: "High" },
  { value: 6, label: "Very High" }, { value: 7, label: "Highest" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyCreateForm = {
  CreditTypeId: "", CreditTypeLabel: "", BranchId: "", BranchLabel: "",
  Type: CreditBatchType.Payout, Reference: "", TotalValue: "",
  Month: new Date().getMonth() + 1, ValueDate: new Date().toISOString().split("T")[0],
  Priority: 3,
};

function CreateCreditBatchDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => { if (open) setForm(emptyCreateForm); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CreditTypeId || !form.BranchId || !form.Reference || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "Credit type, branch, reference and a positive total value are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createCreditBatch({
        CreditTypeId: form.CreditTypeId,
        BranchId: form.BranchId,
        Type: Number(form.Type),
        Reference: form.Reference,
        TotalValue: Number(form.TotalValue),
        Month: Number(form.Month),
        ValueDate: form.ValueDate,
        Priority: Number(form.Priority),
      });
      Swal.fire("Success", "Credit batch created — it's now in the Pending queue.", "success");
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
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
              <h2 className="font-bold text-white">New Credit Batch</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <PickerField label="Credit Type" value={form.CreditTypeLabel} placeholder="Select credit type..." onClick={() => setPicker("creditType")} />
              <PickerField label="Branch" value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />
              <FieldGroup label="Batch Type">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.Type} onChange={(e) => setForm((p) => ({ ...p, Type: e.target.value }))}>
                  {CREDIT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Reference">
                <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} required />
              </FieldGroup>
              <FieldGroup label="Total Value">
                <Input type="number" min="0" value={form.TotalValue} onChange={(e) => setForm((p) => ({ ...p, TotalValue: e.target.value }))} required />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Month">
                  <Input type="number" min="1" max="12" value={form.Month} onChange={(e) => setForm((p) => ({ ...p, Month: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Value Date">
                  <Input type="date" value={form.ValueDate} onChange={(e) => setForm((p) => ({ ...p, ValueDate: e.target.value }))} />
                </FieldGroup>
              </div>
              <FieldGroup label="Priority">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.Priority} onChange={(e) => setForm((p) => ({ ...p, Priority: e.target.value }))}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldGroup>
            </form>
            <div className="shrink-0 px-4 py-3 border-t">
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Creating..." : "Create Batch"}
              </Button>
            </div>
          </motion.div>
        </>
      )}

      {picker === "creditType" && (
        <EntryPickerModal
          title="Select Credit Type"
          fetchUrl={`${FIN_BASE}/api/accounts/credittypes`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, CreditTypeId: i.Id, CreditTypeLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "branch" && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={`${FIN_BASE}/api/administration/branches/all`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, BranchId: i.Id, BranchLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
    </AnimatePresence>
  );
}

const emptyEntryForm = { CustomerAccountId: "", CustomerLabel: "", Beneficiary: "", Principal: "", Interest: "", Reference: "" };

function BatchDetailDrawer({ batch, stage, currentUser, onClose, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [addingEntry, setAddingEntry] = useState(false);
  const [picker, setPicker] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loadingDiscrepancies, setLoadingDiscrepancies] = useState(true);
  const [matchTarget, setMatchTarget] = useState(null);
  const [matching, setMatching] = useState(false);

  const fetchEntries = () => {
    if (!batch) return;
    setLoading(true);
    listCreditBatchEntries(batch.Id, { pageSize: 100 })
      .then((page) => setEntries(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  // Discrepancies exist only for Payout/CheckOff batches — the two types an
  // import can leave unmatched rows for (see CreditBatchAppService.
  // ParseCreditBatchImport). No server-side status filter exists, so every
  // row (Pending/Posted/Rejected) comes back and Pending is filtered here.
  const showDiscrepancies = batch && (batch.Type === CreditBatchType.Payout || batch.Type === CreditBatchType.CheckOff);

  const fetchDiscrepancies = () => {
    if (!batch || !showDiscrepancies) { setLoadingDiscrepancies(false); return; }
    setLoadingDiscrepancies(true);
    listCreditBatchDiscrepancies(batch.Id, { pageSize: 200 })
      .then((page) => setDiscrepancies(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setDiscrepancies([]))
      .finally(() => setLoadingDiscrepancies(false));
  };

  useEffect(() => { fetchEntries(); fetchDiscrepancies(); setEntryForm(emptyEntryForm); setImportResult(null); }, [batch?.Id]);

  if (!batch) return null;

  const isMine = batch.CreatedBy === currentUser;
  const canManageEntries = stage === "origination" && batch.Status === BatchStatus.Pending && isMine;
  const entriesTotal = entries.reduce((sum, e) => sum + (e.Principal || 0) + (e.Interest || 0), 0);
  const pendingDiscrepancies = discrepancies.filter((d) => d.Status === BatchStatus.Pending);
  const discrepancyFields = DISCREPANCY_FIELDS[batch.Type] || [];

  const handleMatch = async (customerAccountId) => {
    if (!matchTarget) return;
    setMatching(true);
    try {
      await matchCreditBatchDiscrepancy(batch.Id, matchTarget.Id, customerAccountId);
      Swal.fire("Matched", "The row was allocated to that account.", "success");
      setMatchTarget(null);
      fetchDiscrepancies();
      fetchEntries();
    } catch (err) {
      Swal.fire("Could not match this row", err.message, "error");
    } finally {
      setMatching(false);
    }
  };

  const handleRejectDiscrepancy = (row) => {
    runBatchAction(
      () => rejectCreditBatchDiscrepancy(batch.Id, row.Id),
      { confirmTitle: "Reject this row?", successMessage: "Row rejected.", onSuccess: fetchDiscrepancies }
    );
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.CustomerAccountId && !entryForm.Beneficiary) {
      Swal.fire("Missing Fields", "Pick a customer account or type a beneficiary name.", "warning");
      return;
    }
    if (!(Number(entryForm.Principal) > 0)) {
      Swal.fire("Missing Fields", "Principal must be greater than zero.", "warning");
      return;
    }
    setAddingEntry(true);
    try {
      await addCreditBatchEntry(batch.Id, {
        CustomerAccountId: entryForm.CustomerAccountId || null,
        Beneficiary: entryForm.Beneficiary,
        Principal: Number(entryForm.Principal),
        Interest: Number(entryForm.Interest) || 0,
        Reference: entryForm.Reference,
      });
      setEntryForm(emptyEntryForm);
      fetchEntries();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setAddingEntry(false);
    }
  };

  const handleRemoveEntry = (entry) => {
    runBatchAction(
      () => removeCreditBatchEntries([entry]),
      { confirmTitle: "Remove this entry?", successMessage: "Entry removed.", onSuccess: fetchEntries }
    );
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      Swal.fire("Unsupported file", "Export the completed Excel sheet as CSV before uploading it.", "warning");
      return;
    }

    setImporting(true);
    try {
      const result = await importCreditBatch(batch.Id, file);
      setImportResult(result);
      fetchEntries();
      Swal.fire(
        "Import complete",
        `${result.MatchedCount ?? 0} matched entries and ${result.MismatchCount ?? 0} discrepancies were recorded.`,
        result.MismatchCount ? "warning" : "success"
      );
    } catch (err) {
      Swal.fire("Import failed", err.message, "error");
    } finally {
      setImporting(false);
    }
  };

  const handleAudit = async (option, remarks) => {
    await runBatchAction(
      () => auditCreditBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.verification }),
      { successMessage: option === 1 ? "Batch verified." : "Batch rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  const handleAuthorize = async (option, remarks) => {
    await runBatchAction(
      () => authorizeCreditBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.authorization }),
      { successMessage: option === 1 ? "Batch authorized. Async types post off a background queue — check the entries list for real posting status." : "Batch rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Credit Batch #{batch.PaddedBatchNumber}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Type</span><p className="font-semibold text-gray-800">{batch.TypeDescription}</p></div>
            <div><span className="text-gray-400">Status</span><p><BatchStatusBadge status={batch.Status} /></p></div>
            <div><span className="text-gray-400">Reference</span><p className="font-semibold text-gray-800">{batch.Reference}</p></div>
            <div><span className="text-gray-400">Total Value</span><p className="font-semibold text-indigo-600">{batch.TotalValue?.toLocaleString()}</p></div>
            <div><span className="text-gray-400">Created By</span><p className="font-semibold text-gray-800">{batch.CreatedBy}</p></div>
            <div><span className="text-gray-400">Entries Total</span><p className="font-semibold text-gray-800">{entriesTotal.toLocaleString()}</p></div>
          </div>

          {batch.AuditRemarks && (
            <div className="text-xs bg-gray-50 border rounded-lg p-3">
              <span className="font-semibold text-gray-600">Verification remarks:</span> {batch.AuditRemarks}
            </div>
          )}
          {batch.AuthorizationRemarks && (
            <div className="text-xs bg-gray-50 border rounded-lg p-3">
              <span className="font-semibold text-gray-600">Authorization remarks:</span> {batch.AuthorizationRemarks}
            </div>
          )}

          {canManageEntries && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Import from Excel</p>
                  <p className="mt-1 text-xs text-indigo-700">Export the workbook as CSV. Importing replaces this batch's matched entries and records unmatched rows for reconciliation.</p>
                </div>
                <Button type="button" disabled={importing} onClick={() => fileInputRef.current?.click()} className="shrink-0 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <FaUpload /> {importing ? "Importing…" : "Choose CSV"}
                </Button>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
              </div>
              {importResult && (
                <div className="mt-3 rounded-lg bg-white p-3 text-xs text-gray-700 shadow">
                  <p><span className="font-semibold text-green-700">Matched:</span> {importResult.MatchedCount ?? 0} · <span className="font-semibold text-amber-700">Discrepancies:</span> {importResult.MismatchCount ?? 0}</p>
                  {!!importResult.Mismatches?.length && (
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {importResult.Mismatches.map((row, index) => <p key={index} className="rounded bg-amber-50 px-2 py-1 text-amber-900">{row.Remarks || `Row ${index + 1} could not be matched.`}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showDiscrepancies && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Discrepancies{pendingDiscrepancies.length > 0 ? ` (${pendingDiscrepancies.length} unresolved)` : ""}
              </p>
              {loadingDiscrepancies ? (
                <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}</div>
              ) : discrepancies.length > 0 ? (
                <div className="space-y-2">
                  {discrepancies.map((row) => (
                    <div key={row.Id} className="bg-white rounded-lg shadow border px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                          {discrepancyFields.map(([field, label]) => (
                            <div key={field} className="truncate">
                              <span className="text-gray-400">{label}:</span> <span className="text-gray-700">{row[field] || "—"}</span>
                            </div>
                          ))}
                        </div>
                        <BatchStatusBadge status={row.Status} />
                      </div>
                      {row.Remarks && <p className="mt-1 text-xs text-amber-700">{row.Remarks}</p>}
                      {canManageEntries && row.Status === BatchStatus.Pending && (
                        <div className="mt-2 flex justify-end gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleRejectDiscrepancy(row)} className="gap-1">
                            <FaBan className="text-red-500" /> Reject
                          </Button>
                          <Button type="button" size="sm" onClick={() => setMatchTarget(row)} className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                            <FaExchangeAlt /> Match to account
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">No discrepancies — every imported row matched automatically.</p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Entries</p>
            {loading ? (
              <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
            ) : entries.length > 0 ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.Id} className="flex items-center justify-between bg-white rounded-lg shadow border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{entry.Beneficiary || entry.CustomerFullName || "—"}</p>
                      <p className="text-xs text-gray-500">{((entry.Principal || 0) + (entry.Interest || 0)).toLocaleString()} · <BatchStatusBadge status={entry.Status} /></p>
                    </div>
                    {canManageEntries && (
                      <button type="button" onClick={() => handleRemoveEntry(entry)} className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2">
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32" />
                <p className="text-gray-400 text-xs mt-1">No entries yet.</p>
              </div>
            )}
          </div>

          {canManageEntries && (
            <form onSubmit={handleAddEntry} className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Add Entry</p>
              <PickerField label="Customer Account (optional)" value={entryForm.CustomerLabel} placeholder="Pick an account holder..." onClick={() => setPicker(true)} />
              <FieldGroup label="Beneficiary (for non-account holders)">
                <Input value={entryForm.Beneficiary} onChange={(e) => setEntryForm((p) => ({ ...p, Beneficiary: e.target.value }))} placeholder="Name" />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Principal">
                  <Input type="number" min="0" value={entryForm.Principal} onChange={(e) => setEntryForm((p) => ({ ...p, Principal: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Interest">
                  <Input type="number" min="0" value={entryForm.Interest} onChange={(e) => setEntryForm((p) => ({ ...p, Interest: e.target.value }))} />
                </FieldGroup>
              </div>
              <FieldGroup label="Reference">
                <Input value={entryForm.Reference} onChange={(e) => setEntryForm((p) => ({ ...p, Reference: e.target.value }))} />
              </FieldGroup>
              <Button type="submit" disabled={addingEntry} className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                <FaPlus /> {addingEntry ? "Adding..." : "Add Entry"}
              </Button>
            </form>
          )}
        </div>

        {(stage === "verification" || stage === "authorization") && (
          <div className="shrink-0 px-4 py-3 border-t">
            <Button onClick={() => setAuditOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {stage === "verification" ? "Verify Batch" : "Authorize Batch"}
            </Button>
          </div>
        )}
      </motion.div>

      {picker && (
        <EntryPickerModal
          title="Select Customer Account"
          fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName || [i.CustomerIndividualFirstName, i.CustomerIndividualLastName].filter(Boolean).join(" ") || i.FullAccountNumber}
          getSublabel={(i) => [i.FullAccountNumber, i.CustomerAccountTypeTargetProductDescription].filter(Boolean).join(" — ")}
          onSelect={(i) => setEntryForm((p) => ({ ...p, CustomerAccountId: i.Id, CustomerLabel: `${i.CustomerFullName || ""} — ${i.FullAccountNumber || ""}` }))}
          onClose={() => setPicker(false)}
        />
      )}

      <BatchAuditModal
        open={auditOpen}
        title={stage === "verification" ? "Verify Credit Batch" : "Authorize Credit Batch"}
        postLabel={stage === "verification" ? "Verify" : "Authorize"}
        onSubmit={stage === "verification" ? handleAudit : handleAuthorize}
        onClose={() => setAuditOpen(false)}
      />

      {matchTarget && (
        <EntryPickerModal
          title={`Match "${matchTarget.Column5 || matchTarget.Column2 || "row"}" to an account`}
          fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName || [i.CustomerIndividualFirstName, i.CustomerIndividualLastName].filter(Boolean).join(" ") || i.FullAccountNumber}
          getSublabel={(i) => [i.FullAccountNumber, i.CustomerAccountTypeTargetProductDescription].filter(Boolean).join(" — ")}
          onSelect={(i) => handleMatch(i.Id)}
          onClose={() => !matching && setMatchTarget(null)}
        />
      )}
    </AnimatePresence>
  );
}

export default function CreditBatchPanel({ stage }) {
  const { userName } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const statusForStage = stage === "authorization" ? BatchStatus.Audited : BatchStatus.Pending;

  const fetchList = () => {
    setLoading(true);
    listCreditBatches({ status: statusForStage, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [stage]);

  return (
    <div>
      {stage === "origination" && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
            <FaPlus /> New Credit Batch
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Batch No</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-3">Reference</span>
          <span className="col-span-2">Total Value</span>
          <span className="col-span-2">Created By</span>
          <span className="col-span-1">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((batch) => (
              <button
                key={batch.Id}
                type="button"
                onClick={() => setSelected(batch)}
                className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-2 font-medium text-indigo-700">{batch.PaddedBatchNumber}</span>
                  <span className="col-span-2 text-gray-700">{batch.TypeDescription}</span>
                  <span className="col-span-3 text-gray-700 truncate">{batch.Reference}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{batch.TotalValue?.toLocaleString()}</span>
                  <span className="col-span-2 text-xs text-gray-500 truncate">{batch.CreatedBy}</span>
                  <span className="col-span-1"><BatchStatusBadge status={batch.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No credit batches found.</p>
          </div>
        )}
      </div>

      <CreateCreditBatchDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <BatchDetailDrawer batch={selected} stage={stage} currentUser={userName} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
