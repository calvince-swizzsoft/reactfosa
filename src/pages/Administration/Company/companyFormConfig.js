// Shared field config for AddCompanies.jsx / EditCompanies.jsx, sourced
// directly from Application.MainBoundedContext.DTO.AdministrationModule/CompanyDTO.cs
// (60+ fields, only a subset of which were previously exposed as inputs —
// see TODO.md). Keeping both drawers reading from one list here is
// deliberate: the previous hand-duplicated field arrays in each file had
// already drifted (one had a typo'd key that matched nothing on the DTO,
// the other was just missing fields), so this is the single source of
// truth both forms render from.

export const TABS = [
  { id: "profile", label: "Profile" },
  { id: "address", label: "Address" },
  { id: "receipt", label: "Receipt Settings" },
  { id: "schedule", label: "Schedule & Limits" },
  { id: "verification", label: "Verification & Batch Audits" },
  { id: "operational", label: "Operational Policies" },
  { id: "security", label: "Security & Access" },
  { id: "notifications", label: "Notifications" },
  { id: "products", label: "Mandatory Products" },
  { id: "debitTypes", label: "Debit Types", stub: true },
];

// [key, label] — text/string inputs
export const PROFILE_FIELDS = [
  ["description", "Description"],
  ["vision", "Vision"],
  ["mission", "Mission"],
  ["motto", "Motto"],
  ["registrationNumber", "Registration Number"],
  ["personalIdentificationNumber", "Personal Identification Number"],
  ["applicationDisplayName", "Rpt Display Name"],
  ["recoveryPriority", "Recovery Priority"],
];

export const ADDRESS_FIELDS = [
  ["addressAddressLine1", "Address Line 1"],
  ["addressAddressLine2", "Address Line 2"],
  ["addressStreet", "Street"],
  ["addressPostalCode", "Postal Code"],
  ["addressCity", "City"],
  ["addressEmail", "Email"],
  ["addressLandLine", "Land Line"],
  ["addressMobileLine", "Mobile Line"],
];

// Receipt tab mixes a few numeric/string fields with the receipt-content
// booleans — grouped by theme rather than by DTO type.
export const RECEIPT_NUMBER_FIELDS = [
  ["transactionReceiptTopIndentation", "Top Indentation"],
  ["transactionReceiptLeftIndentation", "Left Indentation"],
];
export const RECEIPT_TEXT_FIELDS = [
  ["transactionReceiptFooter", "Receipt Footer Text"],
];
export const RECEIPT_TOGGLES = [
  ["excludeChargesInTransactionReceipt", "Exclude Charges In Receipt"],
  ["excludeChequeMaturityDateInTransactionReceipt", "Exclude Cheque Maturity Date In Receipt"],
  ["excludeCustomerAccountBalanceInTransactionReceipt", "Exclude Customer Account Balance In Receipt"],
];

export const SCHEDULE_NUMBER_FIELDS = [
  ["fingerprintBiometricThreshold", "Fingerprint Biometric Threshold"],
  ["membershipTerminationNoticePeriod", "Membership Termination Notice Period (days)"],
];
// TimeSpan fields — previously in form state but never rendered as inputs,
// so always silently sent blank.
export const SCHEDULE_TIME_FIELDS = [
  ["timeDurationStartTime", "System Initialization Time"],
  ["timeDurationEndTime", "System Lock Time"],
];

// The two maker-checker flags this controller lets you set — cross-linked
// from the doc to customer-verification-api-spec.md and
// customer-account-verification-api-spec.md. `enforceCustomerMakerChecker`
// was missing from both forms entirely before this pass.
export const VERIFICATION_TOGGLES = [
  ["enforceCustomerMakerChecker", "Enforce Customer Maker/Checker"],
  ["enforceCustomerAccountMakerChecker", "Enforce Customer Account Maker/Checker"],
];

export const BATCH_AUDIT_TOGGLES = [
  ["bypassJournalVoucherAudit", "Bypass Journal Voucher Verification"],
  ["bypassCreditBatchAudit", "Bypass Credit Batch Verification"],
  ["bypassDebitBatchAudit", "Bypass Debit Batch Verification"],
  ["bypassRefundBatchAudit", "Bypass Refund Batch Verification"],
  ["bypassWireTransferBatchAudit", "Bypass EFT Batch Verification"],
  ["bypassLoanDisbursementBatchAudit", "Bypass Disbursement Batch Verification"],
  ["bypassJournalReversalBatchAudit", "Bypass Reversal Batch Verification"],
  ["bypassInterAccountTransferBatchAudit", "Bypass Inter-Account Transfer Batch Verification"],
  ["bypassExpensePayableAudit", "Bypass Expense Payable Verification"],
  ["bypassGeneralLedgerAudit", "Bypass General Ledger Verification"],
];

