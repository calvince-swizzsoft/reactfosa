import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaExchangeAlt, FaPlus, FaSearch } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import NotFoundImage from "/assets/scopefinding.png";
import FieldHelp from "../SavingsProducts/FieldHelp";
import BatchStatusBadge from "../BatchProcedures/lib/BatchStatusBadge";
import { CreateInterAccountTransferDrawer, BatchDetailDrawer } from "../BatchProcedures/types/InterAccountTransferPanel";
import { listInterAccountTransferBatches } from "../BatchProcedures/types/interAccountTransferApi";

const STATUSES = [[1, "Pending"], [8, "Verified"], [2, "Posted"], [4, "Rejected"]];

export default function IntraAccountTransfer() {
  const { userName } = useAuth();
  const [criteria, setCriteria] = useState({ status: 1, text: "", pageIndex: 0 });
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const refresh = () => setRevision((value) => value + 1);
  const pending = loading || result?.criteria !== criteria || result?.revision !== revision;
  const items = result?.items || [];
  const pages = result?.pages || 1;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listInterAccountTransferBatches({ ...criteria, pageSize: 20 })
      .then((page) => {
        if (!active) return;
        const rows = page?.PageCollection ?? page?.pageCollection ?? [];
        const count = Number(page?.ItemsCount ?? page?.itemsCount ?? rows.length);
        const pageSize = Number(page?.PageSize ?? page?.pageSize) || 20;
        setResult({ criteria, revision, items: rows, count, pages: Math.max(1, Number(page?.TotalPages ?? page?.totalPages) || Math.ceil(count / pageSize)) });
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not load transfer batches.");
        setResult({ criteria, revision, items: [], count: 0, pages: 1 });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [criteria, revision]);

  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-800 px-6 py-3">
      <h1 className="flex items-center gap-2 text-xl font-bold text-white"><FaExchangeAlt /> Intra Account Transfer</h1>
      <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> New Transfer</Button>
    </div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-1 text-sm text-gray-700">
        <span>Transfer between accounts belonging to the same customer.</span>
        <FieldHelp label="Transfer workflow">Create a batch, add one or more destination accounts and save any applicable charges. The batch must then be verified and authorized under Inter Account Transfer in Batch Procedures. Funds are posted at authorization. This page and Batch Procedures share the transfer register, so existing inter-account batches also appear here.</FieldHelp>
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-semibold text-indigo-700">
        <Link className="rounded hover:underline focus-visible:outline-indigo-600" to="/batch/verification?type=interAccountTransfer">Verification</Link>
        <Link className="rounded hover:underline focus-visible:outline-indigo-600" to="/batch/authorization?type=interAccountTransfer">Authorization</Link>
      </div>
    </div>
    <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setCriteria((current) => ({ ...current, text: search.trim(), pageIndex: 0 })); }}>
      <div className="min-w-40"><label id="transfer-status-label" className="mb-1 block text-sm font-semibold text-gray-700">Status</label><Select value={String(criteria.status)} onValueChange={(value) => setCriteria((current) => ({ ...current, status: Number(value), pageIndex: 0 }))}><SelectTrigger aria-labelledby="transfer-status-label"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(([value, label]) => <SelectItem key={value} value={String(value)}>{label}</SelectItem>)}</SelectContent></Select></div>
      <div className="min-w-48 flex-1"><label htmlFor="transfer-search" className="mb-1 block text-sm font-semibold text-gray-700">Search transfer batches</label><Input id="transfer-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transfers…" /></div>
      <Button type="submit" className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaSearch /> Search</Button>
      <Button type="button" variant="outline" onClick={refresh} disabled={pending}>Refresh</Button>
    </form>
    <div className="overflow-x-auto rounded-sm bg-gray-200 p-4">
      <div className="min-w-[600px]">
        <div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 text-sm font-semibold text-gray-100"><span className="col-span-2">Batch</span><span className="col-span-4">Source account</span><span className="col-span-2">Reference</span><span className="col-span-2">Created by</span><span className="col-span-2">Status</span></div>
        {pending ? <div role="status" aria-label="Loading transfers" className="space-y-2 animate-pulse">{[1, 2, 3].map((row) => <div key={row} className="grid grid-cols-12 gap-4 rounded-lg bg-gray-50 p-3">{[2, 4, 2, 2, 2].map((span, index) => <div key={index} style={{ gridColumn: `span ${span}` }} className="h-5 rounded bg-gray-200" />)}</div>)}</div>
          : error ? <div role="alert" className="py-6 text-center text-sm text-red-600">{error}<Button onClick={refresh} className="ml-3">Retry</Button></div>
          : items.length ? <div className="space-y-2">{items.map((batch) => <button type="button" key={batch.Id} onClick={() => setSelected(batch)} className="grid w-full grid-cols-12 items-center gap-4 rounded-lg border bg-white p-3 text-left text-sm shadow-lg transition-all hover:shadow-xl focus-visible:outline-indigo-600">
            <span className="col-span-2 font-semibold text-indigo-700">{batch.PaddedBatchNumber || batch.BatchNumber}</span>
            <span className="col-span-4 text-gray-700"><span className="block truncate">{batch.CustomerAccountCustomerFullName || "—"}</span><span className="block truncate text-xs text-gray-500">{batch.CustomerAccountFullAccountNumber}</span></span>
            <span className="col-span-2 truncate text-gray-700">{batch.Reference || "—"}</span><span className="col-span-2 truncate text-gray-500">{batch.CreatedBy}</span><span className="col-span-2"><BatchStatusBadge status={batch.Status} /></span>
          </button>)}</div> : <div className="py-6 text-center"><img src={NotFoundImage} alt="" className="mx-auto w-32" /><p className="mt-2 text-sm text-gray-400">No transfer batches found.</p></div>}
      </div>
    </div>
    <div className="mt-4 flex items-center justify-center gap-3"><Button disabled={pending || !!error || criteria.pageIndex === 0} onClick={() => setCriteria((current) => ({ ...current, pageIndex: current.pageIndex - 1 }))}>Prev</Button><span className="text-sm text-gray-600">Page {criteria.pageIndex + 1} of {pending ? "…" : pages}</span><Button disabled={pending || !!error || criteria.pageIndex + 1 >= pages} onClick={() => setCriteria((current) => ({ ...current, pageIndex: current.pageIndex + 1 }))}>Next</Button></div>
    {!pending && !error && <p className="mt-2 text-center text-xs text-gray-500">{result?.count || 0} matching transfer batches</p>}
    {createOpen && <CreateInterAccountTransferDrawer intraAccount open onClose={() => setCreateOpen(false)} onSuccess={(batch) => { refresh(); setSelected(batch); }} />}
    {selected && <BatchDetailDrawer key={selected.Id} intraAccount batch={selected} stage="origination" currentUser={userName} onClose={() => setSelected(null)} onChanged={refresh} />}
  </div>;
}
