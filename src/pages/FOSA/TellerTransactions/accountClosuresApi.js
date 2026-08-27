import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's AccountClosureController
// (Controllers/AccountClosureController.cs), base
// api/frontoffice/accountclosures, docs/api/frontoffice-api-spec.md §10.
// Real sequence confirmed against source (the reference controller's
// Create->Verify->Approve->Settle naming order is NOT what the app service
// enforces): Create -> Registered; Approve (Registered/Deferred ->
// Approved); Verify (Approved -> Audited); Settle (Audited -> Settled).
// Each transition returns 409 (not 400) if the request isn't in the right
// state. Settle only flips status + closes the account — the actual
// refund payout is a separate manual call to Sundry Payments
// (transactionType: 32), see sundryPaymentsApi.js.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const ACCOUNT_CLOSURES_BASE = `${FIN_BASE}/api/frontoffice/accountclosures`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

export function listAccountClosures({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${ACCOUNT_CLOSURES_BASE}?${params.toString()}`));
}

export function getAccountClosure(id) {
  return unwrap(apiFetch(`${ACCOUNT_CLOSURES_BASE}/${id}`));
}

export function createAccountClosure(accountClosureRequestDTO) {
  return unwrap(apiFetch(ACCOUNT_CLOSURES_BASE, { method: "POST", body: JSON.stringify(accountClosureRequestDTO) }));
}

// request: { Option, Remarks } — Option: 1=Approve, 2=Defer.
export function approveAccountClosure(id, request) {
  return unwrap(apiFetch(`${ACCOUNT_CLOSURES_BASE}/${id}/approve`, { method: "POST", body: JSON.stringify(request) }));
}

// request: { Option, Remarks } — Option: 1=Verify/Audit, 2=Defer.
export function verifyAccountClosure(id, request) {
  return unwrap(apiFetch(`${ACCOUNT_CLOSURES_BASE}/${id}/verify`, { method: "POST", body: JSON.stringify(request) }));
}

// request: { Option, Remarks } — Option: 1=Settle, 2=Defer.
export function settleAccountClosure(id, request) {
  return unwrap(apiFetch(`${ACCOUNT_CLOSURES_BASE}/${id}/settle`, { method: "POST", body: JSON.stringify(request) }));
}

export { normalizeList };
