export function validateRegistrationGuarantors(product, borrowerId, amount, rows, collateralTotal = 0) {
  const minimum = Number(product.LoanRegistrationMinimumGuarantors || 0);
  const maximum = Number(product.LoanRegistrationMaximumGuarantees || 0);
  const mode = Number(product.LoanRegistrationGuarantorSecurityMode);
  if (minimum < 0 || maximum < minimum || ![0, 1].includes(mode)) return "The product's guarantor configuration is invalid.";
  if (rows.some((row) => !row.GuarantorId)) return "Select a member for every guarantor row, or remove the empty row.";
  if (rows.length < minimum) return `This loan product requires at least ${minimum} guarantor(s).`;
  if (rows.length > maximum) return `This loan product allows at most ${maximum} guarantor(s).`;
  if (new Set(rows.map((row) => row.GuarantorId)).size !== rows.length) return "Each guarantor may be added only once.";
  for (const row of rows) {
    const pledged = Number(row.AmountGuaranteed);
    if (!Number.isFinite(pledged) || pledged <= 0 || Math.abs(pledged * 100 - Math.round(pledged * 100)) > 0.000001) return "Every guarantee must be positive with at most two decimal places.";
    if (!row.lookup) return "Wait for each eligibility check to finish, or select the guarantor again.";
    if (Number(row.lookup.securityMode) !== mode) return "Select the guarantor again to refresh eligibility for this product.";
    if (mode === 1 && (!Number.isFinite(Number(row.lookup.availableToGuarantee)) || row.lookup.availableToGuarantee == null || pledged > Number(row.lookup.availableToGuarantee))) return "A guarantor cannot pledge more than their available guarantee capacity.";
    if (row.GuarantorId === borrowerId) {
      if (!product.LoanRegistrationAllowSelfGuarantee) return "This product does not allow self-guarantee.";
      const limit = Number(product.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage || 0);
      if (!Number.isFinite(limit) || limit < 0 || limit > 100 || pledged > amount * limit / 100) return "Self-guarantee exceeds the product's allowed percentage of the loan amount.";
    }
  }
  if (product.LoanRegistrationSecurityRequired && mode === 1 && rows.reduce((sum, row) => sum + Number(row.AmountGuaranteed), 0) + collateralTotal < amount) return "Guaranteed shares and collateral must fully secure the amount applied.";
  return null;
}
