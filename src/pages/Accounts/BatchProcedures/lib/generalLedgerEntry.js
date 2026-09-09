export function ledgerEntryPayload(form, branchId) {
  if (!form.ChartOfAccountId || !form.ContraChartOfAccountId) throw new Error("Select both debit and credit accounts.");
  const amount = Number(form.Amount);
  if (!Number.isFinite(amount) || amount === 0) throw new Error("Enter a valid, non-zero amount.");
  if (!form.ValueDate) throw new Error("Select a value date.");
  if (![form.PrimaryDescription, form.SecondaryDescription, form.Reference].every((value) => value?.trim())) throw new Error("Both descriptions and reference are required.");
  return {
    BranchId: branchId, ChartOfAccountId: form.ChartOfAccountId, ContraChartOfAccountId: form.ContraChartOfAccountId,
    CustomerAccountId: form.CustomerAccountId || null, ContraCustomerAccountId: form.ContraCustomerAccountId || null,
    Amount: amount, ValueDate: `${form.ValueDate}T00:00:00`, PrimaryDescription: form.PrimaryDescription.trim(),
    SecondaryDescription: form.SecondaryDescription.trim(), Reference: form.Reference.trim(),
  };
}

export function ledgerBalance(batchValue, entriesTotal, draftAmount = 0, originalAmount = 0) {
  const values = [batchValue, entriesTotal, draftAmount, originalAmount];
  if (values.some((value) => value === null || value === undefined || !Number.isFinite(Number(value)))) return null;
  const cents = (value) => Math.round(Number(value) * 100);
  const projected = cents(entriesTotal) - cents(originalAmount) + cents(draftAmount);
  const difference = cents(batchValue) - projected;
  return { total: projected / 100, difference: difference / 100, balanced: difference === 0, exceeds: difference < 0 };
}
