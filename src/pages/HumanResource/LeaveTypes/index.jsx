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
import { FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaUmbrellaBeach } from "react-icons/fa";
import { listLeaveTypes, updateLeaveType } from "../Leave/lib/api";
import { LEAVE_UNIT_TYPE_LABEL, LEAVE_TARGET_GENDER_LABEL } from "../Leave/lib/enums";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

const emptyForm = { Description: "", Entitlement: 1, TargetGender: 0, UnitType: 3, IsAccrued: false, ExcludeHolidays: false, ExcludeWeekends: false, IsLocked: false };

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label>{help && <FieldHelp label={label}>{help}</FieldHelp>}</div>
      {children}
    </div>
  );
}

function LeaveTypeForm({ form, setForm, loading, submitLabel, onSubmit }) {
  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <FieldGroup label="Description">
        <Input value={form.Description} onChange={(e) => set("Description", e.target.value)} required placeholder="e.g. Annual Leave" />
      </FieldGroup>

      <FieldGroup label="Entitlement (Days)" help="The number of leave days granted in each selected entitlement cycle.">
        <Input type="number" min="1" value={form.Entitlement} onChange={(e) => set("Entitlement", Number(e.target.value))} required />
      </FieldGroup>

      <FieldGroup label="Unit Type" help="Determines whether entitlement is granted weekly, monthly, or yearly.">
        <Select value={String(form.UnitType)} onValueChange={(v) => set("UnitType", Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(LEAVE_UNIT_TYPE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Target Gender" help="Restricts this leave type to eligible employees. Choose All genders for a general policy.">
        <Select value={String(form.TargetGender)} onValueChange={(v) => set("TargetGender", Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(LEAVE_TARGET_GENDER_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="leavetype-accrued" checked={form.IsAccrued} onChange={(e) => set("IsAccrued", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="leavetype-accrued">Is Accrued?</Label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="leavetype-excludeholidays" checked={form.ExcludeHolidays} onChange={(e) => set("ExcludeHolidays", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="leavetype-excludeholidays">Exclude Holidays?</Label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="leavetype-excludeweekends" checked={form.ExcludeWeekends} onChange={(e) => set("ExcludeWeekends", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="leavetype-excludeweekends">Exclude Weekends?</Label>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="leavetype-locked" checked={form.IsLocked} onChange={(e) => set("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        <Label htmlFor="leavetype-locked">Locked</Label>
        <FieldHelp label="Locked leave type">Locked leave types remain in history but cannot be selected for new or edited leave applications.</FieldHelp>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function EditLeaveTypeDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        Description: item.Description || "",
        Entitlement: item.Entitlement || 0,
        TargetGender: item.TargetGender || 0,
        UnitType: item.UnitType || 0,
        IsAccrued: item.IsAccrued || false,
        ExcludeHolidays: item.ExcludeHolidays || false,
        ExcludeWeekends: item.ExcludeWeekends || false,
        IsLocked: Boolean(item.IsLocked),
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLeaveType(item.Id, form);
      Swal.fire("Success", "Leave type updated successfully", "success");
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
              <h2 className="font-bold text-lg text-white">Edit Leave Type</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <LeaveTypeForm form={form} setForm={setForm} loading={loading} submitLabel="Update Leave Type" onSubmit={handleSubmit} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function LeaveTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listLeaveTypes({ text: search, pageIndex, pageSize })
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

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaUmbrellaBeach /> Leave Types
          </h2>
          <Link to="/HumanResource/Leave/Application" className="text-sm text-indigo-200 hover:text-white">
            &larr; Back to Leave Applications
          </Link>
        </div>
        <Link
          to="/HumanResource/LeaveTypes/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Leave Type
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
          <span className="col-span-2">Entitlement</span>
          <span className="col-span-2">Unit Type</span>
          <span className="col-span-2">Target Gender</span>
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
                  <span className="col-span-2 text-sm text-gray-700">{item.Entitlement} days</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.UnitTypeDescription || LEAVE_UNIT_TYPE_LABEL[item.UnitType] || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.TargetGenderDescription || LEAVE_TARGET_GENDER_LABEL[item.TargetGender] || "—"}</span>
                  <span className="col-span-1"><span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span>
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
            <p className="font-medium text-gray-400">No leave types found.</p>
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

      <EditLeaveTypeDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
