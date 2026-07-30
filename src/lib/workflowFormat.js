// Shared formatting helpers for workflow-related pages: the Administration
// oversight panel (src/pages/Administration/Workflow) and the per-user
// Approval Requests task list (src/pages/CommandHub/ApprovalRequests). Kept in src/lib
// since both feature areas depend on it.

export const WorkflowRecordStatus = { Pending: 0, Approved: 2, Rejected: 3 };

export const normalizeWorkflow = (row) => ({
  id: row?.id ?? row?.Id ?? "",
  branchId: row?.branchId ?? row?.BranchId ?? "",
  branchDescription: row?.branchDescription ?? row?.BranchDescription ?? "",
  recordId: row?.recordId ?? row?.RecordId ?? "",
  referenceNumber: row?.referenceNumber ?? row?.ReferenceNumber ?? "",
  status: row?.status ?? row?.Status ?? "",
  statusDescription: row?.statusDescription ?? row?.StatusDescription ?? "",
  matchedStatus: row?.matchedStatus ?? row?.MatchedStatus ?? "",
  matchedStatusDescription: row?.matchedStatusDescription ?? row?.MatchedStatusDescription ?? "",
  systemPermissionType: row?.systemPermissionType ?? row?.SystemPermissionType ?? "",
  systemPermissionTypeDescription:
    row?.systemPermissionTypeDescription ?? row?.SystemPermissionTypeDescription ?? "",
  requiredApprovals: row?.requiredApprovals ?? row?.RequiredApprovals ?? 0,
  currentApprovals: row?.currentApprovals ?? row?.CurrentApprovals ?? 0,
});

// WorkflowItemDTO — one row per role in a workflow's approval chain.
// WorkflowRequiredApprovals/WorkflowCurrentApprovals (and the Workflow*
// fields generally) describe the parent workflow this item belongs to;
// RequiredApprovals/CurrentApprovals track progress within this item's own
// role (a role can require more than one approver). The Workflow* fields are
// kept around (not just for display) because approve/reject has to send the
// full DTO back — see toApprovalWorkflowItemDto below.
export const normalizeWorkflowItem = (row) => ({
  id: row?.id ?? row?.Id ?? "",
  workflowId: row?.workflowId ?? row?.WorkflowId ?? "",
  workflowBranchId: row?.workflowBranchId ?? row?.WorkflowBranchId ?? "",
  workflowBranchDescription: row?.workflowBranchDescription ?? row?.WorkflowBranchDescription ?? "",
  workflowSystemPermissionType: row?.workflowSystemPermissionType ?? row?.WorkflowSystemPermissionType ?? 0,
  workflowSystemPermissionTypeDescription:
    row?.workflowSystemPermissionTypeDescription ?? row?.WorkflowSystemPermissionTypeDescription ?? "",
  workflowReferenceNumber: row?.workflowReferenceNumber ?? row?.WorkflowReferenceNumber ?? 0,
  workflowRecordId: row?.workflowRecordId ?? row?.WorkflowRecordId ?? "",
  workflowRequiredApprovals: row?.workflowRequiredApprovals ?? row?.WorkflowRequiredApprovals ?? 0,
  workflowCurrentApprovals: row?.workflowCurrentApprovals ?? row?.WorkflowCurrentApprovals ?? 0,
  overallApprovalStage: row?.overallApprovalStage ?? row?.OverallApprovalStage ?? "",
  roleName: row?.roleName ?? row?.RoleName ?? "",
  approvalPriority: row?.approvalPriority ?? row?.ApprovalPriority ?? 0,
  stage: row?.stage ?? row?.Stage ?? "",
  requiredApprovals: row?.requiredApprovals ?? row?.RequiredApprovals ?? 0,
  currentApprovals: row?.currentApprovals ?? row?.CurrentApprovals ?? 0,
  status: row?.status ?? row?.Status ?? WorkflowRecordStatus.Pending,
  statusDescription: row?.statusDescription ?? row?.StatusDescription ?? "",
  isLocked: row?.isLocked ?? row?.IsLocked ?? false,
  isLastItemInOverallApprovalChain:
    row?.isLastItemInOverallApprovalChain ?? row?.IsLastItemInOverallApprovalChain ?? false,
  createdBy: row?.createdBy ?? row?.CreatedBy ?? "",
  createdDate: row?.createdDate ?? row?.CreatedDate ?? "",
  remarks: row?.remarks ?? row?.Remarks ?? "",
});

