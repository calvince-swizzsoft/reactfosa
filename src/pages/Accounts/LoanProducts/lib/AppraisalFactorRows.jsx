import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaPlus, FaTrash } from "react-icons/fa";

// LoanProductAuxilliaryAppraisalFactorDTO[] — .../{id}/auxiliary-appraisal-factors
// (GET/PUT-full-replace). Investments-range-banded LoaneeMultiplier/
// GuarantorMultiplier, overrides LoanRegistrationInvestmentsMultiplier when
// a matching band exists.
export const emptyAppraisalFactorRow = () => ({
  RangeLowerLimit: 0, RangeUpperLimit: 0, LoaneeMultiplier: 0, GuarantorMultiplier: 0,
});

export default function AppraisalFactorRows({ rows, onChange }) {
  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyAppraisalFactorRow()]);

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-gray-200 p-2">
          <div className="col-span-3">
            <Label className="text-xs text-gray-500">Range Lower Limit</Label>
            <Input type="number" value={row.RangeLowerLimit} onChange={(e) => updateRow(index, { RangeLowerLimit: Number(e.target.value) })} />
          </div>
          <div className="col-span-3">
            <Label className="text-xs text-gray-500">Range Upper Limit</Label>
            <Input type="number" value={row.RangeUpperLimit} onChange={(e) => updateRow(index, { RangeUpperLimit: Number(e.target.value) })} />
          </div>
          <div className="col-span-3">
            <Label className="text-xs text-gray-500">Loanee Multiplier</Label>
            <Input type="number" step="0.01" value={row.LoaneeMultiplier} onChange={(e) => updateRow(index, { LoaneeMultiplier: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-gray-500">Guarantor Multiplier</Label>
            <Input type="number" step="0.01" value={row.GuarantorMultiplier} onChange={(e) => updateRow(index, { GuarantorMultiplier: Number(e.target.value) })} />
          </div>
          <div className="col-span-1">
            <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
              <FaTrash />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Add Appraisal Factor Band
      </Button>
    </div>
  );
}
