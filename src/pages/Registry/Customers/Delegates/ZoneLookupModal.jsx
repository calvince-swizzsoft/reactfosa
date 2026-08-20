import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch, FaTimes, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { EMPLOYERS_BASE, listZonesForEmployer } from "./api";

// Two-level lookup per Areas/Registry/Delegates.md: "select the name of the
// Employer then on the 'Zones' pane select the zone that the customer
// belongs to." Step 1 lists employers (GET employer/all); step 2 lists that
// employer's zones (GET employer/{id}/zones, already built for
// Employer/index.jsx's own drilldown). Chrome matches
// EntryPickerModal/CustomerLookupModal.
export default function ZoneLookupModal({ onSelect, onClose }) {
  const [employer, setEmployer] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`${EMPLOYERS_BASE}/all`)
      .then((r) => r.json())
      .then((body) => { if (!cancelled) setEmployers(normalizeList(body?.data ?? body)); })
      .catch(() => { if (!cancelled) setEmployers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!employer) return;
    let cancelled = false;
    setLoading(true);
    setQuery("");
    listZonesForEmployer(employer.Id)
      .then((rows) => { if (!cancelled) setZones(rows); })
      .catch(() => { if (!cancelled) setZones([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employer]);

  const handlePick = (item) => {
    if (employer) {
      onSelect({ ...item, EmployerDescription: employer.Description });
      onClose();
    } else {
      setEmployer(item);
    }
  };

  const list = employer ? zones : employers;
  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((item) => String(item.Description || "").toLowerCase().includes(q));
  }, [query, list]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-2">
            {employer && (
              <button type="button" onClick={() => setEmployer(null)} className="text-white/70 hover:text-white transition-colors"><FaArrowLeft /></button>
            )}
            <h3 className="font-bold text-white text-base">{employer ? `Zones — ${employer.Description}` : "Select Employer"}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
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
            <p className="text-center text-sm text-gray-400 py-8">{employer ? "No zones found for this employer." : "No employers found."}</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.Id}
                type="button"
                onClick={() => handlePick(item)}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{item.Description}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