// Padded to match the backend's PaddedReferenceNumber getter (7 digits),
// computed client-side so display doesn't depend on that computed prop
// having round-tripped through the response.
export const paddedReferenceNumber = (item) => String(item.workflowReferenceNumber || "").padStart(7, "0");

// Rebuilds a full WorkflowItemDTO (PascalCase, matching the C# class) from a
// normalized item, with Status/Remarks overridden — this is what
// ApproveWorkflowItemRequest.WorkflowItem expects on items/approve. The
// getter-only DTO properties (StatusDescription, Stage, OverallApprovalStage,
// PaddedReferenceNumber, IsLastItemInOverallApprovalChain) have no setters,
// so the backend ignores them on bind and there's no need to send them back.
export function toApprovalWorkflowItemDto(item, { status, remarks }) {
  return {
    Id: item.id,
    WorkflowId: item.workflowId,
    WorkflowBranchId: item.workflowBranchId,
    WorkflowBranchDescription: item.workflowBranchDescription,
    WorkflowSystemPermissionType: item.workflowSystemPermissionType,
    WorkflowReferenceNumber: item.workflowReferenceNumber,
    WorkflowRecordId: item.workflowRecordId,
    WorkflowRequiredApprovals: item.workflowRequiredApprovals,
    WorkflowCurrentApprovals: item.workflowCurrentApprovals,
    Status: status,
    RequiredApprovals: item.requiredApprovals,
    CurrentApprovals: item.currentApprovals,
    RoleName: item.roleName,
    ApprovalPriority: item.approvalPriority,
    IsLocked: item.isLocked,
    CreatedBy: item.createdBy,
    CreatedDate: item.createdDate,
    Remarks: remarks ?? item.remarks,
  };
}

// WorkflowItemEntry — an individual approve/reject decision recorded
// against a workflow item (one role's approval stage).
export const normalizeWorkflowItemEntry = (row) => ({
  id: row?.id ?? row?.Id ?? "",
  workflowItemId: row?.workflowItemId ?? row?.WorkflowItemId ?? "",
  decision: row?.decision ?? row?.Decision ?? "",
  usedBiometrics: row?.usedBiometrics ?? row?.UsedBiometrics ?? false,
  createdBy: row?.createdBy ?? row?.CreatedBy ?? "",
  createdDate: row?.createdDate ?? row?.CreatedDate ?? "",
  remarks: row?.remarks ?? row?.Remarks ?? "",
});

// Status/MatchedStatus badges: Status follows the known WorkflowRecordStatus
// enum (Pending/Approved/Rejected), so it gets an exact mapping when the
// numeric value is passed in. MatchedStatus and free-text Decision values
// don't have a published enum, so those fall back to a keyword guess against
// the description text.
export function statusBadgeClass(description, status) {
  if (status === WorkflowRecordStatus.Approved) return "bg-green-100 text-green-600";
  if (status === WorkflowRecordStatus.Rejected) return "bg-red-100 text-red-600";
  if (status === WorkflowRecordStatus.Pending) return "bg-amber-100 text-amber-600";

  const text = (description || "").toLowerCase();
  if (/(reject|declin|cancel|fail|lock)/.test(text)) return "bg-red-100 text-red-600";
  if (/(pending|await|progress|review|open)/.test(text)) return "bg-amber-100 text-amber-600";
  if (/(approv|complet|active|posted|success|match)/.test(text)) return "bg-green-100 text-green-600";
  if (/(registry|info|queue)/.test(text)) return "bg-blue-100 text-blue-600";
  return "bg-gray-100 text-gray-600";
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
