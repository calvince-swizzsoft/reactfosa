import { apiJson as apiFetch } from "@/lib/api";

// Clients for LoanPurposeController (api/backoffice/loanpurposes) and
// LoaningRemarkController (api/backoffice/loaningremarks) — both were
// built specifically to unblock loan-case registration's Loan Purpose and
// Registration Remark pickers (WebApplication1/Areas/BackOffice/
// WORKFLOW.md §15.2/§13) and share one CRUD shape (same as
// UnPayReasonController): { Id, Description [Required], IsLocked,
// CreatedDate, ErrorMessageResult }. Create reports a duplicate
// Description via `ErrorMessageResult` on the echoed-back DTO rather than
// a thrown/non-2xx error — always check it even when the call resolves.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// Unpaged — matches the picker use case (GET /paged exists separately for
// an admin listing screen, not needed here).
export function listLoanPurposes() {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loanpurposes`));
}

export function createLoanPurpose({ Description, IsLocked = false }) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loanpurposes`, { method: "POST", body: JSON.stringify({ Description, IsLocked }) }));
}

export function listLoanPurposesPaged({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loanpurposes/paged?${params.toString()}`));
}

export function updateLoanPurpose(id, value) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loanpurposes/${id}`, { method: "PUT", body: JSON.stringify(value) }));
}

export function listLoaningRemarks() {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loaningremarks`));
}

export function createLoaningRemark({ Description, IsLocked = false }) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loaningremarks`, { method: "POST", body: JSON.stringify({ Description, IsLocked }) }));
}

export function listLoaningRemarksPaged({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loaningremarks/paged?${params.toString()}`));
}

export function updateLoaningRemark(id, value) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loaningremarks/${id}`, { method: "PUT", body: JSON.stringify(value) }));
}

export function listIncomeAdjustmentsPaged({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/incomeadjustments/paged?${params.toString()}`));
}

export function createIncomeAdjustment({ Description, Type, IsLocked = false }) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/incomeadjustments`, { method: "POST", body: JSON.stringify({ Description, Type, IsLocked }) }));
}

export function updateIncomeAdjustment(id, value) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/incomeadjustments/${id}`, { method: "PUT", body: JSON.stringify(value) }));
}
