import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";
import { buildModuleTree } from "@/lib/moduleTree";

// TODO: swap to `/api/navigation` once the backend exposes a role-scoped
// endpoint; for now /api/modules returns the same Code/AreaCode shape.
const MODULES_ENDPOINT = `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/modules`;

const ModuleTreeContext = createContext(null);

export function ModuleTreeProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setTree([]);
      return;
    }

    let cancelled = false;

    const fetchModules = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(MODULES_ENDPOINT, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load navigation");
        }

        const moduleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

        if (!cancelled) {
          setTree(buildModuleTree(moduleList));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load navigation");
          setTree([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchModules();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, attempt]);

  return (
    <ModuleTreeContext.Provider value={{ tree, loading, error, refetch }}>
      {children}
    </ModuleTreeContext.Provider>
  );
}

export function useModuleTree() {
  const ctx = useContext(ModuleTreeContext);
  if (!ctx) throw new Error("useModuleTree must be used within a ModuleTreeProvider");
  return ctx;
}
