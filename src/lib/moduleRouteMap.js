// Maps a backend module's `Code` to the actual frontend route that
// implements it. The backend's grouping doesn't always match today's
// hand-built route paths (e.g. it nests "Tellers" under Accounts > Setup,
// not under its own top-level area), so this has to be curated by hand
// rather than derived from ControllerName/ActionName.
//
// Only entries confirmed against real module data go here, and only where
// the ControllerName/Description leaves little doubt about the match.
// Anything not listed falls back to the generic placeholder route
// (`/modules/:code`) rather than risk linking to the wrong page — extend
// this map incrementally as more of the module list is reviewed.
export const moduleRouteMap = {
  // Administration > Setup > Companies (ControllerName: Company)
  20003: "/Administration/Company",
  // Administration > Setup > Branches (ControllerName: Branch)
  20004: "/Administration/Branches",

  // Administration > Setup > Banks (ControllerName: Banks) 
  20005: "/Administration/Banks", //w currently use BankLinkages but possibly we should implement Banks

   // Administration > Setup > Banks (ControllerName: Banks)
  20006: "/Administration/Locations",

  // Administration > Setup > Audit Logs (ControllerName: AuditLog)
  20008: "/Administration/AuditLogs",

  // Administration > Operations > Security > Roles (ControllerName: Role)
  20009: "/Administration/Roles/Create",
  // Administration > Operations > Security > Users
  //20010: "/UserManagement/Users",

    20010: "/Administration/Users",



  // Administration > Operations > Access Control List > Modules (ControllerName: Module)
  20012: "/Administration/Modules",
  // Administration > Operations > Access Control List > Permission Types (ControllerName: Role, permission-type-to-role mapping)
  20013: "/Administration/Roles/PermissionTypes",

  // Human Resource > Setup > Departments (ControllerName: Department)
  22003: "/HumanResource/Departments",
  // Human Resource > Setup > Designations (ControllerName: Designation)
  22004: "/HumanResource/Designations",
  // Human Resource > Setup > Employee Types (ControllerName: EmployeeType)
  22006: "/HumanResource/EmployeeTypes",
  // Human Resource > Employees (ControllerName: Employee)
  22007: "/HumanResource/Employees",

  // Accounts > Setup > Treasuries (ControllerName: Treasuries, AreaName: Accounts)
  23020: "/Accounts/Treasuries",
  // Accounts > Setup > Tellers (ControllerName: Teller, AreaName: FrontOffice)
  23021: "/Accounts/Tellers",
  // Accounts > Setup > Bank Linkages (ControllerName: BankLinkage, matches BankLinkages.jsx)
  23022: "/Finance/BanksSetup",

  // Accounts > Setup > G/L Accounts > Cost Centers (ControllerName:
  // CostCenter, AreaName: Accounts — NavigationMenu.cs:74, 0x000059D8+4)
  23004: "/Accounts/CostCenters",
  // Accounts > Setup > G/L Accounts > Chart Of Accounts (ControllerName:
  // ChartOfAccount, AreaName: Accounts — NavigationMenu.cs:76,
  // 0x000059D8+5). Was pointed at the legacy Finance/COA/ChartsOfAccount.jsx
  // screen, which hits an unrelated legacy endpoint
  // (api/values/GetGeneralLedgers, no JWT) — repointed to the real
  // Accounts-area screen built against docs/api/chartofaccount-api-spec.md.
  23005: "/Accounts/ChartOfAccounts",
  // Accounts > Setup > G/L Accounts > G/L Account Determination
  // (ControllerName: SystemGeneralLedgerAccountMapping, AreaName: Accounts
  // — NavigationMenu.cs:78, 0x000059D8+6). Same story as 23005: was
  // pointed at the legacy Finance/Setup/AccountConfiguration.jsx screen
  // (api/values/getSystemMappings), repointed to the real sub-resource of
  // ChartOfAccountController (chartofaccount-api-spec.md §3.6/3.7).
  23006: "/Accounts/ChartOfAccounts/Mappings",

  // Accounts > Setup > Financial Products > Loans (ControllerName: LoanProduct)
  23018: "/Loaning/LoanProducts",

  // Accounts > Setup > Financial Products > Savings (ControllerName: SavingsProduct)
  23016: "/Accounts/SavingsProducts",
  // Accounts > Setup > Financial Products > Investments (ControllerName: InvestmentProduct)
  23017: "/Accounts/InvestmentProducts",

  // Accounts > Operations > Customer Accounts > Register (ControllerName: CustomerAccounts)
  23044: "/Accounts/CustomerAccounts",

  // Accounts > Operations > Standing Orders (ControllerName: StandingOrder)
  23048: "/Accounts/StandingOrders",
  // Accounts > Operations > Standing Orders > Execution (ControllerName: StandingOrderExecution, admin/ops only)
  23039: "/Accounts/StandingOrders/Execution",

  // Accounts > Operations > Statements > Customer Account Statement (ControllerName: CustomerAccountStatement)
  23051: "/Accounts/CustomerAccountStatement",
  // Accounts > Operations > Statements > General Ledger Statement (ControllerName: GeneralLedgerStatement)
  26012: "/Accounts/GeneralLedgerStatement",

  // Dashboard > Messaging > Text Alerts — legacy hex-sum code (0x00006590 + 8)
  // from the old app's NavigationMenu seed list, per user instruction.
  // textalert-api-spec.md §5 explicitly warns this code belongs to a
  // different, read-only reference controller (Areas/Dashboard, plural
  // TextAlertsController) than the create-capable one this route serves
  // (Areas/Messaging, singular TextAlertController) — there's no seeded nav
  // entry for the latter. Replace with the real code once one exists in
  // GET /api/administration/modules.
  26008: "/Messaging/TextAlerts",

  // Registry > Employer (ControllerName: Employer)
  21003: "/Registry/Employer",

  // Registry > Zone (ControllerName: Zone)
  21004: "/Registry/Zone",

  // Registry > Customers (ControllerName: Customer) — replaces the old Members flow
  21007: "/Registry/Customers",

  25003: "/FrontOffice/CashManagement",

  // Front-Office > Teller > "Savings Receipts/Payments" (ControllerName:
  // CashDeposit, NavigationMenu.cs: AreaCode 0x000061A8+5, Code
  // 0x000061A8+6). This is the ONLY real nav entry for the whole teller
  // transaction cycle — deposit/withdrawal/cheque deposit/payment voucher
  // are one screen server-side (SAVINGS-RECEIPTS-PAYMENTS-FLOW.md /
  // -FORM-LAYOUT.md), not four. Previously pointed at the old
  // deposit-only page from the Phase-1 fidelity pass; now the unified one.
  25006: "/FrontOffice/SavingsReceiptsPayments",

  // Front-Office > Teller > "Cheques/Cash Transfer" (ControllerName:
  // Transfers, NavigationMenu.cs AreaCode 0x000061A8+5, Code
  // 0x000061A8+9). Confirmed there is no separate code for Cash Transfer
  // vs. Cheque Transfer anywhere in NavigationMenu.cs — this ONE nav item
  // covers both, same situation as Savings Receipts/Payments (25006)
  // before it was unified. The app still has two separate screens for it
  // (CashTransfer.jsx / ChequeTransfer.jsx, both against
  // TransfersController's /cash and /cheques sub-routes) — pointed at Cash
  // Transfer per user decision (2026-08-07). TODO: merge these into one
  // screen the way Savings Receipts/Payments was, so this nav item has a
  // real single destination instead of an arbitrary pick between two.
  25009: "/FrontOffice/CashTransfer",

  // Front-Office > Teller > "End-Of-Day" (ControllerName: EndOfDay,
  // NavigationMenu.cs AreaCode 0x000061A8+5, Code 0x000061A8+10) — was
  // unmapped entirely.
  25010: "/FrontOffice/EndOfDay",

20014: "/Administration/Workflow",

26010: "/CommandHub/ApprovalRequests"
};
