import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaRedo, FaStamp } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, getVerificationWorksheet, auditLoanCase, recalculateRepaymentSchedule } from "./lib/loanCaseApi";
import { LoanCaseStatus, LoanAuditOption } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";

function Metric({ label, value }) {
  return <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 font-bold text-gray-800">{Number(value || 0).toLocaleString()}</p></div>;
}

function Heading({ children }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</p>;
}

function Rows({ items = [], empty, render }) {
  return <div className="space-y-2">{items.length ? items.map((item, index) => <div key={item.Id || index} className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">{render(item)}</div>) : <p className="text-sm text-gray-400">{empty}</p>}</div>;
}

// Audit only takes { Option, AuditRemarks } but LoanAuditOption has 3
// members (Audit/Reject/Defer), not the 2 (Post/Reject) BatchAuditModal
// (Batch Procedures) is built for — a plain reuse would silently drop the
// Defer path, so this gets its own small 3-button panel instead, same
// shape as ApprovalScreen's rather than a cross-area component reuse.
function AuditDrawer({ loanCaseId, workflowItemId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [usedBiometrics, setUsedBiometrics] = useState(false);
  const [reference, setReference] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true);
    setUsedBiometrics(false);
    setRemarks("");
    setReference("");
    getVerificationWorksheet(loanCaseId)
      .then((d) => { setData(d); setActiveTab("overview"); })
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [loanCaseId]);

  if (!loanCaseId) return null;

  const recalculateSchedule = async () => {
    if (!workflowItemId) {
      Swal.fire("Assigned Task Required", "Open this case from Approval Requests before recalculating its repayment schedule.", "warning");
      return;
    }
    setRecalculating(true);
    try {
      const refreshed = await recalculateRepaymentSchedule(loanCaseId, workflowItemId);
      setData((previous) => ({
        ...previous,
        loanCase: refreshed.loanCase,
        repaymentSchedule: refreshed.repaymentSchedule || [],
      }));
      Swal.fire("Schedule Recalculated", "The repayment schedule and persisted loan-case totals were updated.", "success");
    } catch (err) {
      Swal.fire("Recalculation Failed", err.message, "error");
    } finally {
      setRecalculating(false);
    }
  };

  const submit = async (option) => {
    if (!remarks) {
      Swal.fire("Missing Fields", "Audit remarks are required.", "warning");
      return;
    }
    if (option === LoanAuditOption.Audit && !reference.trim()) {
      Swal.fire("Missing Fields", "Verification reference is required.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const refreshed = await auditLoanCase(loanCaseId, {
        WorkflowItemId: workflowItemId || undefined,
        UsedBiometrics: usedBiometrics,
        Option: option,
        AuditRemarks: remarks,
        Reference: reference,
      });
      const verified = option === LoanAuditOption.Audit && refreshed?.LoanRegistrationCreateStandingOrderOnLoanAudit;
      Swal.fire(
        "Success",
        verified
          ? "Loan case verified — loan/savings accounts and repayment standing order have been set up."
          : option === LoanAuditOption.Audit ? "Loan case verified." : option === LoanAuditOption.Reject ? "Loan case rejected." : "Loan case deferred.",
        "success"
      );
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[94vw] max-w-[1280px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Verify Loan Case</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : data ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-2">{[["overview", "Approved Case"], ["security", "Security"], ["accounts", "Loan Accounts"], ["history", "Customer History"], ["schedule", "Repayment Schedule"], ["decision", "Verification"]].map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${activeTab === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>)}</div>

              {activeTab === "overview" && <><LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} /><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Metric label="Amount applied" value={data.loanCase?.AmountApplied} /><Metric label="Appraised amount" value={data.loanCase?.AppraisedAmount} /><Metric label="Approved amount" value={data.loanCase?.ApprovedAmount} /><Metric label="Total payback" value={data.loanCase?.TotalPaybackAmount} /></div></>}
              {activeTab === "security" && <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} />}
              {activeTab === "accounts" && <Rows items={data.loanAccounts} empty="No existing loan accounts found." render={(item) => `${item.FullAccountNumber} · ${item.CustomerAccountTypeTargetProductDescription || "Loan"} · ${Number((item.BookBalance || 0) + (item.CarryForwardsBalance || 0)).toLocaleString()}`} />}
              {activeTab === "history" && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><section><Heading>Standing Orders</Heading><Rows items={data.standingOrders} empty="No standing orders found." render={(item) => `${item.Description || "Standing order"} · ${Number(item.Amount || 0).toLocaleString()}`} /></section><section><Heading>Posted Payouts</Heading><Rows items={data.payouts} empty="No posted payouts found." render={(item) => `${item.Reference || item.Description || "Payout"} · ${Number(item.Amount || item.Principal || 0).toLocaleString()}`} /></section><section className="md:col-span-2"><Heading>Applications in process</Heading><Rows items={data.applications} empty="No other applications in process." render={(item) => `${item.PaddedCaseNumber || "Loan case"} · ${item.LoanProductDescription || ""} · ${item.StatusDescription || ""}`} /></section></div>}
              {activeTab === "schedule" && <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-gray-700">Repayment Schedule</p><p className="text-xs text-gray-500">Total repayment: {Number(data.loanCase?.TotalPaybackAmount || 0).toLocaleString()}</p></div><Button type="button" onClick={recalculateSchedule} disabled={recalculating || !workflowItemId} title={!workflowItemId ? "Open the assigned verification task to recalculate" : undefined} className="bg-indigo-600 hover:bg-indigo-700"><FaRedo className={`mr-2 ${recalculating ? "animate-spin" : ""}`} />{recalculating ? "Recalculating..." : "Recalculate Schedule"}</Button></div><div className="overflow-x-auto rounded-lg border"><div className="grid min-w-[900px] grid-cols-7 gap-2 bg-gray-700 p-3 text-xs font-semibold text-gray-100"><span>Period</span><span>Due Date</span><span>Starting</span><span>Payment</span><span>Interest</span><span>Principal</span><span>Ending</span></div>{(data.repaymentSchedule || []).map((row) => <div key={row.Period} className="grid min-w-[900px] grid-cols-7 gap-2 border-t p-3 text-xs text-gray-700"><span>{row.Period}</span><span>{new Date(row.DueDate).toLocaleDateString()}</span><span>{Number(row.StartingBalance).toLocaleString()}</span><span>{Number(row.Payment).toLocaleString()}</span><span>{Number(row.InterestPayment).toLocaleString()}</span><span>{Number(row.PrincipalPayment).toLocaleString()}</span><span>{Number(row.EndingBalance).toLocaleString()}</span></div>)}</div></div>}

              {activeTab === "decision" && <div className="border-t pt-4 space-y-3">
                <div><Label className="text-sm font-semibold text-gray-700">Verification Reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Enter the verification reference" /></div>
                <Label className="text-sm font-semibold text-gray-700">Audit Remarks</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
              </div>}
              {workflowItemId && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={usedBiometrics} onChange={(e) => setUsedBiometrics(e.target.checked)} />
                  Verified with biometrics
                </label>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Not found.</p>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t flex gap-2">
          <Button disabled={submitting} onClick={() => submit(LoanAuditOption.Audit)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Working..." : "Verify"}
          </Button>
          <Button disabled={submitting} onClick={() => submit(LoanAuditOption.Defer)} variant="outline" className="flex-1">
            Defer
          </Button>
          <Button disabled={submitting} onClick={() => submit(LoanAuditOption.Reject)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
            Reject
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AuditScreen() {
  const [searchParams] = useSearchParams();
  const routedLoanCaseId = searchParams.get("loanCaseId");
  const routedWorkflowItemId = searchParams.get("workflowItemId");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(routedLoanCaseId);

  const fetchList = () => {
    setLoading(true);
    listLoanCases({ status: LoanCaseStatus.Approved, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaStamp /> Loan Case Audit / Verification
        </h2>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Case No</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Approved Amount</span>
          <span className="col-span-2">Product</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((loanCase) => (
              <button
                key={loanCase.Id}
                type="button"
                onClick={() => setSelectedId(loanCase.Id)}
                className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-2 font-medium text-indigo-700">{loanCase.PaddedCaseNumber}</span>
                  <span className="col-span-4 text-gray-700 truncate">{loanCase.CustomerFullName}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{loanCase.ApprovedAmount?.toLocaleString()}</span>
                  <span className="col-span-2 text-gray-700 truncate">{loanCase.LoanProductDescription}</span>
                  <span className="col-span-2"><LoanCaseStatusBadge status={loanCase.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No loan cases waiting for verification.</p>
          </div>
        )}
      </div>

      <AuditDrawer
        loanCaseId={selectedId}
        workflowItemId={selectedId === routedLoanCaseId ? routedWorkflowItemId : null}
        onClose={() => setSelectedId(null)}
        onChanged={fetchList}
      />
    </div>
  );
}
