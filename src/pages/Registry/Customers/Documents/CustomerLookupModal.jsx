import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { searchCustomers } from "./api";

// Same filter set as Registry/Customers/index.jsx's own search bar — kept as
// a local copy rather than shared, matching how this codebase redefines
// small page-local pieces (FieldGroup, etc.) rather than sharing them.
const customerFilters = [
  [0, "Serial Number"], [1, "Personal Identification #"], [2, "First Name"],
  [3, "Last Name"], [4, "Identity Card #"], [5, "Payroll Numbers"],
  [6, "Organisation Name"], [7, "Organisation Registration #"],
];

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

// The customer base can run into the thousands, unlike the small
// employee/branch/etc. lists EntryPickerModal fetches whole and filters
// client-side — this queries api/registry/customer server-side instead,
// same endpoint and paging Registry/Customers/index.jsx itself searches
// against, debounced as the user types.
export default function CustomerLookupModal({ onSelect, onClose }) {
  const [filter, setFilter] = useState(2);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      searchCustomers({ text: search.trim(), customerFilter: filter, pageIndex })
        .then(({ items: results, totalPages: pages }) => {
          if (cancelled) return;
          setItems(results);
          setTotalPages(pages);
        })
        .catch(() => { if (!cancelled) { setItems([]); setTotalPages(1); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search, filter, pageIndex]);

  useEffect(() => { setPageIndex(0); }, [search, filter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">Select Customer</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <Select value={String(filter)} onValueChange={(value) => setFilter(Number(value))}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {customerFilters.map(([value, label]) => <SelectItem key={value} value={String(value)}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search by ${customerFilters.find(([v]) => v === filter)?.[1] || "selected field"}`} className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" /><span className="text-sm">Searching...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No customers found.</p>
          ) : (
            items.map((item) => (
              <button
                key={item.Id ?? item.id}
                type="button"
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{customerName(item)}</p>
                <p className="text-xs text-gray-500">{item.IndividualIdentityCardNumber || item.NonIndividualRegistrationNumber || "—"}</p>
              </button>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100">
            <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))}>Prev</Button>
            <span className="text-xs text-gray-500">Page {pageIndex + 1} of {totalPages}</span>
            <Button type="button" size="sm" disabled={pageIndex + 1 >= totalPages} onClick={() => setPageIndex((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
