import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaExternalLinkAlt } from "react-icons/fa";

// Departments, Designations, and Employee Types moved to HumanResource;
// Savings Products, Investment Products, and Treasuries moved to Accounts —
// each now its own module with its own index + create page, as part of the
// module-driven routing split. They no longer live here.
const tabs = [
  { id: "branches", label: "Branches" },
];

export default function FOSASetup() {
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();

  const handleTabClick = (tabId) => {
    if (tabId === "branches") {
      navigate("/Administration/Branches");
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <FaCog className="text-white text-xl" />
        <h2 className="text-xl font-bold text-white">FOSA Setup</h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex items-center gap-1 px-5 py-2 text-sm font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id && tab.id !== "branches"
                ? "bg-indigo-600 text-white border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            {tab.label}
            {tab.id === "branches" && <FaExternalLinkAlt className="text-xs" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm text-gray-500">Select "Branches" above to manage branches.</p>
      </div>
    </div>
  );
}
