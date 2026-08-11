import { apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's FixedDepositController
// (Controllers/FixedDepositController.cs), base
// api/frontoffice/fixeddeposits, docs/api/frontoffice-api-spec.md §11.
// Real lifecycle confirmed against source: Create (InvokeFixedDeposit) ->
// New; Verify (AuditFixedDeposit, {Approve: bool}) -> Running/Rejected;
// batch Terminate (RevokeFixedDeposits) any time before maturity; batch
// Liquidate (PayFixedDeposit) only once MaturityDate has passed —
// Liquidate 400s with the specific account number of the first not-yet-
// matured deposit in the batch, not a generic message.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const FIXED_DEPOSITS_BASE = `${FIN_BASE}/api/frontoffice/fixeddeposits`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

export function listFixedDeposits({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}?${params.toString()}`));
}

export function getFixedDeposit(id) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/${id}`));
}

export function listPayableFixedDeposits({ startDate, endDate, text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/payable?${params.toString()}`));
}

export function listRevocableFixedDeposits({ startDate, endDate, text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/revocable?${params.toString()}`));
}

// Denormalized payout-account breakdown (BookBalance/PrincipalBalance/
// InterestBalance) — a read model, not obviously user-editable business
// fields, so this client only exposes GET; PUT /{id}/payables exists
// server-side but isn't wired to a form here (same "don't guess a form
// for an unclear field" call as the FixedDepositTypeId gap below).
export function listFixedDepositPayables(id) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/${id}/payables`));
}

// FixedDepositTypeId is optional (Guid?) and there's no lookup endpoint
// for fixed deposit types anywhere in this API (confirmed — no
// FixedDepositType controller exists), same gap as ChequeType's raw-GUID
// precedent noted in TellerTransactions/TODO.md — omitted from the create
// form entirely rather than guessed at.
export function createFixedDeposit(fixedDepositDTO) {
  return unwrap(apiFetch(FIXED_DEPOSITS_BASE, { method: "POST", body: JSON.stringify(fixedDepositDTO) }));
}

// request: { Approve, ModuleNavigationItemCode }.
export function verifyFixedDeposit(id, request) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/${id}/verify`, { method: "POST", body: JSON.stringify(request) }));
}

export function terminateFixedDeposits(selectedFixedDepositIds, moduleNavigationItemCode) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/terminate`, {
    method: "POST",
    body: JSON.stringify({ SelectedFixedDepositIds: selectedFixedDepositIds, ModuleNavigationItemCode: moduleNavigationItemCode }),
  }));
}

export function liquidateFixedDeposits(selectedFixedDepositIds, moduleNavigationItemCode) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/liquidate`, {
    method: "POST",
    body: JSON.stringify({ SelectedFixedDepositIds: selectedFixedDepositIds, ModuleNavigationItemCode: moduleNavigationItemCode }),
  }));
}

export { normalizeList };
