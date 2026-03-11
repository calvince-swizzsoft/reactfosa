import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import NotFoundImage from "/assets/scopefinding.png";

export default function StockJournalDrawer({ open, onClose, item }) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (open && item) {
      setLoading(true);
      fetch(
        `${import.meta.env.VITE_APP_INV_URL}/api/items/${item.Id}/stockjournal`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      )
        .then((res) => res.json())
        .then((data) => {
          const list = data.data || [];
          setEntries(list);
          setFilteredEntries(list);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, item]);

  useEffect(() => {
    let result = [...entries];

    // Filter by ActionType
    if (filter !== "all") {
      result = result.filter((e) => e.ActionType === filter);
    }

    // Search by CreatedBy
    if (search.trim() !== "") {
      result = result.filter((e) =>
        e.CreatedBy.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredEntries(result);
  }, [filter, search, entries]);

  const SkeletonRow = () => (
    <div className="grid grid-cols-6 gap-4 bg-gray-100 rounded-lg p-3 animate-pulse">
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded"></div>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-1 right-3 w-[800px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-4 h-[95%]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl mb-4">
              <h2 className="font-bold text-lg text-white">
                Stock Journal – {item?.Description}
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by user..."
                className="border p-2 rounded-lg flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border p-2 rounded-lg"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Increase">Increase</option>
                <option value="Reduce">Reduce</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 bg-gray-200 rounded-2xl py-4 px-3">
              {loading ? (
                <div className="space-y-2">
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                </div>
              ) : filteredEntries.length > 0 ? (
                <div className="bg-gray-200 p-4 rounded-xl">
                  <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
                    <span>Action</span>
                    <span>Quantity</span>
                    <span>Old Balance</span>
                    <span>New Balance</span>
                    <span>By</span>
                    <span>Date</span>
                  </div>

                  <div className="space-y-2">
                    {filteredEntries.map((entry) => (
                      <div
                        key={entry.Id}
                        className="grid grid-cols-6 gap-4 bg-white rounded-lg p-3 shadow hover:shadow-md text-sm"
                      >
                        <span
                          className={`font-semibold ${
                            entry.ActionType === "Reduce"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {entry.ActionType}
                        </span>
                        <span>{entry.Quantity}</span>
                        <span>{entry.OriginalBalance}</span>
                        <span>{entry.NewBalance}</span>
                        <span>{entry.CreatedBy}</span>
                        <span>
                          {new Date(entry.CreatedDate).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                 <div className="text-gray-500 text-center mt-4">
                    <img src={NotFoundImage} alt="Not Found" className="mx-auto w-76 h-auto" />
                    <p className="font-medium text-gray-400"> No stock journal entries found.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
