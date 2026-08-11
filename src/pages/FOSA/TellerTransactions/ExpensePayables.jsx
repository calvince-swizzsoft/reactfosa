import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import {
  FaFileInvoiceDollar, FaPlus, FaChevronLeft, FaChevronRight, FaTrash,
} from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import {
  listExpensePayables, getExpensePayable, listExpensePayableEntries,
  addExpensePayableEntry, removeExpensePayableEntries, verifyExpensePayable,
} from "./expensePayablesApi";
import { ExpensePayableStatus, ExpensePayableAuthOption } from "../lib/frontOfficeEnums";

// api/frontoffice/expensepayables — docs/api/frontoffice-api-spec.md §12.
const MODULE_NAVIGATION_ITEM_CODE = 25013;
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const STATUS_OPTIONS = [
  { value: ExpensePayableStatus.Pending, label: "Pending" },
  { value: ExpensePayableStatus.Posted, label: "Posted" },
  { value: ExpensePayableStatus.Rejected, label: "Rejected" },
  { value: ExpensePayableStatus.Audited, label: "Verified" },
];

const STATUS_BADGE = {
  Pending: "bg-yellow-100 text-yellow-700",
  Posted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-600",
  Verified: "bg-blue-100 text-blue-700",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyEntryForm = { BranchId: "", ChartOfAccountId: "", Value: "", PrimaryDescription: "", SecondaryDescription: "", Reference: "" };

function ExpensePayableDetailDrawer({ id, onClose, onChanged }) {
  const [payable, setPayable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState([]);
  const [removing, setRemoving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [savingEntry, setSavingEntry] = useState(false);
  const [verifyOption, setVerifyOption] = useState(String(ExpensePayableAuthOption.Post));
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchAll = () => {
    if (!id) return;
    setLoading(true);
    getExpensePayable(id).then(setPayable).catch(() => setPayable(null)).finally(() => setLoading(false));
    setLoadingEntries(true);
    listExpensePayableEntries(id)
      .then((page) => setEntries(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  };

  useEffect(() => {
    if (!id) return;
    fetchAll();
    setSelectedEntryIds([]);
    setEntryForm(emptyEntryForm);
    setVerifyRemarks("");
    Promise.all([
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`).then((r) => r.json()),
    ]).then(([branchData, coaData]) => {
      setBranches(normalizeList(branchData));
      setChartOfAccounts(normalizeList(coaData));
    }).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return null;

  const totalEntries = entries.reduce((sum, e) => sum + (Number(e.Value) || 0), 0);
  const isPending = payable?.Status === ExpensePayableStatus.Pending;

  const toggleEntry = (entryId) => setSelectedEntryIds((prev) =>
    prev.includes(entryId) ? prev.filter((x) => x !== entryId) : [...prev, entryId]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.BranchId || !entryForm.ChartOfAccountId || !(Number(entryForm.Value) > 0) || !entryForm.Reference.trim()) {
      Swal.fire("Missing Fields", "Branch, G/L account, a positive value, and reference are required.", "warning");
      return;
    }
    setSavingEntry(true);
    try {
      await addExpensePayableEntry(id, {
        BranchId: entryForm.BranchId,
        ChartOfAccountId: entryForm.ChartOfAccountId,
        Value: Number(entryForm.Value),
        PrimaryDescription: entryForm.PrimaryDescription,
        SecondaryDescription: entryForm.SecondaryDescription,
        Reference: entryForm.Reference,
      });
      setEntryForm(emptyEntryForm);
      fetchAll();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingEntry(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedEntryIds.length === 0) return;
    const confirm = await Swal.fire({
      title: `Remove ${selectedEntryIds.length} entry line(s)?`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Remove",
    });
    if (!confirm.isConfirmed) return;
    setRemoving(true);
    try {
      await removeExpensePayableEntries(entries.filter((e) => selectedEntryIds.includes(e.Id)));
      setSelectedEntryIds([]);
      fetchAll();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setRemoving(false);
    }
  };

  const handleVerify = async () => {
    const option = Number(verifyOption);
    const label = { [ExpensePayableAuthOption.Post]: "Post", [ExpensePayableAuthOption.Reject]: "Reject", [ExpensePayableAuthOption.Defer]: "Defer" }[option];
    const confirm = await Swal.fire({
      title: `${label} this expense payable?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: option === ExpensePayableAuthOption.Reject ? "#dc2626" : "#4f46e5",
      confirmButtonText: label,
    });
    if (!confirm.isConfirmed) return;
    setVerifying(true);
    try {
      await verifyExpensePayable(id, { Option: option, Remarks: verifyRemarks });
      if (option === ExpensePayableAuthOption.Post) {
        Swal.fire({
          title: "Sent for Approval",
          html: "Verified and posted for workflow approval — a checker can act on it under <b>Approval Requests</b>.",
          icon: "success",
        });
      } else {
        Swal.fire("Success", `Expense payable ${label.toLowerCase()}ed`, "success");
      }
      fetchAll();
      onChanged?.();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-5 right-3 w-[620px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
          <h2 className="font-bold text-lg text-white">Expense Payable {payable?.PaddedVoucherNumber || ""}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          {loading || !payable ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                <p><span className="font-semibold text-gray-600">Branch:</span> {payable.BranchDescription || "—"}</p>
                <p><span className="font-semibold text-gray-600">G/L Account:</span> {payable.ChartOfAccountName || "—"}</p>
                <p><span className="font-semibold text-gray-600">Value Date:</span> {payable.ValueDate ? new Date(payable.ValueDate).toLocaleDateString() : "—"}</p>
                <p><span className="font-semibold text-gray-600">Total Value:</span> {typeof payable.TotalValue === "number" ? payable.TotalValue.toLocaleString() : "—"}</p>
                <p className="col-span-2">
                  <span className="font-semibold text-gray-600">Status:</span>{" "}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BADGE[payable.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                    {payable.StatusDescription || "—"}
                  </span>
                </p>
                {payable.Remarks && <p className="col-span-2"><span className="font-semibold text-gray-600">Remarks:</span> {payable.Remarks}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-semibold text-gray-700">Entry Lines</Label>
                  <span className={`text-xs font-semibold ${Math.abs(totalEntries - payable.TotalValue) < 0.01 ? "text-green-600" : "text-amber-600"}`}>
                    Total: {totalEntries.toLocaleString()} / {typeof payable.TotalValue === "number" ? payable.TotalValue.toLocaleString() : "—"}
                  </span>
                </div>
                {loadingEntries ? (
                  <p className="text-sm text-gray-400">Loading entries...</p>
                ) : entries.length > 0 ? (
                  <div className="space-y-1">
                    {entries.map((entry) => (
                      <label key={entry.Id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedEntryIds.includes(entry.Id)}
                          onChange={() => toggleEntry(entry.Id)}
                          disabled={!isPending}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="flex-1">
                          <span className="font-medium text-gray-800">{entry.PrimaryDescription || entry.Reference || "—"}</span>
                          <span className="text-gray-400"> — {entry.ChartOfAccountName || "—"}</span>
                        </span>
                        <span className="font-semibold text-indigo-700">{typeof entry.Value === "number" ? entry.Value.toLocaleString() : "—"}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-2">No entry lines yet.</p>
                )}
                {isPending && selectedEntryIds.length > 0 && (
                  <Button size="sm" variant="outline" disabled={removing} onClick={handleRemoveSelected} className="mt-2 text-red-600 flex items-center gap-1">
                    <FaTrash /> Remove {selectedEntryIds.length} Selected
                  </Button>
                )}
              </div>

              {isPending && (
                <form onSubmit={handleAddEntry} className="space-y-2 border-t pt-3">
                  <Label className="font-semibold text-gray-700 block">Add Entry Line</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={entryForm.BranchId} onValueChange={(v) => setEntryForm((p) => ({ ...p, BranchId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={entryForm.ChartOfAccountId} onValueChange={(v) => setEntryForm((p) => ({ ...p, ChartOfAccountId: v }))}>
                      <SelectTrigger><SelectValue placeholder="G/L account" /></SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {chartOfAccounts.map((a) => <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.AccountCode} — {a.AccountName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input type="number" min="0" placeholder="Value" value={entryForm.Value} onChange={(e) => setEntryForm((p) => ({ ...p, Value: e.target.value }))} />
                  <Input placeholder="Primary description" value={entryForm.PrimaryDescription} onChange={(e) => setEntryForm((p) => ({ ...p, PrimaryDescription: e.target.value }))} />
                  <Input placeholder="Secondary description" value={entryForm.SecondaryDescription} onChange={(e) => setEntryForm((p) => ({ ...p, SecondaryDescription: e.target.value }))} />
                  <Input placeholder="Reference" value={entryForm.Reference} onChange={(e) => setEntryForm((p) => ({ ...p, Reference: e.target.value }))} />
                  <Button type="submit" size="sm" disabled={savingEntry} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
                    <FaPlus /> {savingEntry ? "Adding..." : "Add Entry"}
                  </Button>
                </form>
              )}

              {isPending && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="font-semibold text-gray-700 block">Verify</Label>
                  <Select value={verifyOption} onValueChange={setVerifyOption}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(ExpensePayableAuthOption.Post)}>Post</SelectItem>
                      <SelectItem value={String(ExpensePayableAuthOption.Reject)}>Reject</SelectItem>
                      <SelectItem value={String(ExpensePayableAuthOption.Defer)}>Defer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Remarks" value={verifyRemarks} onChange={(e) => setVerifyRemarks(e.target.value)} />
                  <Button
                    disabled={verifying}
                    onClick={handleVerify}
                    className={Number(verifyOption) === ExpensePayableAuthOption.Reject ? "bg-red-600 hover:bg-red-700 w-full" : "bg-indigo-600 hover:bg-indigo-700 w-full"}
                  >
                    {verifying ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ExpensePayables() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    listExpensePayables({ status: statusFilter === "" ? undefined : Number(statusFilter), text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };
  const handleStatusChange = (v) => { setStatusFilter(v === "all" ? "" : v); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaFileInvoiceDollar /> Expense Payables
        </h2>
        <Link
          to="/FrontOffice/ExpensePayables/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> New Expense Payable
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input value={search} onChange={handleSearchChange} placeholder="Search..." className="max-w-xs" />
        <Select value={statusFilter === "" ? "all" : statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Voucher #</span>
          <span className="col-span-3">Branch</span>
          <span className="col-span-3">G/L Account</span>
          <span className="col-span-2">Total Value</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <button key={item.Id} onClick={() => setSelectedId(item.Id)} className="w-full text-left bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-2 font-mono text-xs text-gray-600">{item.PaddedVoucherNumber}</span>
                  <span className="col-span-3 text-sm text-gray-700 truncate">{item.BranchDescription || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-700 truncate">{item.ChartOfAccountName || "—"}</span>
                  <span className="col-span-2 text-sm font-medium text-indigo-700">{typeof item.TotalValue === "number" ? item.TotalValue.toLocaleString() : "—"}</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_BADGE[item.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                      {item.StatusDescription || "—"}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No expense payables found.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      {selectedId && (
        <ExpensePayableDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchItems} />
      )}
    </div>
  );
}
