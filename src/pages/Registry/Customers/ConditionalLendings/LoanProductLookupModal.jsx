import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { LOAN_PRODUCTS_BASE } from "./api";

const SECTIONS = [
  [0, "FOSA"],
  [1, "BOSA"],
];

// Per Areas/Registry/Conditional Lendings.md: "Remember to select between
// FOSA and BOSA loan products from the menu circled in red when searching
// for loan products" — the one respect in which this needs more than the
// generic EntryPickerModal (LoanProductDTO already carries
// LoanRegistrationLoanProductSection, 0=FOSA/1=BOSA, so this filters
// client-side over one unpaged fetch rather than re-querying per toggle).
export default function LoanProductLookupModal({ onSelect, onClose }) {
  const [section, setSection] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(LOAN_PRODUCTS_BASE)
      .then((r) => r.json())
      .then((body) => { if (!cancelled) setProducts(normalizeList(body?.data ?? body)); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const inSection = products.filter((p) => p.LoanRegistrationLoanProductSection === section);
    if (!query.trim()) return inSection;
    const q = query.toLowerCase();
    return inSection.filter((p) => String(p.Description || "").toLowerCase().includes(q));
  }, [query, products, section]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">Select Loan Product</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex gap-2">
            {SECTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value)}
                className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${section === value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" /><span className="text-sm">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No loan products found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.Id}
                type="button"
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{item.Description}</p>
                <p className="text-xs text-gray-500">{item.LoanRegistrationLoanProductSectionDescription}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
