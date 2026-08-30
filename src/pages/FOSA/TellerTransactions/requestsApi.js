import {
  apiErrorFromResponse,
  apiFetch,
  apiJson,
  normalizeList,
  readResponseBody,
} from "@/lib/api";

// Client functions for WebApplication1's CashDepositController
// (Areas/FrontOffice/Controllers/CashDepositController.cs), base
// api/frontoffice/requests — handles all 4 FrontOfficeTransactionType
// values (CashDeposit/CashWithdrawal/ChequeDeposit/CashWithdrawalPaymentVoucher)
// through one unified Create action. This is the "Savings Receipts/Payments"
// screen — the app's real nav tree only ever had one menu item for this
// whole cycle (NavigationMenu.cs, ControllerName: CashDeposit), not four.
//
// Read directly from the real controller and
// SAVINGS-RECEIPTS-PAYMENTS-FLOW.md / -FORM-LAYOUT.md (docs/api spec
// undersold a few load-bearing details):
// - Create() ALWAYS reads the selected account off `creditCustomerAccountId`
//   first, regardless of transaction type — even for a withdrawal, this is
//   the field that resolves "which account", not debitCustomerAccountId.
// - Create()'s response on the "requires authorization" path nests the
//   dialog payload under `data` (dialog/cashTransactionRequestId/
//   transactionCategory/...), not top-level.
// - GET /queue with `type` omitted returns the deposit+withdrawal queues
//   MERGED into one page, sorted by CreatedDate descending, paged as a
//   combined set (fixed server-side — used to come back empty). Each row
//   keeps its own native DTO shape (CashDepositRequestDTO or
//   CashWithdrawalRequestDTO) — inspect TransactionType (1/2) client-side
//   to tell them apart or filter to one type, no second call needed.
//   `type=1`/`type=2` still scope to a single source, same as before.
//   `type=3`/`type=4` (ChequeDeposit/PaymentVoucher) always come back
//   empty — cheque deposits never create a pending request at all (always
//   post directly), and an above-limit payment voucher is stored as an
//   ordinary CashWithdrawalRequest (TransactionType hardcoded back to
//   plain CashWithdrawal, Category = PaymentVoucher) — it already surfaces
//   inside type=1/merged results, filter on Category instead.
// - PostCashDepositRequest (`POST /post?id=`) only ever looks up a
//   CashDepositRequest or a CashWithdrawalRequest by that id — never a
//   cheque-deposit or payment-voucher-specific request row (because
//   neither of those exist as distinct request types). Payment vouchers
//   that got queued for authorization post through this same endpoint,
//   same as an ordinary cash withdrawal.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const REQUESTS_BASE = `${FIN_BASE}/api/frontoffice/requests`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body;
}

/**
 * GET /queue — paged request queue. `type` is optional — omit it for the merged
 * deposit+withdrawal queue (see module note above), or pass 1/2 to scope to
 * a single source. `status` should be passed explicitly per tab (server
 * defaults to Pending if omitted, which silently hides every other tab's
 * rows). Returns PageCollectionInfo<CashDepositRequestDTO |
 * CashWithdrawalRequestDTO | object> (mixed shape when `type` is omitted).
 */
export async function listRequests({ type, status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 }) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize), text });
  if (type !== undefined && type !== null) params.set("type", String(type));
  if (status !== undefined && status !== null) params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const body = await unwrap(apiJson(`${REQUESTS_BASE}/queue?${params.toString()}`));
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
  const response = await apiFetch(REQUESTS_BASE, {
    method: "POST",
    body: JSON.stringify(model),
  });
  const body = await readResponseBody(response);

  // A false success flag is a valid HTTP 200 business result here: it may
  // carry the authorization dialog. Only transport failures should throw.
  if (!response.ok) {
    throw apiErrorFromResponse(response, body, "Unable to create the transaction.");
  }

  // The endpoint has existed with both the Web API anonymous-object casing
  // (success/message/data) and the DTO casing used by some deployments
  // (Success/Message/Data). Keep that transport detail out of the screen so
  // an authorization-required response is not mistaken for an unexplained
  // transaction failure.
  const data = body?.data ?? body?.Data ?? null;

  return {
    success: body?.success ?? body?.Success ?? false,
    message: body?.message ?? body?.Message ?? "",
    data: data
      ? {
          ...data,
          dialog: data.dialog ?? data.Dialog ?? false,
          isCashDepositRequest:
            data.isCashDepositRequest ?? data.IsCashDepositRequest ?? false,
          isCashWithdrawalRequest:
            data.isCashWithdrawalRequest ?? data.IsCashWithdrawalRequest ?? false,
          selectedCustomerAccountId:
            data.selectedCustomerAccountId ?? data.SelectedCustomerAccountId,
          transactionTotalValue:
            data.transactionTotalValue ?? data.TransactionTotalValue,
          transactionReference:
            data.transactionReference ?? data.TransactionReference,
          cashTransactionRequestId:
            data.cashTransactionRequestId ?? data.CashTransactionRequestId,
          transactionCategory:
            data.transactionCategory ?? data.TransactionCategory,
        }
      : null,
  };
}

/**
 * POST /post?id= — post an Authorized CashDepositRequest or
 * CashWithdrawalRequest (including an authorized payment voucher, which is
 * stored as a plain CashWithdrawalRequest — see module note). `id` goes on
 * the query string, not the body or a route segment — the controller binds
 * it as a plain method parameter. 400 if the request isn't Authorized yet.
 */
export async function postAuthorizedRequest(id) {
  const body = await unwrap(apiJson(`${REQUESTS_BASE}/post?id=${id}`, { method: "POST" }));
  return body?.data ?? body;
}

export async function resendApprovalRequest(id) {
  return unwrap(apiJson(`${REQUESTS_BASE}/resend-approval?id=${encodeURIComponent(id)}`, { method: "POST" }));
}

export { normalizeList };
