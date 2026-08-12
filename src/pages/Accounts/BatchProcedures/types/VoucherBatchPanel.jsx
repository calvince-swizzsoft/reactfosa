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
  listVoucherBatches, createVoucherBatch, listVoucherBatchEntries, addVoucherBatchEntry,
  removeVoucherBatchEntries, auditVoucherBatch, authorizeVoucherBatch,
} from "./voucherBatchApi";
import { BatchStatus } from "../lib/batchEnums";
import BatchStatusBadge from "../lib/BatchStatusBadge";
import BatchAuditModal from "../lib/BatchAuditModal";
import EntryPickerModal from "../lib/EntryPickerModal";
import { runBatchAction } from "../lib/runBatchAction";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = { origination: 23069, verification: 23079, authorization: 23089 };

// JournalVoucherType — governs the header leg AND every entry leg's
// direction at once; there is no independent per-entry direction.
const VOUCHER_TYPE_OPTIONS = [
  { value: 0, label: "Debit G/L Account" },
  { value: 1, label: "Credit G/L Account" },
  { value: 2, label: "Debit Customer Account" },
  { value: 3, label: "Credit Customer Account" },
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
  BranchId: "", BranchLabel: "", PostingPeriodId: "", PostingPeriodLabel: "",
  ChartOfAccountId: "", ChartOfAccountLabel: "", CustomerAccountId: "", CustomerLabel: "",
  Type: 0, TotalValue: "", PrimaryDescription: "", Reference: "", Remarks: "",
};

function CreateVoucherBatchDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyCreateForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(null);

  useEffect(() => { if (open) setForm(emptyCreateForm); }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.PostingPeriodId || !form.ChartOfAccountId || !form.Remarks || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "Branch, posting period, G/L account, remarks and a positive total value are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createVoucherBatch({
        BranchId: form.BranchId,
        PostingPeriodId: form.PostingPeriodId,
        ChartOfAccountId: form.ChartOfAccountId,
        CustomerAccountId: form.CustomerAccountId || null,
        Type: Number(form.Type),
        TotalValue: Number(form.TotalValue),
        PrimaryDescription: form.PrimaryDescription,
        Reference: form.Reference,
        Remarks: form.Remarks,
      });
      Swal.fire("Success", "Voucher created — it's now in the Pending queue.", "success");
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
              <h2 className="font-bold text-white">New Journal Voucher</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <PickerField label="Branch" value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />
              <PickerField label="Posting Period" value={form.PostingPeriodLabel} placeholder="Select posting period..." onClick={() => setPicker("postingPeriod")} />
              <FieldGroup label="Direction">
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={form.Type} onChange={(e) => setForm((p) => ({ ...p, Type: e.target.value }))}>
                  {VOUCHER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Governs this account AND every entry's account at once — there's no independent per-entry direction.</p>
              </FieldGroup>
              <PickerField label="G/L Account" value={form.ChartOfAccountLabel} placeholder="Search & select G/L account..." onClick={() => setPicker("coa")} />
              <PickerField label="Customer Account (optional)" value={form.CustomerLabel} placeholder="Only for Debit/Credit Customer Account..." onClick={() => setPicker("customer")} />
              <FieldGroup label="Total Value">
                <Input type="number" min="0" value={form.TotalValue} onChange={(e) => setForm((p) => ({ ...p, TotalValue: e.target.value }))} required />
              </FieldGroup>
              <FieldGroup label="Description">
                <Input value={form.PrimaryDescription} onChange={(e) => setForm((p) => ({ ...p, PrimaryDescription: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Reference">
                <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Remarks">
                <Input value={form.Remarks} onChange={(e) => setForm((p) => ({ ...p, Remarks: e.target.value }))} required />
              </FieldGroup>
            </form>
            <div className="shrink-0 px-4 py-3 border-t">
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Creating..." : "Create Voucher"}
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
        <EntryPickerModal title="Select Posting Period" fetchUrl={`${FIN_BASE}/api/loaning/GetPostingPeriods`} getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, PostingPeriodId: i.Id, PostingPeriodLabel: i.Description }))} onClose={() => setPicker(null)} />
      )}
      {picker === "coa" && (
        <EntryPickerModal title="Select G/L Account" fetchUrl={`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`} getLabel={(i) => `${i.AccountCode} — ${i.AccountName}`}
          onSelect={(i) => setForm((p) => ({ ...p, ChartOfAccountId: i.Id, ChartOfAccountLabel: `${i.AccountCode} — ${i.AccountName}` }))} onClose={() => setPicker(null)} />
      )}
      {picker === "customer" && (
        <EntryPickerModal title="Select Customer Account" fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName || i.FullAccountNumber} getSublabel={(i) => i.FullAccountNumber}
          onSelect={(i) => setForm((p) => ({ ...p, CustomerAccountId: i.Id, CustomerLabel: `${i.CustomerFullName || ""} — ${i.FullAccountNumber || ""}` }))} onClose={() => setPicker(null)} />
      )}
    </AnimatePresence>
  );
}

