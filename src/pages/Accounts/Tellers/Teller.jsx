import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AddTellerDrawer from "./AddTellerDrawer";
import {
  FaChevronDown, FaChevronUp, FaMoneyCheckAlt, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { apiFetch, normalizeList } from "@/lib/api";

// const BASE = "https://rubani.ngrok.io";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

export default function Tellers() {
  const [tellers, setTellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeller, setExpandedTeller] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchTellers = () => {
    setLoading(true);
    // TellerController.Index (GET /) is genuinely paged now
    // (tellerType/text/pageIndex/pageSize), enveloped as
    // { success, message, data: PageCollectionInfo<TellerDTO> } — confirmed
    // against the real controller source, not assumed.
    apiFetch(`${BASE}/api/frontoffice/tellers?pageIndex=${pageIndex}&pageSize=${pageSize}`)
      .then((res) => res.json())
      .then((body) => {
        const page = body?.data ?? body;
        setTellers(page?.pageCollection || page?.PageCollection || normalizeList(body));
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setTellers([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTellers(); }, [pageIndex]);

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : tellers.length === pageSize;

  // No delete/remove action here — TellerController has no DELETE route at
  // all (confirmed against the real controller source; the old code called
  // one that always 404'd/405'd). Only GET/POST/PUT exist.

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

        <div className="flex justify-center items-center mt-4">
          <Button
            type="button"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 m-2"
          >
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button
            type="button"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setPageIndex((p) => p + 1)}
            className="flex items-center gap-1 m-2"
          >
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      <AddTellerDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchTellers}
      />
    </div>
  );
}
