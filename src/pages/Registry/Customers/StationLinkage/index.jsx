import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaSearch, FaBuilding, FaPlus, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { listCustomersForStation, linkCustomerToStation, unlinkCustomerFromStation, STATIONS_BASE } from "./api";
import EntryPickerModal from "@/pages/Accounts/BatchProcedures/lib/EntryPickerModal";
import CustomerLookupModal from "../Documents/CustomerLookupModal";

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

// Not a separate CRUD entity — a workspace built around Customer.StationId,
// per Areas/Registry/Station Linkage.md: pick a station, its Zone/Division/
// Employer load automatically (already flattened onto StationDTO, no extra
// lookups needed), then the customers pane lists everyone currently linked
// with add (link)/reset (unlink) actions.
export default function StationLinkage() {
  const [station, setStation] = useState(null);
  const [stationPickerOpen, setStationPickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [linking, setLinking] = useState(false);

  const fetchItems = () => {
    if (!station) return;
    setLoading(true);
    listCustomersForStation(station.Id, { text: search, pageIndex, pageSize })
      .then(({ items: results, itemsCount: count }) => { setItems(results); setItemsCount(count); })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPageIndex(0);
    setSearch("");
  }, [station]);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station, search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const handleAddCustomer = async (customer) => {
    setLinking(true);
    try {
      await linkCustomerToStation(customer.Id ?? customer.id, station.Id);
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLinking(false);
    }
  };

  const handleRemove = async (customer) => {
    const confirm = await Swal.fire({
      title: "Remove from station?",
      text: `${customerName(customer)} will no longer be linked to ${station.Description}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Reset",
    });
    if (!confirm.isConfirmed) return;

    try {
      await unlinkCustomerFromStation(customer.Id);
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBuilding /> Station Linkage
        </h2>
      </div>

      <div className="mb-6 bg-gray-100 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Station</p>
        <button
          type="button"
          onClick={() => setStationPickerOpen(true)}
          className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left bg-white hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <span className={station ? "text-gray-800 font-medium" : "text-gray-400"}>
            {station ? station.Description : "Look up station..."}
          </span>
          <FaSearch className="text-gray-400" />
        </button>
        {station && (
          <p className="text-xs text-gray-500">
            {station.ZoneDescription} &middot; {station.ZoneDivisionDescription} &middot; {station.ZoneDivisionEmployerDescription}
          </p>
        )}
      </div>

      {!station ? (
        <div className="text-gray-500 text-center mt-10">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
          <p className="font-medium text-gray-400">Look up a station to see its linked customers.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search linked customers..."
              className="max-w-xs"
            />
            <Button onClick={() => setCustomerPickerOpen(true)} disabled={linking} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
              <FaPlus /> Add Customer
            </Button>
          </div>

          <div className="bg-gray-200 p-4 rounded-sm">
            <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
              <span className="col-span-4">Customer</span>
              <span className="col-span-3">ID Number</span>
              <span className="col-span-3">Mobile</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                    <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                      <span className="col-span-4 font-medium text-indigo-700 truncate">{customerName(item)}</span>
                      <span className="col-span-3 text-sm text-gray-600 truncate">{item.IndividualIdentityCardNumber || "—"}</span>
                      <span className="col-span-3 text-sm text-gray-600 truncate">{item.AddressMobileLine || "—"}</span>
                      <span className="col-span-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRemove(item)} title="Reset (remove from station)"><FaTimes className="text-red-600" /></Button>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-4">
                <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                <p className="font-medium text-gray-400">No customers linked to this station yet.</p>
              </div>
            )}

            <div className="flex justify-center items-center mt-4">
              <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
                <FaChevronLeft /> Prev
              </Button>
              <span>Page {pageIndex + 1}</span>
              <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
                Next <FaChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}

      {stationPickerOpen && (
        <EntryPickerModal
          title="Select Station"
          fetchUrl={STATIONS_BASE}
          getLabel={(s) => s.Description}
          getSublabel={(s) => [s.ZoneDescription, s.ZoneDivisionEmployerDescription].filter(Boolean).join(" · ")}
          onSelect={setStation}
          onClose={() => setStationPickerOpen(false)}
        />
      )}

      {customerPickerOpen && (
        <CustomerLookupModal onSelect={handleAddCustomer} onClose={() => setCustomerPickerOpen(false)} />
      )}
    </div>
  );
}
