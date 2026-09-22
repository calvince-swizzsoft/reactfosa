import { validateTransferEntry } from "../BatchProcedures/lib/transferValidation.js";

export function validateIntraAccountEntry(form, source, target, entries) {
  if (Number(form.ApportionTo) !== 1) return "Intra-account transfers must go to another customer account.";
  if (!source?.CustomerId || !target?.CustomerId) return "Select both accounts and wait for their details to load.";
  if (form.CustomerAccountId && form.CustomerAccountId !== target.Id) return "Wait for the selected destination balances to load.";
  if (![1, 3].includes(Number(source.CustomerAccountTypeProductCode))) return "Choose a savings or investment account as the source.";
  if (![1, 2, 3].includes(Number(target.CustomerAccountTypeProductCode))) return "Choose a savings, investment or loan account as the destination.";
  if (Number(target.CustomerAccountTypeProductCode) === 2 &&
      [target.PrincipalBalance, target.InterestBalance].some((value) => value == null || !Number.isFinite(Number(value))))
    return "Refresh the destination loan balances before adding this entry.";
  const error = validateTransferEntry(form, source, target, entries);
  if (error) return error;
  if (Number(target.CustomerAccountTypeProductCode) !== 2 && Number(form.Interest || 0) !== 0)
    return "Enter the transfer amount as principal; interest only applies to loan repayments.";
  const balance = Number(source.CustomerAccountTypeProductCode) === 1 ? source.AvailableBalance : source.BookBalance;
  if (balance == null || !Number.isFinite(Number(balance))) return "Refresh the source balance before adding this entry.";
  const total = entries.reduce((sum, entry) => sum + Number(entry.Principal || 0) + Number(entry.Interest || 0), Number(form.Principal || 0) + Number(form.Interest || 0));
  if (Math.round(total * 100) > Math.round(Number(balance) * 100)) return "The total allocations exceed the source balance. Reduce the amount and allow for applicable charges.";
  return "";
}
