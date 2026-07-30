import { createContext, useContext, useState } from "react";
import {
  getToken, setToken, clearToken,
  getRoles, setRoles, clearRoles,
  getUserName, setUserName, clearUserName,
  isAuthenticated as hasToken,
} from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [roles, setRolesState] = useState(getRoles());
  const [userName, setUserNameState] = useState(getUserName());

  const login = (newToken, newUserName, newRoles = []) => {
    setToken(newToken);
    setTokenState(newToken);
    setRoles(newRoles);
    setRolesState(newRoles);
    setUserName(newUserName);
    setUserNameState(newUserName);
  };

  const logout = () => {
    clearToken();
    clearRoles();
    clearUserName();
    setTokenState(null);
    setRolesState([]);
    setUserNameState(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: Boolean(token), userName, roles, login, logout }}>
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
