import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MdPerson,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import {
  FaUser,
  FaMoneyBillWave,
  FaChartLine,
} from "react-icons/fa";

import Employees from "./EmployeeProfile/Employees";
import EmployeeEarnings from "./EmployeeAccounts/EmployeeEarnings/EmployeeEarnings";
import EmployeeAccountSetup from "./EmployeeAccounts/EmployeeAccountSetup";
import EmployeeDeductions from "./EmployeeAccounts/EmployeeDeductions/EmployeeDeductions";
import SalaryCycle from "./EmployeeAccounts/EmployeeSalaryCycle/SalaryCycle";
import InsuranceCompanies from "./EmployeeInsuarance/EmployeeInsuaranceSetup";
//import Payslip from "./Reports&Payrol/Payslip";
import Payslip from "./Payslip";
import AnnualTaxReport from "./Reports&Payrol/TaxReport";

// Dummy subcomponents
const PayrollSetup = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Payroll Setup</h2>
    <p>Configure payroll settings and calculations here.</p>
  </div>
);
const PayrollReports = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Payroll Reports</h2>
    <p>View and generate payroll reports here.</p>
  </div>
);

function EmployeeSetup() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSublink, setSelectedSublink] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});

  const users = [
    {
      id: 1,
      name: "Employees",
      subtitle: "Employee Management",
      icon: FaUser,
    },
    {
      id: 31,
      name: "Payslip",
      subtitle: "Get Employee Payslips",
      icon: FaMoneyBillWave,
    },
    {
      id: 32,
      name: "Tax Reports",
      subtitle: "Get employee's Tax Reports",
      icon: FaChartLine,
    },
  ];


  const user = selectedUser || users[0];

  const handleMainItemClick = (u) => {
    if (u.hasSublinks) {
      setExpandedMenus((prev) => ({
        ...prev,
        [u.id]: !prev[u.id],
      }));
      if (selectedUser?.id !== u.id) {
        setSelectedUser(u);
        setSelectedSublink(null);
      }
    } else {
      setSelectedUser(u);
      setSelectedSublink(null);
    }
  };

  const handleSubLinkClick = (sublink, parentUser) => {
    setSelectedSublink(sublink);
    setSelectedUser(parentUser);
  };

  const renderContent = () => {


    switch (user.name) {
      case "Employees":
        return <Employees />;

      case "Payslip":
        return <Payslip />;

      case "Tax Reports":
        return <AnnualTaxReport />;

      default:
        return <p>Select an option from the sidebar</p>;
    }

  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-78 border-r bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MdPerson className="text-white" /> Employee Setup
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2 bg-gray-200 rounded-xl">
            {users.map((u) => (
              <div key={u.id}>
                {/* Main Item */}
                <Card
                  onClick={() => handleMainItemClick(u)}
                  className={`p-3 cursor-pointer transition-all duration-200 ${user.id === u.id && !selectedSublink
                    ? "bg-indigo-800 text-white shadow-lg"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {/* <u.icon
                        className={`text-lg ${user.id === u.id && !selectedSublink
                          ? "text-white"
                          : "text-indigo-600"
                          }`}
                      /> */}
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p
                          className={`text-xs ${user.id === u.id && !selectedSublink
                            ? "text-indigo-200"
                            : "text-muted-foreground"
                            }`}
                        >
                          {u.subtitle}
                        </p>
                      </div>
                    </div>
                    {u.hasSublinks && (
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${user.id === u.id && !selectedSublink
                            ? "bg-indigo-600 hover:bg-indigo-600 text-white"
                            : "bg-gray-200 hover:bg-gray-200 text-gray-900"
                            }`}
                        >
                          {u.sublinks?.length || 0}
                        </Badge>
                        {expandedMenus[u.id] ? (
                          <MdExpandLess
                            className={`text-lg ${user.id === u.id && !selectedSublink
                              ? "text-white"
                              : "text-gray-500"
                              }`}
                          />
                        ) : (
                          <MdExpandMore
                            className={`text-lg ${user.id === u.id && !selectedSublink
                              ? "text-white"
                              : "text-gray-500"
                              }`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </Card>

              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="h-full">{renderContent()}</div>
      </main>
    </div>
  );
}

export default EmployeeSetup;
