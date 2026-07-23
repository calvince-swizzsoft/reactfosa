import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { resolveModulePath, nodeContainsPath } from "@/lib/moduleTree";
import { moduleRouteMap } from "@/lib/moduleRouteMap";

export default function SidebarNode({ node, depth = 0, onNavigate }) {
  const location = useLocation();
  const hasChildren = node.Children.length > 0;
  const path = resolveModulePath(node, moduleRouteMap);
  const isActive = location.pathname === path;

  const [expanded, setExpanded] = useState(() =>
    node.Children.some((child) => nodeContainsPath(child, location.pathname, moduleRouteMap))
  );

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 hover:bg-indigo-700"
          style={{ paddingLeft: `${depth * 0.85 + 0.5}rem` }}
        >
          <FaChevronRight
            className={`shrink-0 text-[10px] text-white/50 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
          <span className="truncate">{node.Description || "—"}</span>
        </button>

        {expanded && (
          <div>
            {node.Children.map((child) => (
              <SidebarNode key={child.Id} node={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={path}
      onClick={onNavigate}
      className={`block truncate rounded px-2 py-1.5 text-sm transition-colors ${
        isActive ? "bg-indigo-700 text-white" : "text-white/80 hover:bg-indigo-700 hover:text-white"
      }`}
      style={{ paddingLeft: `${depth * 0.85 + 1.35}rem` }}
    >
      {node.Description || "—"}
    </Link>
  );
}
