import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's JournalReversalBatchController
// (Areas/Accounts/Controllers/JournalReversalBatchController.cs),
// api/accounts/journalreversalbatches — docs/api/batch-procedures-api-spec.md
// §4. An entry is just { JournalId, Remarks } — no amount, no tariffs; the
// amount reversed is implicitly the referenced Journal's own amount, and
// GetByBatch returns each entry with its full Journal populated so the list
// can show real detail even though there's no dedicated "browse journals"
// endpoint to search one out by (see the panel's own note on that gap).
// Remarks2 is required by validation but has no backing column — send
// anything, don't expect it to persist.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/journalreversalbatches`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

// status is required — no status-less overload on this app service.
export function listReversalBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ status: String(status), text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function createReversalBatch(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

export function auditReversalBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

export function authorizeReversalBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listReversalBatchEntries(id, { text = "", pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { JournalId, Remarks }
export function addReversalBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeReversalBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
