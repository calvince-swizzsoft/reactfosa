import { apiJson } from "@/lib/api";

// Client functions for WebApplication1's CustomerAccountSignatoryController
// — additional sub-routes on the same /api/accounts/customer-accounts
// resource as index.jsx/managementApi.js, not a separate resource.
// Spec: SwiftFinancialz/docs/api/customer-account-signatory-api-spec.md

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_ACCOUNT_BASE = `${FIN_BASE}/api/accounts/customer-accounts`;

export const SignatoryRelationship = {
  Unknown: 0,
  Father: 57023,
  Mother: 57024,
  Brother: 57025,
  Sister: 57026,
  Wife: 57027,
  Husband: 57028,
  Son: 57029,
  Daughter: 57030,
};

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body.data;
}

/** GET /{customerAccountId}/signatories — paged. Returns PageCollectionInfo<CustomerAccountSignatoryDTO>. */
export function listSignatories(customerAccountId, { pageIndex = 0, pageSize = 20 } = {}) {
  return unwrap(
    apiJson(`${CUSTOMER_ACCOUNT_BASE}/${customerAccountId}/signatories?pageIndex=${pageIndex}&pageSize=${pageSize}`)
  );
}

/**
 * GET /{customerAccountId}/signatories/all — unpaged. Prefer
 * listSignatories() for anything rendered as a table; this is for cases
 * that genuinely need the full set (e.g. a signature-count check).
 */
export function listAllSignatories(customerAccountId) {
  return unwrap(apiJson(`${CUSTOMER_ACCOUNT_BASE}/${customerAccountId}/signatories/all`));
}

/**
 * POST /{customerAccountId}/signatories — the controller overwrites
 * `customerAccountId` on the body from the URL, so it doesn't need to be
 * set here. Required: firstName, lastName, identityCardNumber.
 */
export function addSignatory(customerAccountId, signatory) {
  return unwrap(
    apiJson(`${CUSTOMER_ACCOUNT_BASE}/${customerAccountId}/signatories`, {
      method: "POST",
      body: JSON.stringify(signatory),
    })
  );
}

/**
 * DELETE /signatories — NOT scoped under a customerAccountId; signatory ids
 * are globally unique. Takes a flat array of ids. success:true means at
 * least one was removed — ids that don't resolve are silently skipped, so a
 * partial match still reports success. Re-fetch the list afterward if you
 * need to confirm exactly which ones were removed.
 */
export function removeSignatories(ids) {
  return unwrap(
    apiJson(`${CUSTOMER_ACCOUNT_BASE}/signatories`, {
      method: "DELETE",
      body: JSON.stringify(ids),
    })
  );
}
