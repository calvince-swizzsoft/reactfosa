import { useState, useEffect, useCallback, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BatchFieldLabel from "../lib/BatchFieldLabel";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listRefundBatches, createRefundBatch, listRefundBatchEntries, addRefundBatchEntry,
  removeRefundBatchEntries, auditRefundBatch, authorizeRefundBatch,
} from "./refundBatchApi";
import { BatchStatus } from "../lib/batchEnums";
import BatchStatusBadge from "../lib/BatchStatusBadge";
import BatchAuditModal from "../lib/BatchAuditModal";
import EntryPickerModal from "../lib/EntryPickerModal";
import { runBatchAction } from "../lib/runBatchAction";

import TransferAccountLookup from "../lib/TransferAccountLookup";
import { refundAccountDetails, refundEntryStatus, refundAmount, refundPageSummary } from "../lib/refundEntryDetails";

const refundMoney = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        <span className={value ? "min-w-0 whitespace-normal break-words text-gray-800" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyCreateForm = { BranchId: "", BranchLabel: "", Reference: "", TotalValue: "" };

function CreateRefundBatchDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);

  useEffect(() => { if (open) setForm(emptyCreateForm); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "Branch and a positive total value are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createRefundBatch({
        BranchId: form.BranchId,
        Reference: form.Reference,
        TotalValue: Number(form.TotalValue),
      });
      Swal.fire("Success", "Refund batch created — it's now in the Pending queue.", "success");
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
              <h2 className="font-bold text-white">New Refund Batch</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <PickerField label="Branch" help="The branch responsible for this batch. Check it before adding entries." value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker(true)} />
              <FieldGroup label="Reference" help="A recognizable reference for tracing this batch or entry, such as a document number or payment reference.">
                <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Total Value" help="The total refund amount. The sum of principal and interest across all entries must match this value.">
                <Input type="number" min="0" value={form.TotalValue} onChange={(e) => setForm((p) => ({ ...p, TotalValue: e.target.value }))} required />
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

const emptyEntryForm = { DebitCustomerAccountId: "", DebitLabel: "", CreditCustomerAccountId: "", CreditLabel: "", Principal: "", Interest: "" };

function RefundAccountCell({ account }) {
  return <>
    <p className="truncate font-semibold text-gray-800" title={account.name}>{account.name}</p>
    <p className="mt-0.5 truncate text-gray-500" title={[account.number, account.product].filter(Boolean).join(" · ")}>
      <span className="font-mono">{account.number}</span>{account.product && " · " + account.product}
    </p>
  </>;
}

