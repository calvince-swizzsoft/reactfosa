export function treasuryValidationMessage(form, options = {}) {
  const description = form.Description?.trim() || "";
  if (!description) return "Description is required.";
  if (description.length > 256) return "Description cannot exceed 256 characters.";
  if (!form.BranchId) return "Please select a branch.";
  if (!form.ChartOfAccountId) return "Please select a chart of account.";
  if (options.branches && !options.branches.some((branch) => branch.Id === form.BranchId)) {
    return "Please select a valid branch from the available options.";
  }
  if (options.chartOfAccounts && !options.chartOfAccounts.some((account) => account.Id === form.ChartOfAccountId)) {
    return "Please select a valid G/L account from the available options.";
  }

  const selectedBranch = options.branches?.find((branch) => branch.Id === form.BranchId);
  if (selectedBranch?.IsLocked) return "The selected branch is locked and cannot be used.";
  const selectedAccount = options.chartOfAccounts?.find((account) => account.Id === form.ChartOfAccountId);
  if (selectedAccount?.IsLocked) return "The selected G/L account is locked and cannot be used.";
  if (selectedAccount?.IsControlAccount) return "Please select a posting G/L account, not a control account.";

  if (form.RangeLowerLimit === "" || form.RangeLowerLimit === null || form.RangeLowerLimit === undefined) {
    return "Range lower limit is required.";
  }
  if (form.RangeUpperLimit === "" || form.RangeUpperLimit === null || form.RangeUpperLimit === undefined) {
    return "Range upper limit is required.";
  }

  const lowerLimit = Number(form.RangeLowerLimit);
  const upperLimit = Number(form.RangeUpperLimit);
  if (!Number.isFinite(lowerLimit) || !Number.isFinite(upperLimit)) {
    return "Range limits must be valid numbers.";
  }
  if (lowerLimit < 0 || upperLimit < 0) {
    return "Range limits cannot be negative.";
  }
  if (upperLimit <= lowerLimit) {
    return "Range upper limit must be greater than the lower limit.";
  }

  return null;
}
