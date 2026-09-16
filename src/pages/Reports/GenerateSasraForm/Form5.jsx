import { useEffect, useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson } from "@/lib/api";
import FieldLabel, { BatchFieldHelp } from "@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel";
import { AccountLookup } from "../FinanceReports/CashFlowMappings";
import { field } from "../FinanceReports/cashFlowApi";
import Swal from "sweetalert2";
import { latestCompletedQuarter, quarterEnd, validateForm5Dates, financialYearStart, reportingQuarters } from "./form5Model";

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/sasra/setup`;
const normalize = value => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k[0].toLowerCase() + k.slice(1), normalize(v)])) : value;
async function request(path, options) { const result = await apiJson(base + path, { cache: "no-store", ...options }); return normalize(result.data ?? result.Data); }
const money = value => Number(value).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 5 });
const primary = "bg-indigo-600 hover:bg-indigo-700";

export default function Form5({ onClose, savedVersionId, savedForm6VersionId, savedForm1VersionId }) {
  const [sourceForm6, setSourceForm6] = useState(null);
  const [sourceForm1, setSourceForm1] = useState(null);
  const [definition, setDefinition] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [dirty, setDirty] = useState(false), [picker, setPicker] = useState(null), [page, setPage] = useState(0);
  const [quarterDate, setQuarterDate] = useState(() => { const p = latestCompletedQuarter(); return quarterEnd(p.year, p.quarter); });
  const [postingPeriods, setPostingPeriods] = useState([]), [periodsLoading, setPeriodsLoading] = useState(true), [periodsError, setPeriodsError] = useState("");
  const [reportPurpose, setReportPurpose] = useState("Quarterly");
  const [manualYearStart, setManualYearStart] = useState(""), [asAt, setAsAt] = useState(quarterDate), [result, setResult] = useState(null), [retry, setRetry] = useState(0);
  const [view, setView] = useState("mappings"), [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setBusy(true); setError("");
    Promise.all([request(savedVersionId ? `/versions/${savedVersionId}` : "/form5/definition"), request(savedForm6VersionId ? `/versions/${savedForm6VersionId}` : "/form6/definition"), request(savedForm1VersionId ? `/versions/${savedForm1VersionId}` : "/form1/definition")]).then(([d, sofp, capital]) => { if (active) { setDefinition(d); setSourceForm6(sofp); setSourceForm1(capital); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [retry, savedVersionId, savedForm6VersionId, savedForm1VersionId]);
  useEffect(() => {
    let active = true;
    setPeriodsLoading(true); setPeriodsError("");
    apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/postingperiods`, { cache: "no-store" })
      .then(body => { if (active) { const periods = normalize(body.data ?? body.Data); if (!Array.isArray(periods)) throw new Error("Financial periods could not be read."); setPostingPeriods(periods); } })
      .catch(e => { if (active) setPeriodsError(e.message); })
      .finally(() => { if (active) setPeriodsLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const configuredYearStart = financialYearStart(postingPeriods, asAt);
  const yearStart = configuredYearStart || manualYearStart;
  const quarters = reportingQuarters(postingPeriods);
  async function run(action) { setBusy(true); setError(""); setNotice(""); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  function updateAccounts(code, accounts, names) {
    setDefinition(d => ({ ...d, lines: d.lines.map(l => l.code === code ? { ...l, accountIds: accounts, accountNames: names } : l) }));
    setDirty(true); setResult(null);
  }
  const mappingLines = definition?.lines.filter(l => l.source === "GlBalance") || [];
  const rows = view === "preview" ? result?.rows || [] : view === "unmapped" ? result?.unmappedAccounts || [] : mappingLines;
  const pages = Math.max(1, Math.ceil(rows.length / 20)), currentPage = Math.min(page, pages - 1);
  const chooseView = next => { setView(next); setPage(0); };
  const reportNotes = (result?.warnings || []).filter(note => /^(Mapping-based working copy\.|C11 follows the workbook label|Workbook correction:)/.test(note));
  const reportWarnings = (result?.warnings || []).filter(note => !reportNotes.includes(note) && !note.startsWith("Interim working copy"));
  async function close() {
    if (dirty && !(await Swal.fire({ title: "Discard unsaved mappings?", icon: "question", showCancelButton: true, confirmButtonText: "Discard" })).isConfirmed) return;
    onClose();
  }
  function clearPreview() { setResult(null); setError(""); chooseView("mappings"); }
  function changeDate(date) { setAsAt(date); setManualYearStart(""); clearPreview(); }
  function download() {
    if (!result?.workbookBase64 || dirty) return;
    const bytes = Uint8Array.from(atob(result.workbookBase64), c => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.ms-excel" }));
    const link = document.createElement("a"); link.href = url; link.download = `SASRA-Form5-${result.reportPurpose === "Interim" ? "Interim-working-copy" : "Quarterly-return"}-${result.asAt.slice(0, 10)}.xls`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <header className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3"><h1 className="text-xl font-bold text-white flex items-center gap-2"><FaFileExcel />Form 5 · Investment Return</h1><Button variant="outline" disabled={busy} onClick={close}>Back to SASRA reports</Button></header>
    <div className="flex flex-wrap justify-between gap-3 my-4 text-sm text-gray-600"><FieldLabel label="DT SACCO · KSh · All branches" help="Form 5 uses KSh closing balances across all branches. Core capital comes from Form 1; total assets and deposits come from Form 6 via Form 1. Review adjustments and eligibility in the downloaded Excel file. The source workbook specifies quarterly reporting." /><span>{definition?.id && definition.id !== "00000000-0000-0000-0000-000000000000" ? `Saved revision ${definition.revision}` : "Mappings not saved"}{dirty ? " · Unsaved changes" : ""}</span></div>
    {error && <div role="alert" className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 mb-4">{error}{!definition && <Button onClick={() => setRetry(x => x + 1)}>Retry</Button>}</div>}
    {notice && <p role="status" className="mb-3 text-green-700">{notice}</p>}
    {!definition ? busy && <div className="animate-pulse h-32 bg-gray-100 rounded-lg" /> : <>
      <form className="flex flex-wrap gap-3 items-end border rounded-lg p-4 mb-4" onSubmit={e => {
        e.preventDefault();
        if (periodsLoading || periodsError) { setError("Load the financial periods before previewing."); return; }
        if (dirty || !definition.revision || (!sourceForm6?.revision || !sourceForm1?.revision)) { setError("Save Form 5, Capital Adequacy and SOFP mappings before previewing."); return; }
        const dateError = validateForm5Dates(yearStart, asAt, reportPurpose);
        if (dateError) { setError(dateError); return; }
        run(async () => { setResult(null); const data = await request("/form5/preview", { method: "POST", body: JSON.stringify({ versionId: definition.id, form6VersionId: sourceForm6.id, form1VersionId: sourceForm1.id, yearStart, asAt, reportPurpose }) }); setResult(data); chooseView("preview"); });
      }}>
        <div className="w-full sm:w-72">
          {reportPurpose === "Quarterly" ? <><FieldLabel label="Reporting quarter" help="Select the quarter to report. The date is set automatically, and the financial-year start comes from the matching configured posting period." /><select aria-label="Reporting quarter" className="w-full border rounded-md p-2 text-sm bg-white" disabled={busy} value={quarterDate} onChange={e => { setQuarterDate(e.target.value); changeDate(e.target.value); }}>{quarters.map(q => <option key={q.date} value={q.date}>{q.label}</option>)}</select></> : <><FieldLabel label="Interim date" help="Choose any date for an interim working copy. The preview and Excel download are labelled as interim." /><Input aria-label="Interim date" type="date" required disabled={busy} value={asAt} onChange={e => changeDate(e.target.value)} /></>}
        </div>
        {!periodsLoading && !periodsError && !configuredYearStart && <div className="w-full sm:w-56"><FieldLabel label="Financial year start" help="No unique configured financial period covers this date. Enter the actual financial-year start to continue, or correct the posting periods in Accounts setup." /><Input aria-label="Financial year start" type="date" required disabled={busy} value={manualYearStart} onChange={e => { setManualYearStart(e.target.value); clearPreview(); }} /></div>}
        <Button className={primary} disabled={busy || periodsLoading || !!periodsError || dirty || !definition.revision || (!sourceForm6?.revision || !sourceForm1?.revision)} type="submit">{busy ? "Working…" : "Preview Form 5"}</Button>
        <Button type="button" variant="outline" disabled={busy || dirty || !result?.workbookBase64} onClick={download}>Download Excel</Button>
        <div className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <button type="button" disabled={busy} className="text-indigo-700 underline focus-visible:outline" onClick={() => { const next = reportPurpose === "Quarterly" ? "Interim" : "Quarterly"; setReportPurpose(next); changeDate(next === "Quarterly" ? quarterDate : asAt); }}>{reportPurpose === "Quarterly" ? "Use an interim date" : "Use a quarterly return"}</button>
          {reportPurpose === "Quarterly" && <span>As at {asAt}</span>}
          {configuredYearStart && <span>Financial year starts {configuredYearStart}</span>}
          {periodsLoading && <span role="status">Loading financial period…</span>}
          {periodsError && <span role="alert" className="text-red-700">{periodsError} <button type="button" className="underline" onClick={() => setRetry(x => x + 1)}>Retry</button></span>}
        </div>
      </form>
      {result && <div className="border rounded-lg p-3 mb-4 text-sm space-y-2">
        <strong>{result.reportPurpose === "Interim" ? "Interim working copy" : "Quarterly return"} · {result.institutionName} · {result.asAt.slice(0, 10)}</strong>
        <div className="flex flex-wrap gap-6"><FieldLabel label={`Ledger difference: ${money(result.ledgerDifference)}`} help="All closing G/L balances should sum to zero within KSh 0.01. Capital Adequacy and SOFP source validations also apply. A report exceeding an investment limit can still be exported when its underlying data is valid."/><span>Capital Adequacy revision {result.form1Revision} · SOFP revision {result.form6Revision}</span></div>
        {reportNotes.length > 0 && <div className="flex items-center gap-1 text-gray-600"><span>Report notes</span><BatchFieldHelp label="Report notes"><span className="block">Figures come from saved account mappings. Review adjustments in Excel; downloaded-file changes do not update the system.</span><span className="block mt-2">Non-earning assets exclude land and buildings, which have a separate line. Confirm classifications using your bank, investment and fixed-asset records.</span><span className="block mt-2">The export corrects the template’s land/buildings ratio and excess formulas. Ratios with a zero or negative denominator show “n.a.”.</span></BatchFieldHelp></div>}
        {result.issues.map(issue => <p key={issue} role="alert" className="text-red-700">{issue}</p>)}{reportWarnings.map(warning => <p key={warning} className="text-amber-700">{warning}</p>)}
      </div>}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3"><div className="flex gap-2"><Button variant={view === "mappings" ? "default" : "outline"} onClick={() => chooseView("mappings")}>Account mappings</Button>{result && <><Button variant={view === "preview" ? "default" : "outline"} onClick={() => chooseView("preview")}>Preview</Button><Button variant={view === "unmapped" ? "default" : "outline"} onClick={() => chooseView("unmapped")}>Unmapped ({result.unmappedAccounts.length})</Button></>}</div>{view === "mappings" && <Button className={primary} disabled={busy || (!dirty && definition.revision > 0)} onClick={() => run(async () => { const saved = await request("/versions", { method: "POST", body: JSON.stringify(definition) }); setDefinition(saved); setDirty(false); setResult(null); setNotice("Form 5 mappings saved as a new revision."); })}>Save mappings</Button>}</div>
      {view === "mappings" && <div className="mb-3"><FieldLabel label="Map posting accounts to each report line" help="Map non-earning assets other than land/buildings to C11, qualifying non-government financial investments to C12, and land/buildings to C13. Include associated accumulated depreciation so property values are net. Government securities and member loans do not belong in financial investments. Split the SOFP property/equipment accounts between C11 and C13; classify other non-earning assets using supporting schedules. Starter mappings reuse SOFP other securities/company investments and investment property. Review them before saving." /></div>}
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
      if (Number(field(account, "accountType")) !== 1000) { setError("Select an asset posting account for Form 5."); setPicker(null); return; }
      const line = definition.lines.find(l => l.code === picker);
      updateAccounts(picker, [...line.accountIds, id], { ...line.accountNames, [id]: name }); setPicker(null); setError("");
    }} />}
  </main>;
}
