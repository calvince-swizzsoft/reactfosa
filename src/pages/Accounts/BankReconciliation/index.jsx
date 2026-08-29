import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaBalanceScale, FaPlus, FaTrash } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listAllBankLinkages } from "../BankLinkages/api";
import { listAllChartOfAccounts } from "../ChartOfAccounts/api";
import { POSTING_PERIODS_BASE } from "../PostingPeriods/api";
import { apiJson, normalizeList } from "@/lib/api";
import { addEntry, closePeriod, createPeriod, listAllPeriods, listEntries, listPeriods, removeEntry } from "./api";

const STATUS = { 1: "Open", 2: "Closed", 4: "Suspended" };
const ADJUSTMENTS = [
  { value: 0, label: "Bank Account Debit" },
  { value: 1, label: "Bank Account Credit" },
  { value: 2, label: "G/L Account Debit" },
  { value: 3, label: "G/L Account Credit" },
];
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pageItems = (page) => page?.PageCollection ?? page?.pageCollection ?? [];
const field = (label, child) => <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{child}</div>;

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
  const selected = periods.find((p) => p.Id === selectedId);

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
    if (!selectedId || mode === "periods") { setEntries([]); return; }
    listEntries(selectedId).then((p) => setEntries(pageItems(p))).catch((e) => Swal.fire("Error", e.message, "error"));
  }, [selectedId, mode]);

  const selectedBank = bankLinkages.find((b) => b.Id === form.BankLinkageId);
  const totals = useMemo(() => entries.reduce((a, e) => {
    const value = Number(e.Value || 0);
    if (e.AdjustmentType === 0) a.bank += value;
    if (e.AdjustmentType === 1) a.bank -= value;
    if (e.AdjustmentType === 2) a.gl += value;
    if (e.AdjustmentType === 3) a.gl -= value;
    return a;
  }, { bank: 0, gl: 0 }), [entries]);
  const unreconciled = selected ? Number(selected.BankAccountBalance || 0) + totals.bank - Number(selected.GeneralLedgerAccountBalance || 0) - totals.gl : 0;

  const savePeriod = async (event) => {
    event.preventDefault();
    if (!selectedBank) return;
    setLoading(true);
    try {
      await createPeriod({
        ...form,
        BranchId: selectedBank.BranchId,
        ChartOfAccountId: selectedBank.ChartOfAccountId,
        BankAccountNumber: selectedBank.BankAccountNumber,
        GeneralLedgerAccountBalance: selectedBank.BankLinkageBalance || 0,
      });
      setCreating(false); await loadPeriods(); Swal.fire("Success", "Bank reconciliation period created.", "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setLoading(false); }
  };

  const saveEntry = async (event) => {
    event.preventDefault();
    try { await addEntry(selectedId, { ...entry, Value: Number(entry.Value), ChartOfAccountId: entry.ChartOfAccountId || null }); setEntries(pageItems(await listEntries(selectedId))); Swal.fire("Success", "Adjustment added.", "success"); }
    catch (e) { Swal.fire("Error", e.message, "error"); }
  };

  const finish = async (authOption) => {
    if (authOption === 1 && Math.abs(unreconciled) > 0.005) { Swal.fire("Not Reconciled", `The unreconciled balance is ${money(unreconciled)}. Reconcile it to zero before posting.`, "warning"); return; }
    const confirm = await Swal.fire({ title: authOption === 1 ? "Post and close reconciliation?" : "Reject reconciliation?", icon: "warning", showCancelButton: true, confirmButtonColor: authOption === 1 ? "#4f46e5" : "#dc2626" });
    if (!confirm.isConfirmed) return;
    try { await closePeriod(selectedId, authOption, remarks); await loadPeriods(); setSelectedId(""); Swal.fire("Success", authOption === 1 ? "Reconciliation closed." : "Reconciliation rejected.", "success"); }
    catch (e) { Swal.fire("Error", e.message, "error"); }
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
      {field("Bank Account Balance", <Input required type="number" step="0.01" value={form.BankAccountBalance} onChange={(e) => setForm({ ...form, BankAccountBalance: e.target.value })} />)}
      {field("Start Date", <Input required type="date" value={form.DurationStartDate} onChange={(e) => setForm({ ...form, DurationStartDate: e.target.value })} />)}
      {field("End Date", <Input required type="date" value={form.DurationEndDate} onChange={(e) => setForm({ ...form, DurationEndDate: e.target.value })} />)}
      {field("Remarks", <Input value={form.Remarks} onChange={(e) => setForm({ ...form, Remarks: e.target.value })} />)}
      {selectedBank && <div className="md:col-span-3 text-sm text-gray-600">Branch: {selectedBank.BranchDescription || "—"} · G/L: {selectedBank.ChartOfAccountAccountName || selectedBank.ChartOfAccountName || "—"} · G/L balance: {money(selectedBank.BankLinkageBalance)}</div>}
      <Button disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">Create Period</Button>
    </form>}

    {mode !== "periods" && <div className="max-w-xl mb-4">{field("Reconciliation Period", <select className="w-full border rounded-md p-2" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Select...</option>{periods.filter((p) => mode === "catalogue" || p.Status === 1).map((p) => <option key={p.Id} value={p.Id}>{p.BankLinkageBankName} · {p.Remarks || String(p.DurationEndDate).slice(0, 10)} ({p.StatusDescription || STATUS[p.Status]})</option>)}</select>)}</div>}
    {mode !== "periods" && <PeriodSummary period={selected} />}

    {mode === "processing" && selected && <form onSubmit={saveEntry} className="grid grid-cols-1 md:grid-cols-4 gap-3 my-5 rounded-lg border p-4">
      {field("Adjustment Type", <select className="w-full border rounded-md p-2" value={entry.AdjustmentType} onChange={(e) => setEntry({ ...entry, AdjustmentType: Number(e.target.value) })}>{ADJUSTMENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>)}
      {field("Contra G/L Account", <select className="w-full border rounded-md p-2" value={entry.ChartOfAccountId} onChange={(e) => setEntry({ ...entry, ChartOfAccountId: e.target.value })}><option value="">None</option>{chartOfAccounts.map((a) => <option key={a.Id} value={a.Id}>{a.AccountCode} — {a.AccountName}</option>)}</select>)}
      {field("Value", <Input required type="number" min="0.01" step="0.01" value={entry.Value} onChange={(e) => setEntry({ ...entry, Value: e.target.value })} />)}
      {field("Remarks", <Input value={entry.Remarks} onChange={(e) => setEntry({ ...entry, Remarks: e.target.value })} />)}
      {field("Cheque Number", <Input value={entry.ChequeNumber} onChange={(e) => setEntry({ ...entry, ChequeNumber: e.target.value })} />)}
      {field("Cheque Drawee", <Input value={entry.ChequeDrawee} onChange={(e) => setEntry({ ...entry, ChequeDrawee: e.target.value })} />)}
      {field("Cheque Date", <Input type="date" value={entry.ChequeDate} onChange={(e) => setEntry({ ...entry, ChequeDate: e.target.value })} />)}
      <Button className="self-end bg-indigo-600 hover:bg-indigo-700">Add Adjustment</Button>
    </form>}

    {selected && mode !== "periods" && <div className="mt-5 bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Adjustment</span><span className="col-span-3">G/L Account</span><span className="col-span-2">Cheque</span><span className="col-span-2 text-right">Value</span><span className="col-span-2">Remarks</span></div>
      {entries.map((e) => <div key={e.Id} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border p-3 mb-2 text-sm"><span className="col-span-3">{e.AdjustmentTypeDescription || ADJUSTMENTS.find((a) => a.value === e.AdjustmentType)?.label}</span><span className="col-span-3">{e.ChartOfAccountName || "—"}</span><span className="col-span-2">{e.ChequeNumber || "—"}</span><span className="col-span-2 text-right">{money(e.Value)}</span><span className="col-span-1 truncate">{e.Remarks || "—"}</span>{mode === "processing" && <button type="button" className="col-span-1 text-red-600" onClick={async () => { await removeEntry(selectedId, e.Id); setEntries(pageItems(await listEntries(selectedId))); }}><FaTrash /></button>}</div>)}
      {!entries.length && <div className="text-center text-gray-400"><img src={NotFoundImage} className="mx-auto w-32" alt="No entries" />No reconciliation entries.</div>}
      <div className="mt-4 text-right font-semibold">Unreconciled balance: <span className={Math.abs(unreconciled) < 0.005 ? "text-green-600" : "text-red-600"}>{money(unreconciled)}</span></div>
    </div>}

    {mode === "closing" && selected && <div className="mt-5 flex flex-wrap items-end gap-3">{field("Authorization / rejection remarks", <Input className="w-96" value={remarks} onChange={(e) => setRemarks(e.target.value)} />)}<Button onClick={() => finish(1)} className="bg-indigo-600 hover:bg-indigo-700">Post & Close</Button><Button onClick={() => finish(2)} className="bg-red-600 hover:bg-red-700">Reject</Button></div>}

    {mode === "periods" && <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Bank</span><span className="col-span-2">Posting Period</span><span className="col-span-2">End Date</span><span className="col-span-2 text-right">Bank Balance</span><span className="col-span-2 text-right">G/L Balance</span><span className="col-span-1">Status</span></div>{periods.map((p) => <div key={p.Id} className="grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg border p-3 mb-2 text-sm"><span className="col-span-3">{p.BankLinkageBankName}</span><span className="col-span-2">{p.PostingPeriodDescription}</span><span className="col-span-2">{String(p.DurationEndDate).slice(0, 10)}</span><span className="col-span-2 text-right">{money(p.BankAccountBalance)}</span><span className="col-span-2 text-right">{money(p.GeneralLedgerAccountBalance)}</span><span className="col-span-1">{p.StatusDescription || STATUS[p.Status]}</span></div>)}{!loading && !periods.length && <p className="text-center text-gray-400">No reconciliation periods.</p>}</div>}
  </div>;
}
