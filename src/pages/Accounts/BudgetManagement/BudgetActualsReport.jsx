import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaChartBar, FaFileExcel } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FieldLabel from "../BatchProcedures/lib/BatchFieldLabel";
import { listAllBudgets, getBudgetActuals } from "./api";

const day = (value) => String(value || "").slice(0, 10);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const money = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (v) => v == null ? "—" : `${(v * 100).toFixed(1)}%`;
const message = (e) => `${e.message || "Could not load the report."}${e.correlationId ? ` Support reference: ${e.correlationId}` : ""}`;

export default function BudgetActualsReport() {
  const [budgets, setBudgets] = useState([]);
  const [branch, setBranch] = useState("");
  const [period, setPeriod] = useState("");
  const [asAt, setAsAt] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLookupLoading(true); setLookupError("");
    listAllBudgets().then((data) => { if (active) setBudgets(data || []); })
      .catch((e) => { if (active) setLookupError(message(e)); })
      .finally(() => { if (active) setLookupLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const branches = useMemo(() => [...new Map(budgets.map((b) => [b.BranchId, b.BranchDescription])).entries()], [budgets]);
  const periods = useMemo(() => [...new Map(budgets.filter((b) => !branch || b.BranchId === branch).map((b) => [b.PostingPeriodId, b.PostingPeriodDescription])).entries()], [budgets, branch]);
  const budget = budgets.find((b) => b.BranchId === branch && b.PostingPeriodId === period);
  const start = day(budget?.PostingPeriodDurationStartDate), end = day(budget?.PostingPeriodDurationEndDate);
  useEffect(() => {
    if (budget) setAsAt((current) => !current || current < start ? start : current > end ? end : current);
  }, [budget, start, end]);
  useEffect(() => {
    let active = true; setReport(null); setError(""); setExportError("");
    if (!budget || !asAt || asAt < start || asAt > end || lookupLoading || lookupError) { setLoading(false); return; }
    setLoading(true);
    getBudgetActuals(budget.Id, asAt).then((data) => { if (active) setReport(data); })
      .catch((e) => { if (active) setError(message(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [budget, asAt, start, end, retry, lookupLoading, lookupError]);
  const current = report?.Budget?.Id === budget?.Id && day(report?.AsAt) === asAt ? report : null;
  const exportExcel = async () => {
    if (!current || loading || exporting) return;
    setExporting(true); setExportError("");
    try { const { downloadBudgetActuals } = await import("./budgetActualsExcel"); downloadBudgetActuals(current); }
    catch (e) { setExportError(`Excel export failed. ${message(e)}`); }
    finally { setExporting(false); }
  };
  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaChartBar /> Budget vs Actual</h2>
      <Button disabled={!current || loading || lookupLoading || exporting} onClick={exportExcel} className="bg-indigo-600 hover:bg-indigo-700"><FaFileExcel className="mr-2" />{exporting ? "Exporting..." : "Export to Excel"}</Button>
    </div>
    <div className="flex justify-between my-4 text-sm text-gray-600"><span>Full-period budgets compared with actuals through the selected date.</span><Link className="text-indigo-700 underline" to="/Accounts/BudgetManagement/Periods">Budget Periods</Link></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-100 rounded-lg p-4 mb-4">
      <div><FieldLabel label="Branch" help="Branches with a saved budget are listed. Actuals are restricted to this branch." /><select aria-label="Branch" disabled={lookupLoading} className="w-full border rounded-md p-2" value={branch} onChange={(e) => { setReport(null); setBranch(e.target.value); setPeriod(""); }}><option value="">Select branch...</option>{branches.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
      <div><FieldLabel label="Posting period" help="The full allocation for this period is shown. Budgets are not prorated to the as-at date." /><select aria-label="Posting period" disabled={!branch || lookupLoading} className="w-full border rounded-md p-2" value={period} onChange={(e) => { setReport(null); setPeriod(e.target.value); }}><option value="">Select period...</option>{periods.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
      <div><FieldLabel label="As at" help="Includes the entire selected day. G/L actuals use journal value dates, falling back to creation dates. Loans use recorded disbursement dates. The date must be within the posting period." /><Input aria-label="As at" type="date" disabled={!budget} min={start || undefined} max={end || undefined} value={asAt} onChange={(e) => { setReport(null); setAsAt(e.target.value); }} /></div>
    </div>
    <Button variant="outline" disabled={loading || lookupLoading} onClick={() => { setReport(null); setRetry((r) => r + 1); }}>Refresh report</Button>
    {(loading || lookupLoading) && <p role="status" className="my-4 text-gray-500">Loading budget report...</p>}
    {(lookupError || error || exportError) && <p role="alert" className="my-4 text-red-700">{lookupError || error || exportError}</p>}
    {budget && (!asAt || asAt < start || asAt > end) && <p role="alert" className="my-4 text-red-700">Choose a date between {start} and {end}.</p>}
    {!lookupLoading && !lookupError && !budgets.length && <p className="my-6 text-gray-500">No budgets are available. <Link className="text-indigo-700 underline" to="/Accounts/BudgetManagement/Appropriation">Create a budget</Link>.</p>}
    {current && <>
      <p className="my-4 font-semibold text-gray-700">{current.Budget.Description} · {day(current.Budget.PostingPeriodDurationStartDate)} to {day(current.AsAt)}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <FieldLabel label="Difference" help="Budget minus actual. For income this is the target still to achieve. For expenses and loans this is the remaining allocation. Negative values mean actuals exceed the budget; income exceeding its target is not overspending." />
        <FieldLabel label="Used / achieved" help="Actual divided by budget. This is achievement for income and allocation usage for expenses or disbursements. A dash means the budget is zero." />
        <FieldLabel label="Unbudgeted activity" help="Accounts and loan products with actual activity but no allocation are included with a zero budget. Repeated allocations to one target are combined so its actuals are counted once." />
      </div>
      {current.Totals.map((total) => <section key={total.Section} className="mb-5 bg-gray-200 p-4 rounded-sm">
        <h3 className="font-semibold text-gray-800 mb-3">{total.Section}</h3>
        <div className="overflow-x-auto"><div className="min-w-[720px]">
          <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-2"><span className="col-span-4">Account / Product</span><span className="col-span-2 text-right">Budget</span><span className="col-span-2 text-right">Actual</span><span className="col-span-2 text-right">Difference</span><span className="col-span-2 text-right">Used / achieved</span></div>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">{current.Lines.filter((l) => l.Section === total.Section).map((line) => <div key={line.TargetId} className="grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg border p-3 text-sm hover:shadow-xl"><span className="col-span-4">{line.Code ? `${line.Code} — ` : ""}{line.Description}{line.Unbudgeted && <span className="ml-2 text-amber-700">Unbudgeted</span>}</span><span className="col-span-2 text-right">{money(line.Budget)}</span><span className="col-span-2 text-right">{money(line.Actual)}</span><span className="col-span-2 text-right">{money(line.Difference)}</span><span className="col-span-2 text-right">{percent(line.Percentage)}</span></div>)}</div>
          {!current.Lines.some((l) => l.Section === total.Section) && <p className="text-gray-500 text-center py-4">No allocations or activity in this section.</p>}
          <div className="grid grid-cols-12 gap-3 font-semibold bg-gray-100 rounded-lg p-3 mt-3 text-sm"><span className="col-span-4">Section total</span><span className="col-span-2 text-right">{money(total.Budget)}</span><span className="col-span-2 text-right">{money(total.Actual)}</span><span className="col-span-2 text-right">{money(total.Difference)}</span><span className="col-span-2 text-right">{percent(total.Percentage)}</span></div>
        </div></div>
      </section>)}
    </>}
  </div>;
}
