const TOKEN_KEY = "token";
const ROLES_KEY = "roles";
const USERNAME_KEY = "userName";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserName() {
  return localStorage.getItem(USERNAME_KEY);
}

export function setUserName(userName) {
  localStorage.setItem(USERNAME_KEY, userName);
}

export function clearUserName() {
  localStorage.removeItem(USERNAME_KEY);
}

export function getRoles() {
  try {
    const stored = JSON.parse(localStorage.getItem(ROLES_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function setRoles(roles) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(Array.isArray(roles) ? roles : []));
}

export function clearRoles() {
  localStorage.removeItem(ROLES_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Reads the "EmployeeId" claim out of the JWT payload client-side — the
// same claim name JwtTokenService.cs embeds and EndOfDayController.cs (and
// friends) resolve server-side via ClaimsPrincipal.FindFirst("EmployeeId").
// The payload segment is only base64url-encoded, not encrypted, so decoding
// it here doesn't expose anything the server doesn't already trust this
// token to carry. Used where a screen needs to look up "my own" teller/
// employee record (no self-lookup endpoint exists — every lookup takes an
// explicit employeeId).
export function getEmployeeIdFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json);
    return claims.EmployeeId || null;
  } catch {
    return null;
  }
}

// BranchId is issued by JwtTokenService for the authenticated user.
export function getBranchIdFromToken() {
  try {
    const payload = getToken()?.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const branchId = claims.BranchId;
    return typeof branchId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId) && branchId !== "00000000-0000-0000-0000-000000000000"
      ? branchId : null;
  } catch {
    return null;
  }
}