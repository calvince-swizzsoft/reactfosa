
import { Link, useLocation } from "react-router-dom";
import { getIconForModule } from "@/lib/faIconMap";
import { resolveModulePath } from "@/lib/moduleTree";
import { moduleRouteMap } from "@/lib/moduleRouteMap";

export default function MiniSidebar({ workspaces, onSelect }) {
  const location = useLocation();

  return (
    <div className="w-16 bg-indigo-800 text-white flex flex-col items-center py-2 space-y-2 overflow-y-auto">
      {workspaces.map((ws) => {
        const path = resolveModulePath(ws, moduleRouteMap);
        const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
        const Icon = getIconForModule(ws.Icon);

        return (
          <Link key={ws.Id} to={path} onClick={() => onSelect(ws.Code)}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                className={`w-12 h-12 flex items-center justify-center rounded-lg
                  ${isActive ? "bg-indigo-900" : "bg-indigo-800 hover:bg-indigo-900"}`}
              >
                <Icon className="text-2xl" />
              </button>
              <p className="font-semibold text-xs text-center truncate w-14">{ws.Description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
