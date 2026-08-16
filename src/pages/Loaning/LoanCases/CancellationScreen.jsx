import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaBan } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, getLoanCase, cancelLoanCase } from "./lib/loanCaseApi";
import { LoanCaseStatus, LoanCancellationOption } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";

// api/backoffice/loancases/{id}/cancel — docs/api/loan-case-api-spec.md §13.
// NavigationMenu code 70011 ("Cancellation"). Only Audited cases (already
// verified, awaiting disbursement) can be cancelled — a different queue
// from Audit's own (which lists Approved cases pending verification).
function CancelDrawer({ loanCaseId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loanCaseId) return;
    setLoading(true);
    getLoanCase(loanCaseId)
      .then((d) => setData(d))
      .catch((err) => Swal.fire("Error", err.message, "error"))
      .finally(() => setLoading(false));
  }, [loanCaseId]);

  if (!loanCaseId) return null;

  const submit = async (option) => {
    const label = option === LoanCancellationOption.Defer ? "defer" : "reject";
    const confirm = await Swal.fire({
      title: `${label === "defer" ? "Defer" : "Reject"} this loan case?`,
      text: label === "reject" ? "This releases the case's guarantors and cannot be undone." : "The case moves back to Deferred and can be re-actioned later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: label === "reject" ? "#dc2626" : "#4f46e5",
      confirmButtonText: label === "defer" ? "Defer" : "Reject",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      await cancelLoanCase(loanCaseId, option);
      Swal.fire("Success", `Loan case ${label === "defer" ? "deferred" : "rejected"}.`, "success");
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
      <motion.div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Cancel Loan Case</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : data ? (
            <>
              <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} />
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                This case is Verified and awaiting disbursement. Deferring parks it for later; rejecting releases its guarantors and closes it out.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Not found.</p>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t flex gap-2">
          <Button disabled={submitting} onClick={() => submit(LoanCancellationOption.Defer)} variant="outline" className="flex-1">
            {submitting ? "Working..." : "Defer"}
          </Button>
          <Button disabled={submitting} onClick={() => submit(LoanCancellationOption.Reject)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
            Reject
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CancellationScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const fetchList = () => {
    setLoading(true);
    listLoanCases({ status: LoanCaseStatus.Audited, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBan /> Loan Case Cancellation
        </h2>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Case No</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Amount</span>
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
                  <span className="col-span-2 font-semibold text-gray-800">{(loanCase.ApprovedAmount ?? loanCase.AmountApplied)?.toLocaleString()}</span>
                  <span className="col-span-2 text-gray-700 truncate">{loanCase.LoanProductDescription}</span>
                  <span className="col-span-2"><LoanCaseStatusBadge status={loanCase.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No verified loan cases awaiting disbursement.</p>
          </div>
        )}
      </div>

      <CancelDrawer loanCaseId={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchList} />
    </div>
  );
}
