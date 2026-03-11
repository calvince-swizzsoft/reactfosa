import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MdPayments } from "react-icons/md";
import IncomeStatement from "./IncomeStatement";
import ConsolidatedBalanceSheet from "./ConsolidatedBalanceSheet";
import SASRAForm6 from "./SASRAForm6";



export default function FinanceReports() {
    const [selectedUserId, setSelectedUserId] = useState(null);


    const users = [
        { id: 1, name: "Income Statement", subtitle: "Statement" },
        { id: 2, name: "Consolidated Balance Sheet", subtitle: "Balance Sheet" },
        // { id: 3, name: "SASRAForm", subtitle: "Form" },
    ];

    const user = users.find((u) => u.id === selectedUserId) || users[0];

    const renderContent = () => {
        switch (user.name) {
            case "Income Statement":
                return <IncomeStatement />;
            case "Consolidated Balance Sheet":
                return <ConsolidatedBalanceSheet />;
            // case "SASRAForm":
            //     return <SASRAForm6 />;
            default:
                return <p>Select an option from the sidebar</p>;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* MAIN CONTENT */}


            {/* RIGHT SIDEBAR */}
            <aside className="w-72 border-r bg-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MdPayments className="text-white" /> Finance Reports
                    </h2>
                </div>

                <ScrollArea className="flex-1">
                    <div className="space-y-2 p-2 bg-gray-200 rounded-xl">
                        {users.map((u) => (
                            <Card
                                key={u.id}
                                onClick={() => setSelectedUserId(u.id)}
                                className={`p-3 cursor-pointer ${user.id === u.id ? "bg-indigo-800 text-white" : ""
                                    }`}
                            >
                                <p className="text-sm font-medium">{u.name}</p>
                                <p
                                    className={`text-xs ${user.id === u.id
                                        ? "text-white"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {u.subtitle}
                                </p>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>

    );
}