export const OPERATIONAL_TOGGLES = [
  ["trackGuarantorCommittedInvestments", "Track Guarantor Committed Investments"],
  ["transferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement", "Transfer Net Refundable Amount To Savings A/C On Death Claim Settlement"],
  ["receiveLoanRequestBeforeLoanRegistration", "Receive Loan Request Before Loan Registration"],
  ["localizeOnlineNotifications", "Localize Online Notifications"],
  ["isWithholdingTaxAgent", "Is Withholding Tax Agent"],
  ["enforceBudgetControl", "Enforce Budget Control"],
  ["isFileTrackingEnforced", "Is File Tracking Enforced"],
  ["enforceFixedDepositBands", "Enforce Fixed Deposit Bands"],
  ["recoverArrearsOnCashDeposit", "Recover Arrears On Cash Deposit"],
  ["recoverArrearsOnExternalChequeClearance", "Recover Arrears On External Cheque Clearance"],
  ["recoverArrearsOnFixedDepositPayment", "Recover Arrears On Fixed Deposit Payment"],
  ["allowDebitBatchToOverdrawAccount", "Allow Debit Batch To Overdraw Account"],
  ["enforceInvestmentProductExemptions", "Enforce Investment Product Exemptions"],
  ["enforceMobileToBankReconciliationVerification", "Enforce Mobile To Bank Reconciliation Verification"],
];

// isLocked is last and handled with its own warning copy in the renderer —
// per the spec, setting it true on a previously-unlocked company locks it
// as part of the same PUT that saves everything else on this tab.
export const SECURITY_TOGGLES = [
  ["enforceBiometricsForCashWithdrawal", "Enforce Biometrics For Cash Withdrawal"],
  ["enforceTwoFactorAuthentication", "Enforce Two Factor Authentication"],
  ["enforceSystemLock", "Enforce System Initialization/Lock Time"],
  ["enforceTellerLimits", "Enforce Teller Limits"],
  ["enforceTellerCashTransferAcknowledgement", "Enforce Teller Cash Transfer Acknowledgement"],
  ["enforceSingleUserSession", "Enforce Single User Session"],
];

export const NOTIFICATION_TOGGLES = [
  ["applicationMembershipTextAlertsEnabled", "Application Membership Text Alerts Enabled"],
  ["customerMembershipTextAlertsEnabled", "Customer Membership Text Alerts Enabled"],
];

const allToggleKeys = [
  ...RECEIPT_TOGGLES, ...VERIFICATION_TOGGLES, ...BATCH_AUDIT_TOGGLES,
  ...OPERATIONAL_TOGGLES, ...SECURITY_TOGGLES, ...NOTIFICATION_TOGGLES,
].map(([key]) => key);

export const emptyCompanyForm = {
  description: "", vision: "", mission: "", motto: "",
  registrationNumber: "", personalIdentificationNumber: "",
  applicationDisplayName: "",
  // The old MVC Create action unconditionally forced this to "DirectDebits"
  // regardless of what was submitted — the new endpoint saves whatever you
  // send as-is (including blank). Defaulting new companies to the old
  // forced value here preserves prior behavior while leaving it editable;
  // this is the frontend decision the spec explicitly left open.
  recoveryPriority: "DirectDebits",
  addressAddressLine1: "", addressAddressLine2: "", addressStreet: "",
  addressPostalCode: "", addressCity: "", addressEmail: "",
  addressLandLine: "", addressMobileLine: "",
  transactionReceiptTopIndentation: 10,
  transactionReceiptLeftIndentation: 15,
  transactionReceiptFooter: "",
  fingerprintBiometricThreshold: 65,
  membershipTerminationNoticePeriod: 30,
  timeDurationStartTime: "06:00",
  timeDurationEndTime: "22:00",
  isLocked: false,
  ...Object.fromEntries(allToggleKeys.map((key) => [key, false])),
};

const REQUIRED_COMPANY_FIELDS = [
  ["description", "Name"],
  ["registrationNumber", "Registration Number"],
  ["personalIdentificationNumber", "P.I.N Number"],
  ["addressAddressLine1", "Address Line 1"],
  ["addressPostalCode", "Postal Code"],
  ["addressCity", "City"],
  ["addressEmail", "E-mail"],
  ["addressLandLine", "Land Line"],
  ["addressMobileLine", "Mobile Line"],
];

export function validateCompany(form) {
  const errors = REQUIRED_COMPANY_FIELDS
    .filter(([key]) => !String(form[key] ?? "").trim())
    .map(([, label]) => `${label} is required.`);
  const email = String(form.addressEmail ?? "").trim();
  const mobile = String(form.addressMobileLine ?? "").trim();

  if (email && !/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
    errors.push("Invalid email address.");
  }
  if (mobile && !/^\+[0-9]{7,15}$/.test(mobile)) {
    errors.push("The mobile number should start with a plus sign, followed by the country code and national number.");
  }

  return errors;
}

export function companyValidationTab(errors) {
  return errors.some((message) => /Address|Postal|City|E-mail|Land Line|mobile/i.test(message))
    ? "address"
    : "profile";
}
