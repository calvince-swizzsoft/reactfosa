import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";
import { buildModuleTree } from "@/lib/moduleTree";

// The by-role endpoint already returns exactly the navigation items a role
// may see — full node data, not just ids — so there's no separate
// unfiltered module list to fetch and no client-side permission filter to
// apply. The backend is the single source of truth for what's gated.
const MODULES_BY_ROLE_ENDPOINT = `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/modules/by-role`;

const ModuleTreeContext = createContext(null);

// A NavigationItemInRoleDTO row uses Navigation-item-prefixed field names
// (and its own `Id` is the role-grant record, not the module) — normalize
// to the Code/AreaCode/Description/IsArea shape buildModuleTree and the
// sidebar components already expect.
function normalizeRoleModuleItem(item) {
  const id = item?.NavigationItemId ?? item?.navigationItemId;
  if (!id) return null;

  return {
    Id: id,
    Code: item.navigationItemCode ?? item.NavigationItemCode,
    AreaCode: item.NavigationItemAreaCode,
    Description: item.NavigationItemDescription,
    IsArea: item.NavigationItemIsArea,
    ControllerName: item.NavigationItemControllerName,
    ActionName: item.NavigationItemActionName,
    Icon: item.NavigationItemIcon,
  };
}

// Union of every navigation item granted to any of the given roles. A role
// with no grants, or a request that fails, just contributes nothing rather
// than failing the whole nav load.
async function fetchModulesForRoles(roles) {
  const results = await Promise.allSettled(
    roles.map(async (role) => {
      const url = `${MODULES_BY_ROLE_ENDPOINT}?role=${encodeURIComponent(role)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(`by-role fetch for "${role}" failed: ${response.status} ${response.statusText}`);
      }

      return { role, data };
    })
  );

  const byId = new Map();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      console.error(`[ModuleTreeContext] Failed to load modules for role "${roles[index]}":`, result.reason);
      return;
    }

    const { role, data } = result.value;
    const itemList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

    if (itemList.length === 0) {
      console.warn(`[ModuleTreeContext] Role "${role}" has no navigation items granted. Raw response:`, data);
    }

    itemList.forEach((item) => {
      const normalized = normalizeRoleModuleItem(item);
      if (normalized) byId.set(String(normalized.Id), normalized);
    });
  });

  return Array.from(byId.values());
}

export function ModuleTreeProvider({ children }) {
  const { isAuthenticated, roles } = useAuth();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(() => isAuthenticated && roles?.length > 0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setTree([]);
      return;
    }

    if (!roles || roles.length === 0) {
      // No roles on record means nothing has been granted — show no nav
      // rather than guessing at an unfiltered fallback.
      setTree([]);
      return;
    }

    let cancelled = false;

    const fetchModules = async () => {
      setLoading(true);
      setError(null);

      try {
        const moduleList = await fetchModulesForRoles(roles);

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
  }, [isAuthenticated, roles, attempt]);

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
