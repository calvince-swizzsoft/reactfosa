import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ProductPicker from "./ProductPicker";
import { listChartOfAccounts } from "./api";
import { SALARY_HEAD_TYPE_LABEL, isEarningType, SINGLETON_TYPES, STATUTORY_TYPE_HELP, SalaryHeadType } from "./enums";

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

export default function SalaryHeadForm({ form, setForm, loading, submitLabel, onSubmit }) {
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loadingCoa, setLoadingCoa] = useState(true);

  useEffect(() => {
    listChartOfAccounts().then(setChartOfAccounts).catch(() => setChartOfAccounts([])).finally(() => setLoadingCoa(false));
  }, []);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-4">
      <FieldGroup label="Name" htmlFor="salaryhead-name" help="The name shown on salary cards and payslips, such as Basic Salary, House Allowance or PAYE.">
        <Input id="salaryhead-name" value={form.Description} onChange={(e) => set("Description", e.target.value)} required placeholder="e.g. House Allowance" />
      </FieldGroup>

      <FieldGroup label="Type" htmlFor="salaryhead-type" help={`Determines whether this item is an earning or a deduction and how payroll calculates and posts it. Choose Other Earning for allowances and the matching deduction type for taxes, loans or contributions. ${STATUTORY_TYPE_HELP[Number(form.Type)] || ""}${SINGLETON_TYPES.has(Number(form.Type)) ? " Only one salary head of this type is allowed across the system." : ""}`}>
        <Select value={form.Type ? String(form.Type) : ""} onValueChange={(v) => { if (v) set("Type", Number(v)); }}>
          <SelectTrigger id="salaryhead-type"><SelectValue placeholder="Select Type" /></SelectTrigger>
          <SelectContent>
            {Object.entries(SALARY_HEAD_TYPE_LABEL).filter(([value]) => Number(value) !== SalaryHeadType.NHIFDeduction || Number(form.Type) === SalaryHeadType.NHIFDeduction).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {form.Type && isEarningType(form.Type) && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="salaryhead-oneoff" checked={form.IsOneOff} onChange={(e) => set("IsOneOff", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="salaryhead-oneoff">Is One-Off?</Label>
          <FieldHelp label="Is One-Off">Use for an earning paid once, such as a bonus or arrears payment. After the payslip is posted, its salary-card amount is reset to prevent it repeating. Leave off for recurring earnings. One-off earnings are excluded from the Housing Levy calculation.</FieldHelp>
        </div>
      )}

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Linked Product</p>
      <ProductPicker
        productCode={form.CustomerAccountTypeProductCode}
        targetProductId={form.CustomerAccountTypeTargetProductId}
        onChange={({ productCode, targetProductId, targetProductCode }) =>
          setForm((p) => ({
            ...p,
            CustomerAccountTypeProductCode: productCode,
            CustomerAccountTypeTargetProductId: targetProductId,
            CustomerAccountTypeTargetProductCode: targetProductCode,
          }))
        }
      />

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">G/L Account</p>
      <FieldGroup label="Chart of Account" htmlFor="salaryhead-gl" help="The G/L account used when this salary head is posted. Choose the relevant expense account for earnings, payable account for remittances, or control account for loan and investment deductions.">
        <Select value={form.ChartOfAccountId} onValueChange={(v) => { if (v) set("ChartOfAccountId", v); }} disabled={loadingCoa}>
          <SelectTrigger id="salaryhead-gl"><SelectValue placeholder={loadingCoa ? "Loading..." : "Select Account"} /></SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {chartOfAccounts.map((a) => (
              <SelectItem key={a.Id} value={a.Id}>
                {a.AccountCode} — {a.AccountName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <Button type="submit" disabled={loading || loadingCoa} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
