import assert from "node:assert/strict";
import {
  ApiError,
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
assert.equal(internalError.message, "An unexpected error occurred.");
assert.equal(apiErrorMessage(new ApiError({ message: "Failed.", correlationId: "abc-123" })), "Failed.\nReference: abc-123");

console.log("All frontend API error-handling tests passed.");
