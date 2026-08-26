import { ApiError, apiErrorFromResponse, apiFetch, apiJson } from "@/lib/api";

// Client functions for WebApplication1's CustomerAccountStatementController.
// Spec: SwiftFinancialz/docs/api/customer-account-statement-api-spec.md

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const STATEMENT_BASE = `${FIN_BASE}/api/accounts/statements/customer-account`;

async function unwrap(responsePromise) {
  const body = await responsePromise;
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
 * GET /{customerAccountId}/mini — most recent transactions within the last
 * lastXDays days, capped at lastXItems. Always paged server-side (don't
 * assume a bare array). Returns PageCollectionInfo<GeneralLedgerTransaction>.
 */
export function getMiniStatement(customerAccountId, { lastXDays = 90, lastXItems = 20, tallyDebitsCredits = true } = {}) {
  return unwrap(
    apiJson(`${STATEMENT_BASE}/${customerAccountId}/mini${buildQuery({ lastXDays, lastXItems, tallyDebitsCredits })}`)
  );
}

/**
 * GET /{customerAccountId} — full statement for a date range, paged and
 * text-searchable. 400 if startDate is after endDate.
 * Returns PageCollectionInfo<GeneralLedgerTransaction>.
 */
export function getFullStatement(customerAccountId, {
  startDate,
  endDate,
  pageIndex = 0,
  pageSize = 20,
  text,
  journalEntryFilter,
  tallyDebitsCredits = true,
} = {}) {
  return unwrap(
    apiJson(`${STATEMENT_BASE}/${customerAccountId}${buildQuery({ startDate, endDate, pageIndex, pageSize, text, journalEntryFilter, tallyDebitsCredits })}`)
  );
}

/**
 * GET /{customerAccountId}/print — raw PDF, not the { success, message,
 * data } envelope. `chargeForPrinting: true` posts a real statement-printing
 * fee to the account — never default this to true without the user
 * explicitly asking for a charged printout.
 *
 * Returns a Blob. On failure, throws with whatever text body the server
 * sent (a plain HttpError, not the usual envelope, per the spec).
 */
export async function printStatement(customerAccountId, {
  startDate,
  endDate,
  chargeForPrinting = false,
  includeInterestStatement = false,
  moduleNavigationItemCode,
} = {}) {
  try {
    const res = await apiFetch(
      `${STATEMENT_BASE}/${customerAccountId}/print${buildQuery({ startDate, endDate, chargeForPrinting, includeInterestStatement, moduleNavigationItemCode })}`
    );
    const contentType = res.headers.get("Content-Type") || "";
    if (!res.ok || !contentType.includes("application/pdf")) {
      const text = await res.text().catch(() => "");
      throw apiErrorFromResponse(res, text, "Unable to generate the statement PDF.");
    }
    return res.blob();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "The server could not be reached. Check your connection and try again.",
      cause: error,
    });
  }
}

// Triggers a browser download for the blob returned by printStatement().
export function downloadPdfBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
