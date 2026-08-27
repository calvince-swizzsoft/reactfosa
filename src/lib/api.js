import { getToken, clearToken, clearRoles, clearUserName } from "@/lib/auth";
import { ApiError, readApiResponse } from "@/lib/api-errors";

export { ApiError, apiErrorFromResponse, apiErrorMessage, isAbortError, readApiResponse, readResponseBody } from "@/lib/api-errors";

// Attaches Authorization: Bearer <token>, defaults Content-Type to
// application/json when a non-FormData body is present, lets caller
// headers win, and force-logs-out + redirects to /login on a 401.
// Still returns the Response as-is so existing `if (!res.ok) throw ...`
// error-toast handling in callers keeps working unchanged.
export async function apiFetch(url, options = {}) {
  const { headers: callerHeaders, body, ...rest } = options;

  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  new Headers(callerHeaders).forEach((value, key) => headers.set(key, value));

  const response = await fetch(url, { ...rest, headers, body });

  if (response.status === 401) {
    clearToken();
    clearRoles();
    clearUserName();
    window.location.href = "/login";
  }

  return response;
}

export async function apiJson(url, options = {}, config = {}) {
  try {
    const response = await apiFetch(url, options);
    return await readApiResponse(response, config);
  } catch (error) {
    if (error instanceof ApiError || error?.name === "AbortError") throw error;

    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "The server could not be reached. Check your connection and try again.",
      cause: error,
    });
  }
}

// Unwraps a list out of whichever envelope shape the endpoint uses: a bare
// array, { data: [...] } / { Data: [...] }, or the paged
// { data: { pageCollection: [...] } } / { PageCollection: [...] } shape
// used by every *-api-spec.md-documented paged endpoint (branches,
// companies, standing orders, ...). Several pages had their own
// hand-duplicated version of this that only checked the bare-array/`.data`
// cases — those silently returned [] the moment an endpoint they called
// switched to the paged envelope (this is what broke the branch dropdowns
// across the app when branch-api-spec.md's GET / started returning
// PageCollectionInfo instead of a bare array). Use this instead of
// re-deriving the check per file.
export function normalizeList(response) {
  const payload = response?.data ?? response?.Data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
  if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
  return [];
}