function BatchDetailDrawer({ batch, stage, currentUser, onClose, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [entryCount, setEntryCount] = useState(0);
  const [entryPage, setEntryPage] = useState(0);
  const [entriesTotal, setEntriesTotal] = useState(null);
  const [entriesError, setEntriesError] = useState("");
  const [loading, setLoading] = useState(true);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const editorRef = useRef(null);
  const [addingEntry, setAddingEntry] = useState(false);
  const [picker, setPicker] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const requestVersion = useRef(0);
  const formId = useId();

  const fetchEntries = useCallback(async () => {
    if (!batch?.Id) return;
    const request = ++requestVersion.current;
    setLoading(true); setEntriesError("");
    try {
      const page = await listRefundBatchEntries(batch.Id, { pageIndex: entryPage, pageSize: 20 });
      if (request !== requestVersion.current) return;
      const summary = refundPageSummary(page);
      if (entryPage > 0 && !summary.entries.length) {
        setEntryPage(Math.max(0, Math.ceil(summary.count / 20) - 1));
      }
      setEntries(summary.entries); setEntryCount(summary.count); setEntriesTotal(summary.total);
    } catch (err) {
      if (request !== requestVersion.current) return;
      setEntriesError(err.message || "Unable to load refund entries."); setEntriesTotal(null);
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }, [batch?.Id, entryPage]);

  useEffect(() => {
    fetchEntries();
    return () => { requestVersion.current++; };
  }, [fetchEntries]);

  useEffect(() => {
    if (editorOpen) editorRef.current?.scrollIntoView({ block: "nearest" });
  }, [editorOpen]);

  if (!batch) return null;
  const canManageEntries = stage === "origination" && Number(batch.Status) === BatchStatus.Pending && batch.CreatedBy === currentUser;
  const totalKnown = !loading && !entriesError && entriesTotal != null;
  const remaining = totalKnown ? Math.round((Number(batch.TotalValue) - entriesTotal) * 100) / 100 : null;
  const isBalanced = remaining === 0;
  const draftTotal = refundAmount(entryForm);

  const handleAddEntry = async (event) => {
    event.preventDefault();
    if (!entryForm.DebitCustomerAccountId || !entryForm.CreditCustomerAccountId) {
      Swal.fire("Missing Fields", "Both a debit and a credit customer account are required.", "warning"); return;
    }
    const principal = Number(entryForm.Principal || 0);
    const interest = Number(entryForm.Interest || 0);
    if (![principal, interest].every((value) => Number.isFinite(value) && value >= 0) || principal + interest <= 0) {
      Swal.fire("Invalid Amount", "Enter non-negative principal and interest with a total greater than zero.", "warning"); return;
    }
    setAddingEntry(true);
    try {
      await addRefundBatchEntry(batch.Id, { DebitCustomerAccountId: entryForm.DebitCustomerAccountId, CreditCustomerAccountId: entryForm.CreditCustomerAccountId, Principal: principal, Interest: interest });
      setEntryForm(emptyEntryForm);
      setEditorOpen(false);
      if (entryPage === 0) await fetchEntries(); else setEntryPage(0);
    } catch (err) { Swal.fire("Error", err.message, "error"); }
    finally { setAddingEntry(false); }
  };

  const handleRemoveEntry = (entry) => runBatchAction(
    () => removeRefundBatchEntries([entry]),
    { confirmTitle: "Remove this refund entry?", successMessage: "Entry removed.", onSuccess: fetchEntries }
  );

  const handleAudit = async (option, remarks) => {
    await runBatchAction(
      () => auditRefundBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.verification }),
      { successMessage: option === 1 ? "Batch verified." : "Batch rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };
  const handleAuthorize = async (option, remarks) => {
    await runBatchAction(
      () => authorizeRefundBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.authorization }),
      { successMessage: option === 1 ? "Refund batch authorized and posted." : "Batch rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  return <AnimatePresence>
    <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => { if (!addingEntry) onClose(); }} />
    <motion.div role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`} className="fixed top-0 right-0 h-full w-full sm:w-[min(860px,96vw)] max-w-full bg-white shadow-2xl z-50 flex flex-col rounded-l-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex shrink-0 justify-between items-center gap-3 bg-indigo-600 rounded-2xl px-4 py-3">
        <h2 id={`${formId}-title`} className="text-lg font-bold text-white">Refund #{batch.PaddedBatchNumber}</h2>
        <Button variant="outline" size="sm" onClick={onClose} disabled={addingEntry}>Close</Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3">
        <section aria-label="Batch summary" className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm"><p className="min-w-0 truncate font-semibold text-gray-800" title={batch.Reference || ""}>{batch.Reference || "No reference"}</p><BatchStatusBadge status={batch.Status} /></div>
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-gray-100 px-3 py-2 text-xs">
            <div className="flex items-center gap-2"><dt className="text-gray-500">Batch total</dt><dd className="font-semibold tabular-nums text-gray-800">{refundMoney(batch.TotalValue)}</dd></div>
            <div className="flex items-center gap-2"><dt className="text-gray-500">Allocated</dt><dd className="font-semibold tabular-nums text-gray-800">{totalKnown ? refundMoney(entriesTotal) : "—"}</dd></div>
            <div role="status" className="flex items-center gap-2"><dt className="text-gray-500">{remaining < 0 ? "Over" : "Remaining"}</dt><dd className={"font-semibold tabular-nums " + (totalKnown && isBalanced ? "text-green-700" : "text-amber-700")}>{totalKnown ? refundMoney(Math.abs(remaining)) : "—"}{totalKnown && isBalanced && " · Balanced"}</dd></div>
          </dl>
          <details className="text-xs text-gray-500">
            <summary className="w-fit cursor-pointer rounded py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">Batch details</summary>
            <dl className="mt-1 grid grid-cols-2 gap-2 border-t border-gray-200 py-2"><div><dt>Branch</dt><dd className="break-words font-medium text-gray-700">{batch.BranchDescription || "—"}</dd></div><div><dt>Created by</dt><dd className="break-words font-medium text-gray-700">{batch.CreatedBy || "—"}</dd></div></dl>
            {batch.AuditRemarks && <p className="py-1"><strong>Verification:</strong> {batch.AuditRemarks}</p>}
            {batch.AuthorizationRemarks && <p className="py-1"><strong>Authorization:</strong> {batch.AuthorizationRemarks}</p>}
          </details>
        </section>

        <section aria-labelledby={`${formId}-entries`} className="rounded-lg bg-gray-200 p-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id={`${formId}-entries`} className="text-sm font-semibold text-gray-800">Entries</h3>
            <span className="text-xs font-semibold text-gray-600">{loading ? "Loading…" : entriesError ? "Unavailable" : `${entryCount} ${entryCount === 1 ? "entry" : "entries"}`}</span>
          </div>
          {entriesError ? <div role="alert" className="rounded-lg border border-red-200 bg-white p-3 text-sm text-red-600">{entriesError}<Button type="button" variant="outline" onClick={fetchEntries} className="ml-3">Retry</Button></div> : <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Refund entry columns" >
            <div role="table" aria-label="Saved refund entries" className="min-w-[740px]">
              <div role="rowgroup">
                <div role="row" className="grid grid-cols-12 gap-2 rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-100">
                  <span role="columnheader" className="col-span-3">Debit account</span>
                  <span role="columnheader" className="col-span-3">Credit account</span>
                  <span role="columnheader" className="col-span-1 text-right">Principal</span>
                  <span role="columnheader" className="col-span-1 text-right">Interest</span>
                  <span role="columnheader" className="col-span-1 text-right">Total</span>
                  <span role="columnheader" className="col-span-2">Status</span>
                  <span role="columnheader" className="col-span-1 text-right">Action</span>
                </div>
              </div>
              <div role="rowgroup" className="mt-1 space-y-1">
                {loading ? [1, 2, 3].map((item) => <div role="row" aria-label="Loading refund entry" key={item} className="grid grid-cols-12 gap-2 items-center rounded-lg bg-gray-50 px-3 py-3 animate-pulse">{[3, 3, 1, 1, 1, 2, 1].map((span, index) => <div role="cell" key={index} style={{ gridColumn: `span ${span}` }}><div className="h-4 rounded bg-gray-200" /></div>)}</div>) : entries.map((entry, index) => {
                  const status = refundEntryStatus(entry.Status);
                  return <div role="row" key={entry.Id} className="grid grid-cols-12 gap-2 items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow hover:shadow-lg transition-shadow">
                    <div role="cell" className="col-span-3 min-w-0"><RefundAccountCell account={refundAccountDetails(entry, "Debit")} /></div>
                    <div role="cell" className="col-span-3 min-w-0"><RefundAccountCell account={refundAccountDetails(entry, "Credit")} /></div>
                    <span role="cell" className="col-span-1 text-right tabular-nums break-words text-gray-700">{refundMoney(entry.Principal)}</span>
                    <span role="cell" className="col-span-1 text-right tabular-nums break-words text-gray-700">{refundMoney(entry.Interest)}</span>
                    <span role="cell" className="col-span-1 text-right tabular-nums break-words font-bold text-indigo-700">{refundMoney(refundAmount(entry))}</span>
                    <div role="cell" className="col-span-2"><span className={`rounded px-2 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></div>
                    <div role="cell" className="col-span-1 text-right">{canManageEntries ? <button type="button" disabled={addingEntry} onClick={() => handleRemoveEntry(entry)} aria-label={`Remove refund entry ${entryPage * 20 + index + 1}`} className="rounded p-2 text-red-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"><FaTrash aria-hidden="true" /></button> : <span className="text-gray-400">—</span>}</div>
                  </div>;
                })}
              </div>
            </div>
            {!loading && !entries.length && <p className="bg-white py-5 text-center text-sm text-gray-500">No entries yet.{canManageEntries && " Use New entry to add one."}</p>}
          </div>}
          {!entriesError && entryCount > 20 && <div className="mt-3 flex justify-center items-center gap-3"><Button type="button" disabled={loading || addingEntry || entryPage === 0} onClick={() => setEntryPage((page) => page - 1)}>Prev</Button><span className="text-sm text-gray-700">Page {entryPage + 1} of {Math.max(1, Math.ceil(entryCount / 20))}</span><Button type="button" disabled={loading || addingEntry || (entryPage + 1) * 20 >= entryCount} onClick={() => setEntryPage((page) => page + 1)}>Next</Button></div>}
        </section>

        {canManageEntries && editorOpen && <section aria-labelledby={`${formId}-editor`} className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
          <h3 id={`${formId}-editor`} className="mb-2 text-sm font-semibold text-indigo-900">New entry</h3>
          <form id={formId} onSubmit={handleAddEntry} ref={editorRef}>
            <fieldset disabled={addingEntry} className="grid grid-cols-2 gap-3 items-start disabled:opacity-60">
              <legend className="sr-only">New refund entry accounts and amounts</legend>
              <div className="col-span-2 sm:col-span-1"><PickerField label="Debit account" help="The customer account to debit to release the over-collected amount. Check the original collection before selecting it." value={entryForm.DebitLabel} placeholder="Select debit account…" onClick={() => setPicker("debit")} /></div>
              <div className="col-span-2 sm:col-span-1"><PickerField label="Credit account" help="The customer account receiving the refund as a credit. Check the recipient and account number." value={entryForm.CreditLabel} placeholder="Select credit account…" onClick={() => setPicker("credit")} /></div>
              <div><FieldGroup label="Principal" help="The main refund amount, excluding any interest entered separately."><Input type="number" min="0" step="0.01" value={entryForm.Principal} onChange={(e) => setEntryForm((form) => ({ ...form, Principal: e.target.value }))} /></FieldGroup></div>
              <div><FieldGroup label="Interest" help="The interest portion of the refund. Enter zero when no interest applies."><Input type="number" min="0" step="0.01" value={entryForm.Interest} onChange={(e) => setEntryForm((form) => ({ ...form, Interest: e.target.value }))} /></FieldGroup></div>
            </fieldset>
          </form>
        </section>}

      </div>

      {canManageEntries && <div className="shrink-0 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3">
        {editorOpen ? <>
          <p className="text-xs text-gray-500">Entry total <span aria-live="polite" className="ml-1 font-semibold tabular-nums text-gray-800">{refundMoney(draftTotal)}</span></p>
          <div className="flex items-center gap-2"><Button type="button" variant="outline" disabled={addingEntry} onClick={() => { setEntryForm(emptyEntryForm); setEditorOpen(false); }}>Cancel</Button><Button type="submit" form={formId} disabled={addingEntry || loading || !!entriesError} className="bg-indigo-600 hover:bg-indigo-700">{addingEntry ? "Saving…" : "Save entry"}</Button></div>
        </> : <Button type="button" disabled={loading || !!entriesError} onClick={() => setEditorOpen(true)} className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus aria-hidden="true" /> New entry</Button>}
      </div>}

      {(stage === "verification" || stage === "authorization") && <div className="shrink-0 px-5 py-4 border-t"><Button onClick={() => setAuditOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700">{stage === "verification" ? "Verify Batch" : "Authorize Batch"}</Button></div>}
    </motion.div>

    {picker && <TransferAccountLookup onClose={() => setPicker(null)} onSelect={(account) => {
      const name = account.CustomerFullName || [account.CustomerIndividualFirstName, account.CustomerIndividualLastName].filter(Boolean).join(" ");
      const label = [name, account.FullAccountNumber, account.CustomerAccountTypeTargetProductDescription].filter(Boolean).join(" — ");
      if (picker === "debit") setEntryForm((form) => ({ ...form, DebitCustomerAccountId: account.Id, DebitLabel: label }));
      else setEntryForm((form) => ({ ...form, CreditCustomerAccountId: account.Id, CreditLabel: label }));
      setPicker(null);
    }} />}
    <BatchAuditModal open={auditOpen} title={stage === "verification" ? "Verify Refund Batch" : "Authorize Refund Batch"} postLabel={stage === "verification" ? "Verify" : "Authorize"} onSubmit={stage === "verification" ? handleAudit : handleAuthorize} onClose={() => setAuditOpen(false)} />
  </AnimatePresence>;
}


export default function RefundBatchPanel({ stage }) {
  const { userName } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const statusForStage = stage === "authorization" ? BatchStatus.Audited : BatchStatus.Pending;

  const fetchList = () => {
    setLoading(true);
    listRefundBatches({ status: statusForStage, pageSize: 100 })
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
            <FaPlus /> New Refund Batch
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Batch No</span>
          <span className="col-span-3">Reference</span>
          <span className="col-span-2">Total Value</span>
          <span className="col-span-3">Created By</span>
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
                  <span className="col-span-2 font-medium text-indigo-700">{batch.PaddedBatchNumber}</span>
                  <span className="col-span-3 text-gray-700 truncate">{batch.Reference || "—"}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{batch.TotalValue?.toLocaleString()}</span>
                  <span className="col-span-3 text-xs text-gray-500 truncate">{batch.CreatedBy}</span>
                  <span className="col-span-2"><BatchStatusBadge status={batch.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No refund batches found.</p>
          </div>
        )}
      </div>

      <CreateRefundBatchDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <BatchDetailDrawer key={selected?.Id || "closed"} batch={selected} stage={stage} currentUser={userName} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
