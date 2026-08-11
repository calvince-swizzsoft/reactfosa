// Shared enums for the Front Office area, transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs in the
// backend repo — not guessed. Several of these are [Flags]-shaped (powers
// of 2) even where the C# source doesn't tag them with [Flags]; treat each
// value as a single discrete state (a request is never simultaneously
// Pending and Authorized), matched via strict equality against whatever
// the server returns.

export const FrontOfficeTransactionType = {
  CashWithdrawal: 1,
  CashDeposit: 2,
  ChequeDeposit: 3,
  CashWithdrawalPaymentVoucher: 4,
};

export const CashDepositRequestAuthStatus = {
  Pending: 1,
  Authorized: 2,
  Rejected: 4,
  Posted: 8,
};

export const CashWithdrawalRequestAuthStatus = {
  Pending: 1,
  Authorized: 2,
  Rejected: 4,
  Paid: 8,
};

// CashManagementController.Create's own switch only handles the first four
// values — TellerToTreasury/TellerCashTransfer are never client-selectable
// here, they're what EndOfDayController (§9) and TransfersController (§7)
// hardcode on their own companion FiscalCount records. Listed for
// completeness/decoding reads (e.g. FiscalCounts.jsx's detail drawer), not
// as options for CashManagement.jsx's movement picker.
export const TreasuryTransactionType = {
  TreasuryToTreasury: 1,
  TreasuryToBank: 2,
  BankToTreasury: 4,
  TreasuryToTeller: 8,
  TellerToTreasury: 16,
  TellerCashTransfer: 32,
};

export const TellerCashBalanceStatus = {
  Balanced: 0x5000,
  Shortage: 0x5001,
  Excess: 0x5002,
};

// [Flags] on CashWithdrawalRequestDTO.Category — tells apart *why* a
// withdrawal request was queued. PaymentVoucher is how a voucher-settled
// withdrawal shows up in the merged Savings Receipts/Payments queue (it's
// stored as a plain CashWithdrawalRequest, not its own request type — see
// SAVINGS-RECEIPTS-PAYMENTS-FORM-LAYOUT.md).
export const CashWithdrawalCategory = {
  WithinLimits: 1,
  AboveMaximumAllowed: 2,
  BelowMinimumBalance: 4,
  Overdraw: 8,
  PaymentVoucher: 16,
};

// GeneralTransactionType — SundryPaymentsController.Create's own switch
// only handles the first five of these (SundryPayment=16 has no case and
// falls through to "Unsupported transaction type", so it's listed here for
// completeness/decoding but not offered as a picker option).
// CashPaymentAccountClosure=32 is only ever sent from the Account Closure
// settle flow, not chosen free-form by a teller.
export const GeneralTransactionType = {
  CashReceipt: 1,
  ChequeReceipt: 2,
  CashPayment: 4,
  CashPickup: 8,
  SundryPayment: 16,
  CashPaymentAccountClosure: 32,
};

// ExpensePayable* — transcribed directly from Enumerations.cs.
export const ExpensePayableType = {
  DebitGLAccount: 1,
  CreditGLAccount: 2,
};

export const ExpensePayableStatus = {
  Pending: 1,
  Posted: 2,
  Rejected: 4,
  Audited: 8,
};

// ExpensePayableController.Verify's request body — Post enqueues the
// generic maker-checker Workflow, Reject/Defer just update Status.
export const ExpensePayableAuthOption = {
  Post: 1,
  Reject: 2,
  Defer: 4,
};

// SystemTransactionCode — the subset relevant to the Fiscal Counts
// catalogue's `transactionCode` filter (frontoffice-api-spec.md §16.1).
// The full server-side enum has 40+ members (every posting source in the
// system); these six are the only ones a FiscalCount row can ever actually
// carry, per §16's own "select a transaction type" table.
export const FiscalCountTransactionCode = {
  BankToTreasury: 7,
  TreasuryToBank: 8,
  TreasuryToTeller: 9,
  TreasuryToTreasury: 10,
  TellerEndOfDay: 41,
  TellerCashTransfer: 42,
};
