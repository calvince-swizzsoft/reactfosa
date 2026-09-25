const DEFAULT_MESSAGES = {
  400: "The request is invalid.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested information or service could not be found. Refresh the page. If this continues, contact your administrator.",
  408: "The server timed out while handling the request. Try again shortly.",
  500: "The server could not complete the request. If this continues, contact your administrator.",
  409: "The request conflicts with the current state of the resource.",
  429: "Too many requests. Please wait and try again.",
  502: "The application could not connect to a required server service. Try again shortly. If this continues, contact your administrator.",
  503: "The server is temporarily unavailable or undergoing maintenance. Try again shortly.",
  504: "The server took too long to respond. Try again shortly.",
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

// Browser transport errors do not reveal whether the cause is a stopped API,
// DNS/TLS trouble, CORS, or another connection block. Do not invent a cause.
export function apiTransportError(error, { method = "GET", signal, online = globalThis.navigator?.onLine } = {}) {
  if (error instanceof ApiError) return error;
  const timeout = error?.name === "TimeoutError" || signal?.reason?.name === "TimeoutError";
  if (!timeout && (isAbortError(error) || signal?.aborted)) return error;
  const offline = online === false;
  let message = timeout
    ? "The server took too long to respond. Check your connection and try again shortly."
    : offline
      ? "You appear to be offline. Check your internet or network connection, then try again."
      : "Cannot connect to the server. It may be offline or the connection may be blocked. Check your connection. If this continues, contact your administrator.";
  if (!["GET", "HEAD", "OPTIONS"].includes(String(method).toUpperCase())) {
    message += " Before submitting again, check whether your previous action completed.";
  }
  return new ApiError({ status: 0, code: timeout ? "REQUEST_TIMEOUT" : offline ? "NETWORK_OFFLINE" : "NETWORK_ERROR", message, cause: error });
}

export async function fetchWithApiErrors(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (error) {
    throw apiTransportError(error, options);
  }
}

function isHtmlDocument(value) {
  return typeof value === "string" && /<(?:!doctype\s+html|html\b|head\b|body\b)/i.test(value);
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
  if (typeof body === "string") return isHtmlDocument(body) ? null : nonEmptyString(body);
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
    payload.validationErrors || payload.ValidationErrors || payload.errors || payload.Errors || payload.ModelState ||
    payload.error?.validationErrors || payload.Error?.ValidationErrors || null;

  return new ApiError({
    status,
    code:
      nonEmptyString(payload.code) ||
      nonEmptyString(payload.Code) ||
      nonEmptyString(payload.error?.code) ||
      nonEmptyString(payload.Error?.Code) ||
      "REQUEST_FAILED",
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
  let body;
  try { body = await readResponseBody(response); }
  catch (error) {
    if (isAbortError(error)) throw error;
    if (!response.ok) throw apiErrorFromResponse(response, null, fallbackMessage);
    throw apiTransportError(error);
  }
  if (response.ok && isHtmlDocument(body)) {
    throw new ApiError({status:response.status, code:"UNEXPECTED_RESPONSE", message:"The server returned a web page instead of the requested information. Refresh the page. If this continues, contact your administrator.",correlationId:response.headers?.get?.("X-Correlation-ID")});
  }
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
  if (!(error instanceof ApiError)) {
    if (error?.name === "TimeoutError" || /^(?:Failed to fetch|NetworkError when attempting to fetch resource\.?|Load failed|Network request failed)$/i.test(error?.message || "")) {
      return apiTransportError(error).message;
    }
    return nonEmptyString(error?.message) || fallback;
  }
  return error.correlationId ? `${error.message}\nReference: ${error.correlationId}` : error.message;
}
