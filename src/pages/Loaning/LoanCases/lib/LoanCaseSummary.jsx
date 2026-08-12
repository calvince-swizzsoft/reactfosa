import LoanCaseStatusBadge from "./LoanCaseStatusBadge";

// Shared read-only case header, reused across every stage's detail/action
// drawer so the case context isn't reimplemented per screen. Expects the
// shape GET /{id} returns: { loanCase, guarantors, collaterals }.
export default function LoanCaseSummary({ loanCase, guarantors = [], collaterals = [] }) {
  if (!loanCase) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-400">Case No</span><p className="font-semibold text-gray-800">{loanCase.PaddedCaseNumber}</p></div>
        <div><span className="text-gray-400">Status</span><p><LoanCaseStatusBadge status={loanCase.Status} /></p></div>
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-gray-800 truncate">{loanCase.CustomerFullName}</p></div>
        <div><span className="text-gray-400">Loan Product</span><p className="font-semibold text-gray-800 truncate">{loanCase.LoanProductDescription}</p></div>
        <div><span className="text-gray-400">Amount Applied</span><p className="font-semibold text-indigo-600">{loanCase.AmountApplied?.toLocaleString()}</p></div>
        <div><span className="text-gray-400">Received Date</span><p className="font-semibold text-gray-800">{loanCase.ReceivedDate ? new Date(loanCase.ReceivedDate).toLocaleDateString() : "—"}</p></div>
      </div>

      {guarantors.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Guarantors</p>
          <div className="space-y-1.5">
            {guarantors.map((g) => (
              <div key={g.Id || g.GuarantorId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700 truncate">{g.GuarantorFullName || g.CustomerFullName}</span>
                <span className="font-semibold text-gray-800">{g.AmountGuaranteed?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {collaterals.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Collateral</p>
          <div className="space-y-1.5">
            {collaterals.map((c) => (
              <div key={c.Id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700 truncate">{c.CustomerDocumentFileTitle}</span>
                <span className="font-semibold text-gray-800">{c.Value?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
