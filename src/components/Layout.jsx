
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaBars } from "react-icons/fa";
import MiniSidebar from "./MiniSidebar";
import MainSidebar from "./MainSidebar";
import Navbar from "./Navbar";
import bgcircle from "../assets/circle.jpg";
import { Outlet } from "react-router-dom";
import { useModuleTree } from "@/context/ModuleTreeContext";
import { findActiveRoot } from "@/lib/moduleTree";
import { moduleRouteMap } from "@/lib/moduleRouteMap";

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tree, loading, error, refetch } = useModuleTree();

  const currentWorkspace = findActiveRoot(tree, location.pathname, moduleRouteMap);

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  const sidebarUnavailable = loading || error;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex flex-1 bg-indigo-800 relative overflow-hidden">

        {sidebarUnavailable ? (
          <div className="hidden lg:flex w-60 shrink-0 items-center justify-center bg-indigo-900 text-white/80 text-sm p-4 text-center">
            {loading ? (
              "Loading navigation..."
            ) : (
              <div className="space-y-2">
                <p>Couldn't load navigation.</p>
                <button
                  onClick={refetch}
                  className="rounded-md bg-indigo-700 px-3 py-1.5 text-xs hover:bg-indigo-600"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── DESKTOP: both sidebars in normal flow (lg+) ── */}
            <div className="hidden lg:flex shrink-0">
              <MiniSidebar workspaces={tree} onSelect={() => { }} />
            </div>
            <div className="hidden lg:flex shrink-0">
              <MainSidebar workspace={currentWorkspace} />
            </div>

            {/* ── TABLET: MiniSidebar in flow; clicking icon opens MainSidebar overlay (md–lg) ── */}
            <div className="hidden md:flex lg:hidden shrink-0">
              <MiniSidebar workspaces={tree} onSelect={openSidebar} />
            </div>

            {/* ── OVERLAY: MainSidebar (tablet) + both sidebars (mobile) ── */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    className="fixed inset-0 bg-black z-40 lg:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={closeSidebar}
                  />

                  {/* Slide-in panel */}
                  <motion.div
                    className="fixed inset-y-0 left-0 z-50 flex lg:hidden"
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {/* MiniSidebar only on mobile (tablet already has it in flow) */}
                    <div className="md:hidden">
                      <MiniSidebar workspaces={tree} onSelect={() => { }} />
                    </div>

                    {/* MainSidebar with close support */}
                    <MainSidebar workspace={currentWorkspace} onClose={closeSidebar} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Mobile top bar with hamburger */}
          <div className="md:hidden bg-indigo-900 text-white px-3 py-2 flex items-center gap-3 shrink-0 border-b border-indigo-700">
            <button
              onClick={openSidebar}
              className="p-1.5 rounded-md bg-indigo-700 hover:bg-indigo-600 transition-colors"
              aria-label="Open menu"
            >
              <FaBars className="text-lg" />
            </button>
            <span className="text-sm font-semibold truncate">{currentWorkspace?.Description || ""}</span>
          </div>

          {/* Page content */}
          <div
            className="flex-1 bg-indigo-100 p-1 overflow-auto"
            style={{
              backgroundImage: `url(${bgcircle})`,
              backgroundColor: "rgba(224, 231, 255, 0.7)",
              backgroundSize: "200px",
              backgroundBlendMode: "saturation",
              backgroundPosition: "center",
            }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
