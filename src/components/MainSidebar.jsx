import { CgGhost } from "react-icons/cg";
import { FaTimes } from "react-icons/fa";
import SidebarNode from "./SidebarNode";

export default function MainSidebar({ workspace, onClose }) {
  if (!workspace) {
    return (
      <div className="w-60 bg-indigo-600 text-white flex items-center justify-center">
        <p>Select a workspace</p>
      </div>
    );
  }

  return (
    <div className="w-60 bg-indigo-900 text-white flex flex-col min-h-screen rounded-tl-lg">
      {/* Header */}
      <div className="p-4 font-bold border-b border-indigo-700 bg-indigo-900 rounded-tl-lg shrink-0">
        <div className="flex items-center justify-between gap-2 bg-indigo-700 px-3 py-2 rounded-lg">
          <div className="flex items-center min-w-0">
            <CgGhost className="mr-2 shrink-0" />
            <span className="truncate text-sm">{workspace.Description}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 text-white/70 hover:text-white transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-0.5">
          {workspace.Children.map((child) => (
            <SidebarNode key={child.Id} node={child} depth={0} onNavigate={onClose} />
          ))}
        </div>
      </nav>
    </div>
  );
}
