import { apiFetch } from "@/lib/api";

// Client for WebApplication1's SundryPaymentsController
// (Controllers/SundryPaymentsController.cs — note: not under an Areas/
// folder, unlike every other FrontOffice controller, but still routed at
// api/frontoffice/sundrypayments), docs/api/frontoffice-api-spec.md §13.
// No dedicated app service backs this — a single-line GL voucher posted
// straight through IJournalAppService against the caller's own teller cash
// account. No GET/list endpoint exists at all (confirmed against the real
// controller source, not just the doc) — this is a receipt-only screen,
// same shape as FOSA/TreasuryTransactions/CashManagement.jsx.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const SUNDRY_PAYMENTS_BASE = `${FIN_BASE}/api/frontoffice/sundrypayments`;

// request: { TransactionType, ChartOfAccountId, TotalValue, Reference,
// PrimaryDescription, ModuleNavigationItemCode } — PascalCase, confirmed
// against the real SundryPaymentRequest C# class. Plain BadRequest(string)
// failures (missing teller, unsupported type, ...) serialize as
// { Message }, capital M — same as CashDepositController's requestsApi.js.
export async function createSundryPayment(request) {
  const res = await apiFetch(SUNDRY_PAYMENTS_BASE, { method: "POST", body: JSON.stringify(request) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}
