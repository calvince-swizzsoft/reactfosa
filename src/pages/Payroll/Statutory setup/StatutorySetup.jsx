import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MdPayments } from "react-icons/md";

import HouseLevy from "./HouseLevy/HouseLevy";
import ShaContributions from "./SHA/ShaContributions";
import NssfContributions from "./NSSF/NssfContributions";
import PayeTaxBands from "./PAYE/TaxBand/PayeTaxBands";
import PayePersonalReliefs from "./PAYE/Personal Relief/PayePersonalReliefs";
import payrollsetupApiConfig from "../../../apis/payrollsetup/payrollsetupApiConfig";

export default function StatutorySetup() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [totals, setTotals] = useState({
    sha: 0,
    nssf: 0,
    taxbands: 0,
    reliefs: 0,
    houselevy: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch totals using axios (same approach as PayrollSetup)
  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const [
          levyRes,
          nssfRes,
          reliefRes,
          taxbandRes,
          shaRes,
        ] = await Promise.all([
          payrollsetupApiConfig.get("/housing-levy-contributions"),
          payrollsetupApiConfig.get("/nssf-contributions"),
          payrollsetupApiConfig.get("/paye-reliefs"),
          payrollsetupApiConfig.get("/paye-taxbands"),
          payrollsetupApiConfig.get("/sha-contributions"),
        ]);

        // Log API responses to verify structure
        console.log("Levy:", levyRes.data);
        console.log("NSSF:", nssfRes.data);
        console.log("Reliefs:", reliefRes.data);
        console.log("Tax Bands:", taxbandRes.data);
        console.log("SHA:", shaRes.data);

        // Handle multiple API response shapes safely
        setTotals({
          houselevy:
            levyRes.data?.data?.length ||
            levyRes.data?.results?.length ||
            levyRes.data?.length ||
            0,
          nssf:
            nssfRes.data?.data?.length ||
            nssfRes.data?.results?.length ||
            nssfRes.data?.length ||
            0,
          reliefs:
            reliefRes.data?.data?.length ||
            reliefRes.data?.results?.length ||
            reliefRes.data?.length ||
            0,
          taxbands:
            taxbandRes.data?.data?.length ||
            taxbandRes.data?.results?.length ||
            taxbandRes.data?.length ||
            0,
          sha:
            shaRes.data?.data?.length ||
            shaRes.data?.results?.length ||
            shaRes.data?.length ||
            0,
        });
      } catch (error) {
        console.error("Error fetching statutory totals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, []);

  const users = [
    {
      id: 1,
      name: "Social Health Authority",
      total: totals.sha,
      subtitle: "National Health Authority Setup",
    },
    {
      id: 2,
      name: "NSSF",
      total: totals.nssf,
      subtitle: "National Social Security Fund Setup",
    },
    {
      id: 3,
      name: "PAYE-Tax Band",
      total: totals.taxbands,
      subtitle: "Pay As You Earn Tax Band Setup",
    },
    {
      id: 4,
      name: "PAYE-Personal Relief",
      total: totals.reliefs,
      subtitle: "Pay As You Earn Personal Relief Setup",
    },
    {
      id: 5,
      name: "Housing Levy",
      total: totals.houselevy,
      subtitle: "National Housing Levy Setup",
    },
  ];

  const user = selectedItem || users[0];

  const renderContent = () => {
    switch (user.name) {
      case "Social Health Authority":
        return <ShaContributions />;
      case "NSSF":
        return <NssfContributions />;
      case "PAYE-Tax Band":
        return <PayeTaxBands />;
      case "PAYE-Personal Relief":
        return <PayePersonalReliefs />;
      case "Housing Levy":
        return <HouseLevy />;
      default:
        return <p>Select a statutory option from the sidebar</p>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* LEFT SIDEBAR */}
      <aside className="w-78 border-r bg-white p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MdPayments className="text-white" /> Statutory Setup
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2 bg-gray-200 rounded-xl">
            {users.map((u) => (
              <Card
                key={u.id}
                onClick={() => setSelectedItem(u)}
                className={`p-3 cursor-pointer ${user.id === u.id ? "bg-indigo-800 text-white" : ""
                  }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{u.name}</p>
                  <Badge
                    className={`bg-gray-200 hover:bg-gray-200 text-gray-900 ${user.id === u.id
                      ? "bg-indigo-600 hover:bg-indigo-600 text-white"
                      : ""
                      }`}
                  >
                    Total {loading ? "..." : u.total}
                  </Badge>
                </div>
                <p
                  className={`text-xs ${user.id === u.id ? "text-white" : "text-muted-foreground"
                    }`}
                >
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
