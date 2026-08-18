import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaMoneyCheckAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { createSalaryPeriod, listPostingPeriods } from "./lib/api";
import { MONTH_LABEL, EMPLOYEE_CATEGORY_LABEL } from "./lib/enums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyForm = {
  PostingPeriodId: "", Month: new Date().getMonth() + 1, EmployeeCategory: 1,
  TaxReliefAmount: 0, MaximumProvidentFundReliefAmount: 0, MaximumInsuranceReliefAmount: 0,
  EnforceMonthValueDate: false, ExecutePayoutStandingOrders: false, Remarks: "",
};

export default function CreateSalaryPeriod() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [postingPeriods, setPostingPeriods] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    listPostingPeriods().then(setPostingPeriods).catch(() => setPostingPeriods([])).finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSalaryPeriod({
        ...form,
        TaxReliefAmount: Number(form.TaxReliefAmount),
        MaximumProvidentFundReliefAmount: Number(form.MaximumProvidentFundReliefAmount),
        MaximumInsuranceReliefAmount: Number(form.MaximumInsuranceReliefAmount),
      });
      Swal.fire("Success", "Salary period created successfully", "success");
      navigate("/HumanResource/SalaryPeriods");
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
          <FaMoneyCheckAlt className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Salary Period</h2>
        </div>
        <Link to="/HumanResource/SalaryPeriods" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Periods
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Posting Period">
          <Select value={form.PostingPeriodId} onValueChange={(v) => set("PostingPeriodId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Posting Period"} /></SelectTrigger>
            <SelectContent>
              {postingPeriods.map((p) => (
                <SelectItem key={p.Id} value={p.Id}>{p.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Month">
            <Select value={String(form.Month)} onValueChange={(v) => set("Month", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MONTH_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Employee Category">
            <Select value={String(form.EmployeeCategory)} onValueChange={(v) => set("EmployeeCategory", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EMPLOYEE_CATEGORY_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>

        <FieldGroup label="Tax Relief Amount">
          <Input type="number" min="0" step="0.01" value={form.TaxReliefAmount} onChange={(e) => set("TaxReliefAmount", e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Maximum Provident Fund Relief Amount">
          <Input type="number" min="0" step="0.01" value={form.MaximumProvidentFundReliefAmount} onChange={(e) => set("MaximumProvidentFundReliefAmount", e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Maximum Insurance Relief Amount">
          <Input type="number" min="0" step="0.01" value={form.MaximumInsuranceReliefAmount} onChange={(e) => set("MaximumInsuranceReliefAmount", e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => set("Remarks", e.target.value)} required placeholder="e.g. August 2026 payroll" />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="period-enforcedate" checked={form.EnforceMonthValueDate} onChange={(e) => set("EnforceMonthValueDate", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="period-enforcedate">Enforce Month Value Date?</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="period-payouts" checked={form.ExecutePayoutStandingOrders} onChange={(e) => set("ExecutePayoutStandingOrders", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="period-payouts">Execute Payout Standing Orders?</Label>
        </div>
        <p className="text-xs text-gray-400">
          When enabled, posting a payslip from this period also queues that employee's payout standing orders — a real money-movement side effect, not just a display flag.
        </p>

        <Button type="submit" disabled={loading || loadingData || !form.PostingPeriodId} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Salary Period"}
        </Button>
      </form>
    </div>
  );
}
