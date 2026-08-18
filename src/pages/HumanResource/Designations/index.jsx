import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEdit, FaPlus, FaIdBadge } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

// Areas/HumanResource/Controllers/DesignationsController.cs — GET/POST/PUT
// only, no DELETE route and no paging/text-filter support (Index() returns
// the plain full FindDesignations() list) — no Prev/Next or server search
// here, matching what CostCenters/ChequeTypes already do when their own
// controllers are missing a capability rather than faking one.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const DESIGNATIONS_BASE = `${BASE}/api/humanresource/designations`;

const emptyForm = { Description: "", TransactionThresholds: "", IsLocked: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function DesignationForm({ form, setForm, loading, submitLabel, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <FieldGroup label="Description">
        <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. Teller" />
      </FieldGroup>
      <FieldGroup label="Transaction Thresholds">
        <Input value={form.TransactionThresholds} onChange={(e) => setForm((p) => ({ ...p, TransactionThresholds: e.target.value }))} placeholder="Enter GUID or value" />
      </FieldGroup>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="desig-locked" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="desig-locked">Is Locked?</Label>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function EditDesignationDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        Description: item.Description || "",
        TransactionThresholds: item.TransactionThresholds || "",
        IsLocked: item.IsLocked || false,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`${DESIGNATIONS_BASE}/${item.Id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, Id: item.Id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update designation");
      Swal.fire("Success", "Designation updated successfully", "success");
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
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Designation</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <DesignationForm form={form} setForm={setForm} loading={loading} submitLabel="Update Designation" onSubmit={handleSubmit} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Designations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");

  const fetchItems = () => {
    setLoading(true);
    apiFetch(DESIGNATIONS_BASE)
      .then((r) => r.json())
      .then((body) => setItems(normalizeList(body)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? items.filter((item) => (item.Description || "").toLowerCase().includes(needle)) : items;
  }, [items, search]);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaIdBadge /> Designations
        </h2>
        <Link
          to="/HumanResource/Designations/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Designation
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by description..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-5">Description</span>
          <span className="col-span-3">Type</span>
          <span className="col-span-2">Status</span>
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
        ) : visibleItems.length > 0 ? (
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-5 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-3 text-sm text-gray-600">{item.TypeDescription || "—"}</span>
                  <span className="col-span-2">
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
            <p className="font-medium text-gray-400">No designations found.</p>
          </div>
        )}
      </div>

      <EditDesignationDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
