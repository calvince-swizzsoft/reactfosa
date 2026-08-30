import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { AUXILIARY_LOAN_CONDITION_OPTIONS } from "./loanProductEnums";

// LoanProductAuxiliaryConditionDTO[] — .../{id}/auxiliary-conditions
// (GET/PUT-full-replace). {id} in the route is the BASE loan product
// (this one); each row picks a TargetLoanProductId + a [Flags] Condition
// bitmask + MaximumEligiblePercentage.
export const emptyAuxiliaryConditionRow = () => ({ TargetLoanProductId: "", Condition: 0, MaximumEligiblePercentage: 0 });

function toggleFlag(current, bit, checked) {
  return checked ? current | bit : current & ~bit;
}

export default function AuxiliaryConditionRows({ rows, onChange, loanProducts, loadingLoanProducts }) {
  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyAuxiliaryConditionRow()]);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6">
              <Label className="text-xs text-gray-500">Target Loan Product</Label>
              <Select value={row.TargetLoanProductId ? String(row.TargetLoanProductId) : ""} onValueChange={(v) => updateRow(index, { TargetLoanProductId: v })} disabled={loadingLoanProducts}>
                <SelectTrigger><SelectValue placeholder={loadingLoanProducts ? "Loading..." : "Select loan product"} /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {loanProducts.map((p) => <SelectItem key={String(p.Id)} value={String(p.Id)}>{p.Description}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Label className="text-xs text-gray-500">Maximum Eligible %</Label>
              <Input type="number" step="0.01" value={row.MaximumEligiblePercentage} onChange={(e) => updateRow(index, { MaximumEligiblePercentage: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
                <FaTrash />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Condition (may combine several)</Label>
            <div className="grid grid-cols-2 gap-1">
              {AUXILIARY_LOAN_CONDITION_OPTIONS.filter((option) => option.value <= 8).map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={(row.Condition & o.value) === o.value}
                    onChange={(e) => updateRow(index, { Condition: toggleFlag(row.Condition, o.value, e.target.checked) })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Add Auxiliary Condition
      </Button>
    </div>
  );
}
