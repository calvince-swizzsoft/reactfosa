import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { ChargeType } from "./chargeType";
import FieldHelp from "../SavingsProducts/FieldHelp";

// Row-editor for GraduatedScaleDTO[] (docs/api/commission-api-spec.md §5.6)
// — the rate-by-amount-bracket structure a Commission's charge is computed
// from. Only the ChargePercentage/ChargeFixedAmount field matching the
// row's own ChargeType is actually used server-side (Domain.MainBoundedContext.
// ValueObjects.Charge's constructor zeroes the other) — both are still kept
// on the row object (not collapsed into one generic "value" field) so
// switching ChargeType back and forth doesn't lose whichever value isn't
// currently shown.
export const emptyGraduatedScaleRow = () => ({
  RangeLowerLimit: 0,
  RangeUpperLimit: 0,
  ChargeType: ChargeType.Percentage,
  ChargePercentage: 0,
  ChargeFixedAmount: 0,
});

export default function GraduatedScaleRows({ rows, onChange }) {
  const HelpLabel = ({ label, children }) => <div className="mb-1 flex items-center gap-1"><Label className="text-xs text-gray-500">{label}</Label><FieldHelp label={label}>{children}</FieldHelp></div>;
  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyGraduatedScaleRow()]);

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const isPercentage = row.ChargeType === ChargeType.Percentage;
        return (
          <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-gray-200 p-2">
            <div className="col-span-3">
              <HelpLabel label="From Amount">Inclusive lower transaction amount for this charge bracket.</HelpLabel>
              <Input type="number" min="0" step="0.01" value={row.RangeLowerLimit} onChange={(e) => updateRow(index, { RangeLowerLimit: Number(e.target.value) })} />
            </div>
            <div className="col-span-3">
              <HelpLabel label="To Amount">Inclusive upper transaction amount. It must not be below From Amount or overlap another bracket.</HelpLabel>
              <Input type="number" min="0" step="0.01" value={row.RangeUpperLimit} onChange={(e) => updateRow(index, { RangeUpperLimit: Number(e.target.value) })} />
            </div>
            <div className="col-span-3">
              <HelpLabel label="Charge Type">Determines whether transactions in this bracket use a rate or one fixed amount.</HelpLabel>
              <Select value={String(row.ChargeType)} onValueChange={(v) => updateRow(index, { ChargeType: Number(v), ChargePercentage: 0, ChargeFixedAmount: 0 })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ChargeType.Percentage)}>Percentage</SelectItem>
                  <SelectItem value={String(ChargeType.FixedAmount)}>Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <HelpLabel label={isPercentage ? "Percentage" : "Amount"}>{isPercentage ? "Enter percentage points: 1 means 1%, while 0.01 means 0.01% (a charge of 1 on a transaction of 10,000 before rounding)." : "Fixed charge for this bracket; enter an amount greater than zero."}</HelpLabel>
              {isPercentage ? (
                <Input type="number" min="0" max="100" step="0.01" value={row.ChargePercentage} onChange={(e) => updateRow(index, { ChargePercentage: Number(e.target.value) })} />
              ) : (
                <Input type="number" min="0" step="0.01" value={row.ChargeFixedAmount} onChange={(e) => updateRow(index, { ChargeFixedAmount: Number(e.target.value) })} />
              )}
            </div>
            <div className="col-span-1">
              <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
                <FaTrash />
              </Button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Add Bracket
      </Button>
    </div>
  );
}
