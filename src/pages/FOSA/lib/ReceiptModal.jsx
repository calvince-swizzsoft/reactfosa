import { Button } from "@/components/ui/button";
import { FaPrint, FaTimes } from "react-icons/fa";
import { normalizeJournal, formatMoney, formatReceiptDate } from "./receipt";

// Renders a printable receipt from a JournalDTO — the only receipt path
// left now that server-side printing is gone (WORKFLOW.md §11). `title`
// distinguishes what kind of posting this is (e.g. "Cash Deposit Receipt",
// "End of Day Receipt") since the journal itself doesn't carry that label.
// `notice` is an optional banner above the amount — used by
// SavingsReceiptsPayments.jsx to flag that a cheque deposit's amount is
// pending clearance, not available yet (frontoffice-api-spec.md §4.2:
// ChequeDeposit posts to a suspense account, not the customer's real
// balance, until the cheque is transferred/banked/Pay-cleared).
export default function ReceiptModal({ open, onClose, journal, title = "Receipt", notice }) {
  if (!open || !journal) return null;
  const j = normalizeJournal(journal);

  const handlePrint = () => window.print();

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 print:hidden" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0">
        <div
          id="fosa-receipt-print-area"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 print:shadow-none print:rounded-none print:max-w-full"
        >
          <div className="text-center border-b pb-3">
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{j.branchCompanyDescription || "—"}</p>
            <p className="text-xs text-slate-500">{j.branchDescription || "—"}</p>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-medium text-slate-800">{j.reference || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Transaction</span><span className="font-medium text-slate-800">{j.transactionCodeDescription || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-slate-700">{formatReceiptDate(j.createdDate)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Posting Period</span><span className="text-slate-700">{j.postingPeriodDescription || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Teller</span><span className="text-slate-700">{j.createdBy || j.applicationUserName || "—"}</span></div>
          </div>

          <div className="border-t border-b py-3 space-y-1">
            <p className="text-sm text-slate-700">{j.primaryDescription || "—"}</p>
            {j.secondaryDescription && <p className="text-xs text-slate-500">{j.secondaryDescription}</p>}
          </div>

          {notice && (
            <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">Amount</span>
            <span className="text-xl font-bold text-indigo-700">{formatMoney(j.totalValue)}</span>
          </div>

          <div className="flex gap-2 pt-2 print:hidden">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <FaTimes className="mr-2" /> Close
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handlePrint}>
              <FaPrint className="mr-2" /> Print
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
