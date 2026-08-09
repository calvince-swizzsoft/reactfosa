import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEdit, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import SplitRows from "../lib/SplitRows";
import { ChargeType } from "../lib/chargeType";

// Areas/Accounts/Controllers/LevyController.cs — docs/api/levy-api-spec.md
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const LEVIES_BASE = `${BASE}/api/accounts/levies`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// PUT /{id} (§4.5) only touches the levy's own fields — deliberately, this
// is the fix for a real bug in the reference app (its Edit action wiped
// LevySplits on every save). Splits are a separate full-replace
// sub-resource (§4.6), saved here as its own request.
function EditLevyDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Description: "", ChargeType: ChargeType.Percentage, ChargeValue: 0, IsLocked: false });
  const [loading, setLoading] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [levySplits, setLevySplits] = useState([]);

  useEffect(() => {
    if (!open || !item) return;

    setForm({
      Description: item.Description || "",
      ChargeType: item.ChargeType ?? ChargeType.Percentage,
      ChargeValue: item.ChargeType === ChargeType.FixedAmount ? (item.ChargeFixedAmount ?? 0) : (item.ChargePercentage ?? 0),
      IsLocked: !!item.IsLocked,
    });

    setLoadingLookups(true);
    Promise.all([
      apiFetch(`${BASE}/api/accounts/chartofaccounts?pageSize=1000`).then((r) => r.json()),
      apiFetch(`${LEVIES_BASE}/${item.Id}/splits`).then((r) => r.json()),
    ]).then(([coaData, splitsData]) => {
      setChartOfAccounts(normalizeList(coaData));
      setLevySplits(normalizeList(splitsData));
    }).catch(() => { }).finally(() => setLoadingLookups(false));
  }, [open, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    const splitTotal = levySplits.reduce((sum, s) => sum + (Number(s.Percentage) || 0), 0);
    if (levySplits.length > 0 && Math.abs(splitTotal - 100) > 0.01) {
      Swal.fire("Splits Don't Balance", `Split percentages must sum to 100% (currently ${splitTotal}%).`, "warning");
      return;
    }

    setLoading(true);
    try {
      const [levyRes, splitsRes] = await Promise.all([
        apiFetch(`${LEVIES_BASE}/${item.Id}`, { method: "PUT", body: JSON.stringify({ ...form, Id: item.Id }) }),
        apiFetch(`${LEVIES_BASE}/${item.Id}/splits`, { method: "PUT", body: JSON.stringify(levySplits) }),
      ]);

      const [levyData, splitsData] = await Promise.all([levyRes, splitsRes].map((r) => r.json().catch(() => ({}))));

      if (!levyRes.ok || levyData.success === false) throw new Error(levyData.message || "Failed to update levy");
      if (!splitsRes.ok || splitsData.success === false) throw new Error(splitsData.message || "Failed to update splits");

      Swal.fire("Success", "Levy updated successfully", "success");
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
          <motion.div className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">Edit Levy</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 space-y-5 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Description">
                  <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. Excise Duty" />
                </FieldGroup>
                <FieldGroup label="Charge Type">
                  <Select value={String(form.ChargeType)} onValueChange={(v) => setForm((p) => ({ ...p, ChargeType: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(ChargeType.Percentage)}>Percentage</SelectItem>
                      <SelectItem value={String(ChargeType.FixedAmount)}>Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label={form.ChargeType === ChargeType.Percentage ? "Percentage" : "Fixed Amount"}>
                  <Input type="number" min="0" value={form.ChargeValue} onChange={(e) => setForm((p) => ({ ...p, ChargeValue: Number(e.target.value) }))} />
                </FieldGroup>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="levy-locked-edit"
                    checked={form.IsLocked}
                    onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <Label htmlFor="levy-locked-edit">Is Locked?</Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">G/L Splits</Label>
                <SplitRows
                  rows={levySplits}
                  onChange={setLevySplits}
                  chartOfAccounts={chartOfAccounts}
                  showLeviable={false}
                  loadingChartOfAccounts={loadingLookups}
                />
              </div>
            </div>

            <div className="p-4 pt-3 border-t shrink-0">
              <Button type="submit" disabled={loading || loadingLookups} className="w-full bg-indigo-600 hover:bg-indigo-700">
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

export default function Levies() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    // GET /paged (§4.2) — the admin-screen listing; GET / (unpaged, §4.1)
    // stays reserved for pickers (Commission's "link existing levies").
    const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
    if (search.trim()) params.set("text", search.trim());
    apiFetch(`${LEVIES_BASE}/paged?${params.toString()}`)
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

  return (
    <div>
      <div className="flex justify-between items-center mb-3 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by description..."
          className="max-w-xs"
        />
        <Link
          to="/Accounts/Levies/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Levy
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-4">Description</span>
        <span className="col-span-2">Charge Type</span>
        <span className="col-span-3">Value</span>
        <span className="col-span-1">Status</span>
        <span className="col-span-2 text-right">Actions</span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const isPercentage = item.ChargeType === ChargeType.Percentage;
            const value = isPercentage ? item.ChargePercentage : item.ChargeFixedAmount;
            return (
              <div key={item.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
                <span className="col-span-4 font-medium text-indigo-700">{item.Description}</span>
                <span className="col-span-2 text-sm text-gray-700">{item.ChargeTypeDescription || "—"}</span>
                <span className="col-span-3 text-sm text-gray-700">{typeof value === "number" ? (isPercentage ? `${value}%` : value.toLocaleString()) : "—"}</span>
                <span className="col-span-1">
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
            );
          })}
        </div>
      ) : (
        <div className="text-center mt-4">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No levies found.</p>
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

      <EditLevyDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
