// Shared enums for the Batch Procedures area, transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs — not guessed.

// Shared across all 9 batch types (Voucher/General Ledger redeclare this
// with the same values under different enum names server-side — doesn't
// affect the wire format, see lib/BatchStatusBadge.jsx).
export const BatchStatus = {
  Pending: 1,
  Posted: 2,
  Rejected: 4,
  Audited: 8,
};

// Request body for /{id}/audit and /{id}/authorize on every type — same
// shape everywhere (1=Post, 2=Reject) regardless of which C# enum name the
// controller declares it as.
export const BatchAuthOption = {
  Post: 1,
  Reject: 2,
};

// CreditBatchType — which of the 4 credit flows a Credit batch is for.
// CashPickup/SundryPayments entries stay Pending after Authorize (a teller
// pays them out later via api/frontoffice/sundrypayments); Payout/CheckOff
// get queued for async GL posting on Authorize.
export const CreditBatchType = {
  Payout: 0xDADA,
  CheckOff: 0xDADA + 1,
  CashPickup: 0xDADA + 2,
  SundryPayments: 0xDADA + 3,
};
