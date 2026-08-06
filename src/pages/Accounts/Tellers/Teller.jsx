import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AddTellerDrawer from "./AddTellerDrawer";
import {
  FaChevronDown, FaChevronUp, FaMoneyCheckAlt, FaEllipsisV, FaTrash,
} from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { apiFetch, normalizeList } from "@/lib/api";

// const BASE = "https://rubani.ngrok.io";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

export default function Tellers() {
  const [tellers, setTellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeller, setExpandedTeller] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const fetchTellers = () => {
    setLoading(true);
    apiFetch(`${BASE}/api/frontoffice/tellers`)
      .then((res) => res.json())
      .then((data) => setTellers(normalizeList(data)))
      .catch(() => setTellers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTellers(); }, []);

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Teller?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await apiFetch(`${BASE}/api/frontoffice/tellers/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete teller");
          setTellers((prev) => prev.filter((t) => t.Id !== id));
          Swal.fire("Deleted!", "Teller removed successfully.", "success");
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheckAlt /> Tellers
        </h2>
        <Button onClick={() => setAddDrawerOpen(true)} className="bg-indigo-500 hover:bg-indigo-600">
          + New Teller
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Description</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-3">Employee</span>
          <span className="col-span-2">Lower / Upper Limit</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : tellers.length > 0 ? (
          <div className="space-y-2">
            {tellers.map((teller) => (
              <div key={teller.Id} className="bg-white rounded-lg shadow-lg border">
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-2 font-semibold text-indigo-700 truncate">
                    {teller.Description}
                  </span>
                  <span className="col-span-2 text-sm text-gray-600">
                    {teller.TypeDescription || "—"}
                  </span>
                  <span className="col-span-3 text-sm truncate">
                    {teller.EmployeeCustomerFullName || "—"}
                  </span>
                  <span className="col-span-2 text-sm text-gray-600">
                    {teller.RangeLowerLimit?.toLocaleString()} / {teller.RangeUpperLimit?.toLocaleString()}
                  </span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${teller.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {teller.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 hover:bg-gray-600 text-white text-xs"
                      onClick={() => setExpandedTeller(expandedTeller === teller.Id ? null : teller.Id)}
                    >
                      {expandedTeller === teller.Id ? <><FaChevronUp className="mr-1" /> Hide</> : <><FaChevronDown className="mr-1" /> Details</>}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FaEllipsisV className="text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(teller.Id)}>
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTeller === teller.Id && (
                  <div className="border-t bg-gray-50 px-6 py-4 rounded-b-lg grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="bg-white p-3 rounded-lg border space-y-1">
                      <p className="font-semibold text-indigo-700 mb-2">Teller Info</p>
                      <p><span className="font-medium">Code:</span> {teller.PaddedCode}</p>
                      <p><span className="font-medium">Reference:</span> {teller.Reference || "—"}</p>
                      <p><span className="font-medium">Branch:</span> {teller.EmployeeBranchDescription || "—"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border space-y-1">
                      <p className="font-semibold text-indigo-700 mb-2">Accounts</p>
                      <p><span className="font-medium">Main:</span> {teller.ChartOfAccountName || "—"}</p>
                      <p><span className="font-medium">Shortage:</span> {teller.ShortageChartOfAccountName || "—"}</p>
                      <p><span className="font-medium">Excess:</span> {teller.ExcessChartOfAccountName || "—"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border space-y-1 col-span-2">
                      <p className="font-semibold text-indigo-700 mb-2">Balances</p>
                      <div className="grid grid-cols-3 gap-2">
                        <p><span className="font-medium">Book Balance:</span> {teller.BookBalance?.toLocaleString()}</p>
                        <p><span className="font-medium">Total Credits:</span> {teller.TotalCredits?.toLocaleString()}</p>
                        <p><span className="font-medium">Total Debits:</span> {teller.TotalDebits?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No Tellers Found.</p>
          </div>
        )}
      </div>

      <AddTellerDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchTellers}
      />
    </div>
  );
}
