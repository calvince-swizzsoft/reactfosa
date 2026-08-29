// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiHelpCircle } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-12 bg-indigo-800  flex items-center justify-between px-4 text-white sticky top-0 z-39">
      {/* Left: Workspace / Branding */}
      <div className="flex items-center space-x-4 ml-15">
        <Link to="/home" className="font-bold hover:text-gray-300">Swift Financial</Link>
      </div>

      {/* Middle: Search Bar */}
      <div className="mx-4 flex flex-1 justify-center">
        <GlobalSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <FiBell className="cursor-pointer hover:text-gray-300" />
        <FiHelpCircle className="cursor-pointer hover:text-gray-300" />
        <div className="relative">
          <div
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center cursor-pointer"
          >
            <span className="text-sm font-bold">A</span>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white text-slate-800 rounded-md shadow-lg overflow-hidden z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
