import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// Customer picker for loanee/guarantor selection — api/registry/customer
// (singular) is a real, paged, server-side search endpoint
// (LoanCaseController's guarantor lookup and Create both key off this same
// Customer entity), unlike EntryPickerModal's fetch-once-then-filter shape
// which is built for small bounded lists (branches, G/L accounts). Search
// text is debounced and re-queries the server via `text`/`customerFilter`
// rather than filtering a static page client-side.
export default function CustomerPickerModal({ title = "Select Customer", onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ text: debounced, customerFilter: "0", pageIndex: "0", pageSize: "20" });
    apiFetch(`${FIN_BASE}/api/registry/customer?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(normalizeList(d)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, serial number..." className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" /><span className="text-sm">Searching...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">{query ? "No customers found." : "Start typing to search."}</p>
          ) : (
            items.map((c) => (
              <button
                key={c.Id}
                type="button"
                onClick={() => { onSelect(c); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{c.FullName}</p>
                <p className="text-xs text-gray-500">#{c.PaddedSerialNumber} · {c.RecordStatusDescription}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
