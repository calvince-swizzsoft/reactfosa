import { validateForm6Dates } from "./form6Model.js";

export const capitalInputs = [
  { key: "surplusAdjustment", label: "Surplus eligibility adjustment (KSh)", help: "Enter the signed adjustment to after-tax ledger surplus for eligibility, including proposed dividends, insufficient provisions and excluded unrealised gains or losses. A negative amount reduces surplus. Enter 0 explicitly if no adjustment is needed." },
  { key: "investmentDeduction", label: "Subsidiary / equity investment deduction (KSh)", help: "Enter the deduction for investments in subsidiaries and equity instruments of other institutions. Support it with the investment schedule. It is a deduction from capital; the assets remain reported in the asset section. Enter 0 explicitly if none." },
  { key: "otherDeductions", label: "Other capital deductions (KSh)", help: "Enter other deductible capital items not already included in the investment deduction. Explain any non-zero value and its supporting schedule. Enter 0 explicitly if none." },
  { key: "offBalanceSheetAssets", label: "Off-balance-sheet exposures (KSh)", help: "Enter supported off-balance-sheet assets, such as guarantees issued by the SACCO. This cannot be established reliably from the ordinary G/L. Enter 0 explicitly if none." },
];

export function validateCapitalInputs(values, yearStart, asAt) {
  const dateError = validateForm6Dates(yearStart, asAt);
  if (dateError) return dateError;
  for (const { key, label } of capitalInputs) {
    const raw = values[key];
    if (raw === "" || raw == null || !Number.isFinite(Number(raw)) || Math.abs(Number(raw)) > 1e15 || (key !== "surplusAdjustment" && Number(raw) < 0))
      return `Enter a valid amount for ${label}, including 0 if none.`;
  }
  if ((values.reviewNotes || "").length > 1000) return "Limit the supporting explanation to 1,000 characters.";
  if (capitalInputs.some(({ key }) => Number(values[key]) !== 0) && !values.reviewNotes?.trim()) return "Explain the non-zero adjustments and exposures and identify their supporting schedules.";
  return "";
}
