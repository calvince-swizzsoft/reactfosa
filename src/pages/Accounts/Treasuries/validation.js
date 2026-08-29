export function treasuryValidationMessage(form) {
  const description = form.Description?.trim() || "";
  if (!description) return "Description is required.";
  if (description.length > 256) return "Description cannot exceed 256 characters.";
  if (!form.BranchId) return "Please select a branch.";
  if (!form.ChartOfAccountId) return "Please select a chart of account.";

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
