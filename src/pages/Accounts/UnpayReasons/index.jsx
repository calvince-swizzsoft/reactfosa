import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaHandPaper, FaPlus, FaChevronLeft, FaChevronRight, FaEdit } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import {
  listUnpayReasons, updateUnpayReason, listUnpayReasonCommissions, updateUnpayReasonCommissions,
} from "./api";
import PickerList from "../lib/PickerList";

// Areas/Accounts/Controllers/UnPayReasonController.cs — docs/api/unpayreason-api-spec.md.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// PUT /{id} only touches the reason's own fields — attached commissions
// are a separate full-replace sub-resource (§3.6), saved with its own
// request here, same pattern as ChequeTypes'/Commissions' edit drawers.
function EditUnpayReasonDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Code: "", Description: "", IsLocked: false });
  const [loading, setLoading] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState(new Set());

  useEffect(() => {
    if (!open || !item) return;

    setForm({
      Code: item.Code ?? "",
      Description: item.Description || "",
      IsLocked: !!item.IsLocked,
    });

    setLoadingCommissions(true);
    Promise.all([
      apiJson(`${BASE}/api/accounts/commissions`),
      listUnpayReasonCommissions(item.Id),
    ]).then(([commissionData, attached]) => {
      setCommissions(normalizeList(commissionData));
      setSelectedCommissionIds(new Set((attached || []).map((c) => c.Id)));
    }).catch((error) => {
      setCommissions([]);
      setSelectedCommissionIds(new Set());
      Swal.fire("Error", apiErrorMessage(error, "Unable to load commissions."), "error");
    }).finally(() => setLoadingCommissions(false));
  }, [open, item]);

  const toggleCommission = (id) => setSelectedCommissionIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        updateUnpayReason(item.Id, { ...item, ...form, Code: Number(form.Code) || 0 }),
        updateUnpayReasonCommissions(item.Id, [...selectedCommissionIds]),
      ]);
      Swal.fire("Success", "Unpay reason updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the unpay reason."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[440px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">Edit Unpay Reason</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Code">
                    <Input type="number" value={form.Code} onChange={(e) => setForm((p) => ({ ...p, Code: e.target.value }))} placeholder="e.g. 1" />
                  </FieldGroup>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="unpay-locked-edit"
                      checked={form.IsLocked}
                      onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <Label htmlFor="unpay-locked-edit">Is Locked?</Label>
                  </div>
                </div>
                <FieldGroup label="Description">
                  <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. Suspicious Activity" />
                </FieldGroup>

                <FieldGroup label="Attached Commissions">
                  <PickerList
                    items={commissions}
                    selectedIds={selectedCommissionIds}
                    onToggle={toggleCommission}
                    getLabel={(c) => c.Description}
                    getSublabel={(c) => c.RoundingTypeDescription}
                    emptyText={loadingCommissions ? "Loading commissions..." : "No commissions configured yet."}
                  />
                </FieldGroup>
              </div>

              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function UnpayReasons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listUnpayReasons({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load unpay reasons."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaHandPaper /> Unpay Reasons
        </h2>
        <Link
          to="/Accounts/UnpayReasons/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Unpay Reason
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
          <span className="col-span-1">Code</span>
          <span className="col-span-6">Description</span>
          <span className="col-span-3">Created</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-1 font-mono font-bold text-gray-700">{item.PaddedCode || item.Code}</span>
                  <span className="col-span-6 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-3 text-xs text-gray-400">
                    {item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"}
                  </span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {item.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                  <div className="col-span-1 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditItem(item)} className="flex items-center gap-1">
                      <FaEdit className="text-indigo-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No unpay reasons found.</p>
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

      <EditUnpayReasonDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
