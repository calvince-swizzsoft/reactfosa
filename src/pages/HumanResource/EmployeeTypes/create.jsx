import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaUserTag } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const categoryOptions = [
  { value: 1, label: "Full-Time" },
  { value: 2, label: "Part-Time" },
  { value: 3, label: "Contract" },
  { value: 4, label: "Intern" },
];

const emptyForm = { ChartOfAccountId: "", Description: "", IsLocked: false, Category: "" };

export default function CreateEmployeeType() {
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
      const payload = { ...form, Category: parseInt(form.Category) || 1 };
      const res = await apiFetch(`${BASE}/api/humanresource/employeetypes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create employee type");
      Swal.fire("Success", "Employee Type created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaUserTag className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Employee Type</h2>
        </div>
        <Link to="/HumanResource/EmployeeTypes" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Employee Types
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <Label>Description</Label>
          <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. FOSA" />
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Chart of Accounts</p>
        <div>
          <Label>Chart of Account</Label>
          <Select value={form.ChartOfAccountId} onValueChange={(v) => handleChange("ChartOfAccountId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {coaList.map((a) => (
                <SelectItem key={a.Id} value={a.Id}>
                  {a.AccountCode} — {a.AccountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select value={String(form.Category)} onValueChange={(v) => handleChange("Category", v)}>
            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="emptype-locked"
            checked={form.IsLocked}
            onChange={(e) => handleChange("IsLocked", e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="emptype-locked">Is Locked?</Label>
        </div>

        <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Employee Type"}
        </Button>
      </form>
    </div>
  );
}
