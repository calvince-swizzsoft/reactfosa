
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdPerson } from "react-icons/md";
import { FaUsers, FaMoneyBillWave, FaChartLine } from "react-icons/fa";

import EmployeeEarnings from "./EmployeeAccounts/EmployeeEarnings/EmployeeEarnings";
import EmployeeAccountSetup from "./EmployeeAccounts/EmployeeAccountSetup";
import EmployeeDeductions from "./EmployeeAccounts/EmployeeDeductions/EmployeeDeductions";

function AccountsSetup() {
  const [selectedUser, setSelectedUser] = useState(1);

  const users = [
    {
      id: 1,
      name: "Account Setup",
      subtitle: "Configure Employees Account",

      component: <EmployeeAccountSetup />
    },
    {
      id: 2,
      name: "Earnings",
      subtitle: "Manage employee's Earnings",

      component: <EmployeeEarnings />
    },
    {
      id: 3,
      name: "Employees Deductions",
      subtitle: "Manage employee's deductions",

      component: <EmployeeDeductions />
    }
  ];

  const activeUser = users.find((u) => u.id === selectedUser);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-78 border-r bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MdPerson className="text-white" /> Account Setup
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2 bg-gray-200 rounded-xl">
            {users.map((u) => (
              <Card
                key={u.id}
                onClick={() => setSelectedUser(u.id)}
                className={`p-3 cursor-pointer transition-all duration-200 ${selectedUser === u.id
                  ? "bg-indigo-800 text-white shadow-lg"
                  : "hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center gap-4">

                  <div>
                    <p className="text-sm font-semibold">{u.name}</p>
                    <p
                      className={`text-xs ${selectedUser === u.id
                        ? "text-indigo-200"
                        : "text-gray-500"
                        }`}
                    >
                      {u.subtitle}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-white p-4">
        {activeUser?.component || <p>Select an option</p>}
      </main>
    </div>
  );
}

export default AccountsSetup;
