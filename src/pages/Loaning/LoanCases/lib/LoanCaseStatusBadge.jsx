import { LoanCaseStatus } from "./loanCaseEnums";

const STATUS_META = {
  [LoanCaseStatus.Registered]: { label: "Registered", cls: "bg-gray-100 text-gray-600" },
  [LoanCaseStatus.Appraised]: { label: "Appraised", cls: "bg-blue-100 text-blue-600" },
  [LoanCaseStatus.Approved]: { label: "Approved", cls: "bg-amber-100 text-amber-600" },
  [LoanCaseStatus.Disbursed]: { label: "Disbursed", cls: "bg-green-100 text-green-600" },
  [LoanCaseStatus.Rejected]: { label: "Rejected", cls: "bg-red-100 text-red-600" },
  [LoanCaseStatus.Deferred]: { label: "Deferred", cls: "bg-amber-100 text-amber-600" },
  [LoanCaseStatus.Audited]: { label: "Verified", cls: "bg-green-100 text-green-600" },
  [LoanCaseStatus.Restructured]: { label: "Restructured", cls: "bg-blue-100 text-blue-600" },
};

export default function LoanCaseStatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: "Unknown", cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${meta.cls}`}>{meta.label}</span>;
}
