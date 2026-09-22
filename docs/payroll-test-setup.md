# Test payroll setup — 21 September 2026

Created through the application services in the application's configured database, at the user's request. No payroll was processed or posted.

## Ready-to-use test

- **Employee:** Samwel Kimeu
- **Employee type:** Swizz Regular (Full Time)
- **Salary group:** TEST - Full Time Basic 100,000
- **Salary card:** 1
- **Period:** September 2026 Payroll, FY2026
- **Gross monthly pay:** KSh 100,000
- **Linked savings product:** TEST SAVINGS (code 2), mapped to ORDINARY SAVINGS liability G/L 2001
- **Payroll control:** existing Swizz Payroll Control, G/L 2004
- **Automatic payouts:** off

The existing September period's pension and insurance limits were annual amounts. They are now the monthly limits of KSh 30,000 and KSh 5,000, with personal relief of KSh 2,400.

Open **Human Resource → Salary Processing**, select **September 2026 Payroll**, choose **TEST - Full Time Basic 100,000**, then process. This creates a pending payslip for review. Posting a payslip is a separate financial action.

### Expected calculation

| Item | KSh |
|---|---:|
| Basic / gross pay | 100,000.00 |
| NSSF employee | 6,000.00 |
| SHIF | 2,750.00 |
| Housing Levy employee | 1,500.00 |
| PAYE | 19,308.35 |
| Net pay | **70,441.65** |
| Employer NSSF, separate expense | 6,000.00 |
| Employer Housing Levy, separate expense | 1,500.00 |

These figures were calculated in memory from the saved salary-card entries using `KenyaPayrollRules`, without creating a payslip or journal.

## Groups

| Group | Basic | House allowance | Transport allowance | Gross |
|---|---:|---:|---:|---:|
| TEST - Full Time Basic 30,000 | 30,000 | 0 | 0 | 30,000 |
| TEST - Full Time Allowances 65,000 | 50,000 | 10,000 | 5,000 | 65,000 |
| TEST - Full Time Basic 100,000 | 100,000 | 0 | 0 | 100,000 |

Each group has nine heads: Basic Salary, House Allowance, Transport Allowance, Overtime, Bonus, NSSF, PAYE, SHIF and Affordable Housing Levy. Overtime and Bonus start at zero and are marked one-off. Statutory entries start at zero in the group/card; processing calculates their amounts automatically. Only Kimeu was assigned a new salary card. The existing **Full Time** group was left unchanged.

## G/L accounts created

| Code | Account | Type |
|---:|---|---|
| 2003 | NSSF Payable | Liability |
| 2012 | PAYE Payable | Liability |
| 2013 | SHIF Payable | Liability |
| 2014 | Affordable Housing Levy Payable | Liability |
| 5001 | Basic Salaries Expense | Expense |
| 5003 | House Allowance Expense | Expense |
| 5004 | Transport Allowance Expense | Expense |
| 5005 | Overtime Expense | Expense |
| 5006 | Staff Bonus Expense | Expense |
| 5007 | Employer NSSF Expense | Expense |
| 5008 | Employer Housing Levy Expense | Expense |

All are unlocked detail accounts, with automatic posting enabled. The employer contribution system mappings point to 5007 and 5008. The existing TEST SAVINGS product and payroll control account were reused.

Before-change snapshot: `tmp/payroll-setup-before.xml`. Setup runner: `tmp/run-payroll-setup.ps1`. The runner writes through the application services and validates saved groups/cards; it does not call payroll processing or posting.
