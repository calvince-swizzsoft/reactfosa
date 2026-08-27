import { apiJson as apiFetch, normalizeList } from "@/lib/api";

// Client for WebApplication1's ExpensePayableController
// (Controllers/ExpensePayableController.cs — not under an Areas/ folder,
// same as SundryPaymentsController), base api/frontoffice/expensepayables,
// docs/api/frontoffice-api-spec.md §12. Real sequence confirmed against
// source: Create -> Pending; add entry lines; Verify (Post/Reject/Defer) —
// on Post success the controller itself enqueues the generic maker-checker
// Workflow (SystemPermissionType.ExpensePayablesAuthorization), so the
// actual approval/posting happens through the existing checker inbox at
// CommandHub/ApprovalRequests, not a second endpoint here.
//
// AddEntry/RemoveEntries don't call ValidateAll() server-side (confirmed by
// reading the controller directly — only Create does), and PostingPeriodId
// is resolved server-side everywhere else in this app (every FOSA/Accounts
// screen leaves it out of the client payload), so entry PostingPeriodId is
// deliberately omitted here too, not guessed.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const EXPENSE_PAYABLES_BASE = `${FIN_BASE}/api/frontoffice/expensepayables`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

export async function listExpensePayables({ status, text = "", startDate, endDate, pageIndex = 0, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ text, pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (status !== undefined && status !== null && status !== "") params.set("status", String(status));
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return unwrap(apiFetch(`${EXPENSE_PAYABLES_BASE}?${params.toString()}`));
}

export function getExpensePayable(id) {
  return unwrap(apiFetch(`${EXPENSE_PAYABLES_BASE}/${id}`));
}

// pageSize defaults high (1000) here, not 20 — there's no server-computed
// total on this response (confirmed against source, unlike the doc's
// mention of totalApportioned/totalShortage), so the entries list needs to
// be complete for the client to sum a running total against the header's
// TotalValue.
export function listExpensePayableEntries(id, { pageIndex = 0, pageSize = 1000 } = {}) {
  const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  return unwrap(apiFetch(`${EXPENSE_PAYABLES_BASE}/${id}/entries?${params.toString()}`));
}

export function createExpensePayable(expensePayableDTO) {
  return unwrap(apiFetch(EXPENSE_PAYABLES_BASE, { method: "POST", body: JSON.stringify(expensePayableDTO) }));
}

// id on the route overwrites entry.ExpensePayableId server-side.
export function addExpensePayableEntry(id, entryDTO) {
  return unwrap(apiFetch(`${EXPENSE_PAYABLES_BASE}/${id}/entries`, { method: "POST", body: JSON.stringify(entryDTO) }));
}

export function removeExpensePayableEntries(entries) {
  return unwrap(apiFetch(`${EXPENSE_PAYABLES_BASE}/entries/remove`, { method: "POST", body: JSON.stringify(entries) }));
}

// request: { Option, Remarks } — ExpensePayableAuthOption: 1=Post, 2=Reject, 4=Defer.
export function verifyExpensePayable(id, request) {
  return unwrap(apiFetch(`${EXPENSE_PAYABLES_BASE}/${id}/verify`, { method: "POST", body: JSON.stringify(request) }));
}

export { normalizeList };
