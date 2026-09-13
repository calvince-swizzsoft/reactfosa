import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FieldLabel from "../BatchProcedures/lib/BatchFieldLabel";
import Swal from "sweetalert2";
import { FaBalanceScale, FaPlus, FaTrash } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listAllBankLinkages } from "../BankLinkages/api";
import { listAllChartOfAccounts } from "../ChartOfAccounts/api";
import { POSTING_PERIODS_BASE } from "../PostingPeriods/api";
import { apiJson, normalizeList } from "@/lib/api";
import { addEntry, closePeriod, createPeriod, getBankBalance, getPeriod, listAllPeriods, listEntries, listPeriods, removeEntry } from "./api";
import { entryRequest } from "./entryRequest";

const STATUS = { 1: "Open", 2: "Closed", 4: "Suspended" };
const ADJUSTMENTS = [
  { value: 0, label: "Bank-side increase · no posting" },
  { value: 1, label: "Bank-side decrease · no posting" },
  { value: 2, label: "G/L debit · increase bank ledger" },
  { value: 3, label: "G/L credit · decrease bank ledger" },
];
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pageItems = (page) => page?.PageCollection ?? page?.pageCollection ?? [];
const field = (label, child, help) => <div>{help ? <FieldLabel label={label} help={help} /> : <Label className="text-sm font-semibold text-gray-700">{label}</Label>}{child}</div>;

function PeriodSummary({ period }) {
  if (!period) return null;
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-gray-100 p-4 text-sm">
    <div><span className="text-gray-400">Bank</span><p>{period.BankLinkageBankName || "—"}</p></div>
    <div><span className="text-gray-400">Bank branch</span><p>{period.BankLinkageBankBranchName || "—"}</p></div>
    <div><span className="text-gray-400">G/L account</span><p>{period.ChartOfAccountName || period.ChartOfAccountAccountName || "—"}</p></div>
    <div><span className="text-gray-400">Account number</span><p>{period.BankAccountNumber || period.BankLinkageBankAccountNumber || "—"}</p></div>
    <div><span className="text-gray-400">G/L balance</span><p>{money(period.GeneralLedgerAccountBalance)}</p></div>
    <div><span className="text-gray-400">Bank balance</span><p>{money(period.BankAccountBalance)}</p></div>
    <div><span className="text-gray-400">Date range</span><p>{String(period.DurationStartDate || "").slice(0, 10)} – {String(period.DurationEndDate || "").slice(0, 10)}</p></div>
    <div><span className="text-gray-400">Status</span><p>{period.StatusDescription || STATUS[period.Status] || "—"}</p></div>
  </div>;
}

