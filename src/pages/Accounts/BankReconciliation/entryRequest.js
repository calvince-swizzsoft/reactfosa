export function entryRequest(entry, periodId) {
  const value = Number(entry.Value);
  if (entry.Value === '' || !Number.isFinite(value) || value <= 0) throw new Error('Enter an adjustment value greater than zero.');
  if (![0, 1, 2, 3].includes(entry.AdjustmentType)) throw new Error('Select a valid adjustment type.');
  if (entry.AdjustmentType >= 2 && !entry.ChartOfAccountId) throw new Error('Select a contra G/L account for this adjustment.');
  return { ...entry, BankReconciliationPeriodId: periodId, Value: value,
    ChartOfAccountId: entry.AdjustmentType >= 2 ? entry.ChartOfAccountId : null,
    ChequeDate: entry.ChequeDate || null };
}
