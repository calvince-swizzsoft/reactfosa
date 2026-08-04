import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's CustomerAccountManagementController
// — additional sub-routes on the same /api/accounts/customer-accounts
// resource as index.jsx/CustomerAccountDrawer.jsx, not a separate resource.
// Spec: SwiftFinancialz/docs/api/customer-account-management-api-spec.md

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_ACCOUNT_BASE = `${FIN_BASE}/api/accounts/customer-accounts`;

export const CustomerAccountRemarkType = {
  Actionable: 0,
  Informational: 1,
};

// Raw CustomerAccountManagementAction values — only needed for filtering
// GET /history by action; the five POST action endpoints hide these from
// callers entirely (the controller picks the code for you). The gaps
// (48836, 48837) are real, not omissions on this app's part.
export const CustomerAccountManagementAction = {
  Activation: 48833,
  Deactivation: 48834, // "Freeze" in the UI/endpoint name
  Remark: 48835,
  Closure: 48838,
  SigningInstructions: 48839,
};

// On these five endpoints `data` is always null and `success` mirrors
// whatever ManageCustomerAccount returned — a 200 with success:false means
// the action didn't take effect, so check success explicitly rather than
// just the HTTP status. unwrap() already throws on success:false regardless
// of status code, so callers just await + try/catch as usual.
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

const manage = (customerAccountId, action, { remarks, remarkType }) =>
  unwrap(
    apiFetch(`${CUSTOMER_ACCOUNT_BASE}/${customerAccountId}/${action}`, {
      method: "POST",
      body: JSON.stringify({ remarks, remarkType }),
    })
  );

/** POST /{id}/activate */
export const activateCustomerAccount = (customerAccountId, body) => manage(customerAccountId, "activate", body);

/** POST /{id}/freeze — also triggers frozen-account member alerts on success. */
export const freezeCustomerAccount = (customerAccountId, body) => manage(customerAccountId, "freeze", body);

/** POST /{id}/close */
export const closeCustomerAccount = (customerAccountId, body) => manage(customerAccountId, "close", body);

/**
 * POST /{id}/remark — no state change, just appends a note to the account's
 * history. This *is* the account-remark feature; there's no separate
 * remarks CRUD.
 */
export const remarkCustomerAccount = (customerAccountId, body) => manage(customerAccountId, "remark", body);

/**
 * POST /{id}/signing-instructions — logs a change to *how* the account
 * should be signed against (mandate rules), distinct from the signatory
 * list itself (see signatoryApi.js).
 */
export const setSigningInstructions = (customerAccountId, body) => manage(customerAccountId, "signing-instructions", body);

/**
 * GET /{id}/history — unpaged audit trail. Omit managementAction for full
 * history, or pass one of CustomerAccountManagementAction to filter.
 * Returns CustomerAccountHistoryDTO[].
 */
export function getCustomerAccountHistory(customerAccountId, { managementAction } = {}) {
  const qs = managementAction !== undefined && managementAction !== null
    ? `?managementAction=${managementAction}`
    : "";
  return unwrap(apiFetch(`${CUSTOMER_ACCOUNT_BASE}/${customerAccountId}/history${qs}`));
}
