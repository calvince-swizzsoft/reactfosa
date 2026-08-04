// Shared between CustomerAccountStatement and GeneralLedgerStatement — both
// controllers return the same GeneralLedgerTransaction line shape and use
// the same JournalEntryFilter enum for their free-text search. Values below
// are transcribed directly from
// SwiftFinancialz/Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs
// (JournalEntryFilter, SystemTransactionCode) rather than guessed.

// Full enum, all 36 values. The "Env.*" entries (5-13) are internal audit
// metadata (user/machine/OS/MAC/IP at posting time) — unlikely search
// targets for a statement screen, but included for completeness since the
// source enum has them.
export const JOURNAL_ENTRY_FILTER_OPTIONS = [
  { value: 0, label: "Posting Period" },
  { value: 1, label: "Branch" },
  { value: 2, label: "Primary Description" },
  { value: 3, label: "Secondary Description" },
  { value: 4, label: "Reference" },
  { value: 5, label: "App. User Name" },
  { value: 6, label: "Env. User Name" },
  { value: 7, label: "Env. Machine Name" },
  { value: 8, label: "Env. Domain Name" },
  { value: 9, label: "Env. OS Version" },
  { value: 10, label: "Env. MAC Address" },
  { value: 11, label: "Env. Motherboard Serial #" },
  { value: 12, label: "Env. Processor Id" },
  { value: 13, label: "Env. IP Address" },
  { value: 14, label: "G/L Account Name" },
  { value: 15, label: "Contra G/L Account Name" },
  { value: 16, label: "Amount" },
  { value: 17, label: "Serial Number" },
  { value: 18, label: "Personal Identification #" },
  { value: 19, label: "First Name" },
  { value: 20, label: "Last Name" },
  { value: 21, label: "Identity Card #" },
  { value: 22, label: "Payroll Numbers" },
  { value: 23, label: "Org. Name" },
  { value: 24, label: "Org. Registration #" },
  { value: 25, label: "Address Line 1" },
  { value: 26, label: "Address Line 2" },
  { value: 27, label: "Street" },
  { value: 28, label: "Postal Code" },
  { value: 29, label: "City" },
  { value: 30, label: "Email" },
  { value: 31, label: "Land Line" },
  { value: 32, label: "Mobile Line" },
  { value: 33, label: "Account Number" },
  { value: 34, label: "Membership Number" },
  { value: 35, label: "Personal File Number" },
];

// Default used by the old MVC statement screen (JournalReference = 4).
export const DEFAULT_JOURNAL_ENTRY_FILTER = 4;

