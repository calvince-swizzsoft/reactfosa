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

export const TreasuryTransactionType = {
  TreasuryToTreasury: 1,
  TreasuryToBank: 2,
  BankToTreasury: 4,
  TreasuryToTeller: 8,
};

export const TellerCashBalanceStatus = {
  Balanced: 0x5000,
  Shortage: 0x5001,
  Excess: 0x5002,
};
