import { apiJson as apiFetch, normalizeList } from "@/lib/api";

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
  const body = await responsePromise;
  return body?.data ?? body;
}

export function listFixedDeposits({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}?${params.toString()}`));
}

export function listPendingFixedDeposits({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/pending-posting?${params.toString()}`));
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

// FixedDepositTypeId is optional (Guid?) — a real lookup endpoint now
// exists (Accounts/FixedDepositTypes, FixedDepositTypeController, added
// 2026-08-16) and is wired into create.jsx's picker. Previously omitted
// entirely per the ChequeType raw-GUID precedent noted in
// TellerTransactions/TODO.md; that gap is now closed.
export function createFixedDeposit(fixedDepositDTO) {
  return unwrap(apiFetch(FIXED_DEPOSITS_BASE, { method: "POST", body: JSON.stringify(fixedDepositDTO) }));
}

// request: { Approve, ModuleNavigationItemCode }.
export function verifyFixedDeposit(id, request) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/${id}/verify`, { method: "POST", body: JSON.stringify(request) }));
}

export function getFixedDepositPostingReconciliation(id) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/${id}/posting-reconciliation`));
}

export function reconcileFixedDepositPosting(id, reason) {
  return unwrap(apiFetch(`${FIXED_DEPOSITS_BASE}/${id}/posting-reconciliation`, {
    method: "POST",
    body: JSON.stringify({ Reason: reason }),
  }));
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
