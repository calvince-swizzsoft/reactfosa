import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaCoins, FaPlus, FaTrash } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { apiJson, normalizeList } from "@/lib/api";
import { POSTING_PERIODS_BASE } from "../PostingPeriods/api";
import { listAllChartOfAccounts } from "../ChartOfAccounts/api";
import { listAllLoanProducts } from "../LoanProducts/api";
import { createBudget, getBudgetEntries, listAllBudgets, listBudgets, updateBudget } from "./api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const money = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pageItems = (p) => p?.PageCollection ?? p?.pageCollection ?? [];
const emptyBudget = { Id: "", Description: "", TotalValue: "", PostingPeriodId: "", BranchId: "" };
const emptyEntry = { Type: 0, ChartOfAccountId: "", LoanProductId: "", Amount: "", Reference: "" };
const field = (label, child) => <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{child}</div>;

export default function BudgetManagement({ mode = "periods" }) {
  const [budgets, setBudgets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [entries, setEntries] = useState([]);
  const [budget, setBudget] = useState(emptyBudget);
  const [draft, setDraft] = useState(emptyEntry);
  const [postingPeriods, setPostingPeriods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBudgets = async () => {
    const data = mode === "periods" ? pageItems(await listBudgets()) : await listAllBudgets();
    setBudgets(data || []);
  };
  useEffect(() => { loadBudgets().catch((e) => Swal.fire("Error", e.message, "error")); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode !== "appropriation") return;
    Promise.all([
      apiJson(POSTING_PERIODS_BASE).then((b) => normalizeList(b?.data ?? b)),
      apiJson(`${FIN_BASE}/api/administration/branches/all`).then((b) => normalizeList(b?.data ?? b)),
      listAllChartOfAccounts(), listAllLoanProducts(),
    ]).then(([p, b, a, l]) => { setPostingPeriods(p); setBranches(b); setAccounts(a); setLoanProducts(l); })
      .catch((e) => Swal.fire("Lookup Error", e.message, "error"));
  }, [mode]);
  useEffect(() => {
    if (!selectedId) { setBudget(emptyBudget); setEntries([]); return; }
    const selected = budgets.find((b) => b.Id === selectedId);
    setBudget(selected || emptyBudget);
    getBudgetEntries(selectedId, true).then(setEntries).catch((e) => Swal.fire("Error", e.message, "error"));
  }, [selectedId, budgets]);

  const apportioned = useMemo(() => entries.reduce((sum, e) => sum + Number(e.Amount || 0), 0), [entries]);
  const shortage = Number(budget.TotalValue || 0) - apportioned;
  const addDraft = () => {
    if (!(Number(draft.Amount) > 0) || (draft.Type === 0 ? !draft.ChartOfAccountId : !draft.LoanProductId)) {
      Swal.fire("Missing Fields", "Select the entry target and enter an amount greater than zero.", "warning"); return;
    }
    setEntries((current) => [...current, { ...draft, Amount: Number(draft.Amount) }]);
    setDraft(emptyEntry);
  };
  const save = async () => {
    if (!budget.Description || !budget.PostingPeriodId || !budget.BranchId || !(Number(budget.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "Complete the budget header.", "warning"); return;
    }
    if (!entries.length || Math.abs(shortage) > 0.005) {
      Swal.fire("Budget Not Balanced", `Appropriation entries must equal the total value. Remaining: ${money(shortage)}.`, "warning"); return;
    }
    setLoading(true);
    try {
      const payload = { ...budget, TotalValue: Number(budget.TotalValue), BranchId: budget.BranchId || null };
      if (budget.Id) await updateBudget(budget.Id, payload, entries); else await createBudget(payload, entries);
      await loadBudgets(); setSelectedId(""); setBudget(emptyBudget); setEntries([]);
      Swal.fire("Success", `Budget ${budget.Id ? "updated" : "created"} successfully.`, "success");
    } catch (e) { Swal.fire("Error", e.message, "error"); }
    finally { setLoading(false); }
  };

  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FaCoins /> {mode === "periods" ? "Budget Periods" : "Budget Appropriation"}</h2></div>
    {mode === "periods" ? <div className="bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Name</span><span className="col-span-3">Posting Period</span><span className="col-span-3">Branch</span><span className="col-span-3 text-right">Total Value</span></div>
      {budgets.map((b) => <button type="button" key={b.Id} onClick={() => { setSelectedId(b.Id); }} className="w-full grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg hover:shadow-xl border p-3 mb-2 text-sm text-left"><span className="col-span-3 font-medium text-indigo-700">{b.Description}</span><span className="col-span-3">{b.PostingPeriodDescription}</span><span className="col-span-3">{b.BranchDescription}</span><span className="col-span-3 text-right">{money(b.TotalValue)}</span></button>)}
      {!budgets.length && <div className="text-center text-gray-400"><img src={NotFoundImage} alt="No budgets" className="mx-auto w-32" />No budgets found.</div>}
      {selectedId && <div className="mt-4 rounded-lg bg-white p-4"><h3 className="font-semibold mb-2">Budget Entries</h3>{entries.map((e) => <div key={e.Id} className="grid grid-cols-5 gap-3 border-b py-2 text-sm"><span>{e.TypeDescription}</span><span className="col-span-2">{e.ChartOfAccountName || e.LoanProductDescription}</span><span className="text-right">{money(e.Amount)}</span><span className="text-right text-gray-500">Balance {money(e.BudgetBalance)}</span></div>)}</div>}
    </div> : <>
      <div className="max-w-xl mb-4">{field("Existing Budget (leave blank to create)", <select className="w-full border rounded-md p-2" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">New budget...</option>{budgets.map((b) => <option key={b.Id} value={b.Id}>{b.Description} — {b.BranchDescription}</option>)}</select>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-lg bg-gray-100 p-4 mb-5">
        {field("Name", <Input value={budget.Description || ""} onChange={(e) => setBudget({ ...budget, Description: e.target.value })} />)}
        {field("Total Value", <Input type="number" min="0.01" step="0.01" value={budget.TotalValue || ""} onChange={(e) => setBudget({ ...budget, TotalValue: e.target.value })} />)}
        {field("Posting Period", <select className="w-full border rounded-md p-2" value={budget.PostingPeriodId || ""} onChange={(e) => setBudget({ ...budget, PostingPeriodId: e.target.value })}><option value="">Select...</option>{postingPeriods.map((p) => <option key={p.Id} value={p.Id}>{p.Description}</option>)}</select>)}
        {field("Branch", <select className="w-full border rounded-md p-2" value={budget.BranchId || ""} onChange={(e) => setBudget({ ...budget, BranchId: e.target.value })}><option value="">Select...</option>{branches.map((b) => <option key={b.Id} value={b.Id}>{b.Description}</option>)}</select>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 border rounded-lg p-4 mb-4">
        {field("Entry Type", <select className="w-full border rounded-md p-2" value={draft.Type} onChange={(e) => setDraft({ ...draft, Type: Number(e.target.value), ChartOfAccountId: "", LoanProductId: "" })}><option value={0}>Income / Expense</option><option value={1}>Loan Product</option></select>)}
        {draft.Type === 0 ? field("G/L Account", <select className="w-full border rounded-md p-2" value={draft.ChartOfAccountId} onChange={(e) => setDraft({ ...draft, ChartOfAccountId: e.target.value })}><option value="">Select...</option>{accounts.map((a) => <option key={a.Id} value={a.Id}>{a.AccountCode} — {a.AccountName}</option>)}</select>) : field("Loan Product", <select className="w-full border rounded-md p-2" value={draft.LoanProductId} onChange={(e) => setDraft({ ...draft, LoanProductId: e.target.value })}><option value="">Select...</option>{loanProducts.map((p) => <option key={p.Id} value={p.Id}>{p.Description}</option>)}</select>)}
        {field("Amount", <Input type="number" min="0.01" step="0.01" value={draft.Amount} onChange={(e) => setDraft({ ...draft, Amount: e.target.value })} />)}
        {field("Reference", <Input value={draft.Reference} onChange={(e) => setDraft({ ...draft, Reference: e.target.value })} />)}
        <Button type="button" onClick={addDraft} className="self-end bg-indigo-600 hover:bg-indigo-700"><FaPlus className="mr-2" /> Add</Button>
      </div>
      <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Type</span><span className="col-span-4">Account / Product</span><span className="col-span-2">Reference</span><span className="col-span-2 text-right">Amount</span><span className="col-span-1"></span></div>{entries.map((e, i) => <div key={e.Id || i} className="grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg border p-3 mb-2 text-sm"><span className="col-span-3">{e.TypeDescription || (e.Type === 0 ? "Income / Expense" : "Loan Product")}</span><span className="col-span-4">{e.ChartOfAccountName || e.LoanProductDescription || accounts.find((a) => a.Id === e.ChartOfAccountId)?.AccountName || loanProducts.find((p) => p.Id === e.LoanProductId)?.Description}</span><span className="col-span-2">{e.Reference}</span><span className="col-span-2 text-right">{money(e.Amount)}</span><button type="button" className="col-span-1 text-red-600" onClick={() => setEntries((all) => all.filter((_, x) => x !== i))}><FaTrash /></button></div>)}<div className="text-right font-semibold mt-3">Appropriated: {money(apportioned)} · Remaining: <span className={Math.abs(shortage) < 0.005 ? "text-green-600" : "text-red-600"}>{money(shortage)}</span></div></div>
      <Button disabled={loading} onClick={save} className="mt-4 bg-indigo-600 hover:bg-indigo-700">{budget.Id ? "Update Budget" : "Create Budget"}</Button>
    </>}
  </div>;
}
