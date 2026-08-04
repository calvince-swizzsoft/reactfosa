import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's GeneralLedgerStatementController.
// Spec: SwiftFinancialz/docs/api/general-ledger-statement-api-spec.md

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const GL_STATEMENT_BASE = `${FIN_BASE}/api/accounts/statements/gl-account`;

// transactionDateFilter (by-account / unscoped browse implicitly use
// CreatedDate too, per the spec's default) — which date field
// startDate/endDate compare against.
export const TransactionDateFilter = {
  ValueDate: 1,
  CreatedDate: 2,
};

async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const err = new Error(body.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return body.data;
}

const buildQuery = (params) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    usp.set(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
};

/**
 * GET /{chartOfAccountId} — ledger statement for one G/L account, free-text
 * searchable. An unknown chartOfAccountId comes back as an empty page
 * (itemsCount: 0), not a 404 — unlike the customer-account statement API.
 * Returns PageCollectionInfo<GeneralLedgerTransaction>.
 */
export function getGlAccountStatement(chartOfAccountId, {
  startDate,
  endDate,
  pageIndex = 0,
  pageSize = 20,
  text,
  journalEntryFilter,
  transactionDateFilter = TransactionDateFilter.CreatedDate,
  tallyDebitsCredits = true,
} = {}) {
  return unwrap(
    apiFetch(`${GL_STATEMENT_BASE}/${chartOfAccountId}${buildQuery({ startDate, endDate, pageIndex, pageSize, text, journalEntryFilter, transactionDateFilter, tallyDebitsCredits })}`)
  );
}

/**
 * GET /{chartOfAccountId}/by-transaction-code — same as getGlAccountStatement
 * but narrowed by a known SystemTransactionCode instead of free text.
 * `transactionCode` is required.
 */
export function getGlAccountStatementByTransactionCode(chartOfAccountId, {
  startDate,
  endDate,
  pageIndex = 0,
  pageSize = 20,
  transactionCode,
  reference,
  transactionDateFilter = TransactionDateFilter.CreatedDate,
  tallyDebitsCredits = true,
} = {}) {
  return unwrap(
    apiFetch(`${GL_STATEMENT_BASE}/${chartOfAccountId}/by-transaction-code${buildQuery({ startDate, endDate, pageIndex, pageSize, transactionCode, reference, transactionDateFilter, tallyDebitsCredits })}`)
  );
}

/**
 * GET / — unscoped browse across every G/L posting in the date range (no
 * chartOfAccountId). Back-office "all transactions" audit view — expect a
 * lot of rows on a live system; always page it.
 */
export function browseGlPostings({
  startDate,
  endDate,
  pageIndex = 0,
  pageSize = 20,
  text,
  journalEntryFilter,
} = {}) {
  return unwrap(
    apiFetch(`${GL_STATEMENT_BASE}${buildQuery({ startDate, endDate, pageIndex, pageSize, text, journalEntryFilter })}`)
  );
}
