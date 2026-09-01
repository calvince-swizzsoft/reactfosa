import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, getApprovalWorksheet, getApprovalRepaymentSchedule, approveLoanCase } from "./lib/loanCaseApi";
import { LoanCaseStatus, LoanApprovalOption } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function ReviewMetric({ label, value }) {
  return <div className="rounded-lg border bg-gray-50 p-3"><p className="text-xs uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 font-bold text-gray-800">{Number(value || 0).toLocaleString()}</p></div>;
}

function ReviewText({ label, value }) {
  return <div className="col-span-2 rounded-lg border bg-gray-50 p-3"><p className="text-xs uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 text-sm text-gray-700">{value || "—"}</p></div>;
}

const emptyForm = {
  ApprovedAmount: "", ApprovedAmountRemarks: "", MonthlyPaybackAmount: "", TotalPaybackAmount: "", ApprovalRemarks: "",
};

function ApprovalDrawer({ loanCaseId, workflowItemId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [usedBiometrics, setUsedBiometrics] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true);
    setUsedBiometrics(false);
    setForm(emptyForm);
    getApprovalWorksheet(loanCaseId)
      .then((d) => {
        setData(d);
        const schedule = d.repaymentSchedule || [];
        setForm({
          ...emptyForm,
          ApprovedAmount: d.loanCase?.AppraisedAmount || d.loanCase?.AmountApplied || "",
          MonthlyPaybackAmount: schedule[0]?.Payment || "",
          TotalPaybackAmount: schedule.reduce((sum, item) => sum + Number(item.Payment || 0), 0),
        });
        setActiveTab("overview");
      })
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [loanCaseId]);

  useEffect(() => {
    const amount = Number(form.ApprovedAmount);
    if (!loanCaseId || !Number.isFinite(amount) || amount <= 0) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      getApprovalRepaymentSchedule(loanCaseId, amount)
        .then((schedule) => {
          if (cancelled) return;
          setData((previous) => previous ? { ...previous, repaymentSchedule: schedule || [] } : previous);
          setForm((previous) => ({
            ...previous,
            MonthlyPaybackAmount: schedule?.[0]?.Payment || "",
            TotalPaybackAmount: (schedule || []).reduce((sum, item) => sum + Number(item.Payment || 0), 0),
          }));
        })
        .catch((err) => {
          if (!cancelled) Swal.fire("Schedule Error", err.message, "error");
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loanCaseId, form.ApprovedAmount]);

  if (!loanCaseId) return null;

  const submit = async (option) => {
    if (!form.ApprovalRemarks) {
      Swal.fire("Missing Fields", "Approval remarks are required.", "warning");
      return;
    }
    if (option === LoanApprovalOption.Approve && !(Number(form.ApprovedAmount) > 0)) {
      Swal.fire("Missing Fields", "Approved amount must be greater than zero to approve.", "warning");
      return;
    }
    if (option === LoanApprovalOption.Approve && Number(form.ApprovedAmount) !== Number(data?.loanCase?.AppraisedAmount || 0) && !form.ApprovedAmountRemarks.trim()) {
      Swal.fire("Override reason required", "Explain why the approved amount differs from the appraised amount.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const refreshed = await approveLoanCase(loanCaseId, {
        WorkflowItemId: workflowItemId || undefined,
        UsedBiometrics: usedBiometrics,
        Option: option,
        ApprovedAmount: Number(form.ApprovedAmount) || 0,
        ApprovedAmountRemarks: form.ApprovedAmountRemarks,
        ApprovalRemarks: form.ApprovalRemarks,
      });
      // The server's own message says so explicitly when a
      // LoanRegistrationBypassAudit product auto-chains Approve straight
      // into Audit — status can come back Audited, not just Approved.
      const autoVerified = refreshed?.Status === LoanCaseStatus.Audited;
      Swal.fire(
        "Success",
        autoVerified
          ? "Loan case approved and automatically verified — this product bypasses the verification step."
          : option === LoanApprovalOption.Approve ? "Loan case approved." : option === LoanApprovalOption.Reject ? "Loan case rejected." : "Loan case deferred.",
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
          <h2 className="font-bold text-white">Approve Loan Case</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : data ? (
            <>
              <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-2">
                {[["overview", "Application"], ["assessment", "Appraisal Review"], ["attached", "Attached Loans"], ["schedule", "Repayment Schedule"], ["decision", "Decision"]].map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold ${activeTab === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>)}
              </div>

              {activeTab === "overview" && <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} />}

              {activeTab === "assessment" && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ReviewMetric label="Amount applied" value={data.loanCase?.AmountApplied} />
                <ReviewMetric label="System recommendation" value={data.loanCase?.SystemAppraisedAmount} />
                <ReviewMetric label="Amount appraised" value={data.loanCase?.AppraisedAmount} />
                <ReviewMetric label="Loan + interest" value={data.loanCase?.TotalPaybackAmount} />
                <ReviewText label="System remarks" value={data.loanCase?.SystemAppraisalRemarks} />
                <ReviewText label="Appraised amount remarks" value={data.loanCase?.AppraisedAmountRemarks} />
                <ReviewText label="Appraiser remarks" value={data.loanCase?.AppraisalRemarks} />
              </div>}

              {activeTab === "attached" && <div className="space-y-2">
                {(data.attachedLoans || []).map((loan) => <div key={loan.Id} className="grid grid-cols-12 gap-3 rounded-lg border bg-gray-50 p-3 text-sm"><span className="col-span-4 font-semibold text-indigo-700">{loan.FullAccountNumber}</span><span className="col-span-4 text-gray-600">{loan.CustomerAccountTypeTargetProductDescription}</span><span className="col-span-2 text-right">Principal {Number(loan.PrincipalBalance || 0).toLocaleString()}</span><span className="col-span-2 text-right">Interest {Number(loan.InterestBalance || 0).toLocaleString()}</span></div>)}
                {!(data.attachedLoans || []).length && <p className="text-sm text-gray-400">No loans are attached for clearance.</p>}
              </div>}

              {activeTab === "schedule" && <div className="overflow-x-auto rounded-lg border"><div className="grid min-w-[900px] grid-cols-7 gap-2 bg-gray-700 p-3 text-xs font-semibold text-gray-100"><span>Period</span><span>Due Date</span><span>Starting</span><span>Payment</span><span>Interest</span><span>Principal</span><span>Ending</span></div>{(data.repaymentSchedule || []).map((row) => <div key={row.Period} className="grid min-w-[900px] grid-cols-7 gap-2 border-t p-3 text-xs text-gray-700"><span>{row.Period}</span><span>{new Date(row.DueDate).toLocaleDateString()}</span><span>{Number(row.StartingBalance).toLocaleString()}</span><span>{Number(row.Payment).toLocaleString()}</span><span>{Number(row.InterestPayment).toLocaleString()}</span><span>{Number(row.PrincipalPayment).toLocaleString()}</span><span>{Number(row.EndingBalance).toLocaleString()}</span></div>)}</div>}

              {activeTab === "decision" && <>

              <div className="grid grid-cols-2 gap-3 border-t pt-4">
                <FieldGroup label="Approved Amount (required to approve)">
                  <Input type="number" min="0" value={form.ApprovedAmount} onChange={(e) => setForm((p) => ({ ...p, ApprovedAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Monthly Payback Amount">
                  <Input type="number" min="0" value={form.MonthlyPaybackAmount} disabled />
                </FieldGroup>
                <FieldGroup label="Total Payback Amount">
                  <Input type="number" min="0" value={form.TotalPaybackAmount} disabled />
                </FieldGroup>
              </div>

              <FieldGroup label="Approved Amount Remarks">
                <Input value={form.ApprovedAmountRemarks} onChange={(e) => setForm((p) => ({ ...p, ApprovedAmountRemarks: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Approval Remarks">
                <Input value={form.ApprovalRemarks} onChange={(e) => setForm((p) => ({ ...p, ApprovalRemarks: e.target.value }))} required />
              </FieldGroup>
              </>}
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
          <Button disabled={submitting} onClick={() => submit(LoanApprovalOption.Approve)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Working..." : "Approve"}
          </Button>
          <Button disabled={submitting} onClick={() => submit(LoanApprovalOption.Defer)} variant="outline" className="flex-1">
            Defer
          </Button>
          <Button disabled={submitting} onClick={() => submit(LoanApprovalOption.Reject)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
            Reject
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ApprovalScreen() {
  const [searchParams] = useSearchParams();
  const routedLoanCaseId = searchParams.get("loanCaseId");
  const routedWorkflowItemId = searchParams.get("workflowItemId");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(routedLoanCaseId);

  const fetchList = () => {
    setLoading(true);
    listLoanCases({ status: LoanCaseStatus.Appraised, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaCheckCircle /> Loan Case Approval
        </h2>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Case No</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Amount Applied</span>
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
                  <span className="col-span-2 font-semibold text-gray-800">{loanCase.AmountApplied?.toLocaleString()}</span>
                  <span className="col-span-2 text-gray-700 truncate">{loanCase.LoanProductDescription}</span>
                  <span className="col-span-2"><LoanCaseStatusBadge status={loanCase.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No loan cases waiting for approval.</p>
          </div>
        )}
      </div>

      <ApprovalDrawer
        loanCaseId={selectedId}
        workflowItemId={selectedId === routedLoanCaseId ? routedWorkflowItemId : null}
        onClose={() => setSelectedId(null)}
        onChanged={fetchList}
      />
    </div>
  );
}
