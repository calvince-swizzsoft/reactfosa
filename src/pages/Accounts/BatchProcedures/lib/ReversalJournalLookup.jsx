import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotFoundImage from "/assets/scopefinding.png";
import { addReversalBatchEntries, findReversibleJournals, reversalLookupOptions } from "../types/reversalBatchApi";

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fieldClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white";

export default function ReversalJournalLookup({ batch, onClose, onAdded }) {
  const [options, setOptions] = useState(null);
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return { systemTransactionCode: "", startDate: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: localDate(now), journalFilter: "5", text: "" };
  });
  const [query, setQuery] = useState(null);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [selected, setSelected] = useState({});
  const [remarks, setRemarks] = useState(batch.Remarks || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [optionError, setOptionError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setOptionError("");
    reversalLookupOptions().then((data) => { if (active) setOptions(data); })
      .catch((err) => { if (active) setOptionError(err.message); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setLoading(true); setError(""); setRows([]);
    findReversibleJournals(query, controller.signal).then((page) => {
      if (controller.signal.aborted) return;
      setRows(page?.PageCollection || page?.pageCollection || []);
      setCount(page?.ItemsCount ?? page?.itemsCount ?? 0);
    }).catch((err) => {
      if (!controller.signal.aborted) { setError(err.message); setCount(0); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  const update = (key, value) => setFilters((old) => ({ ...old, [key]: value }));
  const search = (event) => {
    event.preventDefault();
    if (!filters.systemTransactionCode || !filters.startDate || !filters.endDate || filters.startDate > filters.endDate) {
      setError("Select a transaction type and a valid date range."); return;
    }
    setQuery({ ...filters, pageIndex: 0, pageSize: 20 });
  };
  const toggle = (row) => setSelected((old) => {
    const next = { ...old };
    if (next[row.Id]) delete next[row.Id]; else next[row.Id] = row;
    return next;
  });
  const eligibleRows = rows.filter((row) => !row.IsLocked);
  const allOnPage = eligibleRows.length > 0 && eligibleRows.every((row) => selected[row.Id]);
  const togglePage = () => setSelected((old) => {
    const next = { ...old };
    eligibleRows.forEach((row) => { if (allOnPage) delete next[row.Id]; else next[row.Id] = row; });
    return next;
  });
  const chosen = Object.values(selected);
  const add = async () => {
    if (!chosen.length || !remarks.trim()) return;
    setSaving(true); setError("");
    try {
      await addReversalBatchEntries(batch.Id, chosen.map((row) => ({ JournalId: row.Id, Remarks: remarks.trim() })));
      onAdded(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-w-5xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col rounded-2xl bg-white p-4">
      <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3 mr-6 shrink-0">
        <DialogTitle>Lookup Target Journals</DialogTitle>
        <DialogDescription className="text-indigo-100 mt-1">Select transactions to add to reversal batch #{batch.PaddedBatchNumber}. Reversal follows verification and authorization.</DialogDescription>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        {optionError ? <div role="alert" className="text-red-600 text-sm">{optionError} <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>Retry</Button></div> :
          <form onSubmit={search} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm font-semibold text-gray-700">Transaction type
              <select className={fieldClass} value={filters.systemTransactionCode} onChange={(e) => update("systemTransactionCode", e.target.value)} required disabled={!options || saving}>
                <option value="">{options ? "Select transaction type" : "Loading transaction types..."}</option>
                {options?.TransactionTypes?.map((item) => <option key={item.Value} value={item.Value}>{item.Label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700">From transaction date<Input type="date" value={filters.startDate} onChange={(e) => update("startDate", e.target.value)} required /></label>
            <label className="text-sm font-semibold text-gray-700">To transaction date<Input type="date" value={filters.endDate} onChange={(e) => update("endDate", e.target.value)} min={filters.startDate} required /></label>
            <label className="text-sm font-semibold text-gray-700">Search by
              <select className={fieldClass} value={filters.journalFilter} onChange={(e) => update("journalFilter", e.target.value)}>
                {options?.SearchFields?.map((item) => <option key={item.Value} value={item.Value}>{item.Label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700">Search text<Input value={filters.text} onChange={(e) => update("text", e.target.value)} placeholder="Enter search text" /></label>
            <Button type="submit" disabled={!options || loading || saving} className="self-end bg-indigo-600 hover:bg-indigo-700">{loading ? "Searching..." : "Refresh transactions"}</Button>
          </form>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
              <span className="col-span-1"><input type="checkbox" aria-label="Select all transactions on this page" className="w-4 h-4 accent-indigo-600" checked={allOnPage} disabled={loading || saving || !eligibleRows.length} onChange={togglePage} /></span>
              <span className="col-span-3">Date / Branch</span><span className="col-span-5">Transaction / Reference</span><span className="col-span-3 text-right">Amount</span>
            </div>
            {loading ? <div className="space-y-2">{[1, 2, 3].map((n) => <div key={n} className="animate-pulse grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg">{[1, 3, 5, 3].map((width, i) => <div key={i} style={{ gridColumn: `span ${width}` }} className="h-8 rounded bg-gray-200" />)}</div>)}</div> :
              rows.length ? <div className="space-y-2">{rows.map((row) => <label key={row.Id} className="grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all text-sm cursor-pointer">
                <span className="col-span-1"><input type="checkbox" aria-label={`Select ${row.Reference || row.PrimaryDescription}`} className="w-4 h-4 accent-indigo-600" checked={!!selected[row.Id]} disabled={saving || row.IsLocked} onChange={() => toggle(row)} /></span>
                <span className="col-span-3 text-gray-700">{new Date(row.CreatedDate).toLocaleString()}<span className="block text-xs text-gray-500">{row.BranchDescription}</span></span>
                <span className="col-span-5 text-gray-800 break-words">{row.PrimaryDescription || row.TransactionCodeDescription}<span className="block text-xs text-gray-500">{row.Reference || "No reference"} · {row.SecondaryDescription}</span><span className="block text-xs text-gray-500">{row.ApplicationUserName}</span></span>
                <span className="col-span-3 text-right font-semibold text-gray-700">{money(row.TotalValue)}</span>
              </label>)}</div> : <div className="text-center py-6"><img src={NotFoundImage} alt="" className="mx-auto w-32" /><p className="text-sm text-gray-500 mt-2">{query ? "No eligible transactions found. Check the type and dates; locked transactions and your own postings are excluded." : "Choose a transaction type and dates, then refresh."}</p></div>}
          </div>
        </div>
        {query && <div className="text-center space-y-2"><div className="flex justify-center items-center gap-3"><Button disabled={loading || saving || query.pageIndex === 0} onClick={() => setQuery((old) => ({ ...old, pageIndex: old.pageIndex - 1 }))}>Prev</Button><span className="text-sm">Page {query.pageIndex + 1} of {Math.max(1, Math.ceil(count / 20))}</span><Button disabled={loading || saving || (query.pageIndex + 1) * 20 >= count} onClick={() => setQuery((old) => ({ ...old, pageIndex: old.pageIndex + 1 }))}>Next</Button></div><p className="text-xs text-gray-500">{count} matching transactions</p></div>}
        {chosen.length > 0 && <div className="border rounded-lg p-3 space-y-2"><p className="font-semibold text-sm text-gray-700">Selected transactions ({chosen.length})</p>{chosen.map((row) => <div key={row.Id} className="flex justify-between gap-3 text-sm"><span>{row.Reference || row.PrimaryDescription} · {money(row.TotalValue)}</span><button type="button" disabled={saving} onClick={() => toggle(row)} className="text-red-600">Remove</button></div>)}</div>}
      </div>
      <div className="shrink-0 border-t pt-3 space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Reversal remarks<Input value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={saving} required /></label>
        <div className="flex justify-between gap-3 items-center"><span className="text-sm text-gray-600">{chosen.length} selected · {money(chosen.reduce((sum, row) => sum + Number(row.TotalValue || 0), 0))}</span><Button onClick={add} disabled={saving || !chosen.length || !remarks.trim()} className="bg-indigo-600 hover:bg-indigo-700">{saving ? "Adding..." : "Add selected to batch"}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
