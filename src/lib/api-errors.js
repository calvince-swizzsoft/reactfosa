const DEFAULT_MESSAGES = {
  400: "The request is invalid.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "The request conflicts with the current state of the resource.",
  429: "Too many requests. Please wait and try again.",
  502: "A required service is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
  504: "A required service took too long to respond.",
};

export class ApiError extends Error {
  constructor({ status = 0, code = "REQUEST_FAILED", message, correlationId = null, validationErrors = null, cause } = {}) {
    super(message || DEFAULT_MESSAGES[status] || "The request could not be completed.", cause ? { cause } : undefined);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
    this.validationErrors = validationErrors;
  }
}

export async function readResponseBody(response) {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function collectValidationMessages(value, messages = []) {
  if (typeof value === "string") {
    const message = nonEmptyString(value);
    if (message) messages.push(message);
    return messages;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectValidationMessages(item, messages));
    return messages;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectValidationMessages(item, messages));
  }

  return messages;
}

function responseMessage(body) {
  if (typeof body === "string") return nonEmptyString(body);
  if (!body || typeof body !== "object") return null;

  // Preserve the server's explanation across the response formats used by
  // Web API, ASP.NET Problem Details, and older controller envelopes.
  const direct =
    nonEmptyString(body.message) ||
    nonEmptyString(body.Message) ||
    nonEmptyString(body.detail) ||
    nonEmptyString(body.Detail) ||
    nonEmptyString(body.title) ||
    nonEmptyString(body.Title) ||
    nonEmptyString(body.error_description) ||
    nonEmptyString(body.errorDescription) ||
    nonEmptyString(body.error);
  if (direct) return direct;

  const nestedError = body.error || body.Error;
  if (nestedError && typeof nestedError === "object") {
    const nested = responseMessage(nestedError);
    if (nested) return nested;
  }

  const validationErrors =
    body.validationErrors || body.ValidationErrors || body.errors || body.Errors || body.ModelState;
  const validationMessages = [...new Set(collectValidationMessages(validationErrors))];
  return validationMessages.length ? validationMessages.join("\n") : null;
}

export function apiErrorFromResponse(response, body, fallbackMessage) {
  const payload = body && typeof body === "object" ? body : {};
  const status = response?.status || 0;
  const validationErrors =
    payload.validationErrors || payload.ValidationErrors || payload.errors || payload.Errors || payload.ModelState || null;

  return new ApiError({
    status,
    code: nonEmptyString(payload.code) || nonEmptyString(payload.Code) || "REQUEST_FAILED",
    message:
      responseMessage(body) ||
      nonEmptyString(fallbackMessage) ||
      DEFAULT_MESSAGES[status] ||
      (status >= 500 ? "An unexpected error occurred." : "The request could not be completed."),
    correlationId:
      nonEmptyString(payload.correlationId) ||
      nonEmptyString(payload.CorrelationId) ||
      nonEmptyString(response?.headers?.get?.("X-Correlation-ID")),
    validationErrors,
  });
}

export async function readApiResponse(response, { fallbackMessage } = {}) {
  const body = await readResponseBody(response);
  const legacyFailure = body && typeof body === "object" && (body.success === false || body.Success === false);

  if (!response.ok || legacyFailure) {
    throw apiErrorFromResponse(response, body, fallbackMessage);
  }

  return body;
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

export function apiErrorMessage(error, fallback = "The request could not be completed.") {
  if (!(error instanceof ApiError)) return nonEmptyString(error?.message) || fallback;
  return error.correlationId ? `${error.message}\nReference: ${error.correlationId}` : error.message;
}
