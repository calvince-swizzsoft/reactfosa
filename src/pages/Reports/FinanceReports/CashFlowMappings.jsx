import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiJson, normalizeList } from "@/lib/api";
import FieldLabel from "@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel";
import Swal from "sweetalert2";
import { cashFlowRequest, field, unwrap } from "./cashFlowApi";

const sections = { Cash: "Cash and cash equivalents", Operating: "Operating activities", Investing: "Investing activities", Financing: "Financing activities", Exchange: "Exchange-rate effects" };
const buttonClass = "bg-indigo-600 hover:bg-indigo-700";

export function AccountLookup({ onSelect, onClose }) {
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ text, pageIndex: page, pageSize: 20 });
        const payload = unwrap(await apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/chartofaccounts?${query}`, { signal: controller.signal }));
        if (!controller.signal.aborted) setResult({ items: normalizeList(payload), total: Number(field(payload, "itemsCount") || 0) });
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [text, page, retry]);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-w-xl bg-white rounded-2xl">
    <DialogTitle>Select G/L account</DialogTitle><DialogDescription>Search by account code or name.</DialogDescription>
    <Input aria-label="Search G/L accounts" value={text} onChange={(e) => { setText(e.target.value); setPage(0); }} placeholder="Account code or name" />
    <div className="max-h-[45vh] overflow-y-auto space-y-2">
      {busy ? <p className="p-4 text-gray-500">Loading accounts…</p> : error ? <div role="alert"><p className="text-red-600">{error}</p><Button onClick={() => setRetry((r) => r + 1)}>Retry</Button></div> : result.items.length ? result.items.map((account) => <button key={field(account, "id")} onClick={() => onSelect(account)} className="w-full text-left p-3 border rounded-lg hover:bg-indigo-50"><span className="font-semibold text-indigo-700">{field(account, "accountCode")}</span> {field(account, "accountName")}</button>) : <p className="p-4 text-gray-500">No matching accounts.</p>}
    </div>
    <div className="flex justify-center items-center gap-3"><Button disabled={busy || page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button><span>Page {page + 1} of {Math.max(1, Math.ceil(result.total / 20))}</span><Button disabled={busy || (page + 1) * 20 >= result.total} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
  </DialogContent></Dialog>;
}

export default function CashFlowMappings({ onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [account, setAccount] = useState(null);
  const [section, setSection] = useState("Cash");
  const [line, setLine] = useState("");
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    cashFlowRequest("/mappings").then((data) => { if (active) setRows(data); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const save = async () => {
    setBusy(true);
    try {
      await cashFlowRequest(`/mappings/${field(account, "id")}`, { method: "PUT", body: JSON.stringify({ chartOfAccountId: field(account, "id"), section, line: line.trim() }) });
      setAccount(null); setLine(""); setRetry((r) => r + 1); onChanged();
    } catch (err) { Swal.fire("Unable to save mapping", err.message, "error"); }
    finally { setBusy(false); }
  };
  const remove = async (row) => {
    const result = await Swal.fire({ title: "Remove cash-flow mapping?", text: `${field(row, "accountCode")} — ${field(row, "accountName")}. Reports will use the remaining mappings.`, icon: "warning", showCancelButton: true, confirmButtonText: "Remove", confirmButtonColor: "#dc2626" });
    if (!result.isConfirmed) return;
    setBusy(true);
    try { await cashFlowRequest(`/mappings/${field(row, "chartOfAccountId")}`, { method: "DELETE" }); setRetry((r) => r + 1); onChanged(); }
    catch (err) { Swal.fire("Unable to remove mapping", err.message, "error"); }
    finally { setBusy(false); }
  };
  const matching = rows.filter((r) => ["accountCode", "accountName", "section", "line"].some((key) => String(field(r, key) || "").toLowerCase().includes(search.toLowerCase())));
  const pages = Math.max(1, Math.ceil(matching.length / 20));
  const currentPage = Math.min(page, pages - 1);
  return <section className="border border-gray-300 rounded-lg p-4 mb-5 space-y-4">
    <h3 className="font-semibold text-gray-800">Cash-flow account mappings</h3>
    {loading ? <p className="text-gray-500">Loading mappings…</p> : error ? <div role="alert" className="text-red-600"><p>{error}</p><Button onClick={() => setRetry((r) => r + 1)}>Retry</Button></div> : <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4"><FieldLabel label="G/L account" help="Map each posting account individually. Cash accounts must represent actual cash, bank balances or qualifying cash equivalents. Parent accounts are not expanded automatically." /><Button variant="outline" disabled={busy} onClick={() => setPicker(true)} className="w-full h-auto min-h-10 justify-start whitespace-normal text-left">{account ? `${field(account, "accountCode")} — ${field(account, "accountName")}` : "Select account"}</Button></div>
        <div className="md:col-span-3"><FieldLabel label="Section" htmlFor="cash-section" help="Cash identifies accounts included in opening and closing cash. Other sections classify the counterpart of cash receipts and payments. Use Exchange only for identified exchange-rate adjustments; classification must follow your accounting policy." /><select id="cash-section" disabled={busy} className="w-full h-10 rounded-md border border-gray-300 bg-white px-2" value={section} onChange={(e) => setSection(e.target.value)}>{Object.entries(sections).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
        <div className="md:col-span-3"><FieldLabel label="Report line" htmlFor="cash-line" help="Accounts with the same section and report-line name are combined. For example: Customer deposits, Staff payments, or Equipment purchases. Changes affect subsequent report generations, including historical periods." /><Input id="cash-line" value={line} maxLength={120} disabled={busy} onChange={(e) => setLine(e.target.value)} /></div>
        <Button className={`${buttonClass} md:col-span-2`} disabled={busy || !account || !line.trim()} onClick={save}>{busy ? "Saving…" : "Save mapping"}</Button>
      </div>
      {account && <Button variant="outline" disabled={busy} onClick={() => { setAccount(null); setLine(""); }}>Cancel edit</Button>}
      <Input aria-label="Filter mappings" placeholder="Filter mappings" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      <div className="overflow-x-auto bg-gray-200 p-3 rounded-sm"><div className="min-w-[650px]" role="table" aria-label="Cash-flow mappings">
        <div role="row" className="grid grid-cols-12 gap-3 bg-gray-700 text-white text-sm font-semibold p-3 rounded-lg mb-2"><span role="columnheader" className="col-span-4">Account</span><span role="columnheader" className="col-span-2">Section</span><span role="columnheader" className="col-span-4">Report line</span><span role="columnheader" className="col-span-2">Actions</span></div>
        {matching.slice(currentPage * 20, (currentPage + 1) * 20).map((row) => <div role="row" key={field(row, "chartOfAccountId")} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg border shadow-lg hover:shadow-xl p-3 mb-2 text-sm text-gray-700"><span role="cell" className="col-span-4">{field(row, "accountCode")} — {field(row, "accountName")}</span><span role="cell" className="col-span-2">{field(row, "section")}</span><span role="cell" className="col-span-4">{field(row, "line")}</span><span role="cell" className="col-span-2 flex gap-2"><button disabled={busy} className="text-indigo-700 underline" onClick={() => { setAccount({ id: field(row, "chartOfAccountId"), accountCode: field(row, "accountCode"), accountName: field(row, "accountName") }); setSection(field(row, "section")); setLine(field(row, "line")); }}>Edit</button><button disabled={busy} className="text-red-600 underline" onClick={() => remove(row)}>Remove</button></span></div>)}
        {!matching.length && <p className="text-center text-gray-500 py-5">No mappings found. Add the cash accounts first, then map their receipt and payment counterparts.</p>}
      </div></div>
      <div className="flex justify-center gap-3 items-center"><Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Prev</Button><span>Page {currentPage + 1} of {pages}</span><Button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
    </>}
    {picker && <AccountLookup onClose={() => setPicker(false)} onSelect={(item) => { setAccount(item); setPicker(false); const existing = rows.find((r) => field(r, "chartOfAccountId") === field(item, "id")); if (existing) { setSection(field(existing, "section")); setLine(field(existing, "line")); } }} />}
  </section>;
}
