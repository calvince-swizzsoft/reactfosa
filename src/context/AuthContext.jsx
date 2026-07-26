import { createContext, useContext, useState } from "react";
import {
  getToken, setToken, clearToken,
  getRoles, setRoles, clearRoles,
  isAuthenticated as hasToken,
} from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [roles, setRolesState] = useState(getRoles());

  const login = (newToken, newRoles = []) => {
    setToken(newToken);
    setTokenState(newToken);
    setRoles(newRoles);
    setRolesState(newRoles);
  };

  const logout = () => {
    clearToken();
    clearRoles();
    setTokenState(null);
    setRolesState([]);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: Boolean(token), userName: token, roles, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

// Exported for the rare non-component call site that needs a synchronous
// read (e.g. attaching an Authorization header outside React).
export { hasToken as isAuthenticated };
