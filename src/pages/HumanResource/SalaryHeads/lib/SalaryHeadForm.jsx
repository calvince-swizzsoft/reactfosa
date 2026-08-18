import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ProductPicker from "./ProductPicker";
import { listChartOfAccounts } from "./api";
import { SALARY_HEAD_TYPE_LABEL, isEarningType, SINGLETON_TYPES } from "./enums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
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
      <FieldGroup label="Name">
        <Input value={form.Description} onChange={(e) => set("Description", e.target.value)} required placeholder="e.g. House Allowance" />
      </FieldGroup>

      <FieldGroup label="Type">
        <Select value={form.Type ? String(form.Type) : ""} onValueChange={(v) => set("Type", Number(v))}>
          <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
          <SelectContent>
            {Object.entries(SALARY_HEAD_TYPE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {form.Type && SINGLETON_TYPES.has(form.Type) && (
        <p className="text-xs text-amber-600">This type is limited to one salary head system-wide.</p>
      )}

      {form.Type && isEarningType(form.Type) && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="salaryhead-oneoff" checked={form.IsOneOff} onChange={(e) => set("IsOneOff", e.target.checked)} className="w-4 h-4 accent-indigo-600" />
          <Label htmlFor="salaryhead-oneoff">Is One-Off?</Label>
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
      <FieldGroup label="Chart of Account">
        <Select value={form.ChartOfAccountId} onValueChange={(v) => set("ChartOfAccountId", v)} disabled={loadingCoa}>
          <SelectTrigger><SelectValue placeholder={loadingCoa ? "Loading..." : "Select Account"} /></SelectTrigger>
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
