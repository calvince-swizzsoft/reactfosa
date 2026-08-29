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
import { FaEllipsisV, FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaUniversity } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, normalizeList } from "@/lib/api";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";
import { treasuryValidationMessage } from "./validation";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// Treasury master data lives under Areas/Accounts now, not Areas/FrontOffice
// — the old Areas/FrontOffice/Controllers/TreasurysController.cs was
// removed/merged into this one (docs/api/treasury-api-spec.md §5: "the
// reference app actually had two controllers managing this same entity...
// this API exposes one endpoint for both"). api/frontoffice/treasurys no
// longer resolves at all.
const TREASURIES_BASE = `${BASE}/api/accounts/treasurys`;

const emptyForm = {
  Description: "",
  BranchId: "",
  ChartOfAccountId: "",
  RangeLowerLimit: "",
  RangeUpperLimit: "",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function BranchSelect({ branches, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("BranchId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Branch"} /></SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CoaSelect({ coaList, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("ChartOfAccountId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Chart of Account"} /></SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {coaList.map((c) => (
          <SelectItem key={c.Id} value={c.Id}>
            {c.AccountCode} — {c.AccountName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DrawerShell({ open, onClose, title, children }) {
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
            className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">{title}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TreasuryForm({ form, setForm, branches, coaList, loading, loadingData, submitLabel, onSubmit }) {
  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <FieldGroup label="Description">
        <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. Main Treasury" />
      </FieldGroup>
      <FieldGroup label="Branch">
        <BranchSelect branches={branches} value={form.BranchId} onChange={handleChange} disabled={loadingData} />
      </FieldGroup>
      <FieldGroup label="Chart of Account">
        <CoaSelect coaList={coaList} value={form.ChartOfAccountId} onChange={handleChange} disabled={loadingData} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Range Lower Limit">
          <Input type="number" min="0" step="0.01" required value={form.RangeLowerLimit} onChange={(e) => handleChange("RangeLowerLimit", e.target.value)} placeholder="50000" />
        </FieldGroup>
        <FieldGroup label="Range Upper Limit">
          <Input type="number" min="0" step="0.01" required value={form.RangeUpperLimit} onChange={(e) => handleChange("RangeUpperLimit", e.target.value)} placeholder="100000" />
        </FieldGroup>
      </div>
      <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function EditTreasuryDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      apiFetch(`${BASE}/api/administration/branches`).then((r) => r.json()),
      listAllChartOfAccounts(),
    ]).then(([branchData, accounts]) => {
      // GET / now returns PageCollectionInfo<BranchDTO> (paged), not a
      // bare array.
      setBranches(normalizeList(branchData));
      setCoaList(accounts);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  useEffect(() => {
    if (item) {
      setForm({
        Description: item.Description || "",
        BranchId: item.BranchId || "",
        ChartOfAccountId: item.ChartOfAccountId || "",
        RangeLowerLimit: item.RangeLowerLimit ?? "",
        RangeUpperLimit: item.RangeUpperLimit ?? "",
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = treasuryValidationMessage(form);
    if (validationMessage) {
      Swal.fire("Check Treasury Details", validationMessage, "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        Description: form.Description.trim(),
        RangeLowerLimit: Number(form.RangeLowerLimit),
        RangeUpperLimit: Number(form.RangeUpperLimit),
      };
      const res = await apiFetch(`${TREASURIES_BASE}/${item.Id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update treasury");
      Swal.fire("Success", "Treasury updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell open={open} onClose={onClose} title="Edit Treasury">
      <TreasuryForm form={form} setForm={setForm} branches={branches} coaList={coaList} loading={loading} loadingData={loadingData} submitLabel="Update Treasury" onSubmit={handleSubmit} />
    </DrawerShell>
  );
}

export default function Treasuries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    // TreasurysController.Index (GET /) is confirmed paged
    // (text/pageIndex/pageSize), enveloped as
    // { success, message, data: PageCollectionInfo<TreasuryDTO> } — read
    // directly off the real controller source, no longer just defensive.
    apiFetch(`${TREASURIES_BASE}?pageIndex=${pageIndex}&pageSize=${pageSize}`)
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
  }, [pageIndex]);

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;
  const totalPages = Math.max(1, Math.ceil(itemsCount / pageSize));

  // No delete action here — TreasurysController has no DELETE route at all
  // (confirmed against the real controller source: only GET/GET{id}/POST/
  // PUT exist). The old delete button always 404'd/405'd.

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUniversity /> Treasuries
        </h2>
        <Link
          to="/Accounts/Treasuries/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Treasury
        </Link>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Description</span>
          <span className="col-span-3">Branch</span>
          <span className="col-span-2">Lower Limit</span>
          <span className="col-span-2">Upper Limit</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded" />)}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-6 py-4 rounded-lg shadow-lg border hover:shadow-xl transition-all">
              <span className="col-span-3 font-medium text-indigo-700">{item.Description}</span>
              <span className="col-span-3 text-sm text-gray-600">{item.BranchDescription || item.BranchName || "—"}</span>
              <span className="col-span-2 text-sm text-gray-600">{item.RangeLowerLimit?.toLocaleString() ?? "—"}</span>
              <span className="col-span-2 text-sm text-gray-600">{item.RangeUpperLimit?.toLocaleString() ?? "—"}</span>
              <span className="col-span-1">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {item.IsLocked ? "Locked" : "Active"}
                </span>
              </span>
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditItem(item)}>
                      <FaEdit className="mr-2 text-indigo-600" /> Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No treasuries found.</p>
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
          <span>Page {pageIndex + 1} of {totalPages}</span>
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

      <EditTreasuryDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
