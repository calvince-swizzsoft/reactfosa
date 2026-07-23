import { useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaFolder, FaFolderOpen, FaFileAlt, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import { buildModuleTree, filterTree } from "@/lib/moduleTree";

function ModuleTreeNode({ node, depth, forceExpand }) {
  const hasChildren = node.Children.length > 0;
  const [expanded, setExpanded] = useState(depth === 0);

  const isExpanded = forceExpand !== null ? forceExpand : expanded;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 ${
          hasChildren ? "cursor-pointer" : ""
        }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        onClick={() => hasChildren && setExpanded((prev) => !prev)}
      >
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
            <ModuleTreeNode key={child.Id} node={child} depth={depth + 1} forceExpand={forceExpand} />
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

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/modules`);
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

    fetchModules();
  }, []);

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
              <ModuleTreeNode key={node.Id} node={node} depth={0} forceExpand={forceExpand} />
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
