import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus, FaTrash } from "react-icons/fa";

// DynamicChargeDTO[] — .../{id}/dynamic-charges (GET/PUT-full-replace).
// This is a join to EXISTING DynamicCharge records — the API spec says
// "only Id is read on PUT". Unlike Levies (Commissions' equivalent join),
// no controller anywhere in this backend exposes a DynamicCharge master
// list to pick from (confirmed: no DynamicChargeController exists), so
// there's nothing to build a PickerList against — attaching one takes a
// plain GUID input with an inline note, same treatment as every other
// "no browse endpoint exists" gap this session (Debit Type, Journal,
// Loan Case pickers in Batch Procedures).
export const emptyDynamicChargeRow = () => ({ Id: "" });

export default function DynamicChargeRows({ rows, onChange }) {
  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptyDynamicChargeRow()]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">
        No lookup endpoint exists for existing Dynamic Charge records — paste the Id of one already created elsewhere.
      </p>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-gray-200 p-2">
          <div className="col-span-10">
            <Input value={row.Id} onChange={(e) => updateRow(index, { Id: e.target.value })} placeholder="Dynamic Charge Id (GUID)" />
          </div>
          <div className="col-span-2">
            <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
              <FaTrash />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
        <FaPlus /> Attach Dynamic Charge
      </Button>
    </div>
  );
}
