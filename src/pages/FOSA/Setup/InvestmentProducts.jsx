import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEllipsisV, FaTrash, FaEdit } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//const BASE = "https://rubani.ngrok.io";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

const emptyForm = {
  Description: "",
  MinimumAmount: "",
  MaximumAmount: "",
  MinimumTenure: "",
  MaximumTenure: "",
  AnnualPercentageYield: "",
  ChartOfAccountId: "",
  IsLocked: false,
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NumInput({ field, value, onChange, placeholder }) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder || ""}
    />
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

function InvestmentProductForm({ form, setForm, coaList, loading, loadingData, submitLabel, onSubmit }) {
  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <FieldGroup label="Description">
        <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. FIXED DEPOSIT" />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Minimum Amount">
          <NumInput field="MinimumAmount" value={form.MinimumAmount} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Maximum Amount">
          <NumInput field="MaximumAmount" value={form.MaximumAmount} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Minimum Tenure (days)">
          <NumInput field="MinimumTenure" value={form.MinimumTenure} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Maximum Tenure (days)">
          <NumInput field="MaximumTenure" value={form.MaximumTenure} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Annual Percentage Yield (%)">
          <NumInput field="AnnualPercentageYield" value={form.AnnualPercentageYield} onChange={handleChange} />
        </FieldGroup>
      </div>
      <FieldGroup label="Chart of Account">
        <CoaSelect coaList={coaList} value={form.ChartOfAccountId} onChange={handleChange} disabled={loadingData} />
      </FieldGroup>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.IsLocked} onChange={(e) => handleChange("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        <span className="text-sm font-medium">Is Locked</span>
      </label>
      <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function AddInvestmentProductDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    fetch(`${BASE}/api/values/GetChartOfAccount`)
      .then((r) => r.json())
      .then((d) => setCoaList(Array.isArray(d.Data) ? d.Data : []))
      .catch(() => setCoaList([]))
      .finally(() => setLoadingData(false));
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        MinimumAmount: Number(form.MinimumAmount),
        MaximumAmount: Number(form.MaximumAmount),
        MinimumTenure: Number(form.MinimumTenure),
        MaximumTenure: Number(form.MaximumTenure),
        AnnualPercentageYield: Number(form.AnnualPercentageYield),
      };
      const res = await fetch(`${BASE}/api/accounts/investmentsproducts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create investment product");
      Swal.fire("Success", "Investment product created successfully", "success");
      setForm(emptyForm);
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell open={open} onClose={onClose} title="Add Investment Product">
      <InvestmentProductForm form={form} setForm={setForm} coaList={coaList} loading={loading} loadingData={loadingData} submitLabel="Create Investment Product" onSubmit={handleSubmit} />
    </DrawerShell>
  );
}

function EditInvestmentProductDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    fetch(`${BASE}/api/values/GetChartOfAccount`)
      .then((r) => r.json())
      .then((d) => setCoaList(Array.isArray(d.Data) ? d.Data : []))
      .catch(() => setCoaList([]))
      .finally(() => setLoadingData(false));
  }, [open]);

  useEffect(() => {
    if (item) {
      setForm({
        Description: item.Description || "",
        MinimumAmount: item.MinimumAmount ?? "",
        MaximumAmount: item.MaximumAmount ?? "",
        MinimumTenure: item.MinimumTenure ?? "",
        MaximumTenure: item.MaximumTenure ?? "",
        AnnualPercentageYield: item.AnnualPercentageYield ?? "",
        ChartOfAccountId: item.ChartOfAccountId || "",
        IsLocked: item.IsLocked || false,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        MinimumAmount: Number(form.MinimumAmount),
        MaximumAmount: Number(form.MaximumAmount),
        MinimumTenure: Number(form.MinimumTenure),
        MaximumTenure: Number(form.MaximumTenure),
        AnnualPercentageYield: Number(form.AnnualPercentageYield),
      };
      const res = await fetch(`${BASE}/api/accounts/investmentsproducts/${item.Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update investment product");
      Swal.fire("Success", "Investment product updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell open={open} onClose={onClose} title="Edit Investment Product">
      <InvestmentProductForm form={form} setForm={setForm} coaList={coaList} loading={loading} loadingData={loadingData} submitLabel="Update Investment Product" onSubmit={handleSubmit} />
    </DrawerShell>
  );
}

export default function InvestmentProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${BASE}/api/accounts/investmentsproducts`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = (id) => {
    Swal.fire({ title: "Delete Investment Product?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          const res = await fetch(`${BASE}/api/accounts/investmentsproducts/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete");
          setItems((prev) => prev.filter((x) => x.Id !== id));
          Swal.fire("Deleted!", "Investment product removed.", "success");
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">+ Add Investment Product</Button>
      </div>

      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-4">Description</span>
        <span className="col-span-2">Min Amount</span>
        <span className="col-span-2">Max Amount</span>
        <span className="col-span-2">APY (%)</span>
        <span className="col-span-1">Status</span>
        <span className="col-span-1 text-right">Actions</span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
              <span className="col-span-4 font-medium text-indigo-700">{item.Description}</span>
              <span className="col-span-2 text-sm text-gray-600">{item.MinimumAmount?.toLocaleString() ?? "—"}</span>
              <span className="col-span-2 text-sm text-gray-600">{item.MaximumAmount?.toLocaleString() ?? "—"}</span>
              <span className="col-span-2 text-sm text-gray-600">{item.AnnualPercentageYield ?? "—"}</span>
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
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.Id)}>
                      <FaTrash className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-4">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No investment products found.</p>
        </div>
      )}

      <AddInvestmentProductDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchItems} />
      <EditInvestmentProductDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
