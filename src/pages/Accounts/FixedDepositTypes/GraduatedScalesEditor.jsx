import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus, FaTrash } from "react-icons/fa";

// Inline repeatable-rows editor for FixedDepositTypeGraduatedScaleDTO rows
// (interest-rate bands by deposit amount range) — a real
// IFixedDepositTypeAppService capability with no screen anywhere in the
// reference app, exposed here as a sub-resource (same "found, not
// reproduced -> exposed properly" call as LoanProductController's
// sub-resources). Rows are plain objects { RangeLowerLimit,
// RangeUpperLimit, Percentage } — Id/FixedDepositTypeId are assigned
// server-side on save, not tracked client-side.
export default function GraduatedScalesEditor({ scales, onChange }) {
  const addRow = () => onChange([...scales, { RangeLowerLimit: "", RangeUpperLimit: "", Percentage: "" }]);
  const removeRow = (index) => onChange(scales.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => onChange(scales.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  return (
    <div className="space-y-2">
      {scales.length === 0 ? (
        <p className="text-sm text-gray-400 rounded-lg border border-gray-200 p-3">
          No graduated scales configured — a flat rate applies to every deposit under this type.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-1">
            <span className="col-span-4">Lower Limit</span>
            <span className="col-span-4">Upper Limit</span>
            <span className="col-span-3">Rate (%)</span>
          </div>
          {scales.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-4"
                type="number" min="0" step="0.01"
                value={row.RangeLowerLimit}
                onChange={(e) => updateRow(i, "RangeLowerLimit", e.target.value)}
                placeholder="e.g. 0"
              />
              <Input
                className="col-span-4"
                type="number" min="0" step="0.01"
                value={row.RangeUpperLimit}
                onChange={(e) => updateRow(i, "RangeUpperLimit", e.target.value)}
                placeholder="e.g. 100000"
              />
              <Input
                className="col-span-3"
                type="number" min="0" step="0.01"
                value={row.Percentage}
                onChange={(e) => updateRow(i, "Percentage", e.target.value)}
                placeholder="e.g. 8.5"
              />
              <button type="button" onClick={() => removeRow(i)} className="col-span-1 flex justify-center text-red-500 hover:text-red-700">
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Add Band
      </Button>
    </div>
  );
}
