import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's LoanDisbursementBatchController
// (Areas/Accounts/Controllers/LoanDisbursementBatchController.cs),
// api/accounts/loandisbursementbatches — docs/api/batch-procedures-api-spec.md
// §6. An entry is { LoanDisbursementBatchId, LoanCaseId, Reference } — pick
// an already-Audited, not-yet-batched LoanCase and attach it. Posting one
// entry is the most substantial per-entry logic in this module (creates
// loan/savings accounts if missing, posts the disbursement journal,
// recovers upfront tariffs, marks the LoanCase Disbursed, and sets up the
// repayment StandingOrder) — treated as a black box here, nothing to
// precompute client-side. BatchTotal/StartDate/EndDate on the header have
// no backing column at all — don't expect them to persist.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/loandisbursementbatches`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// status is required — no status-less overload on this app service.
export function listDisbursementBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ status: String(status), text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function createDisbursementBatch(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

export function auditDisbursementBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

export function authorizeDisbursementBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listDisbursementBatchEntries(id, { text = "", pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { LoanCaseId, Reference }
export function addDisbursementBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeDisbursementBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
