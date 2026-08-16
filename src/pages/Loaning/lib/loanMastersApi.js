import { apiFetch } from "@/lib/api";

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
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
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

export function listLoaningRemarks() {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loaningremarks`));
}

export function createLoaningRemark({ Description, IsLocked = false }) {
  return unwrap(apiFetch(`${FIN_BASE}/api/backoffice/loaningremarks`, { method: "POST", body: JSON.stringify({ Description, IsLocked }) }));
}
