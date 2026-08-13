// Shared enums for the Alternate Channel screens, transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs — not guessed.
// No generic enum-lookup endpoint exists in this backend.

export const AlternateChannelType = {
  SaccoLink: 1,
  Sparrow: 2,
  MCoopCash: 4,
  SpotCash: 8,
  Citius: 16,
  AgencyBanking: 32,
  PesaPepe: 64,
  AbcBank: 128,
  Broker: 256,
  WhatsAppBanking: 512,
};

// AgencyBanking/Citius always fail server-side CardNumber validation today
// (CheckAlternateChannelNumber unconditionally blanks CardNumber for these
// two types) — flagged in docs/api/alternate-channel-api-spec.md as a real,
// unfixed gap, not something to silently work around. Surface a warning
// when either is picked rather than letting the 400 be a surprise.
export const ALTERNATE_CHANNEL_TYPE_OPTIONS = [
  { value: AlternateChannelType.SaccoLink, label: "Sacco Link" },
  { value: AlternateChannelType.Sparrow, label: "Sparrow" },
  { value: AlternateChannelType.MCoopCash, label: "MCo-op Cash" },
  { value: AlternateChannelType.SpotCash, label: "SpotCash" },
  { value: AlternateChannelType.Citius, label: "Citius" },
  { value: AlternateChannelType.AgencyBanking, label: "Agency Banking" },
  { value: AlternateChannelType.PesaPepe, label: "PesaPepe" },
  { value: AlternateChannelType.AbcBank, label: "ABC Bank" },
  { value: AlternateChannelType.Broker, label: "Broker" },
  { value: AlternateChannelType.WhatsAppBanking, label: "WhatsApp Banking" },
];

// Types that always 400 today — see comment above.
export const BROKEN_CARD_NUMBER_TYPES = new Set([AlternateChannelType.AgencyBanking, AlternateChannelType.Citius]);

export const RecordStatus = {
  New: 0,
  Edited: 1,
  Approved: 2,
  Rejected: 3,
};

export const RECORD_STATUS_OPTIONS = [
  { value: RecordStatus.New, label: "New" },
  { value: RecordStatus.Edited, label: "Edited" },
  { value: RecordStatus.Approved, label: "Approved" },
  { value: RecordStatus.Rejected, label: "Rejected" },
];

export const ChargeBenefactor = {
  Customer: 0,
  Institution: 1,
};

export const CHARGE_BENEFACTOR_OPTIONS = [
  { value: ChargeBenefactor.Customer, label: "Customer" },
  { value: ChargeBenefactor.Institution, label: "Institution" },
];

// AlternateChannelKnownChargeType — the first 9 are generic across every
// channel type; the rest (9-19) are Sacco Link-specific Coop-Bank
// sub-charges, listed too since the enum is small enough to just include.
export const AlternateChannelKnownChargeType = {
  Linking: 0,
  Replacement: 1,
  Renewal: 2,
  WithdrawalCharges: 3,
  DepositCharges: 4,
  MiniStatementCharges: 5,
  BalanceInquiryCharges: 6,
  AirtimeCharges: 7,
  PINResetCharges: 8,
  DepositChargesCoopBankAgent: 9,
  WithdrawalChargesCoopBankATM: 10,
  WithdrawalChargesNonCoopBankATM: 11,
  WithdrawalChargesCoopBankAccountToMPESA: 12,
  WithdrawalChargesCoopBankAgent: 13,
  PurchaseChargesGoodsAndServicesCoopBankMobile: 14,
  BalanceInquiryChargesCoopBankAgent: 15,
  BalanceInquiryChargesCoopBankMobile: 16,
  MiniStatementChargesCoopBankAgent: 17,
  MiniStatementChargesCoopBankMobile: 18,
  GuarantorshipInquiryCharges: 19,
};

export const ALTERNATE_CHANNEL_KNOWN_CHARGE_TYPE_OPTIONS = [
  { value: AlternateChannelKnownChargeType.Linking, label: "Linking Fee" },
  { value: AlternateChannelKnownChargeType.Replacement, label: "Replacement Fee" },
  { value: AlternateChannelKnownChargeType.Renewal, label: "Renewal Fee" },
  { value: AlternateChannelKnownChargeType.WithdrawalCharges, label: "Withdrawal Fee" },
  { value: AlternateChannelKnownChargeType.DepositCharges, label: "Deposit Fee" },
  { value: AlternateChannelKnownChargeType.MiniStatementCharges, label: "Mini Statement Fee" },
  { value: AlternateChannelKnownChargeType.BalanceInquiryCharges, label: "Balance Inquiry Fee" },
  { value: AlternateChannelKnownChargeType.AirtimeCharges, label: "Airtime Fee" },
  { value: AlternateChannelKnownChargeType.PINResetCharges, label: "PIN Reset Fee" },
  { value: AlternateChannelKnownChargeType.DepositChargesCoopBankAgent, label: "Sacco Link Deposit Fee (Coop-Bank Agent)" },
  { value: AlternateChannelKnownChargeType.WithdrawalChargesCoopBankATM, label: "Sacco Link Withdrawal Fee (Coop-Bank ATM)" },
  { value: AlternateChannelKnownChargeType.WithdrawalChargesNonCoopBankATM, label: "Sacco Link Withdrawal Fee (via Non-Coop-Bank ATM)" },
  { value: AlternateChannelKnownChargeType.WithdrawalChargesCoopBankAccountToMPESA, label: "Sacco Link Withdrawal Fee (via Account-To-MPESA)" },
  { value: AlternateChannelKnownChargeType.WithdrawalChargesCoopBankAgent, label: "Sacco Link Withdrawal Fee (Coop-Bank Agent)" },
  { value: AlternateChannelKnownChargeType.PurchaseChargesGoodsAndServicesCoopBankMobile, label: "Sacco Link Purchase Fee (Goods & Services via Mobile)" },
  { value: AlternateChannelKnownChargeType.BalanceInquiryChargesCoopBankAgent, label: "Sacco Link Balance Inquiry Fee (Coop-Bank Agent)" },
  { value: AlternateChannelKnownChargeType.BalanceInquiryChargesCoopBankMobile, label: "Sacco Link Balance Inquiry Fee (via Mobile)" },
  { value: AlternateChannelKnownChargeType.MiniStatementChargesCoopBankAgent, label: "Sacco Link Mini Statement Fee (Coop-Bank Agent)" },
  { value: AlternateChannelKnownChargeType.MiniStatementChargesCoopBankMobile, label: "Sacco Link Mini Statement Fee (via Mobile)" },
  { value: AlternateChannelKnownChargeType.GuarantorshipInquiryCharges, label: "Guarantorship Inquiry Fee" },
];
