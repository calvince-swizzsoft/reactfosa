import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's ChequeBookController
// (Areas/Accounts/Controllers/ChequeBookController.cs), base
// api/accounts/chequebooks — docs/api/chequebook-api-spec.md. New
// controller: IChequeBookAppService already existed (issuance, per-leaf
// vouchers, activate/pay/flag) but had no API surface before this pass,
// only reachable through the legacy ChequeBookService.svc.cs WCF
// passthrough. DTO field casing (PascalCase, `ChequeBook`/
// `ModuleNavigationItemCode` on the create wrapper) confirmed directly
// against ChequeBookDTO.cs/PaymentVoucherDTO.cs/ChequeBookController.cs,
// not guessed from the doc's TS-style lowerCamelCase prose.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CHEQUEBOOKS_BASE = `${FIN_BASE}/api/accounts/chequebooks`;

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

export function listChequeBooks({ text = "", type, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (type !== undefined && type !== "" && type !== null) params.set("type", String(type));
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}?${params.toString()}`));
}

// Unpaged — for pickers (match-voucher's chequebook reference lookup etc.).
export function listAllChequeBooks() {
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/all`));
}

export function getChequeBook(id) {
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/${id}`));
}

// request: { ChequeBook: ChequeBookDTO, ModuleNavigationItemCode: number }
export function createChequeBook(request) {
  return unwrap(apiFetch(CHEQUEBOOKS_BASE, { method: "POST", body: JSON.stringify(request) }));
}

// chequeBookDTO.Id is overwritten server-side from the path segment, but
// ValidateAll() still runs on the whole DTO — NumberOfVouchers/
// InitialVoucherNumber must still be present and > 0 even though they're
// not editable in the UI (carry the original fetched values forward).
export function updateChequeBook(id, chequeBookDTO) {
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/${id}`, { method: "PUT", body: JSON.stringify(chequeBookDTO) }));
}

export function listVouchers(chequeBookId, { text = "", pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/${chequeBookId}/vouchers?${params.toString()}`));
}

// chequeBookType: ChequeBookType int, voucherNumber: int (the controller's
// own param type — note this doesn't match PaymentVoucherDTO.VoucherNumber
// being a Guid, a pre-existing inconsistency in the backend, not something
// to work around client-side), chequeBookReference: the chequebook's own
// Reference field, not the voucher's.
export function matchVoucher({ chequeBookType, voucherNumber, chequeBookReference }) {
  const params = new URLSearchParams({
    chequeBookType: String(chequeBookType),
    voucherNumber: String(voucherNumber),
    chequeBookReference: chequeBookReference || "",
  });
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/vouchers/match?${params.toString()}`));
}

// Fetch-edit-resubmit contract (same as ChequeTypeController.Update) — pass
// the whole voucher row back, edited. Returns `data: null` on success, not
// the updated voucher — re-fetch the voucher list after a successful call.
export function payVoucher(id, paymentVoucherDTO) {
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/vouchers/${id}/pay`, { method: "POST", body: JSON.stringify(paymentVoucherDTO) }));
}

// Doesn't run full ValidateAll() server-side — only Reference/ManagementAction
// are read, but send the whole fetched row back anyway for consistency with payVoucher.
export function flagVoucher(id, paymentVoucherDTO) {
  return unwrap(apiFetch(`${CHEQUEBOOKS_BASE}/vouchers/${id}/flag`, { method: "POST", body: JSON.stringify(paymentVoucherDTO) }));
}
