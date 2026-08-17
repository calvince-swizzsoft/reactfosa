import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaChevronLeft, FaChevronRight, FaEdit, FaPlus, FaQuestionCircle, FaCommentAlt, FaAdjust } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import {
  createLoanPurpose, createLoaningRemark, listLoanPurposesPaged,
  listLoaningRemarksPaged, updateLoanPurpose, updateLoaningRemark,
  createIncomeAdjustment, listIncomeAdjustmentsPaged, updateIncomeAdjustment,
} from "../lib/loanMastersApi";

const INCOME_ADJUSTMENT_TYPE = { Allowance: 0xFADE, Deduction: 0xFADF };

const CONFIG = {
  purpose: { title: "Loan Purposes", singular: "Loan Purpose", icon: FaQuestionCircle, list: listLoanPurposesPaged, create: createLoanPurpose, update: updateLoanPurpose },
  remark: { title: "Loaning Remarks", singular: "Loaning Remark", icon: FaCommentAlt, list: listLoaningRemarksPaged, create: createLoaningRemark, update: updateLoaningRemark },
  income: { title: "Income Adjustments", singular: "Income Adjustment", icon: FaAdjust, list: listIncomeAdjustmentsPaged, create: createIncomeAdjustment, update: updateIncomeAdjustment, hasType: true },
};

function MasterDrawer({ item, config, onClose, onSaved }) {
  const [description, setDescription] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [type, setType] = useState(String(INCOME_ADJUSTMENT_TYPE.Allowance));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescription(item?.Description || "");
    setIsLocked(!!item?.IsLocked);
    setType(String(item?.Type ?? INCOME_ADJUSTMENT_TYPE.Allowance));
  }, [item]);

  const submit = async (event) => {
    event.preventDefault();
    if (!description.trim()) return Swal.fire("Missing Field", "Description is required.", "warning");
    setSaving(true);
    try {
      const saved = item
        ? await config.update(item.Id, { ...item, Description: description.trim(), IsLocked: isLocked, ...(config.hasType ? { Type: Number(type) } : {}) })
        : await config.create({ Description: description.trim(), IsLocked: isLocked, ...(config.hasType ? { Type: Number(type) } : {}) });
      if (saved?.ErrorMessageResult) throw new Error(saved.ErrorMessageResult);
      await Swal.fire("Success", `${config.singular} ${item ? "updated" : "created"} successfully.`, "success");
      onSaved();
      onClose();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-5 right-3 w-[440px] bg-white shadow-xl z-50 rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
          <h2 className="font-bold text-lg text-white">{item ? "Edit" : "New"} {config.singular}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Description</Label>
            <Input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          {config.hasType && (
            <div>
              <Label className="text-sm font-semibold text-gray-700">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(INCOME_ADJUSTMENT_TYPE.Allowance)}>Allowance</SelectItem>
                  <SelectItem value={String(INCOME_ADJUSTMENT_TYPE.Deduction)}>Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
            Locked
          </label>
          <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving..." : "Save"}</Button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}

function LoanMasterScreen({ type }) {
  const config = CONFIG[type];
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [drawerItem, setDrawerItem] = useState(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pageSize = 20;

  const load = () => {
    setLoading(true);
    config.list({ text: search, pageIndex, pageSize }).then((page) => {
      setItems(page?.pageCollection || page?.PageCollection || []);
      setCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
    }).catch(() => { setItems([]); setCount(0); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, pageIndex, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const openDrawer = (item) => { setDrawerItem(item); setDrawerOpen(true); };
  const hasNext = count ? (pageIndex + 1) * pageSize < count : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon /> {config.title}</h2>
        <Button onClick={() => openDrawer(null)} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><FaPlus /> Add {config.singular}</Button>
      </div>
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search by description..." className="max-w-xs mb-4" />
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-7">Description</span><span className="col-span-3">Created</span><span className="col-span-1">Status</span><span className="col-span-1 text-right">Actions</span>
        </div>
        {loading ? <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-50 rounded-lg" />)}</div>
          : items.length ? <div className="space-y-2">{items.map((item) => (
            <div key={item.Id} className="grid grid-cols-12 gap-4 items-center bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition-all">
              <span className="col-span-7 font-medium text-indigo-700">{item.Description}{config.hasType && <span className="block text-xs font-normal text-gray-500">{item.TypeDescription || (item.Type === INCOME_ADJUSTMENT_TYPE.Deduction ? "Deduction" : "Allowance")}</span>}</span>
              <span className="col-span-3 text-xs text-gray-400">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"}</span>
              <span className="col-span-1"><span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span>
              <span className="col-span-1 text-right"><Button size="sm" variant="outline" onClick={() => openDrawer(item)}><FaEdit className="text-indigo-600" /></Button></span>
            </div>
          ))}</div> : <div className="text-center text-gray-400"><img src={NotFoundImage} alt="Not found" className="mx-auto w-42" /><p>No {config.title.toLowerCase()} found.</p></div>}
        <div className="flex justify-center items-center mt-4">
          <Button size="sm" disabled={!pageIndex} onClick={() => setPageIndex((p) => p - 1)} className="m-2 gap-1"><FaChevronLeft /> Prev</Button>
          <span>Page {pageIndex + 1}</span>
          <Button size="sm" disabled={!hasNext} onClick={() => setPageIndex((p) => p + 1)} className="m-2 gap-1">Next <FaChevronRight /></Button>
        </div>
      </div>
      {drawerOpen && <MasterDrawer item={drawerItem} config={config} onClose={() => setDrawerOpen(false)} onSaved={load} />}
    </div>
  );
}

export function LoanPurposes() { return <LoanMasterScreen type="purpose" />; }
export function LoaningRemarks() { return <LoanMasterScreen type="remark" />; }
export function IncomeAdjustments() { return <LoanMasterScreen type="income" />; }
