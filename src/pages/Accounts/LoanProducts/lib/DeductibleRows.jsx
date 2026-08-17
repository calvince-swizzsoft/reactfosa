import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { PRODUCT_CODE_OPTIONS, CHARGE_TYPE_OPTIONS, ProductCode } from "./loanProductEnums";

// LoanProductDeductibleDTO[] — .../{id}/deductibles (GET/PUT-full-replace).
// Deductions taken against this loan product at disbursement.
// CustomerAccountTypeTargetProductId's picker source is polymorphic on
// CustomerAccountTypeProductCode (Savings/Loan/Investment) — each row
// switches which product list it offers.
export const emptyDeductibleRow = () => ({
  Description: "", CustomerAccountTypeProductCode: ProductCode.Savings, CustomerAccountTypeTargetProductId: "",
  ChargeType: 1, ChargePercentage: 0, ChargeFixedAmount: 0, NetOffInvestmentBalance: false, ComputeChargeOnTopUp: false,
});

function targetProductsFor(productCode, { savingsProducts, loanProducts, investmentProducts }) {
  if (productCode === ProductCode.Savings) return savingsProducts;
  if (productCode === ProductCode.Loan) return loanProducts;
  return investmentProducts;
}

export default function DeductibleRows({ rows, onChange, savingsProducts, loanProducts, investmentProducts, loadingProducts }) {
  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyDeductibleRow()]);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const targetProducts = targetProductsFor(row.CustomerAccountTypeProductCode, { savingsProducts, loanProducts, investmentProducts });
        return (
          <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <Label className="text-xs text-gray-500">Description</Label>
                <Input value={row.Description} onChange={(e) => updateRow(index, { Description: e.target.value })} />
              </div>
              <div className="col-span-3">
                <Label className="text-xs text-gray-500">Product Type</Label>
                <Select value={String(row.CustomerAccountTypeProductCode)} onValueChange={(v) => updateRow(index, { CustomerAccountTypeProductCode: Number(v), CustomerAccountTypeTargetProductId: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CODE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <Label className="text-xs text-gray-500">Target Product</Label>
                <Select value={row.CustomerAccountTypeTargetProductId ? String(row.CustomerAccountTypeTargetProductId) : ""} onValueChange={(v) => updateRow(index, { CustomerAccountTypeTargetProductId: v })} disabled={loadingProducts}>
                  <SelectTrigger><SelectValue placeholder={loadingProducts ? "Loading..." : "Select product"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {targetProducts.map((p) => <SelectItem key={String(p.Id)} value={String(p.Id)}>{p.Description}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
                  <FaTrash />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <Label className="text-xs text-gray-500">Charge Type</Label>
                <Select value={String(row.ChargeType)} onValueChange={(v) => updateRow(index, { ChargeType: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHARGE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Label className="text-xs text-gray-500">Charge %</Label>
                <Input type="number" step="0.01" value={row.ChargePercentage} onChange={(e) => updateRow(index, { ChargePercentage: Number(e.target.value) })} />
              </div>
              <div className="col-span-3">
                <Label className="text-xs text-gray-500">Charge Fixed Amount</Label>
                <Input type="number" value={row.ChargeFixedAmount} onChange={(e) => updateRow(index, { ChargeFixedAmount: Number(e.target.value) })} />
              </div>
              <div className="col-span-3 flex flex-col gap-1 pb-1">
                <label className="flex items-center gap-1 text-xs text-gray-700">
                  <input type="checkbox" checked={!!row.NetOffInvestmentBalance} onChange={(e) => updateRow(index, { NetOffInvestmentBalance: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                  Net Off Investment Balance
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-700">
                  <input type="checkbox" checked={!!row.ComputeChargeOnTopUp} onChange={(e) => updateRow(index, { ComputeChargeOnTopUp: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                  Compute Charge On Top-Up
                </label>
              </div>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Add Deductible
      </Button>
    </div>
  );
}
