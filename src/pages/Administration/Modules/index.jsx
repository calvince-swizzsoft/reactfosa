import { useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaFolder, FaFolderOpen, FaFileAlt, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import { buildModuleTree, filterTree } from "@/lib/moduleTree";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const normalizeRoleName = (role) => role?.roleName || role?.RoleName || role?.name || role?.Name || role;

function ModuleTreeNode({ node, depth, forceExpand, roleMode, assignedIds, savingIds, onToggleAssignment }) {
  const hasChildren = node.Children.length > 0;
  const [expanded, setExpanded] = useState(depth === 0);

  const isExpanded = forceExpand !== null ? forceExpand : expanded;
  const isAssigned = assignedIds?.has(String(node.Id));
  const isSaving = savingIds?.has(String(node.Id));

  return (
    <div>
      <div
        className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 ${
          hasChildren ? "cursor-pointer" : ""
        }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        onClick={() => hasChildren && setExpanded((prev) => !prev)}
      >
        {roleMode && (
          <input
            type="checkbox"
            checked={Boolean(isAssigned)}
            disabled={isSaving}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onToggleAssignment(node, e.target.checked)}
            className={`w-4 h-4 shrink-0 accent-indigo-600 ${isSaving ? "opacity-50 cursor-wait" : ""}`}
          />
        )}

        {hasChildren ? (
          <FaChevronRight
            className={`shrink-0 text-xs text-slate-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        ) : (
          <span className="w-[0.65rem] shrink-0" />
        )}

        {node.IsArea ? (
          isExpanded && hasChildren ? (
            <FaFolderOpen className="shrink-0 text-amber-500" />
          ) : (
            <FaFolder className="shrink-0 text-amber-500" />
          )
        ) : (
          <FaFileAlt className="shrink-0 text-indigo-400" />
        )}

        <span className="truncate text-sm font-medium text-slate-800">
          {node.Description || "—"}
        </span>

        <span className="ml-2 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 group-hover:bg-white">
          {node.Code}
        </span>

        {!node.IsArea && node.ControllerName && (
          <span className="ml-auto shrink-0 truncate text-xs text-slate-400">
            {node.ControllerName}
            {node.ActionName ? `/${node.ActionName}` : ""}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.Children.map((child) => (
            <ModuleTreeNode
              key={child.Id}
              node={child}
              depth={depth + 1}
              forceExpand={forceExpand}
              roleMode={roleMode}
              assignedIds={assignedIds}
              savingIds={savingIds}
              onToggleAssignment={onToggleAssignment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdministrationModules() {
  const [rawModules, setRawModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [forceExpand, setForceExpand] = useState(null); // null = per-node state, true/false = override

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [savingIds, setSavingIds] = useState(new Set());

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/modules`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load modules");
        }

        const moduleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRawModules(moduleList);
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load modules.", "error");
        setRawModules([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/roles`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load roles");
        }

        const roleList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRoles(roleList.map(normalizeRoleName).filter(Boolean));
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load roles.", "error");
      } finally {
        setRolesLoading(false);
      }
    };

    fetchModules();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!selectedRole) {
      setAssignedIds(new Set());
      return;
    }

    const fetchAssignedModules = async () => {
      setAssignedLoading(true);
      try {
        // Deliberately NOT `by-role` — that endpoint only ever answers "what can
        // the CALLER see," resolved purely from their own auth, and never accepts
        // a role name (see ModulesController.GetNavigationItemsByRole). This is a
        // different question — "what is role X currently granted," for managing
        // someone else's access — so it hits the dedicated admin/reporting query
        // instead (`role-grants`), which takes a role name as plain lookup data,
        // same trust level as add-to-role/remove-from-role already have.
        const response = await fetch(
          `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/modules/role-grants?role=${encodeURIComponent(selectedRole)}`
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load this role's current access");
        }

        const itemList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        // Each row is a NavigationItemInRoleDTO: its own `Id` is the role-assignment
        // record, not the module — the module reference is `NavigationItemId`.
        const ids = itemList.map((item) => item?.NavigationItemId ?? item?.navigationItemId).filter(Boolean);
        setAssignedIds(new Set(ids.map(String)));
      } catch (error) {
        Swal.fire("Error", error.message || "Unable to load current access for this role.", "error");
        setAssignedIds(new Set());
      } finally {
        setAssignedLoading(false);
      }
    };

    fetchAssignedModules();
  }, [selectedRole]);

  const toggleAssignment = async (node, nextChecked) => {
    if (!selectedRole) return;

    const id = String(node.Id);
    setSavingIds((prev) => new Set(prev).add(id));

    try {
      const endpoint = nextChecked ? "add-to-role" : "remove-from-role";
      const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/modules/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ NavigationItemId: [node.Id], RoleName: selectedRole }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `Failed to ${nextChecked ? "grant" : "revoke"} access to "${node.Description}"`);
      }

      setAssignedIds((prev) => {
        const next = new Set(prev);
        if (nextChecked) next.add(id); else next.delete(id);
        return next;
      });
    } catch (error) {
      Swal.fire("Error", error.message || "Unable to update role access.", "error");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const tree = useMemo(() => buildModuleTree(rawModules), [rawModules]);

  const query = search.trim().toLowerCase();
  const visibleTree = useMemo(() => filterTree(tree, query), [tree, query]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">Modules</h2>
            <p className="mt-2 text-sm text-slate-500">
              Modules and their sub-modules, nested by Code / AreaCode relationship.
            </p>
          </div>

          {tree.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForceExpand(true)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() => setForceExpand(false)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 p-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Manage access for role
          </Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="w-64">
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={rolesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((roleName) => (
                    <SelectItem key={roleName} value={roleName}>{roleName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRole && (
              <button
                type="button"
                onClick={() => setSelectedRole("")}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Stop managing
              </button>
            )}
            {selectedRole && assignedLoading && (
              <span className="text-xs text-slate-400">Loading current access...</span>
            )}
          </div>
          {selectedRole && (
            <p className="mt-2 text-xs text-slate-500">
              Check a module to grant <span className="font-semibold text-indigo-700">{selectedRole}</span> access to it; uncheck to revoke.
            </p>
          )}
        </div>

        <div className="mb-4 relative">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setForceExpand(null);
            }}
            placeholder="Search modules by name or code..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading modules...</p>
        ) : visibleTree.length > 0 ? (
          <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-slate-100 py-2">
            {visibleTree.map((node) => (
              <ModuleTreeNode
                key={node.Id}
                node={node}
                depth={0}
                forceExpand={forceExpand}
                roleMode={Boolean(selectedRole)}
                assignedIds={assignedIds}
                savingIds={savingIds}
                onToggleAssignment={toggleAssignment}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {query ? "No modules match your search." : "No modules found."}
          </p>
        )}
      </div>
    </div>
  );
}
