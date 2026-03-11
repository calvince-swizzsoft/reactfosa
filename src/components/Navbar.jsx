// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { FiSearch, FiBell, FiHelpCircle } from "react-icons/fi";

export default function Navbar() {
  return (
    <div className="h-12 bg-indigo-800  flex items-center justify-between px-4 text-white sticky top-0 z-39">
      {/* Left: Workspace / Branding */}
      <div className="flex items-center space-x-4 ml-15">
        <span className="font-bold">Swift Financial</span>
        {/*<Link to="/" className="hover:text-gray-300 text-sm">Home</Link>
        <Link to="/settings" className="hover:text-gray-300 text-sm">Settings</Link>*/}
      </div>

      {/* Middle: Search Bar */}
      <div className="flex items-center bg-indigo-700 px-2 py-1 rounded-md w-1/3">
        <FiSearch className="text-gray-100 mr-2" />
        <input
          type="text"
          placeholder="Search... "
          className="bg-transparent outline-none text-sm flex-1 placeholder-gray-400 text-white"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <FiBell className="cursor-pointer hover:text-gray-300" />
        <FiHelpCircle className="cursor-pointer hover:text-gray-300" />
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center cursor-pointer">
          <span className="text-sm font-bold">A</span>
        </div>
      </div>
    </div>
  );
}
