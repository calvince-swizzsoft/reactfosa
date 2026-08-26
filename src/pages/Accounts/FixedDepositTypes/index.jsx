import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaPiggyBank, FaPlus, FaChevronLeft, FaChevronRight, FaEdit } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import {
  listFixedDepositTypes, updateFixedDepositType,
  listFixedDepositTypeLevies, updateFixedDepositTypeLevies,
  listFixedDepositTypeAttachedProducts, updateFixedDepositTypeAttachedProducts,
  listFixedDepositTypeGraduatedScales, updateFixedDepositTypeGraduatedScales,
} from "./api";
import PickerList from "../lib/PickerList";
import GraduatedScalesEditor from "./GraduatedScalesEditor";

// Areas/Accounts/Controllers/FixedDepositTypeController.cs — product setup
// for fixed deposits. Closes the gap flagged in
// FOSA/TellerTransactions/TODO.md: FixedDeposits' create form had no
// FixedDepositTypeId picker because no lookup endpoint existed.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// PUT /{id} only touches the type's own fields — levies/attached-products/
// graduated-scales are separate full-replace sub-resources, saved with
// their own requests here, same pattern as UnpayReasons'/Commissions' edit
// drawers.
function EditFixedDepositTypeDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Description: "", Months: "", IsLocked: false });
  const [enforceFixedDepositBands, setEnforceFixedDepositBands] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSubResources, setLoadingSubResources] = useState(false);
  const [loanProducts, setLoanProducts] = useState([]);
  const [levies, setLevies] = useState([]);
  const [selectedLoanProductIds, setSelectedLoanProductIds] = useState(new Set());
  const [selectedLevyIds, setSelectedLevyIds] = useState(new Set());
  const [graduatedScales, setGraduatedScales] = useState([]);

  useEffect(() => {
    if (!open || !item) return;

    setForm({
      Description: item.Description || "",
      Months: item.Months ?? "",
      IsLocked: !!item.IsLocked,
    });

    setLoadingSubResources(true);
    Promise.all([
      apiJson(`${BASE}/api/accounts/loanproducts`),
      apiJson(`${BASE}/api/accounts/levies`),
      listFixedDepositTypeAttachedProducts(item.Id),
      listFixedDepositTypeLevies(item.Id),
      listFixedDepositTypeGraduatedScales(item.Id),
    ]).then(([loanProductData, levyData, attachedProducts, attachedLevies, scales]) => {
      setLoanProducts(normalizeList(loanProductData));
      setLevies(normalizeList(levyData));
      setSelectedLoanProductIds(new Set((attachedProducts?.LoanProductCollection || []).map((p) => p.Id)));
      setSelectedLevyIds(new Set((attachedLevies || []).map((l) => l.Id)));
      setGraduatedScales((scales || []).map((s) => ({
        RangeLowerLimit: s.RangeLowerLimit, RangeUpperLimit: s.RangeUpperLimit, Percentage: s.Percentage,
      })));
    }).catch((error) => {
      setLoanProducts([]);
      setLevies([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load fixed-deposit options."), "error");
    }).finally(() => setLoadingSubResources(false));
  }, [open, item]);

  const toggleLoanProduct = (id) => setSelectedLoanProductIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleLevy = (id) => setSelectedLevyIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim() || !(Number(form.Months) > 0)) {
      Swal.fire("Missing Fields", "Description and a positive term (months) are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const selectedLoanProducts = loanProducts.filter((p) => selectedLoanProductIds.has(p.Id));
      const selectedLevies = levies.filter((l) => selectedLevyIds.has(l.Id));
      const cleanScales = graduatedScales
        .filter((s) => s.RangeLowerLimit !== "" && s.RangeUpperLimit !== "" && s.Percentage !== "")
        .map((s) => ({
          RangeLowerLimit: Number(s.RangeLowerLimit),
          RangeUpperLimit: Number(s.RangeUpperLimit),
          Percentage: Number(s.Percentage),
        }));

      await Promise.all([
        updateFixedDepositType(item.Id, { ...item, ...form, Months: Number(form.Months) }, enforceFixedDepositBands),
        updateFixedDepositTypeAttachedProducts(item.Id, selectedLoanProducts),
        updateFixedDepositTypeLevies(item.Id, selectedLevies),
        updateFixedDepositTypeGraduatedScales(item.Id, cleanScales),
      ]);
      Swal.fire("Success", "Fixed deposit type updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the fixed deposit type."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[460px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">Edit Fixed Deposit Type</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Description">
                    <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. 12-Month Term Deposit" />
                  </FieldGroup>
                  <FieldGroup label="Term (Months)">
                    <Input type="number" min="1" value={form.Months} onChange={(e) => setForm((p) => ({ ...p, Months: e.target.value }))} required placeholder="e.g. 12" />
                  </FieldGroup>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fdt-locked-edit"
                      checked={form.IsLocked}
                      onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <Label htmlFor="fdt-locked-edit">Is Locked?</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fdt-enforce-bands-edit"
                      checked={enforceFixedDepositBands}
                      onChange={(e) => setEnforceFixedDepositBands(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    <Label htmlFor="fdt-enforce-bands-edit">Enforce Graduated Scale Bands</Label>
                  </div>
                </div>

                <FieldGroup label="Graduated Scales">
                  <GraduatedScalesEditor scales={graduatedScales} onChange={setGraduatedScales} />
                </FieldGroup>

                <FieldGroup label="Attached Loan Products">
                  <PickerList
                    items={loanProducts}
                    selectedIds={selectedLoanProductIds}
                    onToggle={toggleLoanProduct}
                    getLabel={(p) => p.Description}
                    emptyText={loadingSubResources ? "Loading loan products..." : "No loan products configured yet."}
                  />
                </FieldGroup>

                <FieldGroup label="Applicable Levies">
                  <PickerList
                    items={levies}
                    selectedIds={selectedLevyIds}
                    onToggle={toggleLevy}
                    getLabel={(l) => l.Description}
                    emptyText={loadingSubResources ? "Loading levies..." : "No levies configured yet."}
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

export default function FixedDepositTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listFixedDepositTypes({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load fixed deposit types."), "error");
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
          <FaPiggyBank /> Fixed Deposit Types
        </h2>
        <Link
          to="/Accounts/FixedDepositTypes/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Fixed Deposit Type
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
          <span className="col-span-6">Description</span>
          <span className="col-span-2">Term (Months)</span>
          <span className="col-span-2">Created</span>
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
                  <span className="col-span-6 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-2 text-sm text-gray-700">{item.Months}</span>
                  <span className="col-span-2 text-xs text-gray-400">
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
            <p className="font-medium text-gray-400">No fixed deposit types found.</p>
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

      <EditFixedDepositTypeDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
