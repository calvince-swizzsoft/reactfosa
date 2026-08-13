import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaPlus, FaTrash } from "react-icons/fa";

// LoanCycleDTO[] — .../{id}/loan-cycles (GET/PUT-full-replace).
// RangeLowerLimit/RangeUpperLimit define the cycle band.
export const emptyLoanCycleRow = () => ({ RangeLowerLimit: 0, RangeUpperLimit: 0 });

export default function LoanCycleRows({ rows, onChange }) {
  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyLoanCycleRow()]);

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-gray-200 p-2">
          <div className="col-span-5">
            <Label className="text-xs text-gray-500">Range Lower Limit</Label>
            <Input type="number" value={row.RangeLowerLimit} onChange={(e) => updateRow(index, { RangeLowerLimit: Number(e.target.value) })} />
          </div>
          <div className="col-span-5">
            <Label className="text-xs text-gray-500">Range Upper Limit</Label>
            <Input type="number" value={row.RangeUpperLimit} onChange={(e) => updateRow(index, { RangeUpperLimit: Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
              <FaTrash />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Add Loan Cycle
      </Button>
    </div>
  );
}
