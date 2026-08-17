// Infrastructure.Crosscutting.Framework.Utils — transcribed directly from
// Enumerations.cs, shared by ChequeBookDTO.Type and PaymentVoucherDTO.Status/
// ManagementAction (docs/api/chequebook-api-spec.md §4-§5).
export const ChequeBookType = {
  InHouse: 0,
  External: 1,
};

export const PaymentVoucherStatus = {
  Active: 0,
  Paid: 1,
  Flagged: 2,
};

export const PaymentVoucherManagementAction = {
  Flag: 0,
  Unflag: 1,
};
