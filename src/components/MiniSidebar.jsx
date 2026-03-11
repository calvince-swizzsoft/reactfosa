
import { Link, useLocation } from "react-router-dom";

export default function MiniSidebar({ workspaces, onSelect }) {
  const location = useLocation(); // get current path

  return (
    <div className="w-16 bg-indigo-800 text-white flex flex-col items-center py-2 space-y-2">
      {workspaces.map((ws) => {
        // check if current path matches the workspace path
        //const isActive = location.pathname === `/${ws.name}`;
        //const isActive = location.pathname.startsWith(`/${ws.name}`);
        const isActive = location.pathname.includes(`/${ws.name}`);

        return (
          <Link key={ws.id} to={`/${ws.name}`}>
            <div className="flex flex-col items-center">
              <button
                onClick={() => onSelect(ws.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-lg 
                  ${isActive ? "bg-indigo-900" : "bg-indigo-800 hover:bg-indigo-900"}`}
              >
                {ws.icon}
              </button>
              <p className="font-semibold text-xs text-center">{ws.title}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
