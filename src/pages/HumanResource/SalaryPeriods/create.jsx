import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaMoneyCheckAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { createSalaryPeriod, listPostingPeriods } from "./lib/api";
import { MONTH_LABEL, EMPLOYEE_CATEGORY_LABEL } from "./lib/enums";

function FieldGroup({ label, help, htmlFor, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">{label}</Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
      {children}
    </div>
  );
}

const emptyForm = {
  PostingPeriodId: "", Month: new Date().getMonth() + 1, EmployeeCategory: 1,
  TaxReliefAmount: 2400, MaximumProvidentFundReliefAmount: 30000, MaximumInsuranceReliefAmount: 5000,
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
        <FieldGroup label="Posting Period" htmlFor="salary-period-posting" help="The accounting period for this payroll. Its ending year is used with the selected salary month when enforcing the month value date.">
          <Select value={form.PostingPeriodId} onValueChange={(v) => set("PostingPeriodId", v)} disabled={loadingData}>
            <SelectTrigger id="salary-period-posting"><SelectValue placeholder={loadingData ? "Loading..." : "Select Posting Period"} /></SelectTrigger>
            <SelectContent>
              {postingPeriods.map((p) => (
                <SelectItem key={p.Id} value={p.Id}>{p.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Month" htmlFor="salary-period-month" help="The month this payroll covers. Salary periods are identified by posting period, month and employee category.">
            <Select value={String(form.Month)} onValueChange={(v) => set("Month", Number(v))}>
              <SelectTrigger id="salary-period-month"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MONTH_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Employee Category" htmlFor="salary-period-category" help="Choose the employee group for this payroll: full-time, part-time or contract.">
            <Select value={String(form.EmployeeCategory)} onValueChange={(v) => set("EmployeeCategory", Number(v))}>
              <SelectTrigger id="salary-period-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EMPLOYEE_CATEGORY_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>

        <FieldGroup label="Tax Relief Amount" htmlFor="salary-period-tax" help="The relief amount deducted from each employee’s calculated income tax for this salary period. The default KSh 2,400 is monthly personal relief for eligible Kenyan residents. Use zero where personal relief does not apply. Enter an amount, not a percentage.">
          <Input id="salary-period-tax" type="number" min="0" step="0.01" value={form.TaxReliefAmount} onChange={(e) => set("TaxReliefAmount", e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Maximum Provident Fund Relief Amount" htmlFor="salary-period-provident" help="The maximum combined NSSF and provident fund contribution amount deducted from gross pay when calculating taxable pay for this period. The current monthly maximum is KSh 30,000 for eligible registered pension contributions.">
          <Input id="salary-period-provident" type="number" min="0" step="0.01" value={form.MaximumProvidentFundReliefAmount} onChange={(e) => set("MaximumProvidentFundReliefAmount", e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Maximum Insurance Relief Amount" htmlFor="salary-period-insurance" help="The maximum insurance relief deducted from calculated income tax for this period. Payroll uses the lower of this limit and the insurance relief on the employee’s salary card. Enter the already-calculated eligible relief on that card, not the premium; the monthly ceiling is KSh 5,000.">
          <Input id="salary-period-insurance" type="number" min="0" step="0.01" value={form.MaximumInsuranceReliefAmount} onChange={(e) => set("MaximumInsuranceReliefAmount", e.target.value)} />
        </FieldGroup>

        <FieldGroup label="Remarks" htmlFor="salary-period-remarks" help="A description of this salary period, such as September 2026 payroll. It is also used as the reference on salary posting transactions.">
          <Input id="salary-period-remarks" value={form.Remarks} onChange={(e) => set("Remarks", e.target.value)} required placeholder="e.g. August 2026 payroll" />
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="period-enforcedate" checked={form.EnforceMonthValueDate} onChange={(e) => set("EnforceMonthValueDate", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="period-enforcedate">Enforce Month Value Date?</Label>
          <FieldHelp label="Enforce Month Value Date">Use the last day of the selected salary month as the transaction value date, using the posting period’s ending year. Future dates are capped at today. When off, transactions use the date they are posted.</FieldHelp>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="period-payouts" checked={form.ExecutePayoutStandingOrders} onChange={(e) => set("ExecutePayoutStandingOrders", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="period-payouts">Execute Payout Standing Orders?</Label>
          <FieldHelp label="Execute Payout Standing Orders">After a payslip is successfully posted, queue the employee’s payout standing orders from their payroll savings account for the selected month.</FieldHelp>
        </div>

        <Button type="submit" disabled={loading || loadingData || !form.PostingPeriodId} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Salary Period"}
        </Button>
      </form>
    </div>
  );
}
