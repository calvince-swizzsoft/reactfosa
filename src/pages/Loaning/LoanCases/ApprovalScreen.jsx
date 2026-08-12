import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, getLoanCase, approveLoanCase } from "./lib/loanCaseApi";
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

const emptyForm = {
  ApprovedAmount: "", ApprovedAmountRemarks: "", ApprovedPrincipalPayment: "",
  ApprovedInterestPayment: "", MonthlyPaybackAmount: "", TotalPaybackAmount: "", ApprovalRemarks: "",
};

function ApprovalDrawer({ loanCaseId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true);
    setForm(emptyForm);
    getLoanCase(loanCaseId)
      .then((d) => setData(d))
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [loanCaseId]);

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
    setSubmitting(true);
    try {
      const refreshed = await approveLoanCase(loanCaseId, {
        Option: option,
        ApprovedAmount: Number(form.ApprovedAmount) || 0,
        ApprovedAmountRemarks: form.ApprovedAmountRemarks,
        ApprovedPrincipalPayment: Number(form.ApprovedPrincipalPayment) || 0,
        ApprovedInterestPayment: Number(form.ApprovedInterestPayment) || 0,
        MonthlyPaybackAmount: Number(form.MonthlyPaybackAmount) || 0,
        TotalPaybackAmount: Number(form.TotalPaybackAmount) || 0,
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
      <motion.div className="fixed top-0 right-0 h-full w-[560px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Approve Loan Case</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : data ? (
            <>
              <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} />

              <div className="grid grid-cols-2 gap-3 border-t pt-4">
                <FieldGroup label="Approved Amount (required to approve)">
                  <Input type="number" min="0" value={form.ApprovedAmount} onChange={(e) => setForm((p) => ({ ...p, ApprovedAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Approved Principal Payment">
                  <Input type="number" min="0" value={form.ApprovedPrincipalPayment} onChange={(e) => setForm((p) => ({ ...p, ApprovedPrincipalPayment: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Approved Interest Payment">
                  <Input type="number" min="0" value={form.ApprovedInterestPayment} onChange={(e) => setForm((p) => ({ ...p, ApprovedInterestPayment: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Monthly Payback Amount">
                  <Input type="number" min="0" value={form.MonthlyPaybackAmount} onChange={(e) => setForm((p) => ({ ...p, MonthlyPaybackAmount: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Total Payback Amount">
                  <Input type="number" min="0" value={form.TotalPaybackAmount} onChange={(e) => setForm((p) => ({ ...p, TotalPaybackAmount: e.target.value }))} />
                </FieldGroup>
              </div>

              <FieldGroup label="Approved Amount Remarks">
                <Input value={form.ApprovedAmountRemarks} onChange={(e) => setForm((p) => ({ ...p, ApprovedAmountRemarks: e.target.value }))} />
              </FieldGroup>
              <FieldGroup label="Approval Remarks">
                <Input value={form.ApprovalRemarks} onChange={(e) => setForm((p) => ({ ...p, ApprovalRemarks: e.target.value }))} required />
              </FieldGroup>
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

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

      <ApprovalDrawer loanCaseId={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchList} />
    </div>
  );
}
