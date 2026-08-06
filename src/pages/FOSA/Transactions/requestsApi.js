import { apiFetch, normalizeList } from "@/lib/api";

// Client functions for WebApplication1's CashDepositController
// (Areas/FrontOffice/Controllers/CashDepositController.cs), base
// api/frontoffice/requests — handles all 4 FrontOfficeTransactionType
// values (CashDeposit/CashWithdrawal/ChequeDeposit/CashWithdrawalPaymentVoucher)
// through one unified Create action.
//
// Read directly from the real controller (docs/api/frontoffice-api-spec.md
// undersold a few load-bearing details):
// - Create() ALWAYS reads the selected account off `creditCustomerAccountId`
//   first, regardless of transaction type — even for a withdrawal, this is
//   the field that resolves "which account", not debitCustomerAccountId.
// - Create()'s response on the "requires authorization" path nests the
//   dialog payload under `data` (dialog/cashTransactionRequestId/
//   transactionCategory/...), not top-level.
// - GET / only ever returns real rows for type=1 (CashWithdrawal) or type=2
//   (CashDeposit) — any other type value comes back an empty page. Cheque
//   deposits and payment vouchers don't have their own list/type here;
//   cheque deposits never create a pending request at all (always post
//   directly), and an above-limit payment voucher is stored as an ordinary
//   CashWithdrawalRequest (TransactionType hardcoded back to plain
//   CashWithdrawal server-side) — there is no reliable way to filter "just
//   the voucher-flavored withdrawal requests" out of that list.
// - PostCashDepositRequest (`POST /post?id=`) only ever looks up a
//   CashDepositRequest or a CashWithdrawalRequest by that id — never a
//   cheque-deposit or payment-voucher-specific request row (because
//   neither of those exist as distinct request types). Payment vouchers
//   that got queued for authorization post through this same endpoint,
//   same as an ordinary cash withdrawal.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const REQUESTS_BASE = `${FIN_BASE}/api/frontoffice/requests`;

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Plain BadRequest(string) on this controller serializes as
    // { Message } (capital M), not the usual { message } envelope.
    const err = new Error(body?.Message || body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

/**
 * GET / — paged request queue. `type` is required to get real rows
 * (1 = CashWithdrawal, 2 = CashDeposit only — see module note above).
 * `status` should be passed explicitly per tab (server defaults to
 * Pending if omitted, which silently hides every other tab's rows).
 * Returns PageCollectionInfo<CashDepositRequestDTO | CashWithdrawalRequestDTO>.
 */
export async function listRequests({ type, status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ type: String(type), pageIndex: String(pageIndex), pageSize: String(pageSize), text });
  if (status !== undefined && status !== null) params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const body = await unwrap(apiFetch(`${REQUESTS_BASE}?${params.toString()}`));
  return body?.data ?? body;
}

/**
 * POST / — submit a transaction. `model` is a full CustomerTransactionModel
 * (or the subset the backend actually reads for this Type — see per-page
 * comments for exactly which fields matter for each of the 4 types).
 *
 * Three possible outcomes, all HTTP 200 (this endpoint never uses non-2xx
 * for business outcomes, only for genuine exceptions):
 * - { success: true, data: JournalDTO } — posted directly, render a receipt.
 * - { success: false, data: { dialog: true, ... } } — queued for
 *   authorization; nothing more to do here until a checker approves it.
 * - { success: false, data: null } — blocked (teller locked, account not
 *   approved, below minimum, etc.) — show `message`.
 */
export async function createTransaction(model) {
  const res = await apiFetch(REQUESTS_BASE, {
    method: "POST",
    body: JSON.stringify(model),
  });
  return res.json();
}

/**
 * POST /post?id= — post an Authorized CashDepositRequest or
 * CashWithdrawalRequest (including an authorized payment voucher, which is
 * stored as a plain CashWithdrawalRequest — see module note). `id` goes on
 * the query string, not the body or a route segment — the controller binds
 * it as a plain method parameter. 400 if the request isn't Authorized yet.
 */
export async function postAuthorizedRequest(id) {
  const body = await unwrap(apiFetch(`${REQUESTS_BASE}/post?id=${id}`, { method: "POST" }));
  return body?.data ?? body;
}

export { normalizeList };
