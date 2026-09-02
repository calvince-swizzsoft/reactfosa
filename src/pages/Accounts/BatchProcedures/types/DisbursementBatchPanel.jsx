import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listDisbursementBatches, createDisbursementBatch, listDisbursementBatchEntries,
  addDisbursementBatchEntry, removeDisbursementBatchEntries, auditDisbursementBatch, authorizeDisbursementBatch,
} from "./disbursementBatchApi";
import { BatchStatus } from "../lib/batchEnums";
import BatchStatusBadge from "../lib/BatchStatusBadge";
import BatchAuditModal from "../lib/BatchAuditModal";
import EntryPickerModal from "../lib/EntryPickerModal";
import { runBatchAction } from "../lib/runBatchAction";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = { origination: 23069, verification: 23079, authorization: 23089 };

const DISBURSEMENT_TYPE_OPTIONS = [
  { value: 1, label: "Normal" }, { value: 2, label: "Express" }, { value: 4, label: "Waiver" },
];
const LOAN_PRODUCT_CATEGORY_OPTIONS = [
  { value: 0, label: "Short-Term" }, { value: 1, label: "Long-Term" },
];
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

const emptyCreateForm = { BranchId: "", BranchLabel: "", Type: 1, LoanProductCategory: 0, Reference: "", Priority: 3 };

function CreateDisbursementBatchDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);

  useEffect(() => { if (open) setForm(emptyCreateForm); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId) {
      Swal.fire("Missing Fields", "Branch is required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createDisbursementBatch({
        BranchId: form.BranchId,
        Type: Number(form.Type),
        LoanProductCategory: Number(form.LoanProductCategory),
        Reference: form.Reference,
        Priority: Number(form.Priority),
      });
      Swal.fire("Success", "Disbursement batch created — it's now in the Pending queue.", "success");
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
              <h2 className="font-bold text-white">New Disbursement Batch</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <PickerField label="Branch" value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker(true)} />
              <FieldGroup label="Disbursement Type">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.Type} onChange={(e) => setForm((p) => ({ ...p, Type: e.target.value }))}>
                  {DISBURSEMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldGroup>
              <FieldGroup label="Loan Product Category">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.LoanProductCategory} onChange={(e) => setForm((p) => ({ ...p, LoanProductCategory: e.target.value }))}>
                  {LOAN_PRODUCT_CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Immutable after creation — only loan cases in this category can be attached.</p>
              </FieldGroup>
              <FieldGroup label="Reference">
                <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} />
              </FieldGroup>
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

      {picker && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={`${FIN_BASE}/api/administration/branches/all`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, BranchId: i.Id, BranchLabel: i.Description }))}
          onClose={() => setPicker(false)}
        />
      )}
    </AnimatePresence>
  );
}

const AUDITED_LOAN_CASE_STATUS = 48832;
const emptyEntryForm = { LoanCaseId: "", LoanCaseLabel: "", Reference: "" };

