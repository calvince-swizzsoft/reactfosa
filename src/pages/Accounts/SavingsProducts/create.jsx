import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPiggyBank } from "react-icons/fa";
import Swal from "sweetalert2";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";

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
  IsMandatory: false,
  IsDefault: false,
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

export default function CreateSavingsProduct() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    listAllChartOfAccounts()
      .then(setCoaList)
      .catch(() => setCoaList([]))
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        MaximumAllowedWithdrawal: Number(form.MaximumAllowedWithdrawal),
        MaximumAllowedDeposit: Number(form.MaximumAllowedDeposit),
        MinimumBalance: Number(form.MinimumBalance),
        OperatingBalance: Number(form.OperatingBalance),
        WithdrawalNoticeAmount: Number(form.WithdrawalNoticeAmount),
        WithdrawalNoticePeriod: Number(form.WithdrawalNoticePeriod),
        WithdrawalInterval: Number(form.WithdrawalInterval),
        AnnualPercentageYield: Number(form.AnnualPercentageYield),
        Priority: Number(form.Priority),
      };
      const res = await fetch(`${BASE}/api/accounts/savingsproducts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create savings product");
      Swal.fire("Success", "Savings product created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaPiggyBank className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Savings Product</h2>
        </div>
        <Link to="/Accounts/SavingsProducts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Savings Products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <FieldGroup label="Description">
          <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. ORDINARY SAVINGS" />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Max Allowed Withdrawal">
            <NumInput field="MaximumAllowedWithdrawal" value={form.MaximumAllowedWithdrawal} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Max Allowed Deposit">
            <NumInput field="MaximumAllowedDeposit" value={form.MaximumAllowedDeposit} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Minimum Balance">
            <NumInput field="MinimumBalance" value={form.MinimumBalance} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Operating Balance">
            <NumInput field="OperatingBalance" value={form.OperatingBalance} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Notice Amount">
            <NumInput field="WithdrawalNoticeAmount" value={form.WithdrawalNoticeAmount} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Notice Period (days)">
            <NumInput field="WithdrawalNoticePeriod" value={form.WithdrawalNoticePeriod} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Interval (days)">
            <NumInput field="WithdrawalInterval" value={form.WithdrawalInterval} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Annual Percentage Yield (%)">
            <NumInput field="AnnualPercentageYield" value={form.AnnualPercentageYield} onChange={handleChange} />
          </FieldGroup>
          <FieldGroup label="Priority">
            <NumInput field="Priority" value={form.Priority} onChange={handleChange} />
          </FieldGroup>
        </div>

        <FieldGroup label="Chart of Account">
          <Select value={form.ChartOfAccountId} onValueChange={(v) => handleChange("ChartOfAccountId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Chart of Account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {coaList.map((c) => (
                <SelectItem key={c.Id} value={c.Id}>
                  {c.AccountCode} — {c.AccountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.IsMandatory} onChange={(e) => handleChange("IsMandatory", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-medium">Is Mandatory</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.IsDefault} onChange={(e) => handleChange("IsDefault", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-medium">Is Default</span>
          </label>
        </div>

        <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Savings Product"}
        </Button>
      </form>
    </div>
  );
}
