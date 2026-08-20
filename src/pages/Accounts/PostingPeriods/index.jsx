import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaCalendarCheck } from "react-icons/fa";
import { listPostingPeriods, createPostingPeriod, updatePostingPeriod } from "./api";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const toDateInput = (value) => (value ? value.slice(0, 10) : "");
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

function PostingPeriodDrawer({ open, onClose, onSuccess, item }) {
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setDescription(item.Description || "");
      setStartDate(toDateInput(item.DurationStartDate));
      setEndDate(toDateInput(item.DurationEndDate));
      setIsLocked(Boolean(item.IsLocked));
    } else {
      setDescription("");
      setStartDate("");
      setEndDate("");
      setIsLocked(false);
    }
  }, [item, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !startDate || !endDate) {
      Swal.fire("Missing Fields", "Name, start date, and end date are all required.", "warning");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      Swal.fire("Invalid Dates", "The end date must be after the start date.", "warning");
      return;
    }
    setSaving(true);
    try {
      if (item) {
        await updatePostingPeriod(item.Id, { description, startDate, endDate, isLocked });
      } else {
        await createPostingPeriod({ description, startDate, endDate });
      }
      Swal.fire("Success", `Posting period ${item ? "updated" : "created"} successfully.`, "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">{item ? "Edit" : "Add"} Posting Period</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {item?.IsClosed && (
                <p className="text-xs text-red-500 font-medium">This posting period is closed and can no longer be edited.</p>
              )}

              <FieldGroup label="Name">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="e.g. Financial Year 2026" disabled={item?.IsClosed} />
              </FieldGroup>

              <FieldGroup label="Start Date">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required disabled={item?.IsClosed} />
              </FieldGroup>

              <FieldGroup label="End Date">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required disabled={item?.IsClosed} />
              </FieldGroup>

              {item && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} disabled={item?.IsClosed} /> Locked
                </label>
              )}

              <Button type="submit" disabled={saving || item?.IsClosed} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {saving ? "Saving..." : item ? "Update" : "Create"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function PostingPeriods() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [drawerItem, setDrawerItem] = useState(undefined);

  const fetchItems = () => {
    setLoading(true);
    listPostingPeriods({ text: search, pageIndex, pageSize })
      .then(({ items: results, itemsCount: count }) => { setItems(results); setItemsCount(count); })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaCalendarCheck /> Posting Periods
        </h2>
        <Button onClick={() => setDrawerItem(null)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> Add Posting Period
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">Start Date</span>
          <span className="col-span-2">End Date</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-3 text-right">Actions</span>
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
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{item.Description}</span>
                  <span className="col-span-2 text-sm text-gray-600">{formatDate(item.DurationStartDate)}</span>
                  <span className="col-span-2 text-sm text-gray-600">{formatDate(item.DurationEndDate)}</span>
                  <span className="col-span-2 flex gap-1">
                    {item.IsClosed ? (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-600">Closed</span>
                    ) : item.IsActive ? (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-600">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">Inactive</span>
                    )}
                    {item.IsLocked && <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-600">Locked</span>}
                  </span>
                  <span className="col-span-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setDrawerItem(item)} title="Edit posting period"><FaEdit /></Button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No posting periods found.</p>
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

      <PostingPeriodDrawer open={drawerItem !== undefined} onClose={() => setDrawerItem(undefined)} onSuccess={fetchItems} item={drawerItem} />
    </div>
  );
}
