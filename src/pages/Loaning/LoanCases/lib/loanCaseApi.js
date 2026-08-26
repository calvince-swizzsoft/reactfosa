import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's LoanCaseController
// (Areas/BackOffice/Controllers/LoanCaseController.cs),
// api/backoffice/loancases — WebApplication1/Areas/BackOffice/WORKFLOW.md
// §15 / §14.1-14.4. Standard { success, message, data } envelope
// everywhere on this controller. Request bodies bind case-insensitively
// (JSON.NET), but response payloads come back PascalCase — this backend
// has no CamelCasePropertyNamesContractResolver configured anywhere
// (confirmed against source), so every DTO field read from a response
// here must be PascalCase (`Id`, `CustomerId`, `Status`, ...), not
// camelCase, even though hand-built anonymous-object responses
// (appraisal-worksheet's top-level keys, the guarantor lookup) use
// camelCase because those identifiers were literally typed that way.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/backoffice/loancases`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// status is a raw LoanCaseStatus int (see loanCaseEnums.js) — defaults
// server-side to Registered if omitted, but every screen here passes it explicitly.
export function listLoanCases({ status, text = "", loanCaseFilter = 0, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({
    status: String(status), text, loanCaseFilter: String(loanCaseFilter),
    pageIndex: String(pageIndex), pageSize: String(pageSize),
  });
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

// Returns { LoanCase, Guarantors, Collaterals } (PascalCase keys inside the
// hand-built anonymous object too, since `loanCase`/`guarantors`/
// `collaterals` are camelCase but everything nested is a plain DTO —
// actually these three top-level keys ARE camelCase, confirmed directly
// against the controller's `new { loanCase, guarantors, collaterals }`).
export function getLoanCase(id) {
  return unwrap(apiFetch(`${BASE}/${id}`));
}

// request: { LoanCase: {...}, Guarantors: [{GuarantorId, AmountGuaranteed}],
// CollateralDocumentIds: [guid, ...] } — every LoanGuarantorDTO field other
// than GuarantorId/AmountGuaranteed is recomputed server-side, don't send
// anything else per row.
export function createLoanCase(request) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(request) }));
}

// Same duplicate-application guard Create enforces — call before submit to
// warn early, not to block (Create still enforces it either way).
export function checkInProcess(customerId) {
  return unwrap(apiFetch(`${BASE}/customers/${customerId}/in-process`));
}

export function getRegistrationContext(customerId, loanProductId) {
  const params = new URLSearchParams();
  if (loanProductId) params.set("loanProductId", loanProductId);
  return unwrap(apiFetch(`${BASE}/customers/${customerId}/registration-context?${params.toString()}`));
}

// { guarantorId, SerialNumber, fullName, employerDescription,
// stationDescription, identificationNumber, payrollNumber, totalShares,
// committedShares, appraisalFactor, availableToGuarantee } — note
// `SerialNumber` is capital-S even though every sibling field here is
// camelCase (C# anonymous-type member-access shorthand on the server,
// confirmed against source — not a typo to "fix" client-side).
export function lookupGuarantorEligibility(guarantorId, loanProductId) {
  const params = new URLSearchParams({ guarantorId, loanProductId });
  return unwrap(apiFetch(`${BASE}/guarantors/lookup?${params.toString()}`));
}

// Computed appraisal figures for a Registered/Deferred case — read-only.
// Response: { loanCase, totalShares, investmentsBalance, savingsBalance,
// maximumLoan, outstandingLoansBalance, maximumEntitled, loanPart,
// interestPart, loanPlusInterest, paymentPerPeriod, appraisalFactors,
// guarantors, collaterals } — confirmed field-for-field against
// LoanCaseController.GetAppraisalWorksheet.
export function getAppraisalWorksheet(id) {
  return unwrap(apiFetch(`${BASE}/${id}/appraisal-worksheet`));
}

export function getApprovalWorksheet(id) {
  return unwrap(apiFetch(`${BASE}/${id}/approval-worksheet`));
}

export function getVerificationWorksheet(id) {
  return unwrap(apiFetch(`${BASE}/${id}/verification-worksheet`));
}

export function getCancellationWorksheet(id) {
  return unwrap(apiFetch(`${BASE}/${id}/cancellation-worksheet`));
}

export function listCancellationQueue({ loanProductSection = 0, startDate = "", endDate = "", text = "", loanCaseFilter = 0, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ loanProductSection: String(loanProductSection), text, loanCaseFilter: String(loanCaseFilter), pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}/cancellation-queue?${params.toString()}`));
}

// request: { WorkflowItemId?, UsedBiometrics, Option, ModuleNavigationItemCode, LoanProductLatestIncome,
// AppraisedNetIncome, AppraisedAbility, SystemAppraisedAmount,
// SystemAppraisalRemarks, AppraisedAmount, AppraisedAmountRemarks,
// AppraisalRemarks, MonthlyPaybackAmount, TotalPaybackAmount,
// TotalLoansBalance, IncomeAdjustments: [{IncomeAdjustmentId,
// CustomerAccountId?, Amount, IsEnabled}] } — LoanAppraisalOption:
// 1=Appraise, 2=Reject. IncomeAdjustments only applied when Option=Appraise.
export function appraiseLoanCase(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/appraise`, { method: "POST", body: JSON.stringify(request) }));
}

// request: { WorkflowItemId?, UsedBiometrics, Option, ApprovedAmount, ApprovedAmountRemarks,
// ApprovedPrincipalPayment, ApprovedInterestPayment, MonthlyPaybackAmount,
// TotalPaybackAmount, ApprovalRemarks } — LoanApprovalOption: 1=Approve,
// 2=Reject, 4=Defer (non-sequential). No ModuleNavigationItemCode field on
// this request (unlike Appraise) — confirmed against
// ApproveLoanCaseRequest, don't send one. ApprovedAmount required >0 only
// when Option=Approve; ApprovalRemarks always required. Check the response
// `message` before assuming the case is still just Approved — a
// LoanRegistrationBypassAudit product auto-chains into Audit in the same
// call and the case can come back Audited.
export function approveLoanCase(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/approve`, { method: "POST", body: JSON.stringify(request) }));
}

// request: { WorkflowItemId?, UsedBiometrics, Option, Reference, AuditRemarks } — LoanAuditOption: 1=Audit ("Verify" in
// the UI), 2=Reject, 4=Defer. No ModuleNavigationItemCode field here
// either. AuditRemarks always required. On a successful Audit, treat the
// server's work (loan/savings account + repayment StandingOrder creation)
// as a black box — check the response `message`, don't precompute a preview.
export function auditLoanCase(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

// PUT {id}/collaterals — TRUE full-replace, including empty. Sending
// []/null clears every collateral already on the case; this isn't a
// "save the delta", it's "this is now the complete set". Callers must
// confirm before submitting a possibly-emptied list. 400 if any document
// id doesn't exist (not silently dropped, unlike Create's collateral
// handling), 409 if the update otherwise fails.
export function updateLoanCaseCollaterals(id, documentIds) {
  return unwrap(apiFetch(`${BASE}/${id}/collaterals`, { method: "PUT", body: JSON.stringify(documentIds) }));
}

// request: { Option } — LoanCancellationOption: 1=Defer, 2=Reject. Only
// accepts a case already in Audited status (awaiting disbursement) — 409
// otherwise, same wording pattern as every other transition guard on this
// controller. On Reject, the case's guarantors are released server-side.
export function cancelLoanCase(id, option) {
  return unwrap(apiFetch(`${BASE}/${id}/cancel`, { method: "POST", body: JSON.stringify({ Option: option }) }));
}

export { normalizeList };
