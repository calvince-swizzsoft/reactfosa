import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import {
  FaEllipsisV, FaTrash, FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaTree,
} from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listHolidays, listPostingPeriods, updateHoliday, deleteHoliday } from "./api";

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};
const toDateInput = (iso) => (iso ? iso.slice(0, 10) : "");

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function HolidayForm({ form, setForm, postingPeriods, loading, loadingData, submitLabel, onSubmit }) {
  const selectedPeriod = postingPeriods.find((p) => p.Id === form.PostingPeriodId);
  const bounds = selectedPeriod
    ? { min: toDateInput(selectedPeriod.DurationStartDate), max: toDateInput(selectedPeriod.DurationEndDate) }
    : {};

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <FieldGroup label="Posting Period">
        <Select
          value={form.PostingPeriodId}
          onValueChange={(v) => setForm((p) => ({ ...p, PostingPeriodId: v, DurationStartDate: "", DurationEndDate: "" }))}
          disabled={loadingData}
        >
          <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Posting Period"} /></SelectTrigger>
          <SelectContent>
            {postingPeriods.map((p) => (
              <SelectItem key={p.Id} value={p.Id}>{p.Description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Description">
        <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. Independence Day" />
      </FieldGroup>

      <FieldGroup label="Start Date">
        <Input
          type="date"
          value={form.DurationStartDate}
          onChange={(e) => setForm((p) => ({ ...p, DurationStartDate: e.target.value }))}
          min={bounds.min}
          max={bounds.max}
          disabled={!form.PostingPeriodId}
          required
        />
      </FieldGroup>

      <FieldGroup label="End Date">
        <Input
          type="date"
          value={form.DurationEndDate}
          onChange={(e) => setForm((p) => ({ ...p, DurationEndDate: e.target.value }))}
          min={form.DurationStartDate || bounds.min}
          max={bounds.max}
          disabled={!form.PostingPeriodId}
          required
        />
      </FieldGroup>

      {selectedPeriod && (
        <p className="text-xs text-gray-400">
          Must fall within {formatDate(selectedPeriod.DurationStartDate)} – {formatDate(selectedPeriod.DurationEndDate)}.
        </p>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" id="holiday-locked" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="holiday-locked">Is Locked?</Label>
      </div>

      <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function EditHolidayDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ PostingPeriodId: "", Description: "", DurationStartDate: "", DurationEndDate: "", IsLocked: false });
  const [loading, setLoading] = useState(false);
  const [postingPeriods, setPostingPeriods] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    listPostingPeriods().then(setPostingPeriods).catch(() => setPostingPeriods([])).finally(() => setLoadingData(false));
  }, [open]);

  useEffect(() => {
    if (item) {
      setForm({
        PostingPeriodId: item.PostingPeriodId || "",
        Description: item.Description || "",
        DurationStartDate: toDateInput(item.DurationStartDate),
        DurationEndDate: toDateInput(item.DurationEndDate),
        IsLocked: item.IsLocked || false,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateHoliday(item.Id, { ...form, Id: item.Id });
      Swal.fire("Success", "Holiday updated successfully", "success");
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
              <h2 className="font-bold text-lg text-white">Edit Holiday</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <HolidayForm form={form} setForm={setForm} postingPeriods={postingPeriods} loading={loading} loadingData={loadingData} submitLabel="Update Holiday" onSubmit={handleSubmit} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Holidays() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listHolidays({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.PageCollection || page?.pageCollection || []);
        setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
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

  const handleDelete = (item) => {
    Swal.fire({
      title: "Delete Holiday?",
      text: `Remove "${item.Description}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await deleteHoliday(item.Id);
        Swal.fire("Deleted!", "Holiday removed.", "success");
        fetchItems();
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    });
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaTree /> Holidays
        </h2>
        <Link
          to="/HumanResource/Holidays/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Holiday
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
          <span className="col-span-3">Description</span>
          <span className="col-span-3">Posting Period</span>
          <span className="col-span-3">Duration</span>
          <span className="col-span-1">Status</span>
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
                  <span className="col-span-3 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-3 text-sm text-gray-600">{item.PostingPeriodDescription || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-700">
                    {formatDate(item.DurationStartDate)} – {formatDate(item.DurationEndDate)}
                  </span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {item.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                  <div className="col-span-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditItem(item)}>
                          <FaEdit className="mr-2 text-indigo-600" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item)}>
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No holidays found.</p>
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

      <EditHolidayDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
