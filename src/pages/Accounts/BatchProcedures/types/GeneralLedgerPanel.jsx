import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BatchFieldLabel from "../lib/BatchFieldLabel";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash, FaEdit } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listGeneralLedgers, createGeneralLedger, listGeneralLedgerEntries, addGeneralLedgerEntry,
  removeGeneralLedgerEntries, auditGeneralLedger, authorizeGeneralLedger, getGeneralLedger, updateGeneralLedgerEntry,
} from "./generalLedgerApi";
import { BatchStatus } from "../lib/batchEnums";
import BatchStatusBadge from "../lib/BatchStatusBadge";
import BatchAuditModal from "../lib/BatchAuditModal";
import EntryPickerModal from "../lib/EntryPickerModal";
import { POSTING_PERIODS_BASE } from "../../PostingPeriods/api";
import { runBatchAction } from "../lib/runBatchAction";

import LedgerAccountSide from "../lib/LedgerAccountSide";
import { ledgerEntryPayload, ledgerBalance } from "../lib/generalLedgerEntry";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = { origination: 23069, verification: 23079, authorization: 23089 };

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <BatchFieldLabel label={label} help={help} />
      {children}
    </div>
  );
}

function PickerField({ label, help, value, placeholder, onClick }) {
  return (
    <div>
      <BatchFieldLabel label={label} help={help} />
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

const emptyCreateForm = { BranchId: "", BranchLabel: "", PostingPeriodId: "", PostingPeriodLabel: "", TotalValue: "", Remarks: "" };

function CreateGeneralLedgerDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => { if (open) setForm(emptyCreateForm); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.PostingPeriodId || !form.Remarks || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "Branch, posting period, remarks and a positive total value are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createGeneralLedger({
        BranchId: form.BranchId,
        PostingPeriodId: form.PostingPeriodId,
        TotalValue: Number(form.TotalValue),
        Remarks: form.Remarks,
      });
      Swal.fire("Success", "General ledger created — it's now in the Pending queue.", "success");
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
          <motion.div className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
              <h2 className="font-bold text-white">New General Ledger</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

              <PickerField label="Branch" help="The branch responsible for this batch. Check it before adding entries." value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />
              <PickerField label="Posting Period" help="The accounting period in which these transactions will be recorded. Choose the period that includes the value date." value={form.PostingPeriodLabel} placeholder="Select posting period..." onClick={() => setPicker("postingPeriod")} />
              <FieldGroup label="Total Value" help="The total of all entry amounts in this batch, counted once per debit/credit pair. Entries must match this control total before posting.">
                <Input type="number" min="0.01" step="0.01" value={form.TotalValue} onChange={(e) => setForm((p) => ({ ...p, TotalValue: e.target.value }))} required />
              </FieldGroup>
              <FieldGroup label="Remarks" help="Explain why this batch or entry is needed so the verifier and authorizer can review it.">
                <Input value={form.Remarks} onChange={(e) => setForm((p) => ({ ...p, Remarks: e.target.value }))} required />
              </FieldGroup>
            </form>
            <div className="shrink-0 px-4 py-3 border-t">
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Creating..." : "Create Ledger"}
              </Button>
            </div>
          </motion.div>
        </>
      )}

      {picker === "branch" && (
        <EntryPickerModal title="Select Branch" fetchUrl={`${FIN_BASE}/api/administration/branches/all`} getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, BranchId: i.Id, BranchLabel: i.Description }))} onClose={() => setPicker(null)} />
      )}
      {picker === "postingPeriod" && (
        <EntryPickerModal title="Select Posting Period" fetchUrl={POSTING_PERIODS_BASE} getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, PostingPeriodId: i.Id, PostingPeriodLabel: i.Description }))} onClose={() => setPicker(null)} />
      )}
    </AnimatePresence>
  );
}

const emptyEntryForm = {
  ChartOfAccountId: "", ChartOfAccountLabel: "", ContraChartOfAccountId: "", ContraChartOfAccountLabel: "",
  CustomerAccountId: "", CustomerLabel: "", ContraCustomerAccountId: "", ContraCustomerLabel: "",
  ValueDate: "", Amount: "", PrimaryDescription: "", SecondaryDescription: "", Reference: "",
};

