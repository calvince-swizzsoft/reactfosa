
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CgGhost } from "react-icons/cg";
import { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IoIosArrowForward } from "react-icons/io";

export default function MainSidebar({ workspace }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-redirect to first DM
  useEffect(() => {
    if (workspace?.dms?.length > 0 && location.pathname === "/") {
      navigate(`/${workspace.dms[0].id}`, { replace: true });
    }
  }, [workspace, location.pathname, navigate]);

  if (!workspace) {
    return (
      <div className="w-60 bg-indigo-600 text-white flex items-center justify-center">
        <p>Select a workspace</p>
      </div>
    );
  }

  return (
    <div className="w-60 bg-indigo-900 text-white flex flex-col min-h-screen rounded-tl-lg">
      {/* Workspace header */}
      <div className="p-4 font-bold border-b border-indigo-700 bg-indigo-900 rounded-tl-lg">
        <div className="flex items-center bg-indigo-700 px-3 py-2 rounded-lg">
          <CgGhost className="mr-2" /> {workspace.name}
        </div>
      </div>

      {/* Sidebar navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {workspace.dms.map((dm) => {
            const isActive = location.pathname.startsWith(`/${dm.id}`);

            return (
              <li key={dm.id} className="relative">

                {dm.sublinks && dm.sublinks.length > 0 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Link
                        to={`/${dm.id}`}
                        className={`block px-2 py-1 rounded cursor-pointer transition-colors
                          ${isActive ? "bg-indigo-700" : "hover:bg-indigo-700"}`}
                      >
                        <div className="flex justify-between items-center"> {dm.name} <IoIosArrowForward /></div>
                      </Link>

                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-60 bg-indigo-900 text-white shadow-2xl rounded-lg border border-gray-500 ml-2 p-0"
                    >
                      <div className="px-3 py-3 bg-indigo-800 border-b border-indigo-500 rounded-t-md">
                        <h3 className="font-semibold">{dm.name} Menu</h3>
                      </div>
                      <div className="px-3 py-2 flex flex-col space-y-1">
                        {dm.sublinks.map((sub) => {
                          const isSubActive = location.pathname === `/${dm.id}/${sub.id}`;
                          return (
                            <Link
                              key={sub.id}
                              to={`/${dm.id}/${sub.id}`}
                              className={`text-white px-4 py-2 rounded-md transition-colors
                                ${isSubActive ? "bg-indigo-700" : "hover:bg-indigo-700"}`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Link
                    to={`/${dm.id}`}
                    className={`block px-2 py-1 rounded cursor-pointer transition-colors
                      ${isActive ? "bg-indigo-700" : "hover:bg-indigo-700"}`}
                  >
                    {dm.name}
                  </Link>
                )}


              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
