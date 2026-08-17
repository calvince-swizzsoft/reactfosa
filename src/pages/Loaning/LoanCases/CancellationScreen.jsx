import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaBan, FaSearch } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { cancelLoanCase, getCancellationWorksheet, listCancellationQueue } from "./lib/loanCaseApi";
import { LoanCancellationOption } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";

const tabs = [["application", "Application"], ["accounts", "Loan Accounts"], ["history", "Member History"], ["attached", "Attached Loans"], ["schedule", "Repayment Schedule"], ["decision", "Decision"]];
const money = (value) => Number(value || 0).toLocaleString();

function CardList({ items = [], empty, render }) {
  return items.length ? <div className="space-y-2">{items.map((item, i) => <div key={item.Id || i} className="grid grid-cols-3 gap-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">{render(item)}</div>)}</div> : <p className="text-sm text-gray-400">{empty}</p>;
}

function History({ title, items = [], value }) {
  return <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>{items.length ? <div className="space-y-2">{items.map((item, i) => <div key={item.Id || i} className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">{value(item)}</div>)}</div> : <p className="text-sm text-gray-400">None found.</p>}</div>;
}

function CancellationDrawer({ loanCaseId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("application");

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true); setActiveTab("application");
    getCancellationWorksheet(loanCaseId).then(setData).catch((e) => Swal.fire("Error", e.message, "error")).finally(() => setLoading(false));
  }, [loanCaseId]);

  const submit = async (option) => {
    const defer = option === LoanCancellationOption.Defer;
    const confirmation = await Swal.fire({ title: defer ? "Defer this loan?" : "Reject this loan permanently?", text: defer ? "The loan returns to appraisal, where it can be amended and appraised again." : "The application closes and its guarantors are released. A new application must be registered to proceed later.", icon: "warning", showCancelButton: true, confirmButtonColor: defer ? "#4f46e5" : "#dc2626", confirmButtonText: defer ? "Defer to Appraisal" : "Reject Loan" });
    if (!confirmation.isConfirmed) return;
    setSubmitting(true);
    try {
      await cancelLoanCase(loanCaseId, option);
      await Swal.fire("Success", defer ? "Loan deferred and routed back to appraisal." : "Loan rejected and guarantors released.", "success");
      onChanged(); onClose();
    } catch (e) { Swal.fire("Error", e.message, "error"); } finally { setSubmitting(false); }
  };

  if (!loanCaseId) return null;
  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: .4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed right-0 top-0 z-50 flex h-full w-[94vw] max-w-[1280px] flex-col bg-white shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3"><h2 className="font-bold text-white">Loan Cancellation Review</h2><Button variant="outline" size="sm" onClick={onClose}>Close</Button></div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {loading ? <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100" />)}</div> : data ? <>
          <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-2">{tabs.map(([key,label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${activeTab === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>)}</div>
          {activeTab === "application" && <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} />}
          {activeTab === "accounts" && <CardList items={data.loanAccounts} empty="No loan accounts found." render={(x) => <><span className="font-semibold text-indigo-700">{x.FullAccountNumber || x.AccountNumber}</span><span>{x.CustomerAccountTypeTargetProductDescription}</span><span className="text-right font-semibold">Balance {money(x.BookBalance)}</span></>} />}
          {activeTab === "history" && <div className="grid gap-4 lg:grid-cols-3"><History title="Standing Orders" items={data.standingOrders} value={(x) => x.Description || x.Reference || x.Id} /><History title="Posted Payouts" items={data.payouts} value={(x) => `${x.Reference || x.BatchNumber || "Payout"} · ${money(x.Amount)}`} /><History title="Applications in Process" items={data.applications} value={(x) => `${x.PaddedCaseNumber || x.CaseNumber} · ${x.StatusDescription || ""}`} /></div>}
          {activeTab === "attached" && <CardList items={data.attachedLoans} empty="No loans attached for clearance." render={(x) => <><span className="font-semibold text-indigo-700">{x.FullAccountNumber}</span><span>{x.CustomerAccountTypeTargetProductDescription}</span><span className="text-right">Principal {money(x.PrincipalBalance)} · Interest {money(x.InterestBalance)}</span></>} />}
          {activeTab === "schedule" && <div className="overflow-x-auto rounded-lg border"><div className="grid min-w-[900px] grid-cols-7 gap-2 bg-gray-700 p-3 text-xs font-semibold text-gray-100"><span>Period</span><span>Due Date</span><span>Starting</span><span>Payment</span><span>Interest</span><span>Principal</span><span>Ending</span></div>{(data.repaymentSchedule || []).map(x => <div key={x.Period} className="grid min-w-[900px] grid-cols-7 gap-2 border-t p-3 text-xs text-gray-700"><span>{x.Period}</span><span>{new Date(x.DueDate).toLocaleDateString()}</span><span>{money(x.StartingBalance)}</span><span>{money(x.Payment)}</span><span>{money(x.InterestPayment)}</span><span>{money(x.PrincipalPayment)}</span><span>{money(x.EndingBalance)}</span></div>)}</div>}
          {activeTab === "decision" && <div className="space-y-3"><div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Defer</strong> returns the application to appraisal for amendment. <strong>Reject</strong> is terminal and requires a fresh registration.</div><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Cancellation is allowed only before disbursement posting. The server blocks cancellation if a posted disbursement entry exists.</div></div>}
        </> : <p className="py-8 text-center text-sm text-gray-400">Loan case not found.</p>}
      </div>
      <div className="flex shrink-0 gap-2 border-t px-4 py-3"><Button disabled={submitting || loading} onClick={() => submit(LoanCancellationOption.Defer)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">{submitting ? "Working..." : "Defer to Appraisal"}</Button><Button disabled={submitting || loading} onClick={() => submit(LoanCancellationOption.Reject)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">Reject Permanently</Button></div>
    </motion.div>
  </AnimatePresence>;
}

