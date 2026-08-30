import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaTrash } from "react-icons/fa";
import FieldHelp from "../../SavingsProducts/FieldHelp";
import { PRODUCT_CODE_OPTIONS, CHARGE_TYPE_OPTIONS, ProductCode, ChargeType } from "./loanProductEnums";

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

function HelpLabel({ children, help }) {
  return <div className="mb-1 flex items-center gap-1"><Label className="text-xs text-gray-500">{children}</Label><FieldHelp label={children}>{help}</FieldHelp></div>;
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
                <HelpLabel help="A clear name for the deduction as it should be recognised during loan disbursement and review.">Description</HelpLabel>
                <Input value={row.Description} onChange={(e) => updateRow(index, { Description: e.target.value })} />
              </div>
              <div className="col-span-3">
                <HelpLabel help="Selects which account family will receive or offset this deduction: savings, loan, or investment.">Product Type</HelpLabel>
                <Select value={String(row.CustomerAccountTypeProductCode)} onValueChange={(v) => updateRow(index, { CustomerAccountTypeProductCode: Number(v), CustomerAccountTypeTargetProductId: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CODE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <HelpLabel help="The specific product whose customer account is used for this deduction. Changing Product Type clears this selection.">Target Product</HelpLabel>
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
                <HelpLabel help="Choose whether this deduction is calculated as a percentage or as one fixed monetary amount.">Charge Type</HelpLabel>
                <Select value={String(row.ChargeType)} onValueChange={(v) => updateRow(index, { ChargeType: Number(v), ChargePercentage: 0, ChargeFixedAmount: 0 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHARGE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {row.ChargeType === ChargeType.Percentage ? <div className="col-span-6">
                <HelpLabel help="Percentage rate applied by the deduction. Enter a value greater than 0 and no more than 100.">Charge %</HelpLabel>
                <Input type="number" min="0" max="100" step="0.01" value={row.ChargePercentage} onChange={(e) => updateRow(index, { ChargePercentage: Number(e.target.value) })} />
              </div> : <div className="col-span-6">
                <HelpLabel help="Exact monetary amount deducted. Enter an amount greater than zero.">Charge Fixed Amount</HelpLabel>
                <Input type="number" min="0" step="0.01" value={row.ChargeFixedAmount} onChange={(e) => updateRow(index, { ChargeFixedAmount: Number(e.target.value) })} />
              </div>}
              <div className="col-span-3 flex flex-col gap-1 pb-1">
                <label className="flex items-center gap-1 text-xs text-gray-700">
                  <input type="checkbox" checked={!!row.NetOffInvestmentBalance} onChange={(e) => updateRow(index, { NetOffInvestmentBalance: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                  Net Off Investment Balance
                  <FieldHelp label="Net Off Investment Balance">Offsets this deduction against the customer's available investment balance where the selected product and posting process support it.</FieldHelp>
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-700">
                  <input type="checkbox" checked={!!row.ComputeChargeOnTopUp} onChange={(e) => updateRow(index, { ComputeChargeOnTopUp: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                  Compute Charge On Top-Up
                  <FieldHelp label="Compute Charge On Top-Up">Recalculates this deduction when an existing loan is topped up, instead of limiting it to the original disbursement.</FieldHelp>
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
