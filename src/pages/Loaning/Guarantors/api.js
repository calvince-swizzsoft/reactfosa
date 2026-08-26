import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's LoanGuarantorController
// (Areas/BackOffice/Controllers/LoanGuarantorController.cs),
// api/backoffice/loanguarantors — docs/api/loan-guarantor-api-spec.md.
// This is a DIFFERENT thing from Registration's inline guarantor rows —
// Registration attaches guarantors as part of Create-ing a brand-new
// LoanCase; this standalone controller adds ONE MORE guarantor to a case
// that's already been registered (before appraisal). Only 9 fields are
// ever written by Create (confirmed against LoanGuarantorFactory/the
// domain aggregate — everything else on the DTO is a read-only echo):
// CustomerId (the guarantor), LoaneeCustomerId, LoanProductId, LoanCaseId,
// TotalShares, CommittedShares, AmountGuaranteed, AmountPledged,
// AppraisalFactor. Unlike Registration's Create, TotalShares/
// CommittedShares/AppraisalFactor are NOT recomputed server-side here —
// resolve them via lookupGuarantorEligibility (loanCaseApi.js) first and
// send the real values.
//
// IMPORTANT gotcha, confirmed against AddNewLoanGuarantor directly: a
// duplicate-guarantor rejection does NOT come back as a non-2xx failure —
// it returns `success: true` with the same DTO you sent, unpersisted, and
// an `ErrorMsgResult` string set on it. Always check `data.ErrorMsgResult`
// even when the call resolves without throwing.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/backoffice/loanguarantors`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

export function listLoanGuarantors({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function getLoanGuarantor(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

export function listLoanGuarantorsByCustomer(customerId) {
  return unwrap(apiFetch(`${BASE}/customer/${customerId}`));
}

// request: { CustomerId, LoaneeCustomerId, LoanProductId, LoanCaseId,
// TotalShares, CommittedShares, AmountGuaranteed, AmountPledged,
// AppraisalFactor } — every other DTO field is a read-only echo, don't
// send it. 400 on DataAnnotations validation failure (real messages
// joined). On success, ALWAYS check the returned data.ErrorMsgResult — see
// module note above.
export function createLoanGuarantor(request) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(request) }));
}
