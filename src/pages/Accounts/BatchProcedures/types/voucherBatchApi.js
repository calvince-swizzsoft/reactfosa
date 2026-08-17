import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's JournalVoucherController
// (Areas/Accounts/Controllers/JournalVoucherController.cs),
// api/accounts/journalvouchers — docs/api/batch-procedures-api-spec.md §7.
// A voucher is one primary account (header ChartOfAccountId + optional
// CustomerAccountId, at TotalValue) on one side, and however many entries
// (each own ChartOfAccountId + optional CustomerAccountId + own Amount) on
// the other. The header's single Type (JournalVoucherType) sets the
// direction for the header leg AND every entry leg at once — entries' own
// Type/EntryType fields exist on the DTO but are never read anywhere in
// JournalVoucherAppService, confirmed against source; don't build a
// per-entry direction picker against them. Authorize posts synchronously,
// inline, only if entries sum to exactly TotalValue — same "balanced, not
// success" semantics as Refund's Update.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/journalvouchers`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

// status is optional here — omit it (with startDate/endDate) for a
// date-range search, or send neither for a plain paged/text list.
export function listVoucherBatches({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function createVoucherBatch(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

// { Option, Remarks } — JournalVoucherAuthOption: 1=Post (-> Audited), 2=Reject.
export function auditVoucherBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

// { Option, Remarks, ModuleNavigationItemCode } — 1=Post (-> Posted,
// synchronous inline posting, only if entries sum to exactly TotalValue), 2=Reject.
export function authorizeVoucherBatch(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listVoucherBatchEntries(id, { pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { PostingPeriodId, BranchId, ChartOfAccountId, CustomerAccountId?,
// Amount, PrimaryDescription, Reference, Remarks }
export function addVoucherBatchEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeVoucherBatchEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
