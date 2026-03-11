import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MdPayments } from "react-icons/md";
import SalesCreditMemo from "./SalesCreditMemo/SalesCreditMemo";
import SalesInvoices from "./Salesinvoice/salesInvoice";
import Customers from "./Customers/Customers";



export default function AccountsReceivable() {
  const [selectedUserId, setSelectedUserId] = useState(null);


  const users = [
    { id: 1, name: "Sales Credit Memo", subtitle: "Credit Memo" },
    { id: 2, name: "Sales Invoices", subtitle: "Invoices" },
    { id: 3, name: "Customers", subtitle: "Customers" },
  ];

  const user = users.find((u) => u.id === selectedUserId) || users[0];

  const renderContent = () => {
    switch (user.name) {
      case "Sales Credit Memo":
        return <SalesCreditMemo />;
      case "Sales Invoices":
        return <SalesInvoices />;
      case "Customers":
        return <Customers />;
      default:
        return <p>Select an option from the sidebar</p>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-74 border-r bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MdPayments className="text-white" />Account Receivable
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2 bg-gray-200 rounded-xl">
            {users.map((u) => (
              <Card
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`p-3 cursor-pointer ${user.id === u.id ? "bg-indigo-800 text-white" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{u.name}</p>
                </div>
                <p className={`text-xs ${user.id === u.id ? "text-white" : "text-muted-foreground"}`}>
                  {u.subtitle}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">{renderContent()}</main>
    </div>
  );
}
