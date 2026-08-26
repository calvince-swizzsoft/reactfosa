import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's LoanRestructuringController
// (Areas/BackOffice/Controllers/LoanRestructuringController.cs),
// api/backoffice/loanrestructuring — docs/api/loan-restructuring-api-spec.md.
// Keyed by the loan's CustomerAccountId, not a LoanCaseId — restructuring
// acts on the disbursed loan account itself, the one outlier in this
// module. Real gotchas confirmed against RestructureLoan/LoanCaseAppService
// directly, not just the doc:
// - `Pmt` has ZERO computational effect — it's only interpolated into a
//   journal description string. The real new payment is computed entirely
//   server-side from `NPer` + the loan product's own APR/frequency/
//   calculation mode. Don't build a "new payment amount" field implying it
//   drives anything.
// - The balance guard is `-PrincipalBalance > 0 && InterestBalance === 0`
//   (this ledger stores an outstanding loan's principal as negative).
// - Response `data` is always null on success — nothing about the new
//   LoanCase (status Restructured=48833), journal pair, or StandingOrder
//   comes back. If the UI needs to show the result, requery the loan case
//   list for status=Restructured afterward.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/backoffice/loanrestructuring`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// request: { BranchId, CustomerAccountId, NPer, Pmt, Reference,
// ModuleNavigationItemCode }. Guards, in order: BranchId required,
// CustomerAccountId required, NPer > 0, Pmt > 0 (validated but otherwise
// inert — see note above), Reference required. 409 if the account can't be
// found or isn't eligible (no outstanding principal, or has an outstanding
// interest balance).
export function restructureLoan(request) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(request) }));
}
