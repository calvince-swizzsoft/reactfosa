// Transcribed directly from Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs.
export const SalaryHeadType = {
  FullTimeBasicPayEarning: 0xF0F0,
  NSSFDeduction: 0xF0F0 + 1,
  NHIFDeduction: 0xF0F0 + 2,
  PAYEDeduction: 0xF0F0 + 3,
  StatutoryProvidentFundDeduction: 0xF0F0 + 4,
  LoanDeduction: 0xF0F0 + 6,
  InvestmentDeduction: 0xF0F0 + 7,
  OtherEarning: 0xF0F0 + 8,
  OtherDeduction: 0xF0F0 + 9,
  VoluntaryProvidentFundDeduction: 0xF0F0 + 10,
  PartTimeBasicPayEarning: 0xF0F0 + 11,
  ContractBasicPayEarning: 0xF0F0 + 12,
  SHIFDeduction: 0xF0F0 + 13,
  AffordableHousingLevyDeduction: 0xF0F0 + 14,
};

export const SALARY_HEAD_TYPE_LABEL = {
  [SalaryHeadType.FullTimeBasicPayEarning]: "Basic Pay Earning (Full-Time)",
  [SalaryHeadType.PartTimeBasicPayEarning]: "Basic Pay Earning (Part-Time)",
  [SalaryHeadType.ContractBasicPayEarning]: "Basic Pay Earning (Contract)",
  [SalaryHeadType.OtherEarning]: "Other Earning",
  [SalaryHeadType.NSSFDeduction]: "N.S.S.F Deduction",
  [SalaryHeadType.NHIFDeduction]: "NHIF Deduction (Legacy)",
  [SalaryHeadType.SHIFDeduction]: "SHIF Deduction",
  [SalaryHeadType.AffordableHousingLevyDeduction]: "Affordable Housing Levy",
  [SalaryHeadType.PAYEDeduction]: "P.A.Y.E Deduction",
  [SalaryHeadType.StatutoryProvidentFundDeduction]: "Provident Fund Deduction (Statutory)",
  [SalaryHeadType.VoluntaryProvidentFundDeduction]: "Provident Fund Deduction (Voluntary)",
  [SalaryHeadType.LoanDeduction]: "Loan Deduction",
  [SalaryHeadType.InvestmentDeduction]: "Investment Deduction",
  [SalaryHeadType.OtherDeduction]: "Other Deduction",
};

// Mirrors the switch in SalaryHeadAppService.AddNewSalaryHead/UpdateSalaryHead
// — Category is always derived server-side from Type, never taken from the
// client, so this is for display/form-behavior only.
const EARNING_TYPES = new Set([
  SalaryHeadType.FullTimeBasicPayEarning,
  SalaryHeadType.PartTimeBasicPayEarning,
  SalaryHeadType.ContractBasicPayEarning,
  SalaryHeadType.OtherEarning,
]);
export const isEarningType = (type) => EARNING_TYPES.has(Number(type));

// Restricted to one instance system-wide (AddNewSalaryHead returns null on
// a duplicate) — used to warn in the create form before a doomed submit.
export const SINGLETON_TYPES = new Set([
  SalaryHeadType.FullTimeBasicPayEarning,
  SalaryHeadType.PartTimeBasicPayEarning,
  SalaryHeadType.ContractBasicPayEarning,
  SalaryHeadType.NSSFDeduction,
  SalaryHeadType.NHIFDeduction,
  SalaryHeadType.SHIFDeduction,
  SalaryHeadType.AffordableHousingLevyDeduction,
  SalaryHeadType.PAYEDeduction,
  SalaryHeadType.StatutoryProvidentFundDeduction,
]);

export const ProductCode = { Savings: 1, Loan: 2, Investment: 3 };
export const PRODUCT_CODE_LABEL = { [ProductCode.Savings]: "Savings", [ProductCode.Loan]: "Loan", [ProductCode.Investment]: "Investment" };

export const STATUTORY_TYPE_HELP = {
  [SalaryHeadType.NSSFDeduction]: "Calculated automatically at 6% of gross cash pay, capped by the NSSF earnings limit for the payroll month. The employer contributes an equal amount through the Employer NSSF G/L mapping.",
  [SalaryHeadType.SHIFDeduction]: "Calculated automatically at 2.75% of gross cash pay, with a KSh 300 monthly minimum. There is no matching employer contribution. Use a SHIF payable G/L account.",
  [SalaryHeadType.AffordableHousingLevyDeduction]: "Calculated automatically at 1.5% of regular cash earnings; one-off earnings are excluded. The employer contributes an equal amount through the Employer Housing Levy G/L mapping. Use a Housing Levy payable G/L account.",
  [SalaryHeadType.PAYEDeduction]: "Calculated using Kenya's monthly tax bands after eligible pension contributions, SHIF, Housing Levy and the salary-card exemption. The salary period controls personal and insurance relief. Fixed amounts and percentages on the salary card do not override statutory calculations.",
  [SalaryHeadType.NHIFDeduction]: "For historical payroll only. Use SHIF for current salary groups and cards; NHIF cannot be processed for current periods.",
};
