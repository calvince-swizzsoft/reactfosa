import { apiFetch } from "@/lib/api";

// Client for WebApplication1's SundryPaymentsController
// (Areas/FrontOffice/Controllers/SundryPaymentsController.cs),
// api/frontoffice/sundrypayments — docs/api/frontoffice-api-spec.md §13.
// No dedicated app service backs this — a single-line GL voucher posted
// straight through IJournalAppService against the caller's own teller cash
// account. No GET/list endpoint exists for this controller itself — Cash
// Pickup and Cash Payment (Account Closure) instead browse an existing
// queue on a DIFFERENT controller (credit batches / account closures) and
// resolve chartOfAccountId/totalValue off the picked row before posting
// here.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const SUNDRY_PAYMENTS_BASE = `${FIN_BASE}/api/frontoffice/sundrypayments`;
const CREDIT_BATCHES_BASE = `${FIN_BASE}/api/accounts/creditbatches`;

// request: { TransactionType, ChartOfAccountId, TotalValue, Reference,
// PrimaryDescription, ModuleNavigationItemCode, CreditBatchEntryId } —
// PascalCase, confirmed against the real SundryPaymentRequest C# class.
// CreditBatchEntryId is required (and validated server-side) only when
// TransactionType is CashPickup (8); ignored otherwise. Plain
// BadRequest(string) failures (missing teller, unsupported type, ...)
// serialize as { Message }, capital M — same as CashDepositController's
// requestsApi.js.
export async function createSundryPayment(request) {
  const res = await apiFetch(SUNDRY_PAYMENTS_BASE, { method: "POST", body: JSON.stringify(request) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}

// The Cash Pickup picker queue — CreditBatchController.GetByType. Not
// filtered by entry status server-side (only date range/type/text), so
// the caller must filter the result for Status === BatchEntryStatus.Pending
// itself. creditBatchType must be CreditBatchType's own numeric value
// (56028 for CashPickup), NOT GeneralTransactionType.CashPickup (8) —
// the two enums share a name but not a value, confirmed against source.
export async function listCreditBatchEntriesByType(creditBatchType, { startDate, endDate, text = "", pageIndex = 0, pageSize = 100 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const res = await apiFetch(`${CREDIT_BATCHES_BASE}/entries/type/${creditBatchType}?${params.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.message || body?.Message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}
