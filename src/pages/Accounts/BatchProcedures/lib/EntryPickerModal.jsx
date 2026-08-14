import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

// A single `pageSize=1000`-style request only ever returns one page — most
// of these paged endpoints cap pageSize server-side (or the real row count
// just exceeds whatever fixed size the caller guessed), silently dropping
// everything past page 0. Loop pageIndex, accumulating pageCollection
// across requests, until the server reports no more rows (itemsCount
// reached or an empty page comes back) rather than trusting one page-size
// guess to have fetched everything. Endpoints that return a bare array
// (e.g. the unpaged ".../all" ones) have nothing to loop — one request is
// already everything.
async function fetchAllPages(fetchUrl) {
  const collected = [];
  let pageIndex = 0;
  const MAX_PAGES = 200; // safety cap against a misbehaving/never-empty endpoint

  while (pageIndex < MAX_PAGES) {
    const url = new URL(fetchUrl);
    url.searchParams.set("pageIndex", String(pageIndex));
    const res = await apiFetch(url.toString());
    const body = await res.json();
    const payload = body?.data ?? body?.Data ?? body;

    if (Array.isArray(payload)) {
      // Unpaged endpoint — this one request is the whole list.
      return payload;
    }

    const pageCollection = payload?.pageCollection || payload?.PageCollection || [];
    collected.push(...pageCollection);

    const itemsCount = payload?.itemsCount ?? payload?.ItemsCount ?? 0;
    if (pageCollection.length === 0 || collected.length >= itemsCount) break;

    pageIndex += 1;
  }

  return collected;
}

// Generic list-and-select picker, adapted from Cheques.jsx's SearchSelectModal
// (that one is scoped to a single hardcoded "bankLinkage" case). Reused
// across batch types for: customer-account pickers (Credit, Refund, Inter
// Account Transfer), G/L account pickers, Journal pickers (Reversal), and
// LoanCase pickers (Disbursement).
export default function EntryPickerModal({ title, fetchUrl, getLabel, getSublabel, onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllPages(fetchUrl)
      .then((all) => { if (!cancelled) setItems(normalizeList(all)); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchUrl]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) =>
      String(getLabel(item) || "").toLowerCase().includes(q) ||
      String(getSublabel?.(item) || "").toLowerCase().includes(q)
    );
  }, [query, items, getLabel, getSublabel]);

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
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" /><span className="text-sm">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.Id}
                type="button"
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{getLabel(item)}</p>
                {getSublabel && <p className="text-xs text-gray-500">{getSublabel(item)}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
