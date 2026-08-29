import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEdit, FaSearch, FaUserPlus, FaBell, FaUsers } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { readApiResponse } from "@/lib/api-errors";
import CreateCustomerDrawer from "./create";
import EditCustomerDrawer from "./edit";
import AlertPreferencesDrawer from "./AlertPreferencesDrawer";
import NextOfKinDrawer from "./NextOfKinDrawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const customerTypeLabels = {
  0: "Individual",
  1: "Partnership",
  2: "Corporation",
  3: "MicroCredit",
};

const customerFilters = [
  [0, "Serial Number"], [1, "Personal Identification #"], [2, "First Name"],
  [3, "Last Name"], [4, "Identity Card #"], [5, "Payroll Numbers"],
  [6, "Organisation Name"], [7, "Organisation Registration #"],
  [8, "Address Line 1"], [9, "Address Line 2"], [10, "Street"],
  [11, "Postal Code"], [12, "City"], [13, "Email"], [14, "Land Line"],
  [15, "Mobile Line"], [16, "Account Number"], [17, "Membership Number"],
  [18, "Personal File Number"],
];

export default function Customers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alertPrefsCustomer, setAlertPrefsCustomer] = useState(null);
  const [nextOfKinCustomer, setNextOfKinCustomer] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [editAccessResolved, setEditAccessResolved] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(2);
  const [appliedFilter, setAppliedFilter] = useState(2);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const normalizeList = (d) =>
    Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.Data) ? d.Data : [];

  const fetchItems = async (requestedPage = pageIndex, requestedQuery = query, requestedFilter = appliedFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageIndex: String(requestedPage), pageSize: "20", text: requestedQuery, customerFilter: String(requestedFilter) });
      const response = await apiFetch(`${BASE}/api/registry/customer?${params.toString()}`);
      if (!response.ok) throw new Error("Could not load customers");
      const body = await response.json();
      const page = body?.data ?? body?.Data ?? body;
      setItems(normalizeList(page?.PageCollection ?? page?.pageCollection ?? page));
      setTotalPages(Math.max(1, Number(page?.TotalPages ?? page?.totalPages ?? 1)));
      setTotalCount(Number(page?.TotalCount ?? page?.totalCount ?? page?.ItemsCount ?? page?.itemsCount ?? 0));
    } catch { setItems([]); setTotalPages(1); setTotalCount(0); } finally { setLoading(false); }
  };

  useEffect(() => {
    apiFetch(`${BASE}/api/registry/customer/edit-access`).then((response) => readApiResponse(response, { fallbackMessage: "Could not resolve customer-edit access." })).then((body) => setCanEdit(Boolean(body?.data?.canEdit ?? body?.Data?.CanEdit))).catch(() => setCanEdit(false)).finally(() => setEditAccessResolved(true));
  }, []);

  useEffect(() => {
    fetchItems(pageIndex, query, appliedFilter);
  }, [pageIndex, query, appliedFilter]);

  const submitSearch = (event) => {
    event.preventDefault();
    const nextQuery = search.trim();
    if (pageIndex === 0 && query === nextQuery && appliedFilter === filter) fetchItems(0, nextQuery, filter);
    else { setPageIndex(0); setQuery(nextQuery); setAppliedFilter(filter); }
  };

  const customerName = (item) =>
    [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
    item.NonIndividualDescription ||
    item.Description ||
    "—";

  const editCustomer = (item) => {
    if (!editAccessResolved) return Swal.fire("Checking Access", "Customer edit access is still being resolved. Try again in a moment.", "info");
    if (!canEdit) return Swal.fire("Customer Editing Permission Required", "Your current role cannot edit customers. Assign the Customer Editing permission under Administration → Role Permission Types, then try again.", "info");
    setEditingId(item.Id ?? item.id);
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUserPlus /> Customers
        </h2>
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaUserPlus /> Add Customer
        </Button>
      </div>

      <form onSubmit={submitSearch} className="mb-4 flex flex-col md:flex-row items-stretch md:items-center gap-2">
        <Select value={String(filter)} onValueChange={(value) => setFilter(Number(value))}>
          <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            {customerFilters.map(([value, label]) => <SelectItem key={value} value={String(value)}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xl">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder={`Search by ${customerFilters.find(([value]) => value === filter)?.[1] || "selected field"}`} />
        </div>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Search</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm border border-gray-300">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">ID Number</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Mobile</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2 text-right">Action</span>
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
                  <span className="col-span-3 font-medium text-indigo-700">{customerName(item)}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.IndividualIdentityCardNumber || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.TypeDescription || customerTypeLabels[item.Type] || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.AddressMobileLine || "—"}</span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {item.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                  <span className="col-span-2 text-right flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => setNextOfKinCustomer(item)} title="Next of kin"><FaUsers /></Button>
                    <Button size="sm" variant="outline" onClick={() => setAlertPrefsCustomer(item)} title="Alert preferences"><FaBell /></Button>
                    <Button size="sm" variant="outline" onClick={() => editCustomer(item)} title="Edit customer"><FaEdit /></Button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No customers found.</p>
          </div>
        )}

        {!loading && totalPages > 0 && (
          <div className="mt-5 border-t border-gray-300 pt-4">
            <div className="mb-2 text-center text-sm text-gray-600">{totalCount ? `${totalCount} customer${totalCount === 1 ? "" : "s"}` : "Customer results"}</div>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex((page) => Math.max(0, page - 1))}>Prev</Button>
              <span className="px-3 text-sm font-medium text-gray-700">Page {pageIndex + 1} of {totalPages}</span>
              <Button type="button" disabled={pageIndex + 1 >= totalPages} onClick={() => setPageIndex((page) => page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <CreateCustomerDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={() => fetchItems(pageIndex, query, appliedFilter)} />
      <EditCustomerDrawer customerId={editingId} open={Boolean(editingId)} onClose={() => setEditingId(null)} onSuccess={() => fetchItems(pageIndex, query, appliedFilter)} />
      <AlertPreferencesDrawer
        open={Boolean(alertPrefsCustomer)}
        customerId={alertPrefsCustomer?.Id ?? alertPrefsCustomer?.id}
        customerName={alertPrefsCustomer ? customerName(alertPrefsCustomer) : ""}
        onClose={() => setAlertPrefsCustomer(null)}
      />
      <NextOfKinDrawer
        open={Boolean(nextOfKinCustomer)}
        customerId={nextOfKinCustomer?.Id ?? nextOfKinCustomer?.id}
        customerName={nextOfKinCustomer ? customerName(nextOfKinCustomer) : ""}
        onClose={() => setNextOfKinCustomer(null)}
      />
    </div>
  );
}
