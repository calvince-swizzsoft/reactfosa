import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import {
  FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaBriefcase,
} from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// Areas/Accounts/Controllers/CostCenterController.cs — docs/api/costcenter-api-spec.md
const COST_CENTERS_BASE = `${BASE}/api/accounts/costcenters`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EditCostCenterDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Description: "", IsLocked: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ Description: item.Description || "", IsLocked: !!item.IsLocked });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`${COST_CENTERS_BASE}/${item.Id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update cost center");
      Swal.fire("Success", "Cost center updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Cost Center</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FieldGroup label="Description">
                <Input
                  value={form.Description}
                  onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
                  required
                  placeholder="e.g. Nairobi Branch Operations"
                />
              </FieldGroup>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="costcenter-locked"
                  checked={form.IsLocked}
                  onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600"
                />
                <Label htmlFor="costcenter-locked">Is Locked?</Label>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Update Cost Center"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function CostCenters() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    // GET / — text matches Description only, real pagination.
    const params = new URLSearchParams({ text: search, pageIndex: String(pageIndex), pageSize: String(pageSize) });
    apiFetch(`${COST_CENTERS_BASE}?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        const page = body?.data ?? body;
        setItems(page?.pageCollection || page?.PageCollection || normalizeList(body));
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
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

  // No delete action here — CostCenterController has no DELETE route
  // (confirmed against the real controller source: only GET/GET{id}/POST/
  // PUT exist).

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBriefcase /> Cost Centers
        </h2>
        <Link
          to="/Accounts/CostCenters/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Cost Center
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by description..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-7">Description</span>
          <span className="col-span-3">Status</span>
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
                  <span className="col-span-7 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {item.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                  <div className="col-span-2 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditItem(item)} className="flex items-center gap-1">
                      <FaEdit className="text-indigo-600" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No cost centers found.</p>
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

      <EditCostCenterDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
