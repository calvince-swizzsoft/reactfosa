import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import NotFoundImage from "/assets/scopefinding.png";
import { FaWallet, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import CustomerAccountDrawer from "./CustomerAccountDrawer";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_ACCOUNT_BASE = `${FIN_BASE}/api/accounts/customer-accounts`;

// Value 1 is a gap in the backend's own enum — not omitted by mistake here.
const CUSTOMER_FILTER_OPTIONS = [
  { value: 0, label: "Seriation Number" },
  { value: 2, label: "First Name" },
  { value: 3, label: "Last Name" },
  { value: 4, label: "Identity Card Number" },
  { value: 5, label: "Payroll Number" },
  { value: 6, label: "Organization Name" },
];

export default function CustomerAccounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  // The Registry/Accounts API's response envelope is just
  // { success, message, data } — no total count is provided — so "is
  // there a next page" is inferred from whether this page came back full.
  const [hasNextPage, setHasNextPage] = useState(false);

  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize),
      text: search,
      customerFilter: String(customerFilter),
    });
    apiFetch(`${CUSTOMER_ACCOUNT_BASE}?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const list = normalizeList(d);
        setItems(list);
        setHasNextPage(list.length === pageSize);
      })
      .catch(() => {
        setItems([]);
        setHasNextPage(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, customerFilter, pageIndex, pageSize]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const handleFilterChange = (v) => {
    setCustomerFilter(Number(v));
    setPageIndex(0);
  };

  // CustomerFullName is a computed property on CustomerAccountDTO that
  // already branches on customer type (Individual: salutation + first +
  // last name; Partnership/Corporation/MicroCredit: the non-individual
  // group name) — use it directly rather than reconstructing the name
  // client-side.
  const customerName = (item) =>
    item.CustomerFullName || item.customerFullName || item.CustomerId || "—";

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaWallet /> Customer Accounts
        </h2>
        <Button onClick={() => setDrawerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> Add Account
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4 gap-3">
        <input
          type="text"
          placeholder="Search Customer Accounts..."
          value={search}
          onChange={handleSearchChange}
          className="border p-2 rounded-lg flex-1"
        />
        <Select value={String(customerFilter)} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CUSTOMER_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Account Number</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-3">Product</span>
          <span className="col-span-3">Book Balance</span>
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
                  <span className="col-span-3 font-medium text-indigo-700">{item.FullAccountNumber || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-600">{customerName(item)}</span>
                  <span className="col-span-3 text-sm text-gray-600">{item.CustomerAccountTypeTargetProductDescription || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-600">
                    {typeof item.BookBalance === "number" ? item.BookBalance.toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No Customer Accounts Found.</p>
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

      <CustomerAccountDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={fetchItems}
      />
    </div>
  );
}
