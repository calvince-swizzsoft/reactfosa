const TOKEN_KEY = "token";
const ROLES_KEY = "roles";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
