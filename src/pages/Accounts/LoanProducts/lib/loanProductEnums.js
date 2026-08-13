// Shared enums for the Loan Product admin screen, transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs — not guessed.
// No generic enum-lookup endpoint exists in this backend, same situation as
// every other small fixed-set enum used this session.

export const LoanProductSection = {
  FOSA: 0x000,
  BOSA: 0x000 + 1,
};

export const LoanProductCategory = {
  ShortTerm: 0x000,
  LongTerm: 0x000 + 1,
};

export const InterestCalculationMode = {
  ReducingBalance: 0x200,
  StraightLine: 0x200 + 1,
  StraightLineAmortization: 0x200 + 2,
  DiminishingBalanceAmortization: 0x200 + 3,
  FixedInterest: 0x200 + 4,
};

export const InterestChargeMode = {
  Upfront: 0x300,
  Periodic: 0x300 + 1,
};

export const InterestRecoveryMode = {
  Upfront: 0x400,
  Periodic: 0x400 + 1,
};

export const DynamicChargeRecoveryMode = {
  Upfront: 0x500,
  Periodic: 0x500 + 1,
  CarryForward: 0x500 + 2,
};

export const DynamicChargeRecoverySource = {
  LoanAccount: 0x600,
  SavingsAccount: 0x600 + 1,
};

export const DynamicChargeInstallmentsBasisValue = {
  LoanCaseApprovedAmount: 0,
  AttachedLoansAmount: 1,
};

export const PayoutRecoveryMode = {
  StandingOrder: 0x700,
  Percentage: 0x700 + 1,
};

export const AggregateCheckOffRecoveryMode = {
  OutstandingBalance: 0x0000,
  StandingOrder: 0x0001,
};

export const ChargeType = {
  Percentage: 1,
  FixedAmount: 2,
};

export const RoundingType = {
  NoRounding: 0,
  ToEven: 1,
  AwayFromZero: 2,
  Ceiling: 3,
  Floor: 4,
};

export const PaymentFrequencyPerYear = {
  Annual: 1,
  SemiAnnual: 2,
  Quarterly: 3,
  TriAnnual: 4,
  BiMonthly: 6,
  Monthly: 12,
  SemiMonthly: 24,
  BiWeekly: 26,
  Weekly: 52,
  Daily: 365,
};

export const PaymentDueDate = {
  EndOfPeriod: 0,
  BegOfPeriod: 1,
};

export const StandingOrderTrigger = {
  Payout: 0,
  CheckOff: 1,
  Schedule: 2,
  Sweep: 3,
  Microloan: 4,
};

export const LoanProductKnownChargeType = {
  LoanClearanceCharges: 0xD0FA,
  ExpressLoanDisbursementFee: 0xD0FA + 1,
  NormalLoanDisbursementFee: 0xD0FA + 2,
  LoanArrearsFee: 0xD0FA + 3,
};

export const LoanProductChargeBasisValue = {
  PrincipalBalance: 0,
  BookBalance: 1,
};

// [Flags] — a condition can combine multiple bits.
export const AuxiliaryLoanCondition = {
  SubjectToNotHavingOutstandingBalance: 1,
  SubjectToHavingLoanInProcessApproved: 2,
  SubjectToHavingLoanInProcessAudited: 4,
  SubjectToHavingLoanInProcessAppraised: 8,
  SubjectToExistingInConditionalLendingList: 16,
  SubjectToHavingDividendsPayabale: 32,
};

export const GuarantorSecurityMode = {
  Income: 0,
  Investments: 1,
};

// ProductCode — used by LoanProductDeductibleDTO.CustomerAccountTypeProductCode.
export const ProductCode = {
  Savings: 0x001,
  Loan: 0x001 + 1,
  Investment: 0x001 + 2,
};

// Human-readable option lists for <select> elements — {value, label} pairs,
// [Description] text from the C# source, not re-derived from the member name.
export const LOAN_PRODUCT_SECTION_OPTIONS = [
  { value: LoanProductSection.FOSA, label: "FOSA" },
  { value: LoanProductSection.BOSA, label: "BOSA" },
];

export const LOAN_PRODUCT_CATEGORY_OPTIONS = [
  { value: LoanProductCategory.ShortTerm, label: "Short-Term" },
  { value: LoanProductCategory.LongTerm, label: "Long-Term" },
];

export const INTEREST_CALCULATION_MODE_OPTIONS = [
  { value: InterestCalculationMode.ReducingBalance, label: "Reducing Balance" },
  { value: InterestCalculationMode.StraightLine, label: "Straight Line" },
  { value: InterestCalculationMode.StraightLineAmortization, label: "Amortization (Straight Line)" },
  { value: InterestCalculationMode.DiminishingBalanceAmortization, label: "Amortization (Diminishing Balance)" },
  { value: InterestCalculationMode.FixedInterest, label: "Fixed Interest" },
];

export const INTEREST_CHARGE_MODE_OPTIONS = [
  { value: InterestChargeMode.Upfront, label: "Upfront" },
  { value: InterestChargeMode.Periodic, label: "Periodic" },
];

export const INTEREST_RECOVERY_MODE_OPTIONS = [
  { value: InterestRecoveryMode.Upfront, label: "Upfront" },
  { value: InterestRecoveryMode.Periodic, label: "Periodic" },
];

