import { apiFetch } from "@/lib/api";

// Client for WebApplication1's UnPayReasonController
// (Areas/Accounts/Controllers/UnPayReasonController.cs), base
// api/accounts/unpayreasons — docs/api/unpayreason-api-spec.md. Replaces
// the undocumented `/api/unpay` endpoint the FOSA Clear Cheques screen
// used to call (flagged as a real gap in TellerTransactions/TODO.md) —
// this is the real, documented controller for it, under Accounts
// (NavigationMenu.cs: Code 0x000059D8+28, ControllerName UnpayReason,
// AreaName Accounts — not FrontOffice, despite being consumed from a
// front-office screen).

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const UNPAY_REASONS_BASE = `${FIN_BASE}/api/accounts/unpayreasons`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body?.data ?? body;
}

// Unpaged — for pickers (e.g. the Clear Cheques "unpay" reason dropdown).
export function listAllUnpayReasons() {
  return unwrap(apiFetch(UNPAY_REASONS_BASE));
}

export function listUnpayReasons({ text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${UNPAY_REASONS_BASE}/paged?${params.toString()}`));
}

export function getUnpayReason(id) {
  return unwrap(apiFetch(`${UNPAY_REASONS_BASE}/${id}`));
}

// request: { UnPayReason: UnPayReasonDTO, CommissionIds?: Guid[] }. 409 if
// Description already exists on another UnPayReason.
export function createUnpayReason(request) {
  return unwrap(apiFetch(UNPAY_REASONS_BASE, { method: "POST", body: JSON.stringify(request) }));
}

// Only updates the reason's own fields — does not touch attached
// commissions, use the sub-resource below for that.
export function updateUnpayReason(id, unPayReasonDTO) {
  return unwrap(apiFetch(`${UNPAY_REASONS_BASE}/${id}`, { method: "PUT", body: JSON.stringify(unPayReasonDTO) }));
}

export function listUnpayReasonCommissions(id) {
  return unwrap(apiFetch(`${UNPAY_REASONS_BASE}/${id}/commissions`));
}

// Full replace — every existing attachment is deleted and replaced with
// exactly what's sent ([] clears all).
export function updateUnpayReasonCommissions(id, commissionIds) {
  return unwrap(apiFetch(`${UNPAY_REASONS_BASE}/${id}/commissions`, { method: "PUT", body: JSON.stringify(commissionIds) }));
}
