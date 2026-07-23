import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaExternalLinkAlt } from "react-icons/fa";
import Designations from "./Designations";
import Departments from "./Departments";
import EmployeeTypes from "./EmployeeTypes";
import SavingsProducts from "./SavingsProducts";
import InvestmentProducts from "./InvestmentProducts";
import Treasuries from "./Treasuries";

const tabs = [
  { id: "designations", label: "Designations" },
  { id: "departments", label: "Departments" },
  { id: "employeetypes", label: "Employee Types" },
  { id: "savingsproducts", label: "Savings Products" },
  { id: "investmentsproducts", label: "Investment Products" },
  { id: "treasuries", label: "Treasuries" },
  { id: "branches", label: "Branches" },
];

export default function FOSASetup() {
  const [activeTab, setActiveTab] = useState("designations");
  const navigate = useNavigate();

  const handleTabClick = (tabId) => {
    if (tabId === "branches") {
      navigate("/Membership/branches");
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
        {activeTab === "designations" && <Designations />}
        {activeTab === "departments" && <Departments />}
        {activeTab === "employeetypes" && <EmployeeTypes />}
        {activeTab === "savingsproducts" && <SavingsProducts />}
        {activeTab === "investmentsproducts" && <InvestmentProducts />}
        {activeTab === "treasuries" && <Treasuries />}
      </div>
    </div>
  );
}
