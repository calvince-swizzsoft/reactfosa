export function validateTransferEntry(form, source, target, entries) {
  const principal = Number(form.Principal || 0), interest = Number(form.Interest || 0);
  if (!Number.isFinite(principal) || !Number.isFinite(interest) || principal < 0 || interest < 0 || principal + interest <= 0)
    return "Enter non-negative amounts with a total greater than zero.";
  if (Number(form.ApportionTo) === 1) {
    if (!source || !target) return "Select a target account and wait for its balances to load.";
    if (source.CustomerId !== target.CustomerId) return "Select an account belonging to the source customer.";
    if (source.Id === target.Id) return "The target must differ from the source account.";
    if (Number(target.CustomerAccountTypeProductCode) === 2) {
      const existing = entries.filter((entry) => entry.CustomerAccountId === target.Id);
      const p = existing.reduce((sum, entry) => sum + Number(entry.Principal || 0), principal);
      const i = existing.reduce((sum, entry) => sum + Number(entry.Interest || 0), interest);
      if (Math.round(p * 100) > Math.round(Math.abs(Number(target.PrincipalBalance)) * 100)) return "Total principal allocated to this loan exceeds its outstanding principal.";
      if (Math.round(i * 100) > Math.round(Math.abs(Number(target.InterestBalance)) * 100)) return "Total interest allocated to this loan exceeds its outstanding interest.";
    }
  }
  return "";
}
