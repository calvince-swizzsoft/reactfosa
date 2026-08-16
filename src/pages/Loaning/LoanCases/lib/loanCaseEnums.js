// Shared enums for Loan Origination, transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs — not the
// placeholder 0/1/2 values shown in WORKFLOW.md §15.1's illustrative table.
export const LoanCaseStatus = {
  Registered: 0xBEBA,
  Appraised: 0xBEBA + 1,
  Approved: 0xBEBA + 2,
  Disbursed: 0xBEBA + 3,
  Rejected: 0xBEBA + 4,
  Deferred: 0xBEBA + 5,
  Audited: 0xBEBA + 6, // "Verified" in the UI
  Restructured: 0xBEBA + 7,
};

export const LoanAppraisalOption = {
  Appraise: 1,
  Reject: 2,
};

export const LoanApprovalOption = {
  Approve: 1,
  Reject: 2,
  Defer: 4,
};

export const LoanAuditOption = {
  Audit: 1, // "Verify" in the UI
  Reject: 2,
  Defer: 4,
};

// POST /{id}/cancel — only accepts a case already in Audited status
// (awaiting disbursement), 409 otherwise. [Flags] on the C# side but only
// ever sent as a single value.
export const LoanCancellationOption = {
  Defer: 1,
  Reject: 2,
};

// RecordStatus.Approved — a loanee/guarantor customer must be at this
// status or LoanCaseController.Create rejects with 400.
export const RecordStatus = {
  Approved: 2,
};
