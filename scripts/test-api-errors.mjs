import assert from "node:assert/strict";
import {
  ApiError,
  apiTransportError,
  fetchWithApiErrors,
  apiErrorFromResponse,
  apiErrorMessage,
  readApiResponse,
} from "../src/lib/api-errors.js";

const response = (status, body, headers = {}) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const conflictResponse = response(409, {
  code: "RESOURCE_CONFLICT",
  message: "This record is already pending approval.",
  correlationId: "corr-body",
});

await assert.rejects(
  () => readApiResponse(conflictResponse),
  (error) =>
    error instanceof ApiError &&
    error.status === 409 &&
    error.code === "RESOURCE_CONFLICT" &&
    error.correlationId === "corr-body",
);

const validationError = apiErrorFromResponse(
  response(400, null, { "X-Correlation-ID": "corr-header" }),
  { message: "Validation failed.", validationErrors: { Name: ["Name is required."] } },
);
assert.equal(validationError.correlationId, "corr-header");
assert.deepEqual(validationError.validationErrors, { Name: ["Name is required."] });

const legacyResponse = response(200, { success: false, message: "The operation was declined." });
await assert.rejects(
  () => readApiResponse(legacyResponse),
  (error) => error instanceof ApiError && error.message === "The operation was declined.",
);

const internalError = apiErrorFromResponse(response(500, null), {}, null);
assert.equal(internalError.message, "The server could not complete the request. If this continues, contact your administrator.");
assert.equal(apiErrorMessage(new ApiError({ message: "Failed.", correlationId: "abc-123" })), "Failed.\nReference: abc-123");

const plainTextError = apiErrorFromResponse(response(400, null), "Customer must have an account.");
assert.equal(plainTextError.message, "Customer must have an account.");

const problemDetailsError = apiErrorFromResponse(response(400, null), {
  title: "Validation failed",
  detail: "The selected customer cannot be linked yet.",
});
assert.equal(problemDetailsError.message, "The selected customer cannot be linked yet.");

const modelStateError = apiErrorFromResponse(response(400, null), {
  errors: { BranchId: ["The selected branch does not exist."], CustomerId: ["The customer is required."] },
});
assert.equal(modelStateError.message, "The selected branch does not exist.\nThe customer is required.");

const nestedError = apiErrorFromResponse(response(400, null), {
  error: { code: "MAKER_CHECKER_VIOLATION", message: "The customer must have at least one account before being linked." },
});
assert.equal(nestedError.message, "The customer must have at least one account before being linked.");
assert.equal(nestedError.code, "MAKER_CHECKER_VIOLATION");

const budgetFields = { "request.Entries[0].ChartOfAccountId": ["Line 1: select a valid G/L account."] };
const budgetError = apiErrorFromResponse(response(400, null), {
  success: false,
  message: "Check the highlighted budget fields.",
  error: { code: "VALIDATION_FAILED", validationErrors: budgetFields },
  correlationId: "budget-validation-reference",
});
assert.deepEqual(budgetError.validationErrors, budgetFields);
assert.equal(budgetError.correlationId, "budget-validation-reference");
assert.equal(budgetError.code, "VALIDATION_FAILED");

const network = apiTransportError(new TypeError("Failed to fetch"), {online:true});
assert.equal(network.code, "NETWORK_ERROR");
assert.match(network.message, /Cannot connect to the server/);
assert.doesNotMatch(network.message, /Failed to fetch/);
assert.equal(apiTransportError(new TypeError("Failed to fetch"), {online:false}).code, "NETWORK_OFFLINE");
assert.match(apiTransportError(new TypeError("Failed to fetch"), {method:"POST"}).message, /check whether your previous action completed/);
assert.equal(apiTransportError(new DOMException("Timed out", "TimeoutError")).code, "REQUEST_TIMEOUT");
const cancelled = new DOMException("Cancelled", "AbortError");
assert.equal(apiTransportError(cancelled), cancelled);
const customCancel = new Error("Navigation changed");
assert.equal(apiTransportError(customCancel, {signal:{aborted:true,reason:customCancel}}), customCancel);
assert.equal(apiTransportError(validationError), validationError);
assert.match(apiErrorMessage(new TypeError("Failed to fetch")), /Cannot connect|offline/);
assert.equal(apiErrorMessage(new Error("Choose a customer.")), "Choose a customer.");
for (const status of [404, 500, 502, 503, 504]) {
  const html = new Response("<!DOCTYPE html><html><body>Internal server details</body></html>", {status});
  await assert.rejects(() => readApiResponse(html), error => error instanceof ApiError && error.status === status && !error.message.includes("<html>") && !error.message.includes("Internal server details"));
}
await assert.rejects(() => readApiResponse(new Response("<!doctype html><html>Application shell</html>", {status:200})), error => error.code === "UNEXPECTED_RESPONSE");
assert.equal(await readApiResponse(new Response("Operation complete", {status:200})), "Operation complete");
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(() => fetchWithApiErrors("http://localhost/api", {method:"POST"}), error => error.code === "NETWORK_ERROR" && error.message.includes("previous action completed"));
  globalThis.fetch = async () => { throw cancelled; };
  await assert.rejects(() => fetchWithApiErrors("http://localhost/api"), error => error === cancelled);
  const missing = response(404, {message:"Selected loan no longer exists."});
  globalThis.fetch = async () => missing;
  assert.equal(await fetchWithApiErrors("http://localhost/api"), missing, "Raw fetch callers retain their HTTP response handling contract");
  await assert.rejects(() => readApiResponse(missing), error => error.message === "Selected loan no longer exists.");
} finally { globalThis.fetch = originalFetch; }
console.log("All frontend API error-handling tests passed (network, offline, timeout, cancellation, HTTP failures and server validation).");
