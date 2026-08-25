import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage, apiJson } from "@/lib/api";
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

// Every navigation item granted to the caller, across all of their roles at
// once. `by-role` takes no role parameter at all — who it resolves for is
// determined purely from the caller's own auth (ModulesController.
// GetNavigationItemsByRole), never from client input, so this is one request
// regardless of how many roles the caller holds, not one per role. (This
// used to loop and pass `?role=<name>` per role — that querystring param was
// always silently ignored server-side, so the loop only ever produced N
// copies of the same identical response; removed along with the now-deleted
// param.)
async function fetchModulesForCurrentUser() {
  const data = await apiJson(MODULES_BY_ROLE_ENDPOINT, {}, { fallbackMessage: "Unable to load navigation." });

  const itemList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  if (itemList.length === 0) {
    console.warn("[ModuleTreeContext] No navigation items granted for the current user. Raw response:", data);
  }

  return itemList.map(normalizeRoleModuleItem).filter(Boolean);
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
        const moduleList = await fetchModulesForCurrentUser();

        if (!cancelled) {
          setTree(buildModuleTree(moduleList));
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiErrorMessage(err, "Unable to load navigation."));
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
