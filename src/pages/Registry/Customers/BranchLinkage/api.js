import { apiJson as apiFetch } from "@/lib/api";

// Client for the real, live CustomerController.cs (api/registry/customer,
// singular). PUT {id}/branch wraps ICustomerAppService.UpdateCustomerBranch,
// which was already fully built but had no REST endpoint. Unlike Station
// Linkage, this doesn't touch a Customer.BranchId field — there isn't one —
// it reassigns every account the customer already has to the given branch,
// so it fails for a customer with no accounts yet. There's also no
// reset/unlink counterpart in the app service, matching
// Areas/Registry/Branch linkage.md, which only documents linking.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_BASE = `${BASE}/api/registry/customer`;
export const BRANCHES_BASE = `${BASE}/api/administration/branches`;

async function unwrapJson(responsePromise) {
  const body = await responsePromise;
  return body?.data ?? body;
}

/** PUT /{id}/branch — reassigns the customer's accounts to the given branch. */
export function linkCustomerToBranch(customerId, branchId) {
  return unwrapJson(apiFetch(`${CUSTOMER_BASE}/${customerId}/branch`, {
    method: "PUT",
    body: JSON.stringify({ Id: customerId, BranchId: branchId }),
  }));
}
