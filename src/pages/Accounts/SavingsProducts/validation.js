const numericRules = [
  ["MaximumAllowedWithdrawal", "Maximum allowed withdrawal", { positive: true }],
  ["MaximumAllowedDeposit", "Maximum allowed deposit", { positive: true }],
  ["MinimumBalance", "Minimum balance"],
  ["OperatingBalance", "Operating balance"],
  ["WithdrawalNoticeAmount", "Withdrawal notice amount"],
  ["WithdrawalNoticePeriod", "Withdrawal notice period", { integer: true }],
  ["WithdrawalInterval", "Withdrawal interval", { integer: true }],
  ["AnnualPercentageYield", "Annual percentage yield"],
  ["Priority", "Recovery priority", { integer: true }],
];

export function validateSavingsProduct(form) {
  const errors = [];

  if (!form.Description?.trim()) errors.push("Description is required.");
  if (!form.ChartOfAccountId) errors.push("Chart of Account is required.");

  numericRules.forEach(([field, label, options = {}]) => {
    const raw = form[field];
    const value = Number(raw);
    if (raw === "" || raw === null || raw === undefined) {
      errors.push(`${label} is required.`);
    } else if (!Number.isFinite(value)) {
      errors.push(`${label} must be a valid number.`);
    } else if (options.positive ? value <= 0 : value < 0) {
      errors.push(`${label} must be ${options.positive ? "greater than zero" : "zero or greater"}.`);
    } else if (options.integer && !Number.isInteger(value)) {
      errors.push(`${label} must be a whole number.`);
    }
  });

  const minimumBalance = Number(form.MinimumBalance);
  const operatingBalance = Number(form.OperatingBalance);
  const maximumWithdrawal = Number(form.MaximumAllowedWithdrawal);
  const noticeAmount = Number(form.WithdrawalNoticeAmount);
  const noticePeriod = Number(form.WithdrawalNoticePeriod);
  const apy = Number(form.AnnualPercentageYield);

  if (Number.isFinite(minimumBalance) && Number.isFinite(operatingBalance) && operatingBalance < minimumBalance) {
    errors.push("Operating balance cannot be lower than the minimum balance.");
  }
  if (Number.isFinite(noticeAmount) && Number.isFinite(maximumWithdrawal) && noticeAmount > maximumWithdrawal) {
    errors.push("Withdrawal notice amount cannot exceed the maximum allowed withdrawal.");
  }
  if (noticeAmount > 0 && noticePeriod <= 0) {
    errors.push("Withdrawal notice period must be greater than zero when a notice amount is configured.");
  }
  if (Number.isFinite(apy) && apy > 100) {
    errors.push("Annual percentage yield cannot exceed 100%.");
  }
  if (Number.isFinite(Number(form.Priority)) && Number(form.Priority) > 3) {
    errors.push("Recovery priority must be between 0 and 3.");
  }

  return [...new Set(errors)];
}

export function savingsProductPayload(form) {
  return {
    ...form,
    Description: form.Description.trim(),
    MaximumAllowedWithdrawal: Number(form.MaximumAllowedWithdrawal),
    MaximumAllowedDeposit: Number(form.MaximumAllowedDeposit),
    MinimumBalance: Number(form.MinimumBalance),
    OperatingBalance: Number(form.OperatingBalance),
    WithdrawalNoticeAmount: Number(form.WithdrawalNoticeAmount),
    WithdrawalNoticePeriod: Number(form.WithdrawalNoticePeriod),
    WithdrawalInterval: Number(form.WithdrawalInterval),
    AnnualPercentageYield: Number(form.AnnualPercentageYield),
    Priority: Number(form.Priority),
  };
}

export function savingsProductValidationAlert(errors) {
  return {
    title: "Check Savings Product Details",
    icon: "warning",
    html: `<div style="text-align:left">${errors.map((message) => `<div>• ${message}</div>`).join("")}</div>`,
  };
}
