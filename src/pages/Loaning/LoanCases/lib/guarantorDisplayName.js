// Saved LoanGuarantorDTOs expose flattened customer names even when the
// optional full-name fields are empty. Never fall back to the loanee's name.
export function guarantorDisplayName(guarantor = {}) {
  const individualName = [guarantor.CustomerIndividualFirstName, guarantor.CustomerIndividualLastName]
    .map((value) => String(value ?? "").trim()).filter(Boolean).join(" ");
  const name = [guarantor.GuarantorFullName, guarantor.GuarantorCustomerFullName,
    guarantor.CustomerFullName, individualName, guarantor.CustomerNonIndividualDescription]
    .map((value) => String(value ?? "").trim()).find(Boolean);
  return name || `Guarantor ${guarantor.CustomerId || guarantor.GuarantorId || "(name unavailable)"}`;
}
