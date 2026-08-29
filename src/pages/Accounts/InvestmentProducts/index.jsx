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
import { FaEllipsisV, FaEdit, FaPlus, FaChartLine } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import FieldHelp from "../SavingsProducts/FieldHelp";
import { investmentProductPayload, investmentProductValidationAlert, validateInvestmentProduct } from "./validation";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = {
  Description: "",
  MinimumBalance: "", MaximumBalance: "", PoolAmount: "0", MaturityPeriod: "",
  AnnualPercentageYield: "",
  Priority: "1", ChartOfAccountId: "", PoolChartOfAccountId: "",
  IsRefundable: false, IsPooled: false, IsSuperSaver: false, IsMandatory: false,
  TrackArrears: false, ThrottleScheduledArrearsRecovery: false, IsLocked: false,
};

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>
      {children}
    </div>
  );
}

function NumInput({ field, value, onChange, placeholder }) {
  return (
    <Input
      type="number"
      min="0"
      step="any"
      required
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
            className="fixed top-5 right-3 w-[520px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 h-[95vh]"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="shrink-0 p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
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
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <FieldGroup label="Description" help="Name shown on member investment accounts and reports.">
        <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required maxLength={256} placeholder="e.g. FIXED DEPOSIT" />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Minimum Balance" help="Target minimum used by balancing and recovery processes.">
          <NumInput field="MinimumBalance" value={form.MinimumBalance} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Maximum Balance" help="Maximum balance this investment account should hold.">
          <NumInput field="MaximumBalance" value={form.MaximumBalance} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Maturity Period (days)" help="Days before invested funds are treated as mature.">
          <NumInput field="MaturityPeriod" value={form.MaturityPeriod} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Annual Percentage Yield (%)" help="Annual return rate, between 0% and 100%.">
          <NumInput field="AnnualPercentageYield" value={form.AnnualPercentageYield} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Recovery Priority" help="Recovery category: 0 Loans, 1 Investments, 2 Savings, or 3 Direct Debits.">
          <NumInput field="Priority" value={form.Priority} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Pool Amount" help="Required above zero for pooled products.">
          <NumInput field="PoolAmount" value={form.PoolAmount} onChange={handleChange} />
        </FieldGroup>
      </div>
      <FieldGroup label="Chart of Account" help="Required G/L control account for this product.">
        <CoaSelect coaList={coaList} value={form.ChartOfAccountId} onChange={handleChange} disabled={loadingData} />
      </FieldGroup>
      {form.IsPooled && <FieldGroup label="Pool G/L Account" help="G/L account used for pooled-fund movements."><CoaSelect coaList={coaList} value={form.PoolChartOfAccountId} onChange={(field,value) => handleChange("PoolChartOfAccountId",value)} disabled={loadingData}/></FieldGroup>}
      <div className="grid grid-cols-2 gap-3">{[["IsRefundable","Refundable","Allows the balance to be refunded."],["IsPooled","Pooled","Uses a separate pooled-funds G/L account."],["IsSuperSaver","Super Saver","Used by Super Saver processing."],["IsMandatory","Mandatory","Automatically attaches to eligible members."],["TrackArrears","Track Arrears","Tracks missed scheduled contributions."],["ThrottleScheduledArrearsRecovery","Throttle Recovery","Limits recovery; requires Track Arrears."],["IsLocked","Locked","Prevents normal active use."]].map(([field,label,help]) => <div key={field} className="flex items-center gap-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form[field]} onChange={(e) => handleChange(field,e.target.checked)} className="w-4 h-4 accent-indigo-600"/><span className="text-sm font-medium">{label}</span></label><FieldHelp label={label}>{help}</FieldHelp></div>)}</div>
      </div>
      <div className="shrink-0 border-t border-gray-200 bg-white p-4"><Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">{loading ? "Saving..." : submitLabel}</Button></div>
    </form>
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
    listAllChartOfAccounts()
      .then(setCoaList)
      .catch(() => setCoaList([]))
      .finally(() => setLoadingData(false));
  }, [open]);

  useEffect(() => {
    if (item) {
      setForm({
        Description: item.Description || "",
        MinimumBalance: item.MinimumBalance ?? "",
        MaximumBalance: item.MaximumBalance ?? "",
        PoolAmount: item.PoolAmount ?? 0,
        MaturityPeriod: item.MaturityPeriod ?? "",
        AnnualPercentageYield: item.AnnualPercentageYield ?? "",
        Priority: item.Priority ?? 1,
        ChartOfAccountId: item.ChartOfAccountId || "",
        PoolChartOfAccountId: item.PoolChartOfAccountId || "",
        IsRefundable: !!item.IsRefundable, IsPooled: !!item.IsPooled, IsSuperSaver: !!item.IsSuperSaver,
        IsMandatory: !!item.IsMandatory, TrackArrears: !!item.TrackArrears,
        ThrottleScheduledArrearsRecovery: !!item.ThrottleScheduledArrearsRecovery,
        IsLocked: item.IsLocked || false,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateInvestmentProduct(form);
    if (validationErrors.length) { Swal.fire(investmentProductValidationAlert(validationErrors)); return; }
    setLoading(true);
    try {
      const payload = { ...investmentProductPayload(form), Id: item.Id };
      await apiJson(`${BASE}/api/accounts/investmentsproducts`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Unable to update the investment product." });
      Swal.fire("Success", "Investment product updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the investment product."), "error");
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
  const [editItem, setEditItem] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    apiJson(`${BASE}/api/accounts/investmentsproducts`, {}, { fallbackMessage: "Unable to load investment products." })
      .then((body) => setItems(normalizeList(body)))
      .catch((error) => { setItems([]); Swal.fire("Error", apiErrorMessage(error, "Unable to load investment products."), "error"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaChartLine /> Investment Products
        </h2>
        <Link
          to="/Accounts/InvestmentProducts/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Investment Product
        </Link>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Description</span>
          <span className="col-span-2">Min Amount</span>
          <span className="col-span-2">Max Amount</span>
          <span className="col-span-2">APY (%)</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Actions</span>
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
                  <span className="col-span-4 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.MinimumBalance?.toLocaleString() ?? "—"}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.MaximumBalance?.toLocaleString() ?? "—"}</span>
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
            <p className="font-medium text-gray-400">No Investment Products Found.</p>
          </div>
        )}
      </div>

      <EditInvestmentProductDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
