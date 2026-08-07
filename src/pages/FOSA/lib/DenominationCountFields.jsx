import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Denomination breakdown fields, matching FiscalCountDTO
// (Application.MainBoundedContext.DTO/FrontOfficeModule/FiscalCountDTO.cs)
// and — per a later backend change — CashTransferRequestDTO too (used by
// both End of Day close and cash transfer requests). Field names include
// "Fourty", which is the real property name, not a typo to fix here.
//
// DENOMINATION-CAPTURE-FRONTEND-GUIDE.md: despite the "...Value" suffix,
// each field is a MONETARY SUBTOTAL, not a note/coin count — the server
// sums these 11 fields directly against the transaction total and 400s if
// they don't reconcile; it does not multiply by face value itself. This
// component's own `counts` state is still piece-counts (the natural way
// for a teller to enter "3 of the 1000s...") — use `toDenominationSubtotals`
// below to convert to the pre-multiplied shape the API actually expects
// before submitting. Never spread `counts` directly into a request body.
//
// Cash movement, EOD, and standalone fiscal count endpoints now all
// require this breakdown to reconcile exactly against their own total
// field (TotalValue/ClosingBalance/Amount respectively — see the guide's
// per-screen table); a mismatch is a hard 400, not a warning.
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

// Converts piece-counts (this component's UI state) into the pre-multiplied
// monetary subtotals the API actually expects on the wire — e.g. 3 counted
// 1000-notes becomes { DenominationOneThousandValue: 3000 }, not 3.
export const toDenominationSubtotals = (counts) =>
  Object.fromEntries(DENOMINATIONS.map((d) => [d.key, (Number(counts[d.key]) || 0) * d.amount]));

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