function BatchDetailDrawer({ batch, stage, currentUser, onClose, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [addingEntry, setAddingEntry] = useState(false);
  const [picker, setPicker] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [entryPage, setEntryPage] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [entriesTotal, setEntriesTotal] = useState(null);
  const [entriesError, setEntriesError] = useState("");
  const [editorVersion, setEditorVersion] = useState(0);
  const [editingEntry, setEditingEntry] = useState(null);
  const editorRef = useRef(null);
  const resetEntry = () => {
    const today = new Date();
    const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    setEditingEntry(null); setEntryForm({ ...emptyEntryForm, ValueDate: date }); setEditorVersion((n) => n + 1);
  };

  const fetchEntries = () => {
    if (!batch) return;
    setLoading(true);
    setEntriesError("");
    listGeneralLedgerEntries(batch.Id, { pageIndex: entryPage, pageSize: 20 })
      .then((page) => { setEntries(page?.pageCollection || page?.PageCollection || []); setEntryCount(page?.ItemsCount ?? page?.itemsCount ?? 0); setEntriesTotal(Number(page?.TotalApportioned ?? page?.totalApportioned ?? 0)); })
      .catch((error) => { setEntries([]); setEntriesTotal(null); setEntriesError(error.message); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, [batch?.Id, entryPage]);
  useEffect(() => { resetEntry(); }, [batch?.Id]);

  if (!batch) return null;

  const isMine = batch.CreatedBy === currentUser;
  const canManageEntries = stage === "origination" && batch.Status === BatchStatus.Pending && isMine;
  const balance = ledgerBalance(batch.TotalValue, entriesTotal);
  const isBalanced = !!balance?.balanced && entryCount > 0;
  const draftBalance = ledgerBalance(batch.TotalValue, entriesTotal, entryForm.Amount || 0, editingEntry?.Amount || 0);
  const editEntry = (entry) => {
    setEditingEntry(entry);
    setEntryForm({ ...emptyEntryForm, ...entry, Amount: String(entry.Amount), ValueDate: entry.ValueDate?.slice(0, 10) || "",
      ChartOfAccountLabel: entry.ChartOfAccountName, ContraChartOfAccountLabel: entry.ContraChartOfAccountName,
      CustomerLabel: entry.CustomerAccountCustomerFullName, ContraCustomerLabel: entry.ContraCustomerAccountCustomerFullName });
    setEditorVersion((n) => n + 1);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const checkCurrentBalance = async () => {
    try {
      const [currentBatch, page] = await Promise.all([getGeneralLedger(batch.Id), listGeneralLedgerEntries(batch.Id, { pageSize: 1 })]);
      const total = Number(page?.TotalApportioned ?? page?.totalApportioned ?? 0);
      const current = ledgerBalance(currentBatch.TotalValue, total);
      if (!current?.balanced || !(Number(page?.ItemsCount ?? page?.itemsCount) > 0)) {
        Swal.fire("Batch is not balanced", "The entries total must equal the batch value before proceeding. Refresh and correct the entries.", "warning");
        fetchEntries(); return false;
      }
      return true;
    } catch (error) { Swal.fire("Balance check failed", error.message, "error"); return false; }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    let payload;
    try { payload = ledgerEntryPayload(entryForm, batch.BranchId); }
    catch (error) { Swal.fire("Check entry", error.message, "warning"); return; }
    if (!draftBalance || draftBalance.exceeds) {
      Swal.fire("Batch value exceeded", draftBalance ? "This change exceeds the batch value by " + Math.abs(draftBalance.difference).toLocaleString() + ". Reduce the entry amount." : "Wait for the batch total to load.", "warning"); return;
    }
    setAddingEntry(true);
    try {
      if (editingEntry) await updateGeneralLedgerEntry(batch.Id, editingEntry.Id, payload);
      else await addGeneralLedgerEntry(batch.Id, payload);
      resetEntry();
      Swal.fire(editingEntry ? "Entry updated" : "Entry added", "The entry has been saved. Balance the batch before verification.", "success");
      fetchEntries();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setAddingEntry(false);
    }
  };

  const handleRemoveEntry = (entry) => {
    runBatchAction(
      () => removeGeneralLedgerEntries([entry]),
      { confirmTitle: "Remove this entry?", successMessage: "Entry removed.", onSuccess: () => { if (editingEntry?.Id === entry.Id) resetEntry(); fetchEntries(); } }
    );
  };

  const handleAudit = async (option, remarks) => {
    if (option === 1 && !(await checkCurrentBalance())) return;
    await runBatchAction(
      () => auditGeneralLedger(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.verification }),
      { successMessage: option === 1 ? "Ledger verified." : "Ledger rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  const handleAuthorize = async (option, remarks) => {
    if (option === 1 && !(await checkCurrentBalance())) return;
    await runBatchAction(
      () => authorizeGeneralLedger(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.authorization }),
      { successMessage: option === 1 ? "Ledger authorized and posted." : "Ledger rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-full max-w-[760px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">General Ledger #{batch.PaddedLedgerNumber}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Status</span><p><BatchStatusBadge status={batch.Status} /></p></div>
            <div><span className="text-gray-400">Total Value</span><p className="font-semibold text-indigo-600">{batch.TotalValue?.toLocaleString()}</p></div>
            <div className="col-span-2"><span className="text-gray-400">Remarks</span><p className="font-semibold text-gray-800">{batch.Remarks}</p></div>
            <div><span className="text-gray-400">Created By</span><p className="font-semibold text-gray-800">{batch.CreatedBy}</p></div>
            <div><span className="text-gray-400">Entries Total</span><p className="font-semibold text-gray-800">{(entriesTotal?.toLocaleString() ?? "—")}</p></div>
          </div>

          {!loading && !entriesError && !isBalanced && (
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Entries total {(entriesTotal?.toLocaleString() ?? "—")} / Batch value {batch.TotalValue?.toLocaleString()}. {balance?.exceeds ? "Over by" : "Remaining"}: {Math.abs(balance?.difference || 0).toLocaleString()}. Balance the batch before verification or authorization.
            </div>
          )}

          {!loading && !entriesError && isBalanced && <p className="rounded-lg bg-green-100 text-green-700 p-3 text-sm font-semibold">Balanced — entries total matches the batch value.</p>}

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
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Ledger entries</p>
            {entriesError ? <div role="alert" className="text-red-600 text-sm">{entriesError} <Button onClick={fetchEntries}>Retry</Button></div> : loading ? (
              <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
            ) : entries.length > 0 ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.Id} className="flex items-center justify-between bg-white rounded-lg shadow border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">Debit: {entry.ContraChartOfAccountName}</p>
                      <p className="font-medium text-gray-800">Credit: {entry.ChartOfAccountName}</p>
                      <p className="text-xs text-gray-500">{entry.ContraCustomerAccountCustomerFullName || "G/L"} → {entry.CustomerAccountCustomerFullName || "G/L"} · {entry.ValueDate ? new Date(entry.ValueDate).toLocaleDateString() : "—"}</p>
                      <p className="text-xs text-gray-500">{(entry.Amount || 0).toLocaleString()} · {entry.Reference}</p>
                    </div>
                    {canManageEntries && (
                      <div className="flex gap-3 ml-2 shrink-0"><button type="button" disabled={addingEntry} aria-label={`Edit entry ${entry.Reference}`} onClick={() => editEntry(entry)} className="text-indigo-600"><FaEdit /></button>
                      <button type="button" disabled={addingEntry} aria-label={`Remove entry ${entry.Reference}`} onClick={() => handleRemoveEntry(entry)} className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2">
                        <FaTrash className="text-xs" />
                      </button></div>
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

          {entryCount > 0 && <div className="flex justify-center items-center gap-3"><Button disabled={loading || entryPage === 0} onClick={() => setEntryPage((n) => n - 1)}>Prev</Button><span className="text-sm">Page {entryPage + 1} of {Math.max(1, Math.ceil(entryCount / 20))}</span><Button disabled={loading || (entryPage + 1) * 20 >= entryCount} onClick={() => setEntryPage((n) => n + 1)}>Next</Button></div>}
          {canManageEntries && (
            <form ref={editorRef} id="general-ledger-entry" onSubmit={handleAddEntry} className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{editingEntry ? "Edit Entry" : "Add Entry"}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LedgerAccountSide key={"debit-" + editorVersion} label="Debit" initialValue={editingEntry ? { ledgerId: editingEntry.ContraChartOfAccountId, ledgerLabel: editingEntry.ContraChartOfAccountName, customerAccountId: editingEntry.ContraCustomerAccountId } : null} disabled={addingEntry} onChange={(value) => setEntryForm((old) => ({ ...old, ContraChartOfAccountId: value?.ledgerId || "", ContraChartOfAccountLabel: value?.ledgerLabel || "", ContraCustomerAccountId: value?.customerAccountId || "", ContraCustomerLabel: value?.customerLabel || "" }))} />
                <LedgerAccountSide key={"credit-" + editorVersion} label="Credit" initialValue={editingEntry ? { ledgerId: editingEntry.ChartOfAccountId, ledgerLabel: editingEntry.ChartOfAccountName, customerAccountId: editingEntry.CustomerAccountId } : null} disabled={addingEntry} onChange={(value) => setEntryForm((old) => ({ ...old, ChartOfAccountId: value?.ledgerId || "", ChartOfAccountLabel: value?.ledgerLabel || "", CustomerAccountId: value?.customerAccountId || "", CustomerLabel: value?.customerLabel || "" }))} />
              </div>
              <FieldGroup label="Value Date" help="The effective accounting date of the transaction. It must fall within the applicable posting period."><Input type="date" value={entryForm.ValueDate} onChange={(event) => setEntryForm((old) => ({ ...old, ValueDate: event.target.value }))} required /></FieldGroup>
              <FieldGroup label="Amount" help="The amount posted equally to this entry’s debit and credit accounts. For 1,000, the debit is 1,000 and the credit is 1,000; the batch total increases by 1,000.">
                <Input type="number" step="0.01" value={entryForm.Amount} onChange={(e) => setEntryForm((p) => ({ ...p, Amount: e.target.value }))} />
              </FieldGroup>
              {entryForm.Amount && draftBalance && <p aria-live="polite" className={`text-sm ${draftBalance.exceeds ? "text-red-600" : "text-gray-600"}`}>Total after {editingEntry ? "saving" : "adding"}: {draftBalance.total.toLocaleString()} · {draftBalance.exceeds ? "Over by" : "Remaining"}: {Math.abs(draftBalance.difference).toLocaleString()}</p>}
              <FieldGroup label="Primary Description" help="The main narration describing the purpose of the transaction.">
                <Input value={entryForm.PrimaryDescription} onChange={(e) => setEntryForm((p) => ({ ...p, PrimaryDescription: e.target.value }))} required />
              </FieldGroup>
              <FieldGroup label="Secondary Description" help="Additional narration to help identify or explain the transaction.">
                <Input value={entryForm.SecondaryDescription} onChange={(e) => setEntryForm((p) => ({ ...p, SecondaryDescription: e.target.value }))} required />
              </FieldGroup>
              <FieldGroup label="Reference" help="A recognizable reference for tracing this batch or entry, such as a document number or payment reference.">
                <Input value={entryForm.Reference} onChange={(e) => setEntryForm((p) => ({ ...p, Reference: e.target.value }))} required />
              </FieldGroup>

            </form>
          )}
        </div>

        {canManageEntries && <div className="shrink-0 px-4 py-3 border-t"><Button type="submit" form="general-ledger-entry" disabled={addingEntry || loading || !!entriesError || !entryForm.ChartOfAccountId || !entryForm.ContraChartOfAccountId} className="w-full bg-indigo-600 hover:bg-indigo-700">{addingEntry ? "Saving..." : editingEntry ? "Save Changes" : "Add Entry"}</Button>{editingEntry && <Button type="button" variant="outline" disabled={addingEntry} onClick={resetEntry} className="w-full mt-2">Cancel Edit</Button>}</div>}
        {(stage === "verification" || stage === "authorization") && (
          <div className="shrink-0 px-4 py-3 border-t">
            <Button onClick={() => setAuditOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {stage === "verification" ? "Verify Ledger" : "Authorize Ledger"}
            </Button>
          </div>
        )}
      </motion.div>

      <BatchAuditModal
        open={auditOpen}
        title={stage === "verification" ? "Verify General Ledger" : "Authorize General Ledger"}
        postDisabled={loading || !!entriesError || !isBalanced}
        postDisabledReason="The batch must contain entries and their total must match the batch value. You can still reject the batch."
        postLabel={stage === "verification" ? "Verify" : "Authorize"}
        onSubmit={stage === "verification" ? handleAudit : handleAuthorize}
        onClose={() => setAuditOpen(false)}
      />
    </AnimatePresence>
  );
}

export default function GeneralLedgerPanel({ stage }) {
  const { userName } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const statusForStage = stage === "authorization" ? BatchStatus.Audited : BatchStatus.Pending;

  const fetchList = () => {
    setLoading(true);
    listGeneralLedgers({ status: statusForStage, pageSize: 100 })
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
            <FaPlus /> New General Ledger
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Ledger No</span>
          <span className="col-span-4">Remarks</span>
          <span className="col-span-2">Total Value</span>
          <span className="col-span-2">Created By</span>
          <span className="col-span-2">Status</span>
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
                  <span className="col-span-2 font-medium text-indigo-700">{batch.PaddedLedgerNumber}</span>
                  <span className="col-span-4 text-gray-700 truncate">{batch.Remarks}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{batch.TotalValue?.toLocaleString()}</span>
                  <span className="col-span-2 text-xs text-gray-500 truncate">{batch.CreatedBy}</span>
                  <span className="col-span-2"><BatchStatusBadge status={batch.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No general ledgers found.</p>
          </div>
        )}
      </div>

      <CreateGeneralLedgerDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <BatchDetailDrawer key={selected?.Id || "closed"} batch={selected} stage={stage} currentUser={userName} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