export default function BankReconciliation({ mode = "periods" }) {
  const [periods, setPeriods] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [bankLinkages, setBankLinkages] = useState([]);
  const [postingPeriods, setPostingPeriods] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [entry, setEntry] = useState({ AdjustmentType: 0, ChartOfAccountId: "", Value: "", ChequeNumber: "", ChequeDrawee: "", ChequeDate: "", Remarks: "" });
  const [form, setForm] = useState({ PostingPeriodId: "", BankLinkageId: "", BankAccountBalance: "", DurationStartDate: "", DurationEndDate: "", Remarks: "" });
  const [summary, setSummary] = useState(null);
  const [entryPage, setEntryPage] = useState(0);
  const [entryCount, setEntryCount] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [acting, setActing] = useState(false);
  const [bankBalance, setBankBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const selected = summary?.Id === selectedId ? summary : null;

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const data = mode === "periods" ? pageItems(await listPeriods({ pageSize: 100 })) : await listAllPeriods();
      setPeriods(data || []);
      if (selectedId && !(data || []).some((p) => p.Id === selectedId)) setSelectedId("");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setLoading(false); }
  }, [mode, selectedId]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);
  useEffect(() => {
    if (mode !== "periods") return;
    Promise.all([listAllBankLinkages(), apiJson(POSTING_PERIODS_BASE).then((b) => normalizeList(b?.data ?? b))])
      .then(([banks, postings]) => { setBankLinkages(banks || []); setPostingPeriods(postings || []); })
      .catch(() => { setBankLinkages([]); setPostingPeriods([]); });
  }, [mode]);
  useEffect(() => {
    if (mode !== "processing") return;
    listAllChartOfAccounts().then(setChartOfAccounts).catch(() => setChartOfAccounts([]));
  }, [mode]);
  useEffect(() => {
    let active = true;
    setSummary(null); setEntries([]); setDetailsError("");
    if (!selectedId || mode === "periods") { setDetailsLoading(false); return; }
    setDetailsLoading(true);
    Promise.all([getPeriod(selectedId), listEntries(selectedId, { pageIndex: entryPage, pageSize: 20 })])
      .then(([period, page]) => { if (active) { setSummary(period); setEntries(pageItems(page)); setEntryCount(Number(page?.ItemsCount ?? page?.itemsCount ?? 0)); } })
      .catch((e) => { if (active) setDetailsError(e.message); })
      .finally(() => { if (active) setDetailsLoading(false); });
    return () => { active = false; };
  }, [selectedId, mode, entryPage, refresh]);
  useEffect(() => {
    let active = true; setBankBalance(null); setBalanceError("");
    if (!form.BankLinkageId || !form.DurationEndDate) { setBalanceLoading(false); return; }
    setBalanceLoading(true);
    getBankBalance(form.BankLinkageId, form.DurationEndDate)
      .then((balance) => { if (active) setBankBalance(Number(balance)); })
      .catch((e) => { if (active) setBalanceError(e.message); })
      .finally(() => { if (active) setBalanceLoading(false); });
    return () => { active = false; };
  }, [form.BankLinkageId, form.DurationEndDate, refresh]);

  const selectedBank = bankLinkages.find((b) => b.Id === form.BankLinkageId);
  const unreconciled = selected?.UnreconciledBalance == null ? null : Number(selected.UnreconciledBalance);
  const entryPages = Math.max(1, Math.ceil(entryCount / 20));

  const savePeriod = async (event) => {
    event.preventDefault();
    if (!selectedBank || bankBalance == null || balanceLoading) return;
    setLoading(true);
    try {
      await createPeriod({
        ...form,
        BranchId: selectedBank.BranchId,
        ChartOfAccountId: selectedBank.ChartOfAccountId,
        BankAccountNumber: selectedBank.BankAccountNumber,
        GeneralLedgerAccountBalance: bankBalance,
      });
      setCreating(false); await loadPeriods(); Swal.fire("Success", "Bank reconciliation period created.", "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setLoading(false); }
  };

  const saveEntry = async (event) => {
    event.preventDefault();
    if (acting || !selected || detailsLoading) return;
    setActing(true);
    try {
      await addEntry(selectedId, entryRequest(entry, selectedId));
      setEntry({ AdjustmentType: 0, ChartOfAccountId: "", Value: "", ChequeNumber: "", ChequeDrawee: "", ChequeDate: "", Remarks: "" });
      setRefresh((r) => r + 1);
      Swal.fire("Success", "Adjustment added.", "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setActing(false); }
  };

  const finish = async (authOption) => {
    if (acting || detailsLoading || !selected) return;
    if (authOption === 1 && (unreconciled == null || Math.abs(unreconciled) >= 0.005)) {
      Swal.fire("Not Reconciled", unreconciled == null ? "Refresh the period to retrieve its reconciliation totals." : `The unreconciled balance is ${money(unreconciled)}. Reconcile it to zero before posting.`, "warning"); return;
    }
    const confirm = await Swal.fire({ title: authOption === 1 ? "Post and close reconciliation?" : "Reject reconciliation?", icon: "warning", showCancelButton: true, confirmButtonColor: authOption === 1 ? "#4f46e5" : "#dc2626" });
    if (!confirm.isConfirmed) return;
    setActing(true);
    try { await closePeriod(selectedId, authOption, remarks); await loadPeriods(); setSelectedId(""); Swal.fire("Success", authOption === 1 ? "Reconciliation closed." : "Reconciliation rejected.", "success"); }
    catch (e) { setRefresh((r) => r + 1); Swal.fire("Error", e.message, "error"); }
    finally { setActing(false); }
  };

  const deleteEntry = async (id) => {
    if (acting || detailsLoading) return;
    setActing(true);
    try { await removeEntry(selectedId, id); if (entries.length === 1 && entryPage > 0) setEntryPage((p) => p - 1); else setRefresh((r) => r + 1); }
    catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setActing(false); }
  };

  const title = { periods: "Bank Reconciliation Periods", processing: "Bank Reconciliation Processing", closing: "Bank Reconciliation Closing", catalogue: "Bank Reconciliation Catalogue" }[mode];
  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaBalanceScale /> {title}</h2>
      {mode === "periods" && <Button onClick={() => setCreating((v) => !v)} className="bg-indigo-600 hover:bg-indigo-700"><FaPlus className="mr-2" /> Create</Button>}
    </div>

    {mode === "periods" && creating && <form onSubmit={savePeriod} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 rounded-lg bg-gray-100 p-4">
      {field("Posting Period", <select required className="w-full border rounded-md p-2" value={form.PostingPeriodId} onChange={(e) => setForm({ ...form, PostingPeriodId: e.target.value })}><option value="">Select...</option>{postingPeriods.map((p) => <option key={p.Id} value={p.Id}>{p.Description}</option>)}</select>)}
      {field("Bank", <select required className="w-full border rounded-md p-2" value={form.BankLinkageId} onChange={(e) => setForm({ ...form, BankLinkageId: e.target.value })}><option value="">Select...</option>{bankLinkages.map((b) => <option key={b.Id} value={b.Id}>{b.BankName} — {b.BankAccountNumber}</option>)}</select>)}
      {field("Start Date", <Input required type="date" value={form.DurationStartDate} onChange={(e) => setForm({ ...form, DurationStartDate: e.target.value })} />)}
      {field("End Date", <Input required type="date" value={form.DurationEndDate} onChange={(e) => setForm({ ...form, DurationEndDate: e.target.value })} />)}
      {field("Bank Account Balance (System G/L)", <Input readOnly aria-label="Bank Account Balance (System G/L)" aria-busy={balanceLoading} className="bg-gray-200 text-gray-700 font-semibold" value={bankBalance == null || balanceLoading ? "" : money(bankBalance)} placeholder={!form.BankLinkageId ? "Select a bank" : !form.DurationEndDate ? "Select an end date" : balanceLoading ? "Loading balance…" : balanceError ? "Balance unavailable" : "Loading balance…"} />, "Automatically populated from the selected bank's G/L account as at the end date. Select both a bank and an end date to load it. This system balance is read-only and refreshes when either selection changes.")}
      {field("Bank Statement Closing Balance", <Input required aria-label="Bank Statement Closing Balance" type="number" step="0.01" placeholder="Enter balance from bank statement" value={form.BankAccountBalance} onChange={(e) => setForm({ ...form, BankAccountBalance: e.target.value })} />, "Enter the closing balance shown on the bank statement for the selected end date. This is compared with the system G/L balance during reconciliation; it is not automatically copied from the system.")}
      <div className="md:col-span-3">{field("Remarks", <Input value={form.Remarks} onChange={(e) => setForm({ ...form, Remarks: e.target.value })} />)}</div>
      {selectedBank && <div className="md:col-span-3 text-sm text-gray-600">Branch: {selectedBank.BranchDescription || "—"} · G/L: {selectedBank.ChartOfAccountAccountName || selectedBank.ChartOfAccountName || "—"}</div>}
      {balanceError && <div role="alert" className="md:col-span-3 text-red-600">{balanceError} <Button type="button" onClick={() => setRefresh((r) => r + 1)}>Retry</Button></div>}
      <Button disabled={loading || balanceLoading || bankBalance == null} className="bg-indigo-600 hover:bg-indigo-700">Create Period</Button>
    </form>}

    {mode !== "periods" && <div className="max-w-xl mb-4">{field("Reconciliation Period", <select className="w-full border rounded-md p-2" value={selectedId} disabled={acting} onChange={(e) => { setSelectedId(e.target.value); setEntryPage(0); setRemarks(""); }}><option value="">Select...</option>{periods.filter((p) => mode === "catalogue" || p.Status === 1).map((p) => <option key={p.Id} value={p.Id}>{p.BankLinkageBankName} · {p.Remarks || String(p.DurationEndDate).slice(0, 10)} ({p.StatusDescription || STATUS[p.Status]})</option>)}</select>)}</div>}
    {mode !== "periods" && selectedId && <Button variant="outline" disabled={acting || detailsLoading} onClick={() => setRefresh((r) => r + 1)} className="mb-3">Refresh balances and entries</Button>}
    {detailsLoading && <p className="text-gray-500 mb-3">Loading period and adjustments…</p>}
    {detailsError && <p role="alert" className="text-red-600 mb-3">{detailsError}</p>}
    {mode !== "periods" && <PeriodSummary period={selected} />}

    {mode === "processing" && selected && <form onSubmit={saveEntry} className="grid grid-cols-1 md:grid-cols-4 gap-3 my-5 rounded-lg border p-4">
      {field("Adjustment Type", <select className="w-full border rounded-md p-2" value={entry.AdjustmentType} onChange={(e) => setEntry({ ...entry, AdjustmentType: Number(e.target.value), ChartOfAccountId: "" })}>{ADJUSTMENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>, "Bank-side adjustments explain timing differences and never post journals. G/L debit increases the bank ledger; G/L credit decreases it. G/L adjustments post against the selected contra account when the period closes.")}
      {field("Contra G/L Account", <select required={entry.AdjustmentType >= 2} disabled={entry.AdjustmentType < 2} className="w-full border rounded-md p-2" value={entry.ChartOfAccountId} onChange={(e) => setEntry({ ...entry, ChartOfAccountId: e.target.value })}><option value="">None</option>{chartOfAccounts.map((a) => <option key={a.Id} value={a.Id}>{a.AccountCode} — {a.AccountName}</option>)}</select>, "Required for G/L adjustments: choose the posting account for the opposite side of the bank entry. For example, bank charges credit the bank and debit an expense account. Choose a different account from the bank G/L. Bank-side timing differences do not need a contra account.")}
      {field("Value", <Input required type="number" min="0.01" step="0.01" value={entry.Value} onChange={(e) => setEntry({ ...entry, Value: e.target.value })} />, "Enter a positive amount. The adjustment type determines whether the bank or ledger balance increases or decreases; do not enter a negative amount.")}
      {field("Remarks", <Input value={entry.Remarks} onChange={(e) => setEntry({ ...entry, Remarks: e.target.value })} />, "Describe the reason for the adjustment and its supporting reference. For G/L adjustments, this description is used in the journal when the reconciliation is posted.")}
      {field("Cheque Number", <Input value={entry.ChequeNumber} onChange={(e) => setEntry({ ...entry, ChequeNumber: e.target.value })} />, "Optional: enter the cheque reference if this adjustment relates to a cheque. Leave blank for charges, interest or other non-cheque adjustments.")}
      {field("Cheque Drawee", <Input value={entry.ChequeDrawee} onChange={(e) => setEntry({ ...entry, ChequeDrawee: e.target.value })} />, "Optional: identify the bank or party on which the cheque is drawn. This is a supporting reference and does not select the contra G/L account.")}
      {field("Cheque Date", <Input type="date" value={entry.ChequeDate} onChange={(e) => setEntry({ ...entry, ChequeDate: e.target.value })} />, "Optional: enter the date on the cheque. This does not change the adjustment posting date; G/L adjustments use the reconciliation period end date when posted.")}
      <Button disabled={acting || detailsLoading} className="self-end bg-indigo-600 hover:bg-indigo-700">Add Adjustment</Button>
    </form>}

    {selected && mode !== "periods" && <div className="mt-5 bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Adjustment</span><span className="col-span-3">G/L Account</span><span className="col-span-2">Cheque</span><span className="col-span-2 text-right">Value</span><span className="col-span-2">Remarks</span></div>
      {entries.map((e) => <div key={e.Id} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border p-3 mb-2 text-sm"><span className="col-span-3">{ADJUSTMENTS.find((a) => a.value === e.AdjustmentType)?.label || e.AdjustmentTypeDescription}</span><span className="col-span-3">{e.AdjustmentType < 2 ? "Not required (no posting)" : e.ChartOfAccountId ? (e.ChartOfAccountName || chartOfAccounts.find(a => a.Id === e.ChartOfAccountId)?.AccountName || e.ChartOfAccountId) : <span className="text-red-600">Missing contra — remove and re-add</span>}</span><span className="col-span-2">{e.ChequeNumber || "—"}</span><span className="col-span-2 text-right">{money(e.Value)}</span><span className="col-span-1 truncate">{e.Remarks || "—"}</span>{mode === "processing" && <button type="button" className="col-span-1 text-red-600" aria-label="Remove adjustment" disabled={acting || detailsLoading} onClick={() => deleteEntry(e.Id)}><FaTrash /></button>}</div>)}
      {!entries.length && <div className="text-center text-gray-400"><img src={NotFoundImage} className="mx-auto w-32" alt="No entries" />No reconciliation entries.</div>}
      <p className="text-center text-sm text-gray-500 mt-4">Showing {entries.length} of {entryCount} adjustments</p>
      <div className="flex justify-center items-center gap-3 mt-2"><Button disabled={acting || detailsLoading || entryPage === 0} onClick={() => setEntryPage((p) => p - 1)}>Prev</Button><span>Page {entryPage + 1} of {entryPages}</span><Button disabled={acting || detailsLoading || entryPage + 1 >= entryPages} onClick={() => setEntryPage((p) => p + 1)}>Next</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 bg-white rounded-lg p-4">
        {field("Adjusted bank balance", <p>{money(selected.AdjustedBankBalance)}</p>, "Statement balance plus bank-side increases minus bank-side decreases. These reconciliation items do not post to the ledger.")}
        {field("Adjusted G/L balance", <p>{money(selected.AdjustedGeneralLedgerBalance)}</p>, "End-date ledger balance plus G/L debits minus G/L credits. For an open period, the ledger balance is refreshed from value-dated entries. G/L adjustments post on closing.")}
        {field("Unreconciled balance", <p className={unreconciled != null && Math.abs(unreconciled) < 0.005 ? "text-green-600" : "text-red-600"}>{unreconciled == null ? "Unavailable" : money(unreconciled)}</p>, "Adjusted bank balance minus adjusted G/L balance. Calculated by the server across all adjustments, including other pages. The backend rechecks it before closing.")}
      </div>
    </div>}

    {mode === "closing" && selected && <div className="mt-5 flex flex-wrap items-end gap-3">{field("Authorization / rejection remarks", <Input className="w-96" value={remarks} onChange={(e) => setRemarks(e.target.value)} />)}<Button disabled={acting || detailsLoading || unreconciled == null} onClick={() => finish(1)} className="bg-indigo-600 hover:bg-indigo-700">Post & Close</Button><Button disabled={acting || detailsLoading} onClick={() => finish(2)} className="bg-red-600 hover:bg-red-700">Reject</Button></div>}

    {mode === "periods" && <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Bank</span><span className="col-span-2">Posting Period</span><span className="col-span-2">End Date</span><span className="col-span-2 text-right">Bank Balance</span><span className="col-span-2 text-right">G/L Balance</span><span className="col-span-1">Status</span></div>{periods.map((p) => <div key={p.Id} className="grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg border p-3 mb-2 text-sm"><span className="col-span-3">{p.BankLinkageBankName}</span><span className="col-span-2">{p.PostingPeriodDescription}</span><span className="col-span-2">{String(p.DurationEndDate).slice(0, 10)}</span><span className="col-span-2 text-right">{money(p.BankAccountBalance)}</span><span className="col-span-2 text-right">{money(p.GeneralLedgerAccountBalance)}</span><span className="col-span-1">{p.StatusDescription || STATUS[p.Status]}</span></div>)}{!loading && !periods.length && <p className="text-center text-gray-400">No reconciliation periods.</p>}</div>}
  </div>;
}
