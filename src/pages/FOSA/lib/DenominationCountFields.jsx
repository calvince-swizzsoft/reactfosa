import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Denomination breakdown fields, matching FiscalCountDTO
// (Application.MainBoundedContext.DTO/FrontOfficeModule/FiscalCountDTO.cs)
// exactly — including its "Fourty" spelling, which is the real property
// name, not a typo to fix here. Each field is a *count* of notes/coins at
// that denomination (WORKFLOW.md §6: "note+coin counts"), not a money
// value — DTO field names just happen to end in "...Value".
//
// FiscalCountDTO itself carries these fields (used by Treasury cash
// movement, §1C). CashTransferRequestDTO (End of Day, §1F) has no
// per-denomination slots at all — EOD only wants the summed total in
// ClosingBalance, so EndOfDay.jsx uses sumDenominations() below but
// discards the per-field object rather than submitting it.
export const DENOMINATIONS = [
  { key: "DenominationOneThousandValue", amount: 1000, label: "1000" },
  { key: "DenominationFiveHundredValue", amount: 500, label: "500" },
  { key: "DenominationTwoHundredValue", amount: 200, label: "200" },
  { key: "DenominationOneHundredValue", amount: 100, label: "100" },
  { key: "DenominationFiftyValue", amount: 50, label: "50" },
  { key: "DenominationFourtyValue", amount: 40, label: "40" },
  { key: "DenominationTwentyValue", amount: 20, label: "20" },
  { key: "DenominationTenValue", amount: 10, label: "10" },
  { key: "DenominationFiveValue", amount: 5, label: "5" },
  { key: "DenominationOneValue", amount: 1, label: "1" },
  { key: "DenominationFiftyCentValue", amount: 0.5, label: "50c" },
];

export const emptyDenominationCounts = Object.fromEntries(DENOMINATIONS.map((d) => [d.key, 0]));

export const sumDenominations = (counts) =>
  DENOMINATIONS.reduce((total, d) => total + (Number(counts[d.key]) || 0) * d.amount, 0);

export default function DenominationCountFields({ counts, onChange }) {
  const total = sumDenominations(counts);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {DENOMINATIONS.map((d) => (
          <div key={d.key}>
            <Label className="text-xs font-semibold text-gray-500">{d.label}</Label>
            <Input
              type="number"
              min="0"
              value={counts[d.key] ?? 0}
              onChange={(e) => onChange(d.key, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center rounded-lg bg-gray-50 border px-4 py-2">
        <span className="text-sm font-semibold text-gray-600">Counted Total</span>
        <span className="text-lg font-bold text-indigo-700">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
