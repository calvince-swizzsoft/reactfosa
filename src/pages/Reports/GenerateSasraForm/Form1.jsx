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

export default function Form1({ onClose, savedVersionId, savedForm6VersionId }) {
  const [sourceForm6, setSourceForm6] = useState(null);
  const [definition, setDefinition] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [dirty, setDirty] = useState(false), [picker, setPicker] = useState(null), [page, setPage] = useState(0);
  const [yearStart, setYearStart] = useState(""), [asAt, setAsAt] = useState(""), [result, setResult] = useState(null), [retry, setRetry] = useState(0);
  const [view, setView] = useState("mappings"), [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setBusy(true); setError("");
    Promise.all([request(savedVersionId ? `/versions/${savedVersionId}` : "/form1/definition"), savedVersionId ? (savedForm6VersionId ? request(`/versions/${savedForm6VersionId}`) : Promise.resolve({ revision: 0 })) : request("/form6/definition")]).then(([d, sofp]) => { if (active) { setDefinition(d); setSourceForm6(sofp); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [retry, savedVersionId, savedForm6VersionId]);
  async function run(action) { setBusy(true); setError(""); setNotice(""); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  function updateAccounts(code, accounts, names) {
    setDefinition(d => ({ ...d, lines: d.lines.map(l => l.code === code ? { ...l, accountIds: accounts, accountNames: names } : l) }));
    setDirty(true); setResult(null);
  }
  const mappingLines = definition?.lines.filter(l => l.source === "GlBalance") || [];
  const rows = view === "preview" ? result?.rows || [] : view === "unmapped" ? result?.unmappedAccounts || [] : mappingLines;
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
    const link = document.createElement("a"); link.href = url; link.download = `SASRA-Form1-${result.asAt.slice(0, 10)}.xls`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <header className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3"><h1 className="text-xl font-bold text-white flex items-center gap-2"><FaFileExcel />Form 1 · Capital Adequacy</h1><Button variant="outline" disabled={busy} onClick={close}>Back to SASRA reports</Button></header>
    <div className="flex flex-wrap justify-between gap-3 my-4 text-sm text-gray-600"><FieldLabel label="DT SACCO · KSh · All branches" help="Form 1 uses whole KSh in the main amount column D. The original workbook formulas and additional Year 3 / Year 4 columns are preserved; those additional columns are not populated. Capital and assets use G/L mappings. Form 6 supplies the balance-sheet asset and deposit figures. This report is generated from mappings and ledger balances. Additional regulatory adjustments must be completed in the downloaded Excel file; Excel changes are not saved back into the system." /><span>{definition?.id && definition.id !== "00000000-0000-0000-0000-000000000000" ? `Saved revision ${definition.revision}` : "Mappings not saved"}{dirty ? " · Unsaved changes" : ""}</span></div>
    <div className="my-3 text-sm text-gray-700"><FieldLabel label="Generated from mappings · Adjustments completed in Excel" help="Download after the mapping and ledger checks pass. In worksheet Capital Adequacy, review D13 (eligible surplus contribution), D19 (investment deductions), D20 (other deductions) and D37 (off-balance-sheet exposures). Deductions and exposures initially show zero because no additional adjustments have been supplied. Keep total and ratio formulas intact. Excel edits are not imported into the system." /></div>
    {error && <div role="alert" className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 mb-4">{error}{!definition && <Button onClick={() => setRetry(x => x + 1)}>Retry</Button>}</div>}
    {notice && <p role="status" className="mb-3 text-green-700">{notice}</p>}
    {!definition ? busy && <div className="animate-pulse h-32 bg-gray-100 rounded-lg" /> : <>
      <form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end border rounded-lg p-4 mb-4" onSubmit={e => {
        e.preventDefault();
        if (dirty || !definition.revision || !sourceForm6?.revision) { setError("Save Form 1 mappings and a Form 6 revision before previewing."); return; }
        const dateError = validateForm6Dates(yearStart, asAt);
        if (dateError) { setError(dateError); return; }
        run(async () => { setResult(null); const data = await request("/form1/preview", { method: "POST", body: JSON.stringify({ versionId: definition.id, form6VersionId: sourceForm6.id, yearStart, asAt, mappingBased: true }) }); setResult(data); chooseView("preview"); });
      }}>
        <div><FieldLabel label="Financial year start" help="Enter the actual financial-year start. Current-year profit is calculated before system closing transfers; those transfers are removed from mapped capital components to avoid counting earnings twice. The initial report includes 50% of ledger profit or the full loss. Review any surplus eligibility adjustments in Excel." /><Input aria-label="Financial year start" type="date" required disabled={busy} value={yearStart} onChange={e => { setYearStart(e.target.value); setResult(null); chooseView("mappings"); }} /></div>
        <div><FieldLabel label="As at" help="Closing balances include the whole selected day. This is a position at a date, not only the change since the financial year began." /><Input aria-label="As at" type="date" required min={yearStart || undefined} disabled={busy} value={asAt} onChange={e => { setAsAt(e.target.value); setResult(null); chooseView("mappings"); }} /></div>
        <Button className={primary} disabled={busy || dirty || !definition.revision || !sourceForm6?.revision} type="submit">{busy ? "Working…" : "Preview Form 1"}</Button>
        <Button type="button" variant="outline" disabled={busy || dirty || !result?.workbookBase64} onClick={download}>Download Excel</Button>
        <p className="col-span-full text-sm text-gray-500">{sourceForm6?.revision ? `Balance-sheet comparison: Form 6 revision ${sourceForm6.revision}.` : "Save a Form 6 workbook revision before previewing Form 1."}</p>
      </form>
      {result && <div className="border rounded-lg p-3 mb-4 text-sm space-y-2">
        <strong>{result.institutionName} · {result.asAt.slice(0, 10)}</strong>
        <div className="flex flex-wrap gap-6"><FieldLabel label={`Reconciliation difference: ${money(result.difference)}`} help="Form 1 on-balance-sheet assets minus assets in the selected Form 6 revision, in KSh. A difference above KSh 0.01 blocks download. Form 6 data issues also need resolving. Deficient but correctly calculated capital ratios remain reportable." /><span>Ledger difference: {money(result.ledgerDifference)}</span><span>Ledger surplus: {money(result.rawCurrentSurplus)}</span><FieldLabel label={`Included surplus: ${money(result.eligibleCurrentSurplus)}`} help="Initially 50% of ledger profit or the full loss, in KSh. In Excel D13, enter the final eligible contribution after any required adjustments; do not halve that contribution again." /></div>
        {result.issues.map(issue => <p key={issue} role="alert" className="text-red-700">{issue}</p>)}{result.warnings.map(warning => <p key={warning} className="text-amber-700">{warning}</p>)}
      </div>}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3"><div className="flex gap-2"><Button variant={view === "mappings" ? "default" : "outline"} onClick={() => chooseView("mappings")}>Account mappings</Button>{result && <><Button variant={view === "preview" ? "default" : "outline"} onClick={() => chooseView("preview")}>Preview</Button><Button variant={view === "unmapped" ? "default" : "outline"} onClick={() => chooseView("unmapped")}>Unmapped ({result.unmappedAccounts.length})</Button></>}</div>{view === "mappings" && <Button className={primary} disabled={busy || (!dirty && definition.revision > 0)} onClick={() => run(async () => { const saved = await request("/versions", { method: "POST", body: JSON.stringify(definition) }); setDefinition(saved); setDirty(false); setResult(null); setNotice("Form 1 mappings saved as a new revision."); })}>Save mappings</Button>}</div>
      {view === "mappings" && <div className="mb-3"><FieldLabel label="Map posting accounts to each report line" help="Map eligible equity accounts to capital components and asset accounts to the on-balance-sheet categories. Include accumulated depreciation with the related asset and loan-loss allowance with loans, so their credit balances reduce assets. Exclude revaluation and other ineligible reserves. Proposed dividends and capital deductions require review. Existing Form 6 mappings are suggested for a new Form 1 definition only where their meaning carries over. Complete additional deductions, exposures and surplus adjustments in Excel. Totals and balance-sheet comparisons are automatic." /></div>}
      <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-5">{view === "unmapped" ? "Account" : "Report line"}</span><span className={view === "mappings" ? "col-span-6" : "col-span-7 text-right"}>{view === "mappings" ? "Mapped accounts" : "KSh / %"}</span></div>
        <div className="space-y-2">{rows.slice(currentPage * 20, currentPage * 20 + 20).map(l => <div key={l.code || l.cell || l.id || l.description} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border p-3 text-sm text-gray-700">
          <div className="col-span-5"><span className={l.source === "Formula" || l.source === "Header" ? "font-semibold" : ""}>{l.description || l.name}</span>{l.formula && <FieldLabel label="Formula" help={l.formula} />}</div>
          {view === "mappings" ? <><div className="col-span-6 flex flex-wrap gap-2">{l.accountIds.length ? l.accountIds.map(id => <span key={id} className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-1">{l.accountNames[id] || "Account name unavailable"}<button disabled={busy} className="px-1 text-red-700 focus-visible:outline" aria-label={`Remove ${l.accountNames[id] || "account"} from ${l.description}`} onClick={() => updateAccounts(l.code, l.accountIds.filter(a => a !== id), l.accountNames)}>×</button></span>) : <span className="text-gray-500">No accounts mapped</span>}</div><button disabled={busy} className="col-span-1 text-indigo-700 font-semibold focus-visible:outline" aria-label={`Map account to ${l.description}`} onClick={() => setPicker(l.code)}>Add</button></> : <span className="col-span-7 text-right tabular-nums">{view === "unmapped" ? money(l.balance) : l.amount == null ? (l.source === "Header" ? "" : "Unavailable") : l.isRatio ? `${money(l.amount * 100)}%` : money(l.amount)}</span>}
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
