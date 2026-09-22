import CustomerLookupModal from "../../../Registry/Customers/Documents/CustomerLookupModal";

// CustomerDTO.FullName is a server-computed getter that can come back
// blank — IndividualSalutationDescription (and several sibling
// *Description getters on this same DTO) call EnumHelper.GetDescription
// without the Enum.IsDefined guard every other Description getter in this
// backend uses, which falls through to a literal null on an undefined
// enum value (same root cause already chased down and worked around for
// CustomerAccountDTO.CustomerFullName in the Accounts pickers — see that
// fix's commit message for the full story). Fall back to the raw
// first/last name, then the non-individual description, before ever
// showing a blank row.
export function customerDisplayName(c = {}) {
  const customer = c.Customer || c.customer || {};
  const individualName = [
    c.IndividualFirstName ?? c.CustomerIndividualFirstName ?? customer.IndividualFirstName,
    c.IndividualLastName ?? c.CustomerIndividualLastName ?? customer.IndividualLastName,
  ].filter(Boolean).join(" ").trim();

  return c.FullName
    || c.CustomerFullName
    || customer.FullName
    || individualName
    || c.NonIndividualDescription
    || c.CustomerNonIndividualDescription
    || customer.NonIndividualDescription
    || `Customer #${c.PaddedSerialNumber || c.SerialNumber || customer.PaddedSerialNumber || customer.SerialNumber || ""}`;
}

export function searchableCustomerText(customer) {
  const nested = customer.Customer || customer.customer || {};
  return [
    customerDisplayName(customer),
    customer.PaddedSerialNumber,
    customer.SerialNumber,
    customer.IdentificationNumber,
    customer.IndividualIdentificationNumber,
    customer.CustomerIndividualIdentificationNumber,
    customer.PayrollNumber,
    customer.IndividualPayrollNumber,
    customer.IndividualPayrollNumbers,
    customer.CustomerIndividualPayrollNumber,
    customer.Reference2,
    customer.Reference3,
    customer.AddressEmail,
    customer.CustomerAddressEmail,
    customer.AddressMobileLine,
    customer.CustomerAddressMobileLine,
    nested.PaddedSerialNumber,
    nested.SerialNumber,
    nested.IdentificationNumber,
    nested.PayrollNumber,
    nested.IndividualPayrollNumbers,
    nested.Reference2,
    nested.Reference3,
  ].filter((value) => value !== undefined && value !== null).join(" ").toLowerCase();
}

// Keep the loan callers' normalized FullName contract while sharing the
// Registry lookup's server-side search, pagination and customer details.
export default function CustomerPickerModal({ title = "Select Customer", onSelect, onClose }) {
  return <CustomerLookupModal title={title} getCustomerName={customerDisplayName} onSelect={(customer) => onSelect({ ...customer, Id: customer.Id ?? customer.id, FullName: customerDisplayName(customer) })} onClose={onClose} />;
}
