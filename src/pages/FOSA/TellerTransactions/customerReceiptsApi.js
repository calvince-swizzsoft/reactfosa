import { apiFetch } from "@/lib/api";

// Client for WebApplication1's CustomerReceiptsController
// (Controllers/CustomerReceiptsController.cs, base
// api/frontoffice/customerreceipts), docs/api/frontoffice-api-spec.md §13.
// Free-form single-line GL receipt at the till, not tied to a specific
// customer account transaction type. No apportioned/multi-line posting
// (confirmed against source — IJournalAppService has no such overload) and
// no GET/list endpoint exists at all — receipt-only screen.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_RECEIPTS_BASE = `${FIN_BASE}/api/frontoffice/customerreceipts`;

// request: { ChartOfAccountId, TotalValue, Reference, PrimaryDescription,
// ModuleNavigationItemCode } — PascalCase, confirmed against the real
// CustomerReceiptRequest C# class. Plain BadRequest(string) failures
// serialize as { Message }, capital M.
export async function createCustomerReceipt(request) {
  const res = await apiFetch(CUSTOMER_RECEIPTS_BASE, { method: "POST", body: JSON.stringify(request) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.Message || body?.message || `Request failed (${res.status})`);
  }
  return body?.data ?? body;
}
