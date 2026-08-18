// Transcribed directly from Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs.
export const SalaryPeriodStatus = { Open: 1, Closed: 2, Suspended: 4 };
export const SALARY_PERIOD_STATUS_LABEL = { [SalaryPeriodStatus.Open]: "Open", [SalaryPeriodStatus.Closed]: "Closed", [SalaryPeriodStatus.Suspended]: "Suspended" };
export const SALARY_PERIOD_STATUS_BADGE_CLASS = {
  [SalaryPeriodStatus.Open]: "bg-green-100 text-green-600",
  [SalaryPeriodStatus.Closed]: "bg-gray-100 text-gray-500",
  [SalaryPeriodStatus.Suspended]: "bg-amber-100 text-amber-600",
};

export const PaySlipStatus = { Pending: 1, Posted: 2, Rejected: 4 };
export const PAYSLIP_STATUS_LABEL = { [PaySlipStatus.Pending]: "Pending", [PaySlipStatus.Posted]: "Posted", [PaySlipStatus.Rejected]: "Rejected" };
export const PAYSLIP_STATUS_BADGE_CLASS = {
  [PaySlipStatus.Pending]: "bg-amber-100 text-amber-600",
  [PaySlipStatus.Posted]: "bg-green-100 text-green-600",
  [PaySlipStatus.Rejected]: "bg-red-100 text-red-600",
};

export const EmployeeCategory = { FullTime: 1, PartTime: 2, Contract: 4 };
export const EMPLOYEE_CATEGORY_LABEL = { [EmployeeCategory.FullTime]: "Full-Time", [EmployeeCategory.PartTime]: "Part-Time", [EmployeeCategory.Contract]: "Contract" };

export const MONTH_LABEL = {
  1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
  7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
};
