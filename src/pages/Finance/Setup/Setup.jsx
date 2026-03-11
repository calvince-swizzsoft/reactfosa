import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MdPayments } from "react-icons/md";

import AccountConfiguration from "./AccountConfiguration/AccountConfiguration";
import BankLinkages from "./Bank/BankLinkages";

export default function Setup() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [totals, setTotals] = useState({
    banks: 0,
    branches: 0,
  });
  const [loading, setLoading] = useState(true);

  // helper to count items from different response shapes
  const getCount = (resp) => {
    if (!resp) return 0;
    if (Array.isArray(resp)) return resp.length;
    if (resp.data && Array.isArray(resp.data)) return resp.data.length;
    if (typeof resp.total === "number") return resp.total;
    if (typeof resp.length === "number") return resp.length;
    return 0;
  };

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const [banksRes, branchesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/getBankWithLinkages`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }),
          fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/getSystemMappings`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }),
        ]);

        const banksData = await banksRes.json().catch(() => null);
        const branchesData = await branchesRes.json().catch(() => null);

        setTotals({
          banks: getCount(banksData),
          branches: getCount(branchesData),
        });

      } catch (error) {
        console.error("Error fetching totals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, []);

  const users = [
    { id: 1, name: "Bank", total: totals.banks, subtitle: "Financial Institution Bank" },
    { id: 2, name: "Account Configuration", total: totals.branches, subtitle: "Accounts" },
  ];

  const user = users.find((u) => u.id === selectedUserId) || users[0];

  const renderContent = () => {
    switch (user.name) {
      case "Bank":
        return <BankLinkages />;
      case "Account Configuration":
        return <AccountConfiguration />;
      default:
        return <p>Select an option from the sidebar</p>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-72 border-r bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MdPayments className="text-white" />Setup
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
                  <Badge
                    className={`bg-gray-200 hover:bg-gray-200 text-gray-900 ${
                      user.id === u.id ? "bg-indigo-600 hover:bg-indigo-600 text-white" : ""
                    }`}
                  >
                    Total {loading ? "..." : u.total}
                  </Badge>
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
