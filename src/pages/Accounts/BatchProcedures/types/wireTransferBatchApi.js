import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's WireTransferBatchController
// (Areas/Accounts/Controllers/WireTransferBatchController.cs),
// api/accounts/wiretransferbatches — docs/api/batch-procedures-api-spec.md
// §3. Closest sibling to Credit (real TotalValue control-total, entries
// carry a trustworthy Amount up front), but Authorize strictly requires
// Audited first (Credit's guard is commented out) and every entry queues
// for async posting regardless of type (no Payout/CheckOff-style carve-out
// — WireTransferBatchType is label-only). If the customer's balance can't
// cover Amount + tariffs, PostEntry auto-rejects the entry outright.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/wiretransferbatches`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

// status is required on this controller's Index — no status-less overload.
export function listWireTransferBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ status: String(status), text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function createWireTransferBatch(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

export function auditWireTransferBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

export function authorizeWireTransferBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listWireTransferBatchEntries(id, { text = "", pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { CustomerAccountId, Amount, Payee, AccountNumber, Reference }
export function addWireTransferBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeWireTransferBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
