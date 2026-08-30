import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaPlus, FaTrash } from "react-icons/fa";
import FieldHelp from "../SavingsProducts/FieldHelp";

// Shared row-editor for CommissionSplitDTO[] (docs/api/commission-api-spec.md
// §5.7) and LevySplitDTO[] (docs/api/levy-api-spec.md §4.6) — same shape
// (ChartOfAccountId/Description/Percentage), Commission splits additionally
// carry `Leviable` (feeds the levy calculation, COMMISSION-LEVY-CHARGE-
// CONCEPTS.md §2), Levy splits don't. Both endpoints enforce the same rule
// server-side: when the list is non-empty, percentages must sum to 100%
// (±0.01) — the running total below is a client-side preview of that same
// check, not a substitute for it.
export const emptySplitRow = (showLeviable) => ({
  ChartOfAccountId: "",
  Description: "",
  Percentage: 0,
  ...(showLeviable ? { Leviable: false } : {}),
});

export default function SplitRows({ rows, onChange, chartOfAccounts, showLeviable, loadingChartOfAccounts }) {
  const HelpLabel = ({ label, children }) => <div className="mb-1 flex items-center gap-1"><Label className="text-xs text-gray-500">{label}</Label><FieldHelp label={label}>{children}</FieldHelp></div>;
  const total = rows.reduce((sum, r) => sum + (Number(r.Percentage) || 0), 0);
  const isBalanced = rows.length === 0 || Math.abs(total - 100) < 0.01;

  const updateRow = (index, patch) => {
    const next = rows.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
  const addRow = () => onChange([...rows, emptySplitRow(showLeviable)]);

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-end rounded-lg border border-gray-200 p-2">
          <div className="col-span-4">
            <HelpLabel label="G/L Account">Posting account that receives this share of the computed charge.</HelpLabel>
            <Select value={row.ChartOfAccountId ? String(row.ChartOfAccountId) : ""} onValueChange={(v) => updateRow(index, { ChartOfAccountId: v })} disabled={loadingChartOfAccounts}>
              <SelectTrigger><SelectValue placeholder={loadingChartOfAccounts ? "Loading..." : "Select account"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {chartOfAccounts.map((a) => <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.AccountCode} — {a.AccountName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <HelpLabel label="Description">Identifies the purpose of this posting split in configuration and review screens.</HelpLabel>
            <Input value={row.Description} onChange={(e) => updateRow(index, { Description: e.target.value })} placeholder="e.g. Main Split" />
          </div>
          <div className="col-span-2">
            <HelpLabel label="Percentage">Share of the charge posted to this account. All split rows together must total 100%.</HelpLabel>
            <Input type="number" min="0" max="100" step="0.01" value={row.Percentage} onChange={(e) => updateRow(index, { Percentage: Number(e.target.value) })} />
          </div>
          {showLeviable && (
            <div className="col-span-2 flex items-center gap-1 pb-2">
              <input
                type="checkbox"
                checked={!!row.Leviable}
                onChange={(e) => updateRow(index, { Leviable: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              <Label className="text-xs text-gray-500">Leviable</Label>
              <FieldHelp label="Leviable">Includes this split's amount in the base used to calculate levies linked to the charge.</FieldHelp>
            </div>
          )}
          <div className={showLeviable ? "col-span-1" : "col-span-3"}>
            <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
              <FaTrash />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
          <FaPlus /> Add Split
        </Button>
        {rows.length > 0 && (
          <span className={`text-xs font-semibold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
            Total: {total}% {isBalanced ? "" : "(must equal 100%)"}
          </span>
        )}
      </div>
    </div>
  );
}