export default function CancellationScreen() {
  const [filters, setFilters] = useState({ loanProductSection: 0, startDate: "", endDate: "", text: "" });
  const [query, setQuery] = useState(filters);
  const [pageIndex, setPageIndex] = useState(0);
  const [page, setPage] = useState({ PageCollection: [], ItemsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const pageSize = 20;
  const fetchList = () => { setLoading(true); listCancellationQueue({ ...query, pageIndex, pageSize }).then(x => setPage(x || {})).catch(e => { setPage({}); Swal.fire("Error", e.message, "error"); }).finally(() => setLoading(false)); };
  useEffect(fetchList, [query, pageIndex]);
  const items = page.PageCollection || page.pageCollection || [];
  const count = page.ItemsCount ?? page.itemsCount ?? 0;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const search = (e) => { e.preventDefault(); setPageIndex(0); setQuery(filters); };

  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaBan /> Loan Cancellation</h2></div>
    <form onSubmit={search} className="mb-4 grid gap-3 rounded-lg border bg-gray-50 p-4 md:grid-cols-5"><select className="h-10 rounded-md border bg-white px-3 text-sm" value={filters.loanProductSection} onChange={e => setFilters(p => ({...p, loanProductSection: Number(e.target.value)}))}><option value={0}>FOSA</option><option value={1}>BOSA</option></select><Input type="date" value={filters.startDate} onChange={e => setFilters(p => ({...p, startDate:e.target.value}))} /><Input type="date" value={filters.endDate} onChange={e => setFilters(p => ({...p, endDate:e.target.value}))} /><Input placeholder="Loan no, member no or name" value={filters.text} onChange={e => setFilters(p => ({...p, text:e.target.value}))} /><Button className="bg-indigo-600 hover:bg-indigo-700"><FaSearch className="mr-2" /> Search</Button></form>
    <div className="rounded-sm bg-gray-200 p-4"><div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 text-sm font-semibold text-gray-100"><span className="col-span-2">Loan No</span><span className="col-span-3">Customer</span><span className="col-span-2">Member No</span><span className="col-span-2">Amount</span><span className="col-span-2">Product</span><span className="col-span-1">Status</span></div>
      {loading ? <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100" />)}</div> : items.length ? <div className="space-y-2">{items.map(x => <button key={x.Id} type="button" onClick={() => setSelectedId(x.Id)} className="w-full rounded-lg border bg-white text-left shadow-lg transition-all hover:shadow-xl"><div className="grid grid-cols-12 items-center gap-2 px-6 py-3 text-sm"><span className="col-span-2 font-medium text-indigo-700">{x.PaddedCaseNumber || x.CaseNumber}</span><span className="col-span-3 truncate text-gray-700">{x.CustomerFullName}</span><span className="col-span-2 truncate text-gray-600">{x.CustomerReference2 || "—"}</span><span className="col-span-2 font-semibold">{money(x.ApprovedAmount || x.AmountApplied)}</span><span className="col-span-2 truncate">{x.LoanProductDescription}</span><span className="col-span-1"><LoanCaseStatusBadge status={x.Status} /></span></div></button>)}</div> : <div className="py-6 text-center"><img src={NotFoundImage} className="mx-auto w-42" alt="Not found" /><p className="font-medium text-gray-400">No audited, unposted loans match these filters.</p></div>}
    </div>
    <div className="mt-4 text-center text-sm text-gray-500">{count} loan{count === 1 ? "" : "s"}</div><div className="mt-2 flex justify-center gap-2"><Button disabled={pageIndex === 0} onClick={() => setPageIndex(x => x - 1)}>Prev</Button><Button disabled>Page {pageIndex + 1} of {pages}</Button><Button disabled={pageIndex + 1 >= pages} onClick={() => setPageIndex(x => x + 1)}>Next</Button></div>
    <CancellationDrawer loanCaseId={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchList} />
  </div>;
}