const emptyEntryForm = { ChartOfAccountId: "", ChartOfAccountLabel: "", CustomerAccountId: "", CustomerLabel: "", Amount: "", PrimaryDescription: "", Reference: "", Remarks: "" };

function BatchDetailDrawer({ batch, stage, currentUser, onClose, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [addingEntry, setAddingEntry] = useState(false);
  const [picker, setPicker] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const fetchEntries = () => {
    if (!batch) return;
    setLoading(true);
    listVoucherBatchEntries(batch.Id, { pageSize: 100 })
      .then((page) => setEntries(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); setEntryForm(emptyEntryForm); }, [batch?.Id]);

  if (!batch) return null;

  const isMine = batch.CreatedBy === currentUser;
  const canManageEntries = stage === "origination" && batch.Status === BatchStatus.Pending && isMine;
  const entriesTotal = entries.reduce((sum, e) => sum + (e.Amount || 0), 0);
  const isBalanced = entriesTotal === batch.TotalValue;

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.ChartOfAccountId || !entryForm.Remarks) {
      Swal.fire("Missing Fields", "G/L account and remarks are required.", "warning");
      return;
    }
    if (!(Number(entryForm.Amount) > 0)) {
      Swal.fire("Missing Fields", "Amount must be greater than zero.", "warning");
      return;
    }
    setAddingEntry(true);
    try {
      await addVoucherBatchEntry(batch.Id, {
        PostingPeriodId: batch.PostingPeriodId,
        BranchId: batch.BranchId,
        ChartOfAccountId: entryForm.ChartOfAccountId,
        CustomerAccountId: entryForm.CustomerAccountId || null,
        Amount: Number(entryForm.Amount),
        PrimaryDescription: entryForm.PrimaryDescription,
        Reference: entryForm.Reference || batch.Reference,
        Remarks: entryForm.Remarks,
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
      () => removeVoucherBatchEntries([entry]),
      { confirmTitle: "Remove this entry?", successMessage: "Entry removed.", onSuccess: fetchEntries }
    );
  };

  const handleAudit = async (option, remarks) => {
    await runBatchAction(
      () => auditVoucherBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.verification }),
      { successMessage: option === 1 ? "Voucher verified." : "Voucher rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  const handleAuthorize = async (option, remarks) => {
    await runBatchAction(
      () => authorizeVoucherBatch(batch.Id, { Option: option, Remarks: remarks, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.authorization }),
      { successMessage: option === 1 ? "Voucher authorized and posted — this type posts synchronously, inline, no background queue." : "Voucher rejected.", onSuccess: () => { setAuditOpen(false); onChanged(); onClose(); } }
    );
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Voucher #{batch.PaddedVoucherNumber}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Direction</span><p className="font-semibold text-gray-800">{batch.TypeDescription}</p></div>
            <div><span className="text-gray-400">Status</span><p><BatchStatusBadge status={batch.Status} /></p></div>
            <div><span className="text-gray-400">G/L Account</span><p className="font-semibold text-gray-800 truncate">{batch.ChartOfAccountName}</p></div>
            <div><span className="text-gray-400">Total Value</span><p className="font-semibold text-indigo-600">{batch.TotalValue?.toLocaleString()}</p></div>
            <div><span className="text-gray-400">Created By</span><p className="font-semibold text-gray-800">{batch.CreatedBy}</p></div>
            <div><span className="text-gray-400">Entries Total</span><p className="font-semibold text-gray-800">{entriesTotal.toLocaleString()}</p></div>
          </div>

          {!isBalanced && (
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Not balanced yet — entries total {entriesTotal.toLocaleString()}, voucher total is {batch.TotalValue?.toLocaleString()}. Authorize will refuse to post until these match exactly.
            </div>
          )}

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
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Entries</p>
            {loading ? (
              <div className="space-y-2 animate-pulse">{[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
            ) : entries.length > 0 ? (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.Id} className="flex items-center justify-between bg-white rounded-lg shadow border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{entry.CustomerAccountCustomerFullName || entry.ChartOfAccountName || "—"}</p>
                      <p className="text-xs text-gray-500">{(entry.Amount || 0).toLocaleString()} · {entry.Remarks}</p>
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
              <PickerField label="G/L Account" value={entryForm.ChartOfAccountLabel} placeholder="Search & select G/L account..." onClick={() => setPicker("coa")} />
              <PickerField label="Customer Account (optional)" value={entryForm.CustomerLabel} placeholder="Only for Debit/Credit Customer Account..." onClick={() => setPicker("customer")} />
              <FieldGroup label="Amount">
                <Input type="number" min="0" value={entryForm.Amount} onChange={(e) => setEntryForm((p) => ({ ...p, Amount: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Description">
                <Input value={entryForm.PrimaryDescription} onChange={(e) => setEntryForm((p) => ({ ...p, PrimaryDescription: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Remarks">
                <Input value={entryForm.Remarks} onChange={(e) => setEntryForm((p) => ({ ...p, Remarks: e.target.value }))} required />
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
              {stage === "verification" ? "Verify Voucher" : "Authorize Voucher"}
            </Button>
          </div>
        )}
      </motion.div>

      {picker === "coa" && (
        <EntryPickerModal title="Select G/L Account" fetchUrl={`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`} getLabel={(i) => `${i.AccountCode} — ${i.AccountName}`}
          onSelect={(i) => setEntryForm((p) => ({ ...p, ChartOfAccountId: i.Id, ChartOfAccountLabel: `${i.AccountCode} — ${i.AccountName}` }))} onClose={() => setPicker(null)} />
      )}
      {picker === "customer" && (
        <EntryPickerModal title="Select Customer Account" fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName || i.FullAccountNumber} getSublabel={(i) => i.FullAccountNumber}
          onSelect={(i) => setEntryForm((p) => ({ ...p, CustomerAccountId: i.Id, CustomerLabel: `${i.CustomerFullName || ""} — ${i.FullAccountNumber || ""}` }))} onClose={() => setPicker(null)} />
      )}

      <BatchAuditModal
        open={auditOpen}
        title={stage === "verification" ? "Verify Voucher" : "Authorize Voucher"}
        postLabel={stage === "verification" ? "Verify" : "Authorize"}
        onSubmit={stage === "verification" ? handleAudit : handleAuthorize}
        onClose={() => setAuditOpen(false)}
      />
    </AnimatePresence>
  );
}

export default function VoucherBatchPanel({ stage }) {
  const { userName } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const statusForStage = stage === "authorization" ? BatchStatus.Audited : BatchStatus.Pending;

  const fetchList = () => {
    setLoading(true);
    listVoucherBatches({ status: statusForStage, pageSize: 100 })
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
            <FaPlus /> New Journal Voucher
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Voucher No</span>
          <span className="col-span-3">Direction</span>
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
                  <span className="col-span-2 font-medium text-indigo-700">{batch.PaddedVoucherNumber}</span>
                  <span className="col-span-3 text-gray-700">{batch.TypeDescription}</span>
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
            <p className="text-gray-400 font-medium">No journal vouchers found.</p>
          </div>
        )}
      </div>

      <CreateVoucherBatchDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <BatchDetailDrawer batch={selected} stage={stage} currentUser={userName} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
