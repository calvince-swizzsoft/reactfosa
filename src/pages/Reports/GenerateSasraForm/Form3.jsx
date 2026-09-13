import { useEffect, useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson } from "@/lib/api";
import FieldLabel from "@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel";
import { AccountLookup } from "../FinanceReports/CashFlowMappings";
import { field } from "../FinanceReports/cashFlowApi";
import Swal from "sweetalert2";
import { validateForm6Dates } from "./form6Model";

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/sasra/setup`;
const normalize = value => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k[0].toLowerCase() + k.slice(1), normalize(v)])) : value;
async function request(path, options) { const result = await apiJson(base + path, { cache: "no-store", ...options }); return normalize(result.data ?? result.Data); }
const money = value => Number(value).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 5 });
const primary = "bg-indigo-600 hover:bg-indigo-700";

export default function Form3({ onClose, savedVersionId, savedForm6VersionId }) {
  const [sourceForm6, setSourceForm6] = useState(null);
  const [definition, setDefinition] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [dirty, setDirty] = useState(false), [picker, setPicker] = useState(null), [page, setPage] = useState(0);
  const [yearStart, setYearStart] = useState(""), [asAt, setAsAt] = useState(""), [result, setResult] = useState(null), [retry, setRetry] = useState(0);
  const [view, setView] = useState("mappings"), [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setBusy(true); setError("");
    Promise.all([request(savedVersionId ? `/versions/${savedVersionId}` : "/form3/definition"), savedVersionId ? (savedForm6VersionId ? request(`/versions/${savedForm6VersionId}`) : Promise.resolve({ revision: 0 })) : request("/form6/definition")]).then(([d, sofp]) => { if (active) { setDefinition(d); setSourceForm6(sofp); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [retry, savedVersionId, savedForm6VersionId]);
  async function run(action) { setBusy(true); setError(""); setNotice(""); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  function updateAccounts(code, accounts, names) {
    setDefinition(d => ({ ...d, lines: d.lines.map(l => l.code === code ? { ...l, accountIds: accounts, accountNames: names } : l) }));
    setDirty(true); setResult(null);
  }
  const mappingLines = definition?.lines.filter(l => l.source === "GlBalance") || [];
  const rows = view === "preview" ? result?.depositRows || [] : view === "unmapped" ? result?.unmappedAccounts || [] : mappingLines;
  const pages = Math.max(1, Math.ceil(rows.length / 20)), currentPage = Math.min(page, pages - 1);
  const chooseView = next => { setView(next); setPage(0); };
  async function close() {
    if (dirty && !(await Swal.fire({ title: "Discard unsaved mappings?", icon: "question", showCancelButton: true, confirmButtonText: "Discard" })).isConfirmed) return;
    onClose();
  }
  function download() {
    if (!result?.workbookBase64 || dirty) return;
    const bytes = Uint8Array.from(atob(result.workbookBase64), c => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.ms-excel" }));
    const link = document.createElement("a"); link.href = url; link.download = `SASRA-Form3-${result.asAt.slice(0, 10)}.xls`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <header className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3"><h1 className="text-xl font-bold text-white flex items-center gap-2"><FaFileExcel />Form 3 · Statement of Deposit Return</h1><Button variant="outline" disabled={busy} onClick={close}>Back to SASRA reports</Button></header>
    <div className="flex flex-wrap justify-between gap-3 my-4 text-sm text-gray-600"><FieldLabel label="DT SACCO · Amounts in KSh thousands · All branches" help="Each positive customer-account balance is classified by deposit category and balance band. The report counts accounts, not unique members or fixed-deposit contracts. Principal and mapped posted interest are combined for each customer account within its category. Zero balances are excluded. Excel edits are not saved back into the system." /><span>{definition?.revision ? `Saved revision ${definition.revision}` : "Mappings not saved"}{dirty ? " · Unsaved changes" : ""}</span></div>
    <div className="mb-3 text-sm text-gray-700"><FieldLabel label="Balance bands and accrued interest" help="Bands use whole KSh before conversion to thousands: below 50,000; 50,000 through 100,000; above 100,000 through 300,000; above 300,000 through 1,000,000; above 1,000,000. Each account is counted once per category. Unposted accrued interest needs a supporting schedule and adjustment in Excel. Missing customer links or debit deposit balances must be resolved before export." /></div>
    {error && <div role="alert" className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 mb-4">{error}{!definition && <Button onClick={() => setRetry(x => x + 1)}>Retry</Button>}</div>}
    {notice && <p role="status" className="mb-3 text-green-700">{notice}</p>}
    {!definition ? busy && <div className="animate-pulse h-32 bg-gray-100 rounded-lg" /> : <>
      <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end border rounded-lg p-4 mb-4" onSubmit={e => {
        e.preventDefault();
        if (dirty || !definition.revision || !sourceForm6?.revision) { setError("Save Form 3 mappings and a Form 6 revision before previewing."); return; }
        const dateError = validateForm6Dates(yearStart, asAt);
        if (dateError) { setError(dateError); return; }
        run(async () => { setResult(null); const data = await request("/form3/preview", { method: "POST", body: JSON.stringify({ versionId: definition.id, form6VersionId: sourceForm6.id, yearStart, asAt }) }); setResult(data); chooseView("preview"); });
      }}>
        <div><FieldLabel label="Financial year start" help="Enter the actual financial-year start for the workbook heading. Amounts are cumulative closing balances, including postings before this date." /><Input aria-label="Financial year start" type="date" required disabled={busy} value={yearStart} onChange={e => { setYearStart(e.target.value); setResult(null); chooseView("mappings"); }} /></div>
        <div><FieldLabel label="As at" help="Closing balances include the whole selected day. This is a position at a date, not only the change since the financial year began." /><Input aria-label="As at" type="date" required min={yearStart || undefined} disabled={busy} value={asAt} onChange={e => { setAsAt(e.target.value); setResult(null); chooseView("mappings"); }} /></div>
        <Button className={primary} disabled={busy || dirty || !definition.revision || !sourceForm6?.revision} type="submit">{busy ? "Working…" : "Preview Form 3"}</Button>
        <Button type="button" variant="outline" disabled={busy || dirty || !result?.workbookBase64} onClick={download}>Download Excel</Button>
        <p className="col-span-full text-sm text-gray-500">{sourceForm6?.revision ? `Balance-sheet comparison: Form 6 revision ${sourceForm6.revision}.` : "Save a Form 6 workbook revision before previewing Form 3."}</p>
      </form>
      {result && <div className="border rounded-lg p-3 mb-4 text-sm space-y-2">
        <strong>{result.institutionName} · {result.asAt.slice(0, 10)}</strong>
        <div className="flex flex-wrap gap-6"><span>Deposit accounts: {result.totalAccounts.toLocaleString()}</span><span>Total deposits: KSh {money(result.totalDeposits)}</span><FieldLabel label={`Customer / G/L difference: KSh ${money(result.difference)}`} help="Positive customer balances less the total of mapped deposit G/L balances. A difference above KSh 0.01 blocks export. Missing customer links and debit deposit balances also block export, even if they offset each other." /><FieldLabel label={`Form 6 difference: KSh ${money(result.form6Difference)}`} help="Mapped deposit G/L totals less deposits mapped to Form 6 withdrawable, term and non-withdrawable deposit lines. A difference above KSh 0.01 blocks export." /><FieldLabel label={`Ledger difference: KSh ${money(result.ledgerDifference)}`} help="The sum of all closing G/L balances across all branches. Debits and credits must balance to within KSh 0.01." /></div>
        {result.issues.map(issue => <p key={issue} role="alert" className="text-red-700">{issue}</p>)}{result.warnings.map(warning => <p key={warning} className="text-amber-700">{warning}</p>)}
      </div>}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3"><div className="flex gap-2"><Button variant={view === "mappings" ? "default" : "outline"} onClick={() => chooseView("mappings")}>Account mappings</Button>{result && <><Button variant={view === "preview" ? "default" : "outline"} onClick={() => chooseView("preview")}>Preview</Button><Button variant={view === "unmapped" ? "default" : "outline"} onClick={() => chooseView("unmapped")}>Unmapped ({result.unmappedAccounts.length})</Button></>}</div>{view === "mappings" && <Button className={primary} disabled={busy || (!dirty && definition.revision > 0)} onClick={() => run(async () => { const saved = await request("/versions", { method: "POST", body: JSON.stringify(definition) }); setDefinition(saved); setDirty(false); setResult(null); setNotice("Form 3 mappings saved as a new revision."); })}>Save mappings</Button>}</div>
      {view === "mappings" && <div className="mb-3"><FieldLabel label="Map deposit liability posting accounts to the three categories" help="BOSA deposits normally map to non-withdrawable deposits; ordinary savings to savings deposits; fixed deposits to term deposits. These category mappings apply across all five bands. Add posted accrued-interest liabilities to the related category only when they have customer-account links. Each G/L can be mapped once. Use posting accounts without children." /></div>}
      <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">{view === "preview" ? <><span className="col-span-3">Balance range (KSh)</span><span className="col-span-3">Deposit category</span><span className="col-span-2 text-right">Accounts</span><span className="col-span-4 text-right">KSh thousands</span></> : <><span className="col-span-5">{view === "unmapped" ? "Account" : "Deposit category"}</span><span className={view === "mappings" ? "col-span-6" : "col-span-7 text-right"}>{view === "mappings" ? "Mapped accounts" : "G/L balance (KSh)"}</span></>}</div>
        <div className="space-y-2">{rows.slice(currentPage * 20, currentPage * 20 + 20).map(l => <div key={l.code || l.cell || l.id} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg hover:shadow-xl transition-all border p-3 text-sm text-gray-700">
          {view === "preview" ? <><span className="col-span-3">{l.range}</span><span className="col-span-3">{l.depositType}</span><span className="col-span-2 text-right tabular-nums">{l.accountCount.toLocaleString()}</span><span className="col-span-4 text-right tabular-nums">{money(l.amount)}</span></> : <><div className="col-span-5">{l.description || l.name}</div>
          {view === "mappings" ? <><div className="col-span-6 flex flex-wrap gap-2">{l.accountIds.length ? l.accountIds.map(id => <span key={id} className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-1">{l.accountNames[id] || "Account name unavailable"}<button disabled={busy} className="px-1 text-red-700 focus-visible:outline" aria-label={`Remove ${l.accountNames[id] || "account"} from ${l.description}`} onClick={() => updateAccounts(l.code, l.accountIds.filter(a => a !== id), l.accountNames)}>×</button></span>) : <span className="text-gray-500">No accounts mapped</span>}</div><button disabled={busy} className="col-span-1 text-indigo-700 font-semibold focus-visible:outline" aria-label={`Map account to ${l.description}`} onClick={() => setPicker(l.code)}>Add</button></> : <span className="col-span-7 text-right tabular-nums">{money(l.balance)}</span>}</>}
        </div>)}</div>
        {!rows.length && <div className="text-center py-6"><img src="/assets/scopefinding.png" alt="" className="mx-auto w-32" /><p className="text-gray-400">{view === "unmapped" ? "No unmapped non-zero balances." : "No lines to display."}</p></div>}
      </div>
      <div className="flex justify-center items-center gap-3 mt-4"><Button disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>Prev</Button><span>Page {currentPage + 1} of {pages}</span><Button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div>
    </>}
    {picker && <AccountLookup onClose={() => setPicker(null)} onSelect={account => {
      const id = field(account, "id"), name = `${field(account, "accountCode")} — ${field(account, "accountName")}`;
      if (definition.lines.some(l => l.accountIds.includes(id))) { setError("This account is already mapped. Remove its existing mapping before moving it."); setPicker(null); return; }
      const line = definition.lines.find(l => l.code === picker);
      updateAccounts(picker, [...line.accountIds, id], { ...line.accountNames, [id]: name }); setPicker(null); setError("");
    }} />}
  </main>;
}