// Full enum, all 92 values (0-91).
export const SYSTEM_TRANSACTION_CODE_OPTIONS = [
  { value: 0, label: "Unclassified" },
  { value: 1, label: "Cash Withdrawal (Customer)" },
  { value: 2, label: "Cash Deposit (Customer)" },
  { value: 3, label: "Cheque Deposit (Customer)" },
  { value: 4, label: "Payment Voucher" },
  { value: 5, label: "Journal Voucher" },
  { value: 6, label: "Payout Batch" },
  { value: 7, label: "Bank to Treasury" },
  { value: 8, label: "Treasury to Bank" },
  { value: 9, label: "Treasury to Teller" },
  { value: 10, label: "Treasury to Treasury" },
  { value: 11, label: "Sacco-Link" },
  { value: 12, label: "Sparrow" },
  { value: 13, label: "MCo-op Cash" },
  { value: 14, label: "Inter-Acccount Transfer" },
  { value: 15, label: "Fiscal Period Closing" },
  { value: 16, label: "SkyWorld" },
  { value: 17, label: "Cash Receipt (Customer)" },
  { value: 18, label: "Cash Receipt (Sundry)" },
  { value: 19, label: "Cheque Receipt (Sundry)" },
  { value: 20, label: "Cash Payment (Sundry)" },
  { value: 21, label: "Loan Disbursement" },
  { value: 22, label: "External Cheque (Clearance)" },
  { value: 23, label: "Loan Restructuring" },
  { value: 24, label: "Interest Capitalization" },
  { value: 25, label: "SpotCash" },
  { value: 26, label: "Fixed Deposit" },
  { value: 27, label: "Salary" },
  { value: 28, label: "Check-Off Batch" },
  { value: 29, label: "Cash Pickup Batch" },
  { value: 30, label: "Standing Order" },
  { value: 31, label: "Savings Charges" },
  { value: 32, label: "Loan Charges" },
  { value: 33, label: "Truncated Cheque" },
  { value: 34, label: "Legacy Balance" },
  { value: 35, label: "Statement Fee" },
  { value: 36, label: "Archive Balance" },
  { value: 37, label: "Refund Batch" },
  { value: 38, label: "Debit Batch" },
  { value: 39, label: "Balance Adjustment" },
  { value: 40, label: "Bank Reconciliation" },
  { value: 41, label: "Teller End-Of-Day" },
  { value: 42, label: "Teller Cash Transfer" },
  { value: 43, label: "Sundry Payment Batch" },
  { value: 44, label: "Expense Payables/Receivables" },
  { value: 45, label: "Intra-Acccount Transfer" },
  { value: 46, label: "Membership Termination" },
  { value: 47, label: "Loan Guarantee" },
  { value: 48, label: "Guarantor Attachment" },
  { value: 49, label: "Guarantor Substitution" },
  { value: 50, label: "Loan Offsetting" },
  { value: 51, label: "Agency Banking" },
  { value: 52, label: "Mobile To Bank" },
  { value: 53, label: "In-House Cheque" },
  { value: 54, label: "PesaPepe" },
  { value: 55, label: "Guarantor Relieving" },
  { value: 56, label: "Balance Pooling" },
  { value: 57, label: "PesaPepe Microloan" },
  { value: 58, label: "General Ledger" },
  { value: 59, label: "ABC Bank" },
  { value: 60, label: "Cash Withdrawal (Account Closure)" },
  { value: 61, label: "Wire Transfer Batch" },
  { value: 62, label: "Citius" },
  { value: 63, label: "e-Statement" },
  { value: 64, label: "Loan Request" },
  { value: 65, label: "Purchase Payables" },
  { value: 66, label: "Asset Disposals" },
  { value: 67, label: "Mobile To Bank (Sender ACK)" },
  { value: 68, label: "Super Saver Payables" },
  { value: 69, label: "Funeral Rider Claim" },
  { value: 70, label: "Account Activation" },
  { value: 71, label: "Asset Depreciations" },
  { value: 72, label: "Membership Approval" },
  { value: 73, label: "Account Closure" },
  { value: 74, label: "Account Freezing" },
  { value: 75, label: "Account Dormant" },
  { value: 76, label: "Loan Deferred" },
  { value: 77, label: "Alternate Channel Linking" },
  { value: 78, label: "Alternate Channel Replacement" },
  { value: 79, label: "Alternate Channel Renewal" },
  { value: 80, label: "Alternate Channel Delinking" },
  { value: 81, label: "Alternate Channel Stoppage" },
  { value: 82, label: "Leave Approval" },
  { value: 83, label: "Customer Details Editing" },
  { value: 84, label: "Interest Adjustment" },
  { value: 85, label: "External Cheque (Transfer)" },
  { value: 86, label: "External Cheque (Banking)" },
  { value: 87, label: "Membership Account Registration" },
  { value: 88, label: "Membership Account Verification" },
  { value: 89, label: "Membership Reset Password" },
  { value: 90, label: "Promotional Account Alert" },
  { value: 91, label: "Customer Registration Alert" },
];

export const formatMoney = (n) =>
  typeof n === "number" ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

export const formatStatementDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

// Shared row renderer for the GeneralLedgerTransaction line shape — used by
// both statement screens' tables so the columns stay in sync.
export function StatementRow({ line, showGlAccount = false }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-3 px-4 text-sm border-b last:border-b-0">
      <span className="col-span-2 text-gray-600">{formatStatementDate(line.journalValueDate || line.journalCreatedDate)}</span>
      <div className={showGlAccount ? "col-span-3" : "col-span-4"}>
        <p className="text-gray-700">{line.journalPrimaryDescription || "—"}</p>
        {line.journalSecondaryDescription && (
          <p className="text-xs text-gray-400">{line.journalSecondaryDescription}</p>
        )}
      </div>
      {showGlAccount && (
        <div className="col-span-2">
          <p className="text-gray-700">{line.glAccountName || "—"}</p>
          {line.customerFullName && <p className="text-xs text-gray-400">{line.customerFullName}</p>}
        </div>
      )}
      <span className="col-span-1 text-gray-500">{line.journalReference || "—"}</span>
      <span className="col-span-1 text-right text-red-600">{line.debit ? formatMoney(line.debit) : ""}</span>
      <span className="col-span-1 text-right text-green-600">{line.credit ? formatMoney(line.credit) : ""}</span>
      <span className="col-span-1 text-right font-medium text-gray-800">{formatMoney(line.runningBalance)}</span>
      <span className="col-span-1 text-right">
        {line.journalIsLocked && (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600">Reversed</span>
        )}
      </span>
    </div>
  );
}
