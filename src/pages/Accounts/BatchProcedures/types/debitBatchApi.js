import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's DebitBatchController
// (Areas/Accounts/Controllers/DebitBatchController.cs),
// api/accounts/debitbatches — docs/api/batch-procedures-api-spec.md §2.
// Real differences from Credit, confirmed against source: no `TotalValue`
// on the header at all (so no control-total check), Authorize genuinely
// refuses a not-yet-Audited batch (Credit's equivalent guard is commented
// out), and entries carry Multiplier/BasisValue instead of an amount —
// PostDebitBatchEntry computes the real deduction from a tariff structure,
// there's nothing to show before posting.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/debitbatches`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

export function listDebitBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

// Create -> Pending. BatchNumber/Status/CreatedBy assigned server-side.
export function createDebitBatch(debitBatchDTO) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(debitBatchDTO) }));
}

// { Option, Remarks } — 1=Post (-> Audited), 2=Reject. Only accepts Pending.
export function auditDebitBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

// { Option, Remarks, ModuleNavigationItemCode } — 1=Post (-> Posted, queues
// every entry for async posting), 2=Reject. Refuses if not already Audited.
export function authorizeDebitBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listDebitBatchEntries(id, { text = "", pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { CustomerAccountId, Multiplier, BasisValue, Reference } —
// DebitBatchId is set from `id`.
export function addDebitBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeDebitBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
