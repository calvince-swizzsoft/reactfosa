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
import { FaEllipsisV, FaTrash, FaEdit, FaPlus, FaPiggyBank } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { savingsProductPayload, savingsProductValidationAlert, validateSavingsProduct } from "./validation";
import FieldHelp from "./FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = {
  Description: "",
  MaximumAllowedWithdrawal: "",
  MaximumAllowedDeposit: "",
  MinimumBalance: "",
  OperatingBalance: "",
  WithdrawalNoticeAmount: "",
  WithdrawalNoticePeriod: "",
  WithdrawalInterval: "",
  AnnualPercentageYield: "",
  Priority: 0,
  ChartOfAccountId: "",
  ChartOfAccountName: "",
  IsMandatory: false,
  IsDefault: false,
};

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
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

function CoaSelect({ coaList, value, nameFallback, onChange, disabled }) {
  const selected = coaList.find((c) => c.Id === value);
  const selectedLabel = selected
    ? `${selected.AccountCode} — ${selected.AccountName}`
    : (nameFallback || "");

  const handleValueChange = (v) => {
    const chosen = coaList.find((c) => c.Id === v);
    onChange("ChartOfAccountId", v);
    onChange("ChartOfAccountName", chosen?.AccountName || "");
  };

  return (
    <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={disabled ? "Loading..." : "Select Chart of Account"}>
          {selectedLabel || (disabled ? "Loading..." : "Select Chart of Account")}
        </SelectValue>
      </SelectTrigger>
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

function SavingsProductForm({ form, setForm, coaList, loading, loadingData, submitLabel, onSubmit }) {
  const handleChange = (field, value) => {
    console.log("[SavingsProductForm] field change:", field, "=", value);
    setForm((p) => ({ ...p, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <FieldGroup label="Description" help="The name shown on member accounts, transaction screens, and reports.">
        <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. ORDINARY SAVINGS" />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Max Allowed Withdrawal" help="Largest permitted single withdrawal. Must be greater than zero.">
          <NumInput field="MaximumAllowedWithdrawal" value={form.MaximumAllowedWithdrawal} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Max Allowed Deposit" help="Largest permitted single deposit. Must be greater than zero.">
          <NumInput field="MaximumAllowedDeposit" value={form.MaximumAllowedDeposit} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Minimum Balance" help="Protected balance expected to remain after withdrawals.">
          <NumInput field="MinimumBalance" value={form.MinimumBalance} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Operating Balance" help="Normal operating target; cannot be below minimum. Currently stored but not transaction-enforced.">
          <NumInput field="OperatingBalance" value={form.OperatingBalance} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Withdrawal Notice Amount" help="Withdrawals above this require notice or may attract a without-notice charge.">
          <NumInput field="WithdrawalNoticeAmount" value={form.WithdrawalNoticeAmount} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Withdrawal Notice Period (days)" help="Business days before a future withdrawal notice matures.">
          <NumInput field="WithdrawalNoticePeriod" value={form.WithdrawalNoticePeriod} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Withdrawal Interval (days)" help="Minimum days between withdrawals; early withdrawal may attract a charge.">
          <NumInput field="WithdrawalInterval" value={form.WithdrawalInterval} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Annual Percentage Yield (%)" help="Displayed annual return rate, from 0% to 100%; not currently used for automatic accrual.">
          <NumInput field="AnnualPercentageYield" value={form.AnnualPercentageYield} onChange={handleChange} />
        </FieldGroup>
        <FieldGroup label="Recovery Priority" help="Recovery category: 0 Loans, 1 Investments, 2 Savings, or 3 Direct Debits.">
          <NumInput field="Priority" value={form.Priority} onChange={handleChange} />
        </FieldGroup>
      </div>
      <FieldGroup label="Chart of Account" help="Required G/L control account used for this product's financial postings.">
        <CoaSelect coaList={coaList} value={form.ChartOfAccountId} nameFallback={form.ChartOfAccountName} onChange={handleChange} disabled={loadingData} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.IsMandatory} onChange={(e) => handleChange("IsMandatory", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm font-medium">Is Mandatory</span>
            </label>
            <FieldHelp label="Is Mandatory">Marks this product for automatic member-account attachment.</FieldHelp>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.IsDefault} onChange={(e) => handleChange("IsDefault", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm font-medium">Is Default</span>
            </label>
            <FieldHelp label="Is Default">Primary fallback product. Only one product should be default.</FieldHelp>
          </div>
        </div>
      </div>
      </div>
      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function EditSavingsProductDrawer({ open, onClose, onSuccess, item }) {
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
      console.log("[EditSavingsProductDrawer] prefill item:", item);
      setForm({
        Description: item.Description || "",
        MaximumAllowedWithdrawal: item.MaximumAllowedWithdrawal ?? "",
        MaximumAllowedDeposit: item.MaximumAllowedDeposit ?? "",
        MinimumBalance: item.MinimumBalance ?? "",
        OperatingBalance: item.OperatingBalance ?? "",
        WithdrawalNoticeAmount: item.WithdrawalNoticeAmount ?? "",
        WithdrawalNoticePeriod: item.WithdrawalNoticePeriod ?? "",
        WithdrawalInterval: item.WithdrawalInterval ?? "",
        AnnualPercentageYield: item.AnnualPercentageYield ?? "",
        Priority: item.Priority ?? 0,
        ChartOfAccountId: item.ChartOfAccountId || "",
        ChartOfAccountName: item.ChartOfAccountName || "",
        IsMandatory: item.IsMandatory || false,
        IsDefault: item.IsDefault || false,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateSavingsProduct(form);
    if (validationErrors.length) {
      Swal.fire(savingsProductValidationAlert(validationErrors));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...savingsProductPayload(form),
        Id: item.Id,
      };
      console.log("[EditSavingsProductDrawer] PUT payload:", payload);
      await apiJson(`${BASE}/api/accounts/savingsproducts`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Unable to update the savings product." });
      Swal.fire("Success", "Savings product updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the savings product."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerShell open={open} onClose={onClose} title="Edit Savings Product">
      <SavingsProductForm form={form} setForm={setForm} coaList={coaList} loading={loading} loadingData={loadingData} submitLabel="Update Savings Product" onSubmit={handleSubmit} />
    </DrawerShell>
  );
}

export default function SavingsProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    apiJson(`${BASE}/api/accounts/savingsproducts`, {}, { fallbackMessage: "Unable to load savings products." })
      .then((body) => {
        setItems(normalizeList(body));
      })
      .catch((error) => {
        setItems([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load savings products."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = (id) => {
    Swal.fire({ title: "Delete Savings Product?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await apiJson(`${BASE}/api/accounts/savingsproducts/${id}`, { method: "DELETE" }, { fallbackMessage: "Unable to delete the savings product." });
          setItems((prev) => prev.filter((x) => x.Id !== id));
          Swal.fire("Deleted!", "Savings product removed.", "success");
        } catch (err) {
          Swal.fire("Error", apiErrorMessage(err, "Unable to delete the savings product."), "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaPiggyBank /> Savings Products
        </h2>
        <Link
          to="/Accounts/SavingsProducts/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Savings Product
        </Link>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Description</span>
          <span className="col-span-2">Min Balance</span>
          <span className="col-span-2">APY (%)</span>
          <span className="col-span-2">Priority</span>
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
                  <span className="col-span-2 text-sm text-gray-600">{item.AnnualPercentageYield ?? "—"}</span>
                  <span className="col-span-2 text-sm text-gray-500">{item.Priority ?? 0}</span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No Savings Products Found.</p>
          </div>
        )}
      </div>

      <EditSavingsProductDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
