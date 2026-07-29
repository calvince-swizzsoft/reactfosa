import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaChartLine } from "react-icons/fa";
import Swal from "sweetalert2";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

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

export default function CreateInvestmentProduct() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    fetch(`${BASE}/api/values/GetChartOfAccount`)
      .then((r) => r.json())
      .then((d) => setCoaList(Array.isArray(d.Data) ? d.Data : []))
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
          <FaChartLine className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Investment Product</h2>
        </div>
        <Link to="/Accounts/InvestmentProducts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Investment Products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
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

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.IsLocked} onChange={(e) => handleChange("IsLocked", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <span className="text-sm font-medium">Is Locked</span>
        </label>

        <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Investment Product"}
        </Button>
      </form>
    </div>
  );
}
