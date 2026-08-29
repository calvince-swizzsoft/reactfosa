export function validateInvestmentProduct(form) {
  const errors = [];
  const requiredNumbers = [
    ["MinimumBalance", "Minimum balance"], ["MaximumBalance", "Maximum balance"],
    ["PoolAmount", "Pool amount"], ["MaturityPeriod", "Maturity period"],
    ["AnnualPercentageYield", "Annual percentage yield"], ["Priority", "Recovery priority"],
  ];
  if (!form.Description?.trim()) errors.push("Description is required.");
  else if (form.Description.trim().length > 256) errors.push("Description cannot exceed 256 characters.");
  if (!form.ChartOfAccountId) errors.push("Chart of Account is required.");
  requiredNumbers.forEach(([field, label]) => {
    if (form[field] === "" || form[field] === null || form[field] === undefined) errors.push(`${label} is required.`);
    else if (!Number.isFinite(Number(form[field]))) errors.push(`${label} must be a valid number.`);
    else if (Number(form[field]) < 0) errors.push(`${label} must be zero or greater.`);
  });
  if (Number(form.MaximumBalance) <= 0) errors.push("Maximum balance must be greater than zero.");
  if (Number(form.MaximumBalance) < Number(form.MinimumBalance)) errors.push("Maximum balance cannot be lower than the minimum balance.");
  if (!Number.isInteger(Number(form.MaturityPeriod))) errors.push("Maturity period must be a whole number.");
  if (Number(form.MaturityPeriod) > 32767) errors.push("Maturity period cannot exceed 32,767 days.");
  if (Number(form.AnnualPercentageYield) > 100) errors.push("Annual percentage yield cannot exceed 100%.");
  if (!Number.isInteger(Number(form.Priority)) || Number(form.Priority) > 3) errors.push("Recovery priority must be a whole number between 0 and 3.");
  if (form.IsPooled && !form.PoolChartOfAccountId) errors.push("Pool G/L Account is required for a pooled product.");
  if (form.IsPooled && Number(form.PoolAmount) <= 0) errors.push("Pool amount must be greater than zero for a pooled product.");
  if (form.IsPooled && form.PoolChartOfAccountId && form.PoolChartOfAccountId === form.ChartOfAccountId) errors.push("Pool G/L Account must be different from the product G/L Account.");
  if (!form.IsPooled && Number(form.PoolAmount) !== 0) errors.push("Pool amount must be zero when the product is not pooled.");
  if (form.ThrottleScheduledArrearsRecovery && !form.TrackArrears) errors.push("Track Arrears must be enabled before scheduled arrears recovery can be throttled.");
  return [...new Set(errors)];
}

export function investmentProductPayload(form) {
  return {
    ...form,
    Description: form.Description.trim(),
    MinimumBalance: Number(form.MinimumBalance),
    MaximumBalance: Number(form.MaximumBalance),
    MaturityPeriod: Number(form.MaturityPeriod),
    AnnualPercentageYield: Number(form.AnnualPercentageYield),
    Priority: Number(form.Priority),
    PoolChartOfAccountId: form.IsPooled ? form.PoolChartOfAccountId : null,
    PoolAmount: form.IsPooled ? Number(form.PoolAmount) : 0,
  };
}

export function investmentProductValidationAlert(errors) {
  return { title: "Check Investment Product Details", icon: "warning", html: `<div style="text-align:left">${errors.map((x) => `<div>• ${x}</div>`).join("")}</div>` };
}