export const DYNAMIC_CHARGE_RECOVERY_MODE_OPTIONS = [
  { value: DynamicChargeRecoveryMode.Upfront, label: "Upfront" },
  { value: DynamicChargeRecoveryMode.Periodic, label: "Periodic" },
  { value: DynamicChargeRecoveryMode.CarryForward, label: "Carry Forward" },
];

export const DYNAMIC_CHARGE_RECOVERY_SOURCE_OPTIONS = [
  { value: DynamicChargeRecoverySource.LoanAccount, label: "Loan Account" },
  { value: DynamicChargeRecoverySource.SavingsAccount, label: "Savings Account" },
];

export const DYNAMIC_CHARGE_INSTALLMENTS_BASIS_VALUE_OPTIONS = [
  { value: DynamicChargeInstallmentsBasisValue.LoanCaseApprovedAmount, label: "Approved Loan Amount" },
  { value: DynamicChargeInstallmentsBasisValue.AttachedLoansAmount, label: "Attached Loans Amount" },
];

export const PAYOUT_RECOVERY_MODE_OPTIONS = [
  { value: PayoutRecoveryMode.StandingOrder, label: "Per Standing Order" },
  { value: PayoutRecoveryMode.Percentage, label: "Outstanding Percentage" },
];

export const AGGREGATE_CHECK_OFF_RECOVERY_MODE_OPTIONS = [
  { value: AggregateCheckOffRecoveryMode.OutstandingBalance, label: "Outstanding Balance" },
  { value: AggregateCheckOffRecoveryMode.StandingOrder, label: "Per Standing Order" },
];

export const CHARGE_TYPE_OPTIONS = [
  { value: ChargeType.Percentage, label: "Percentage" },
  { value: ChargeType.FixedAmount, label: "Fixed Amount" },
];

export const ROUNDING_TYPE_OPTIONS = [
  { value: RoundingType.NoRounding, label: "No Rounding" },
  { value: RoundingType.ToEven, label: "Midpoint To Even" },
  { value: RoundingType.AwayFromZero, label: "Midpoint Away From Zero" },
  { value: RoundingType.Ceiling, label: "Round Up" },
  { value: RoundingType.Floor, label: "Round Down" },
];

export const PAYMENT_FREQUENCY_PER_YEAR_OPTIONS = [
  { value: PaymentFrequencyPerYear.Annual, label: "Annual" },
  { value: PaymentFrequencyPerYear.SemiAnnual, label: "Semi-Annual (every 6 months)" },
  { value: PaymentFrequencyPerYear.Quarterly, label: "Quarterly (every 3 months)" },
  { value: PaymentFrequencyPerYear.TriAnnual, label: "Tri-Annual (every 4 months)" },
  { value: PaymentFrequencyPerYear.BiMonthly, label: "Bi-Monthly (every 2 months)" },
  { value: PaymentFrequencyPerYear.Monthly, label: "Monthly" },
  { value: PaymentFrequencyPerYear.SemiMonthly, label: "Semi-Monthly (twice a month)" },
  { value: PaymentFrequencyPerYear.BiWeekly, label: "Bi-Weekly (every 2 weeks)" },
  { value: PaymentFrequencyPerYear.Weekly, label: "Weekly" },
  { value: PaymentFrequencyPerYear.Daily, label: "Daily" },
];

export const PAYMENT_DUE_DATE_OPTIONS = [
  { value: PaymentDueDate.EndOfPeriod, label: "End of Period" },
  { value: PaymentDueDate.BegOfPeriod, label: "Beginning of Period" },
];

export const STANDING_ORDER_TRIGGER_OPTIONS = [
  { value: StandingOrderTrigger.Payout, label: "Payout" },
  { value: StandingOrderTrigger.CheckOff, label: "Check-Off" },
  { value: StandingOrderTrigger.Schedule, label: "Schedule" },
  { value: StandingOrderTrigger.Sweep, label: "Sweep" },
  { value: StandingOrderTrigger.Microloan, label: "Microloan" },
];

export const GUARANTOR_SECURITY_MODE_OPTIONS = [
  { value: GuarantorSecurityMode.Income, label: "Income" },
  { value: GuarantorSecurityMode.Investments, label: "Investments" },
];

export const PRODUCT_CODE_OPTIONS = [
  { value: ProductCode.Savings, label: "Savings" },
  { value: ProductCode.Loan, label: "Loan" },
  { value: ProductCode.Investment, label: "Investment" },
];

export const AUXILIARY_LOAN_CONDITION_OPTIONS = [
  { value: AuxiliaryLoanCondition.SubjectToNotHavingOutstandingBalance, label: "Subject to Not Having Outstanding Balance" },
  { value: AuxiliaryLoanCondition.SubjectToHavingLoanInProcessApproved, label: "Subject to Having Loan In Process (Approved)" },
  { value: AuxiliaryLoanCondition.SubjectToHavingLoanInProcessAudited, label: "Subject to Having Loan In Process (Verified)" },
  { value: AuxiliaryLoanCondition.SubjectToHavingLoanInProcessAppraised, label: "Subject to Having Loan In Process (Appraised)" },
  { value: AuxiliaryLoanCondition.SubjectToExistingInConditionalLendingList, label: "Subject to Existing In Conditional Lending List" },
  { value: AuxiliaryLoanCondition.SubjectToHavingDividendsPayabale, label: "Subject to Having Dividends Payable" },
];
