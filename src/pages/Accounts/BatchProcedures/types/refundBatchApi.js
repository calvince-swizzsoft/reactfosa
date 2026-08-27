import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's OverDeductionBatchController
// (Areas/Accounts/Controllers/OverDeductionBatchController.cs),
// api/accounts/overdeductionbatches — docs/api/batch-procedures-api-spec.md
// §5. Refunds a prior over-collection back to the affected member; each
// entry pairs a real debit CustomerAccount and credit CustomerAccount plus
// Principal/Interest — both trustworthy up front, unlike Credit/Debit's
// dead/computed-only equivalents. The one type in this module where
// Authorize posts every entry's journal(s) synchronously in the same call
// (no async broker) — safe to treat entries as Posted immediately after a
// successful Authorize here, the opposite assumption from every sibling
// type. Update's boolean result (surfaced via `message`, not an error)
// means "entries now sum exactly to TotalValue", not "save failed".

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/overdeductionbatches`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body;
}

// status is required — no status-less overload on this app service.
export async function listRefundBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ status: String(status), text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const body = await unwrap(apiFetch(`${BASE}?${params.toString()}`));
  return body?.data ?? body;
}

export async function createRefundBatch(dto) {
  const body = await unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
  return body?.data ?? body;
}

export async function auditRefundBatch(id, request) {
  const body = await unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
  return body?.data ?? body;
}

// Always success:true (Ok) even when not authorizable per se — the real
// carrier of the outcome here is `success` from the plain Authorize
// Conflict path (batch not Audited); message is descriptive, not an error
// signal, so this stays a plain unwrap.
export async function authorizeRefundBatch(id, request) {
  const body = await unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
  return body?.data ?? body;
}

export async function listRefundBatchEntries(id, { text = "", pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  const body = await unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
  return body?.data ?? body;
}

// entryDTO: { DebitCustomerAccountId, CreditCustomerAccountId, Principal, Interest }
export async function addRefundBatchEntry(id, entryDTO) {
  const body = await unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
  return body?.data ?? body;
}

export async function removeRefundBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
