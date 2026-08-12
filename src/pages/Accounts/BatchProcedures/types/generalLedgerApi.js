import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's GeneralLedgerController
// (Areas/Accounts/Controllers/GeneralLedgerController.cs),
// api/accounts/generalledgers — docs/api/batch-procedures-api-spec.md §8.
// Not to be confused with GeneralLedgerStatementController
// (api/accounts/statements/gl-account) — that's a read-only reporting view;
// this is the maker-checker-authorizer batch that actually posts entries.
// The header carries no chart-of-account/customer-account fields at all —
// unlike Voucher, there is no "primary" account; it's purely a container
// (branch, posting period, totalValue, remarks) for entries that are each
// already self-balancing double-entry transfers (ChartOfAccountId credit +
// ContraChartOfAccountId debit, each optionally paired with a customer
// account). Verified directly against AuthorizeGeneralLedger: every entry
// posts as its OWN separate Journal, not shared legs on one Journal the way
// Voucher works. Authorize posts synchronously, inline; an out-of-balance
// Post throws server-side but this controller catches it and returns the
// normal 409 shape, so no special-casing needed here.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/accounts/generalledgers`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

// status is optional, same as Journal Voucher.
export function listGeneralLedgers({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${BASE}?${params.toString()}`));
}

export function createGeneralLedger(dto) {
  return unwrap(apiFetch(BASE, { method: "POST", body: JSON.stringify(dto) }));
}

// { Option, Remarks } — GeneralLedgerAuthOption: 1=Post (-> Audited), 2=Reject.
export function auditGeneralLedger(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/audit`, { method: "POST", body: JSON.stringify(request) }));
}

// { Option, Remarks, ModuleNavigationItemCode } — 1=Post (-> Posted, one
// Journal per entry, synchronous inline), 2=Reject.
export function authorizeGeneralLedger(id, request) {
  return unwrap(apiFetch(`${BASE}/${id}/authorize`, { method: "POST", body: JSON.stringify(request) }));
}

export function listGeneralLedgerEntries(id, { pageIndex = 0, pageSize = 50 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${BASE}/${id}/entries?${params.toString()}`));
}

// entryDTO: { BranchId, ChartOfAccountId, ContraChartOfAccountId,
// CustomerAccountId?, ContraCustomerAccountId?, Amount, PrimaryDescription,
// SecondaryDescription, Reference }
export function addGeneralLedgerEntry(id, entryDTO) {
  return unwrap(apiFetch(`${BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeGeneralLedgerEntries(entries) {
  return unwrap(apiFetch(`${BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

export { normalizeList };