function BatchDetailDrawer({ batch, stage, currentUser, onClose, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoadError, setEntriesLoadError] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [addingEntry, setAddingEntry] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [loanCasePickerOpen, setLoanCasePickerOpen] = useState(false);

  const fetchEntries = () => {
    if (!batch) return Promise.resolve([]);
    setLoading(true);
    setEntriesLoadError(false);
    return listDisbursementBatchEntries(batch.Id, { pageSize: 100 })
      .then((page) => {
        const batchEntries = page?.pageCollection || page?.PageCollection || [];
        setEntries(batchEntries);
        return batchEntries;
      })
      .catch(() => {
        setEntries([]);
        setEntriesLoadError(true);
        return null;
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); setEntryForm(emptyEntryForm); }, [batch?.Id]);

  if (!batch) return null;

  const isMine = batch.CreatedBy === currentUser;
  const canManageEntries = stage === "origination" && batch.Status === BatchStatus.Pending && isMine;

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.LoanCaseId) {
      Swal.fire("Missing Fields", "A Loan Case Id is required.", "warning");
      return;
    }
    setAddingEntry(true);
    try {
      await addDisbursementBatchEntry(batch.Id, { LoanCaseId: entryForm.LoanCaseId, Reference: entryForm.Reference });
      setEntryForm(emptyEntryForm);
      fetchEntries();
      Swal.fire("Entry Added", "The audited loan case was added to the disbursement batch.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setAddingEntry(false);
    }
  };

  const handleRemoveEntry = (entry) => {
    runBatchAction(
      () => removeDisbursementBatchEntries([entry]),
      { confirmTitle: "Remove this entry? The loan case becomes eligible for a different batch again.", successMessage: "Entry removed.", onSuccess: fetchEntries }
    );
  };

  const handleAudit = async (option, remarks) => {
    if (option === 1) {
      const currentEntries = await fetchEntries();
      if (!currentEntries) {
        Swal.fire("Entries Unavailable", "The batch entries could not be checked. Reload them before verifying the batch.", "error");
        return;
      }
      if (currentEntries.length === 0) {
        Swal.fire("Empty Batch", "Add at least one entry before verifying this disbursement batch.", "warning");
        return;
      }
    }
    await runBatchAction(
      () => auditDisbursementBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.verification }),
      { successMessage: option === 1 ? "Batch verified." : "Batch rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  const handleAuthorize = async (option, remarks) => {
    if (option === 1) {
      const currentEntries = await fetchEntries();
      if (!currentEntries) {
        Swal.fire("Entries Unavailable", "The batch entries could not be checked. Reload them before authorizing the batch.", "error");
        return;
      }
      if (currentEntries.length === 0) {
        Swal.fire("Empty Batch", "A disbursement batch must contain at least one entry before authorization.", "warning");
        return;
      }
    }
    await runBatchAction(
      () => authorizeDisbursementBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.authorization }),
      { successMessage: option === 1 ? "Batch authorized. Entries disburse off a background queue — check the entries list for real posting status." : "Batch rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Disbursement Batch #{batch.PaddedBatchNumber}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Type</span><p className="font-semibold text-gray-800">{batch.TypeDescription}</p></div>
            <div><span className="text-gray-400">Status</span><p><BatchStatusBadge status={batch.Status} /></p></div>
            <div><span className="text-gray-400">Category</span><p className="font-semibold text-gray-800">{batch.LoanProductCategoryDescription}</p></div>
            <div><span className="text-gray-400">Reference</span><p className="font-semibold text-gray-800">{batch.Reference || "—"}</p></div>
            <div><span className="text-gray-400">Created By</span><p className="font-semibold text-gray-800">{batch.CreatedBy}</p></div>
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

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Entries (Loan Cases)</p>
            {loading ? (
              <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
            ) : entriesLoadError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-center">
                <p className="text-sm font-medium text-red-600">Entries could not be loaded.</p>
                <Button type="button" onClick={fetchEntries} className="mt-3">Retry</Button>
              </div>
            ) : entries.length > 0 ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.Id} className="flex items-center justify-between bg-white rounded-lg shadow border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{entry.CustomerFullName || entry.LoanCasePaddedCaseNumber || "—"}</p>
                      <p className="text-xs text-gray-500">{(entry.LoanCaseApprovedAmount || 0).toLocaleString()} · <BatchStatusBadge status={entry.Status} /></p>
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
              <PickerField label="Audited Loan Case" value={entryForm.LoanCaseLabel} placeholder="Search eligible audited loan cases..." onClick={() => setLoanCasePickerOpen(true)} />
              {entryForm.LoanCaseId && <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">Selected case: <span className="font-semibold">{entryForm.LoanCaseLabel}</span></div>}
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
            <Button
              onClick={() => setAuditOpen(true)}
              disabled={loading || entriesLoadError || entries.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading
                ? "Checking Entries..."
                : entriesLoadError
                  ? "Entries Unavailable"
                  : entries.length === 0
                    ? "Add Entries Before Continuing"
                    : stage === "verification" ? "Verify Batch" : "Authorize Batch"}
            </Button>
            {!loading && !entriesLoadError && entries.length === 0 && (
              <p className="mt-2 text-center text-xs text-amber-600">This batch cannot move forward until it contains at least one entry.</p>
            )}
          </div>
        )}
      </motion.div>

      <BatchAuditModal
        open={auditOpen}
        title={stage === "verification" ? "Verify Disbursement Batch" : "Authorize Disbursement Batch"}
        postLabel={stage === "verification" ? "Verify" : "Authorize"}
        onSubmit={stage === "verification" ? handleAudit : handleAuthorize}
        onClose={() => setAuditOpen(false)}
      />
      {loanCasePickerOpen && (
        <EntryPickerModal
          title="Select Audited Loan Case"
          fetchUrl={`${FIN_BASE}/api/backoffice/loancases?status=${AUDITED_LOAN_CASE_STATUS}&pageSize=50&text=&loanCaseFilter=0`}
          filterItems={(loanCase) => !loanCase.IsBatched
            && Number(loanCase.LoanRegistrationLoanProductCategory) === Number(batch.LoanProductCategory)
            && String(loanCase.BranchId) === String(batch.BranchId)}
          getLabel={(loanCase) => `${loanCase.PaddedCaseNumber || loanCase.CaseNumber || "Loan case"} — ${loanCase.CustomerFullName || "Customer"}`}
          getSublabel={(loanCase) => `${loanCase.LoanProductDescription || "Loan product"} · ${Number(loanCase.ApprovedAmount || 0).toLocaleString()} · ${loanCase.BranchDescription || "Branch"}`}
          emptyText="No unbatched audited loan cases match this batch's branch and product category."
          onSelect={(loanCase) => setEntryForm((previous) => ({
            ...previous,
            LoanCaseId: loanCase.Id,
            LoanCaseLabel: `${loanCase.PaddedCaseNumber || loanCase.CaseNumber || "Loan case"} — ${loanCase.CustomerFullName || "Customer"}`,
          }))}
          onClose={() => setLoanCasePickerOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}

export default function DisbursementBatchPanel({ stage }) {
  const { userName } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const statusForStage = stage === "authorization" ? BatchStatus.Audited : BatchStatus.Pending;

  const fetchList = () => {
    setLoading(true);
    listDisbursementBatches({ status: statusForStage, pageSize: 100 })
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
            <FaPlus /> New Disbursement Batch
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Batch No</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-3">Reference</span>
          <span className="col-span-2">Created By</span>
          <span className="col-span-3">Status</span>
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
                  <span className="col-span-3 text-gray-700 truncate">{batch.Reference || "—"}</span>
                  <span className="col-span-2 text-xs text-gray-500 truncate">{batch.CreatedBy}</span>
                  <span className="col-span-3"><BatchStatusBadge status={batch.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No disbursement batches found.</p>
          </div>
        )}
      </div>

      <CreateDisbursementBatchDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <BatchDetailDrawer batch={selected} stage={stage} currentUser={userName} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
