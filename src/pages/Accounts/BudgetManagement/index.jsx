import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FieldLabel, { BatchFieldHelp } from "../BatchProcedures/lib/BatchFieldLabel";
import { Link } from "react-router-dom";
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
const HELP = {
  "Existing Budget (leave blank to create)": "Leave New budget selected to originate a budget. Choose an existing budget to change its allocations. One budget is allowed per branch and posting period.",
  Name: "A meaningful name, such as Main Branch 2026 Budget. Maximum 256 characters.",
  "Total Value": "The total amount to allocate across all lines. Allocations must equal this total before saving. This does not move money or post journals.",
  "Posting Period": "The accounting period this budget applies to. Actual G/L activity is compared within this posting period.",
  Branch: "The branch whose accounts or loan disbursements this budget covers. Each branch can have one budget per posting period.",
  "Entry Type": "Income / Expense allocates a target or allowance to a G/L posting account. Loan Product allocates an amount for loan disbursements.",
  "G/L Account": "Choose an income or expense posting account. Parent accounts and balance-sheet accounts cannot be used for this allocation type.",
  "Loan Product": "Choose the loan product whose disbursements this allocation covers.",
  Amount: "A positive allocation with at most two decimal places. Click Add to include it in the budget before saving.",
  Reference: "An optional note describing this allocation, up to 256 characters.",
};
const field = (label, child) => <div><FieldLabel label={label} help={HELP[label]} />{child}</div>;
const cents = (value) => Math.round(Number(value || 0) * 100);
const validAmount = (value) => /^\d+(?:\.\d{1,2})?$/.test(String(value)) && Number(value) > 0 && Number(value) <= 9999999999999.99;
const errorMessage = (error) => {
  const message = error?.message || "The request could not be completed. Please try again.";
  const fields = Object.entries(error?.validationErrors || {}).flatMap(([field, messages]) =>
    (Array.isArray(messages) ? messages : [messages]).filter((m) => m && m !== message).map((m) => `${field}: ${m}`));
  return [message, ...fields, error?.correlationId ? `Support reference: ${error.correlationId}` : ""].filter(Boolean).join("\n");
};

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
  const [listLoading, setListLoading] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [entriesError, setEntriesError] = useState("");
  const [balancesError, setBalancesError] = useState("");
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    setListLoading(true); setListError("");
    const request = mode === "periods" ? listBudgets({ pageIndex: page, pageSize: 20 }) : listAllBudgets();
    request.then((data) => { if (active) { setBudgets(mode === "periods" ? pageItems(data) : data || []); setCount(Number(data?.ItemsCount ?? data?.itemsCount ?? 0)); } })
      .catch((e) => { if (active) setListError(errorMessage(e)); })
      .finally(() => { if (active) setListLoading(false); });
    return () => { active = false; };
  }, [mode, page, retry]);
  useEffect(() => {
    if (mode !== "appropriation") return;
    let active = true; setLookupsLoading(true); setLookupError("");
    Promise.all([
      apiJson(POSTING_PERIODS_BASE).then((b) => normalizeList(b?.data ?? b)),
      apiJson(`${FIN_BASE}/api/administration/branches/all`).then((b) => normalizeList(b?.data ?? b)),
      listAllChartOfAccounts(), listAllLoanProducts(),
    ]).then(([p, b, a, l]) => { if (active) { setPostingPeriods(p); setBranches(b); setAccounts(a); setLoanProducts(l); } })
      .catch((e) => { if (active) setLookupError(errorMessage(e)); })
      .finally(() => { if (active) setLookupsLoading(false); });
    return () => { active = false; };
  }, [mode, retry]);
  useEffect(() => {
    let active = true;
    setEntries([]); setEntriesError(""); setBalancesError(""); setError(""); setDraft(emptyEntry);
    if (!selectedId) { setBudget(emptyBudget); setEntriesLoading(false); return; }
    setBudget(budgets.find((b) => b.Id === selectedId) || emptyBudget);
    setEntriesLoading(true);
    // Allocation editing is independent of actual-balance reporting.
    getBudgetEntries(selectedId, false).then(async (data) => {
      if (!active) return;
      setEntries(data || []);
      if (mode === "periods") {
        try { const actuals = await getBudgetEntries(selectedId, true); if (active) setEntries(actuals || []); }
        catch (e) { if (active) setBalancesError(errorMessage(e)); }
      }
    }).catch((e) => { if (active) setEntriesError(errorMessage(e)); })
      .finally(() => { if (active) setEntriesLoading(false); });
    return () => { active = false; };
  }, [selectedId, budgets, mode, retry]);

  const apportioned = useMemo(() => entries.reduce((sum, e) => sum + cents(e.Amount), 0) / 100, [entries]);
  const shortage = (cents(budget.TotalValue) - cents(apportioned)) / 100;
  const addDraft = () => {
    setError("");
    if (!validAmount(draft.Amount)) { setError("Enter an allocation amount greater than zero with at most two decimal places (maximum 9,999,999,999,999.99)."); return; }
    if (draft.Type === 0 ? !draft.ChartOfAccountId : !draft.LoanProductId) { setError(draft.Type === 0 ? "Select a G/L account for this allocation." : "Select a loan product for this allocation."); return; }
    setEntries((current) => [...current, { ...draft, Amount: Number(draft.Amount), ChartOfAccountId: draft.Type === 0 ? draft.ChartOfAccountId : null, LoanProductId: draft.Type === 1 ? draft.LoanProductId : null }]);
    setDraft(emptyEntry);
  };
  const save = async () => {
    if (loading || entriesLoading || lookupsLoading || listLoading || entriesError || lookupError || listError) return;
    setError("");
    if (!budget.Description?.trim()) { setError("Enter a budget name."); return; }
    if (!budget.PostingPeriodId || !budget.BranchId) { setError("Select both a posting period and a branch."); return; }
    if (!validAmount(budget.TotalValue)) { setError("Enter a positive total with at most two decimal places (maximum 9,999,999,999,999.99)."); return; }
    if (draft.Amount || draft.ChartOfAccountId || draft.LoanProductId || draft.Reference) { setError("There is an unfinished allocation. Click Add, or Clear line, before saving."); return; }
    if (!entries.length || shortage !== 0) { setError(!entries.length ? "Add at least one allocation." : shortage > 0 ? `Allocate another ${money(shortage)} before saving.` : `Reduce allocations by ${money(-shortage)} before saving.`); return; }
    setLoading(true);
    try {
      const payload = { Description: budget.Description.trim(), TotalValue: Number(budget.TotalValue), BranchId: budget.BranchId, PostingPeriodId: budget.PostingPeriodId };
      const lines = entries.map((e) => ({ Type: Number(e.Type), ChartOfAccountId: Number(e.Type) === 0 ? e.ChartOfAccountId : null, LoanProductId: Number(e.Type) === 1 ? e.LoanProductId : null, Amount: Number(e.Amount), Reference: e.Reference || "" }));
      if (budget.Id) await updateBudget(budget.Id, payload, lines); else await createBudget(payload, lines);
      setSelectedId(""); setBudget(emptyBudget); setEntries([]); setDraft(emptyEntry); setRetry((r) => r + 1);
      Swal.fire("Success", "Budget and allocations saved successfully.", "success");
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  };


  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="mb-3 text-right"><Link className="text-indigo-700 underline font-semibold" to="/Accounts/BudgetManagement/Actuals">Budget vs Actual / Excel</Link></div>
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FaCoins /> {mode === "periods" ? "Budget Periods" : "Budget Appropriation"}</h2></div>
    <p className="text-sm text-gray-600 mb-4">{mode === "periods" ? "Browse saved budgets and review their allocations and remaining balances." : "Create a budget for a branch and posting period, then allocate its total across the lines below."} {mode === "periods" && <Link to="/Accounts/BudgetManagement/Appropriation" className="text-indigo-700 underline">Open Budget Appropriation</Link>}</p>
    {listError && <div role="alert" className="mb-3 text-red-700">{listError} <Button onClick={() => setRetry((r) => r + 1)}>Retry</Button></div>}
    {lookupError && <div role="alert" className="mb-3 text-red-700">{lookupError} <Button onClick={() => setRetry((r) => r + 1)}>Retry lookups</Button></div>}
    {entriesError && <div role="alert" className="mb-3 text-red-700">{entriesError} <Button onClick={() => setRetry((r) => r + 1)}>Retry entries</Button></div>}
    {(listLoading || lookupsLoading || entriesLoading) && <p role="status" className="text-gray-500 mb-3">Loading budget data...</p>}
    {balancesError && <div role="alert" className="mb-3 text-amber-800">{balancesError} <Button onClick={() => setRetry((r) => r + 1)}>Retry balances</Button></div>}
    {mode === "periods" ? <div className="bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Name</span><span className="col-span-3">Posting Period</span><span className="col-span-3">Branch</span><span className="col-span-3 text-right">Total Value</span></div>
      {budgets.map((b) => <button type="button" key={b.Id} onClick={() => { setSelectedId(b.Id); }} disabled={listLoading} className="w-full grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg hover:shadow-xl border p-3 mb-2 text-sm text-left"><span className="col-span-3 font-medium text-indigo-700">{b.Description}</span><span className="col-span-3">{b.PostingPeriodDescription}</span><span className="col-span-3">{b.BranchDescription}</span><span className="col-span-3 text-right">{money(b.TotalValue)}</span></button>)}
      {!listLoading && !listError && !budgets.length && <div className="text-center text-gray-400"><img src={NotFoundImage} alt="No budgets" className="mx-auto w-32" />No budgets found.</div>}
      <div className="flex justify-center items-center gap-3 mt-4"><Button disabled={listLoading || page === 0} onClick={() => { setSelectedId(""); setPage((p) => p - 1); }}>Prev</Button><span>Page {page + 1} of {Math.max(1, Math.ceil(count / 20))}</span><Button disabled={listLoading || (page + 1) * 20 >= count} onClick={() => { setSelectedId(""); setPage((p) => p + 1); }}>Next</Button></div>
      {selectedId && !entriesError && <div className="mt-4 rounded-lg bg-white p-4"><h3 className="font-semibold mb-2">Budget Entries</h3>{entries.map((e) => <div key={e.Id} className="grid grid-cols-5 gap-3 border-b py-2 text-sm"><span>{e.TypeDescription}</span><span className="col-span-2">{e.ChartOfAccountName || e.LoanProductDescription}</span><span className="text-right">{money(e.Amount)}</span><span className="text-right text-gray-500">Balance {balancesError || entriesLoading ? "Unavailable" : money(e.BudgetBalance)}</span></div>)}</div>}
    </div> : <fieldset disabled={loading || entriesLoading || lookupsLoading || listLoading} className="min-w-0">
      <div className="max-w-xl mb-4">{field("Existing Budget (leave blank to create)", <select className="w-full border rounded-md p-2" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">New budget...</option>{budgets.map((b) => <option key={b.Id} value={b.Id}>{b.Description} — {b.BranchDescription}</option>)}</select>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-lg bg-gray-100 p-4 mb-5">
        {field("Name", <Input maxLength={256} value={budget.Description || ""} onChange={(e) => setBudget({ ...budget, Description: e.target.value })} />)}
        {field("Total Value", <Input type="number" min="0.01" step="0.01" value={budget.TotalValue || ""} onChange={(e) => setBudget({ ...budget, TotalValue: e.target.value })} />)}
        {field("Posting Period", <select className="w-full border rounded-md p-2" value={budget.PostingPeriodId || ""} onChange={(e) => setBudget({ ...budget, PostingPeriodId: e.target.value })}><option value="">Select...</option>{postingPeriods.map((p) => <option key={p.Id} value={p.Id}>{p.Description}</option>)}</select>)}
        {field("Branch", <select className="w-full border rounded-md p-2" value={budget.BranchId || ""} onChange={(e) => setBudget({ ...budget, BranchId: e.target.value })}><option value="">Select...</option>{branches.map((b) => <option key={b.Id} value={b.Id}>{b.Description}</option>)}</select>)}
      </div>
      <div className="bg-gray-700 text-white font-semibold px-4 py-2 rounded-t-lg">Allocation lines</div><div className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-gray-300 rounded-b-lg bg-gray-50 p-4 mb-4">
        {field("Entry Type", <select className="w-full border rounded-md p-2" value={draft.Type} onChange={(e) => setDraft({ ...draft, Type: Number(e.target.value), ChartOfAccountId: "", LoanProductId: "" })}><option value={0}>Income / Expense</option><option value={1}>Loan Product</option></select>)}
        {draft.Type === 0 ? field("G/L Account", <select className="w-full border rounded-md p-2" value={draft.ChartOfAccountId} onChange={(e) => setDraft({ ...draft, ChartOfAccountId: e.target.value })}><option value="">Select...</option>{accounts.filter((a) => [4000, 5000].includes(Number(a.AccountType)) && !accounts.some((child) => child.ParentId === a.Id)).map((a) => <option key={a.Id} value={a.Id}>{a.AccountCode} — {a.AccountName}</option>)}</select>) : field("Loan Product", <select className="w-full border rounded-md p-2" value={draft.LoanProductId} onChange={(e) => setDraft({ ...draft, LoanProductId: e.target.value })}><option value="">Select...</option>{loanProducts.map((p) => <option key={p.Id} value={p.Id}>{p.Description}</option>)}</select>)}
        {field("Amount", <Input type="number" min="0.01" step="0.01" value={draft.Amount} onChange={(e) => setDraft({ ...draft, Amount: e.target.value })} />)}
        {field("Reference", <Input maxLength={256} value={draft.Reference} onChange={(e) => setDraft({ ...draft, Reference: e.target.value })} />)}
        <div className="self-end flex gap-2"><Button type="button" onClick={addDraft} className="bg-indigo-600 hover:bg-indigo-700"><FaPlus className="mr-2" /> Add</Button><Button type="button" variant="outline" onClick={() => { setDraft(emptyEntry); setError(""); }}>Clear line</Button></div>
      </div>
      <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3"><span className="col-span-3">Type</span><span className="col-span-4">Account / Product</span><span className="col-span-2">Reference</span><span className="col-span-2 text-right">Amount</span><span className="col-span-1"></span></div>{entries.map((e, i) => <div key={e.Id || i} className="grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg border p-3 mb-2 text-sm"><span className="col-span-3">{e.TypeDescription || (e.Type === 0 ? "Income / Expense" : "Loan Product")}</span><span className="col-span-4">{e.ChartOfAccountName || e.LoanProductDescription || accounts.find((a) => a.Id === e.ChartOfAccountId)?.AccountName || loanProducts.find((p) => p.Id === e.LoanProductId)?.Description}</span><span className="col-span-2">{e.Reference}</span><span className="col-span-2 text-right">{money(e.Amount)}</span><button type="button" aria-label={`Remove allocation ${i + 1}`} className="col-span-1 text-red-600" onClick={() => setEntries((all) => all.filter((_, x) => x !== i))}><FaTrash /></button></div>)}<div className="text-right font-semibold mt-3">Allocated: {money(apportioned)} · Unallocated: <span className={Math.abs(shortage) < 0.005 ? "text-green-600" : "text-red-600"}>{money(shortage)}</span><BatchFieldHelp label="Unallocated amount">Budget total minus the allocation lines. Zero means fully allocated; a negative value means the lines exceed the total. This is not the remaining spending balance.</BatchFieldHelp></div></div>
      {error && <div role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Button disabled={loading || entriesLoading || lookupsLoading || listLoading || !!entriesError || !!lookupError || !!listError} onClick={save} className="mt-4 bg-indigo-600 hover:bg-indigo-700">{budget.Id ? "Update Budget" : "Create Budget"}</Button>
    </fieldset>}
  </div>;
}
