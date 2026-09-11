// OverDeductionBatchEntryDTO uses DebitCustomerFullName / CreditCustomerFullName,
// not DebitCustomerAccountFullName / CreditCustomerAccountFullName.
export function refundAccountDetails(entry, side) {
  const prefix = `${side}CustomerAccountCustomer`;
  const name = [entry[`${prefix}IndividualFirstName`], entry[`${prefix}IndividualLastName`]].filter(Boolean).join(" ").trim();
  return {
    name: entry[`${prefix}NonIndividualDescription`]?.trim() || name || entry[`${side}CustomerFullName`]?.trim() || "Account holder unavailable",
    number: entry[`${side}FullAccountNumber`] || "Account number unavailable",
    product: entry[`${side}ProductDescription`]?.trim() || "",
  };
}

export function refundEntryStatus(status) {
  // The refund entry factory leaves new entries at 0 until posting/rejection.
  // Keep this interpretation local; 0 is not a shared BatchStatus value.
  const statuses = {
    0: { label: "Not posted", className: "bg-gray-100 text-gray-600" },
    1: { label: "Pending", className: "bg-amber-100 text-amber-700" },
    2: { label: "Posted", className: "bg-green-100 text-green-700" },
    4: { label: "Rejected", className: "bg-red-100 text-red-600" },
  };
  return statuses[status] || { label: "Status unavailable", className: "bg-gray-100 text-gray-600" };
}

export function refundAmount(entry) {
  return Number(entry.Principal || 0) + Number(entry.Interest || 0);
}

export function refundPageSummary(page) {
  const entries = page?.PageCollection || page?.pageCollection || [];
  const count = Number(page?.ItemsCount ?? page?.itemsCount ?? entries.length);
  const serverTotal = page?.TotalApportioned ?? page?.totalApportioned;
  // A page subtotal must never masquerade as the full batch total.
  const total = serverTotal != null ? Number(serverTotal) : count === entries.length ? entries.reduce((sum, entry) => sum + refundAmount(entry), 0) : null;
  return { entries, count, total };
}
