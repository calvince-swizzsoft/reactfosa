// Transcribed directly from Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs
// — [Flags] on the C# side but only ever used as single values in practice.
export const LeaveApplicationStatus = {
  Pending: 1,
  Approved: 2,
  Rejected: 4,
  Recalled: 8,
};

export const LEAVE_STATUS_LABEL = {
  [LeaveApplicationStatus.Pending]: "Pending",
  [LeaveApplicationStatus.Approved]: "Approved",
  [LeaveApplicationStatus.Rejected]: "Rejected",
  [LeaveApplicationStatus.Recalled]: "Recalled",
};

export const LEAVE_STATUS_BADGE_CLASS = {
  [LeaveApplicationStatus.Pending]: "bg-amber-100 text-amber-600",
  [LeaveApplicationStatus.Approved]: "bg-green-100 text-green-600",
  [LeaveApplicationStatus.Rejected]: "bg-red-100 text-red-600",
  [LeaveApplicationStatus.Recalled]: "bg-gray-100 text-gray-500",
};

// LeaveUnitTypes — Application.MainBoundedContext.DTO's LeaveType.UnitType
export const LEAVE_UNIT_TYPE_LABEL = { 0: "Unknown", 1: "Weekly", 2: "Monthly", 3: "Yearly" };

// LeaveTypeTargetGender
export const LEAVE_TARGET_GENDER_LABEL = { 0: "Unknown", 1: "Male", 2: "Female", 3: "Non-Binary" };
