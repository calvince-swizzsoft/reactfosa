import { apiJson as apiFetch } from "@/lib/api";

// Client for WebApplication1's LoanRequestController
// (Areas/BackOffice/Controllers/LoanRequestController.cs),
// api/backoffice/loanrequests — docs/api/loan-request-api-spec.md. The
// optional pre-case intake stage before a real LoanCase is registered —
// a member expressing interest in a loan product/purpose/amount, no
// guarantor/appraisal machinery involved yet. Ungated: no NavigationMenu
// code exists anywhere for this screen (confirmed via grep, zero matches).
//
// IMPORTANT — confirmed directly against RegisterLoanRequest: this action
// is a pure status flip (New -> Registered). It does NOT create a
// LoanCase. If a real case should exist, create it first via
// createLoanCase (../LoanCases/lib/loanCaseApi.js), then call register()
// here with the resulting case's CaseNumber (an int, not its guid Id).
//
// Create only ever persists 6 fields (confirmed against
// LoanRequestFactory.CreateLoanRequest): CustomerId, LoanProductId,
// LoanPurposeId, AmountApplied, ReceivedDate, Reference — everything else
// on the DTO is a read-only echo. Create throws (400) if the customer
// already has a pending (New) request for the same loan product.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/backoffice/loanrequests`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

export function listLoanRequests({ text = "", loanRequestFilter = 0, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, loanRequestFilter: String(loanRequestFilter), pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function getLoanRequest(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

export function listLoanRequestsInProcessForCustomer(customerId) {
  return unwrap(apiFetch(`${BASE}/customers/${customerId}/in-process`));
}

// request: { CustomerId, LoanProductId, LoanPurposeId, AmountApplied,
// ReceivedDate, Reference } — ReceivedDate must be supplied by the
// caller, it is not defaulted server-side.
export function createLoanRequest(request) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(request) }));
}

// Pure status flip New->Registered — does not create a LoanCase. Pass the
// CaseNumber (int) of a LoanCase already created separately, if linking
// this request to one.
export function registerLoanRequest(id, loanCaseNumber) {
  return unwrap(apiFetch(`${BASE}/${id}/register`, { method: "POST", body: JSON.stringify({ LoanCaseNumber: loanCaseNumber }) }));
}

export function cancelLoanRequest(id) {
  return unwrap(apiFetch(`${BASE}/${id}/cancel`, { method: "POST" }));
}

export function deleteLoanRequest(id) {
  return unwrap(apiFetch(`${BASE}/${id}`, { method: "DELETE" }));
}
