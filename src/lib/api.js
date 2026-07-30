import { getToken, clearToken, clearRoles, clearUserName } from "@/lib/auth";

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
