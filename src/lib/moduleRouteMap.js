// Maps a backend module's `Code` to the actual frontend route that
// implements it. The backend's grouping doesn't always match today's
// hand-built route paths (e.g. it nests "Tellers" under Accounts > Setup,
// not under its own top-level area), so this has to be curated by hand
// rather than derived from ControllerName/ActionName.
//
// Every `Code` below was computed directly from
// `Infrastructure.Crosscutting.Framework/Utils/NavigationMenu.cs`
// (SwiftFinancialz repo) — each area's base hex constant plus the leaf's
// own `+N` offset, e.g. Front-Office is `0x000061A8` (25000), so "Fiscal
// Counts" at `0x000061A8 + 15` is `25015`. Only entries confirmed against
// that source go here, and only where the ControllerName/Description
// leaves little doubt about the match. Most of the backend's module tree
// (the Loan-Origination/"Back Office" module beyond the 4 core pipeline
// stages now built — guarantor sub-flows, restructuring, cancellation,
// payroll/check-off data capture — all of Control/Procurement, all of
// Micro-Credit, and most Accounts reconciliation/budget/HR
// roster-attendance-salary detail screens) has no frontend page built yet
// — those are deliberately left out rather than guessed, and fall back to
// the generic placeholder route
// (`/modules/:code`). Extend this map incrementally as more pages are
// built, always against the real NavigationMenu.cs source, not by pattern
// -matching a Description string — Code values are NOT sequential/nested
// the way a casual skim suggests (e.g. `AreaCode+7` is a sibling's child in
// one region and a grandparent's grandchild in another).
//
// Audited 2026-08-08 against the full NavigationMenu.cs source (previously
// only spot-checked incrementally). Found and fixed four Codes that had
// been pointed at a route based on Description-guessing rather than the
// real backend data — each was silently gating (or failing to gate) the
// wrong page:
// - `20013` was pointed at Roles/PermissionTypes.jsx, but Code 20013 is
//   actually "Operations" (ControllerName: SystemTransactiontypes) under
//   Access Control List, not Permission Types — no real Code exists for
//   Permission Types anywhere in the source. Removed; that page has no
//   backend-modeled permission and is ungated (legacy), like every other
//   page absent from this map.
// - `22007` was pointed at HumanResource/Employees, but Code 22007 is the
//   "Employees" *area/folder* node (`IsArea: true`, no ControllerName) —
//   not a real page. The actual leaf ("Register", ControllerName:
//   Employee) is `22008`. Fixed.
// - `23051` was pointed at Accounts/CustomerAccountStatement, but Code
//   23051 is actually "E-Statements" (ControllerName: eStatements), a
//   different feature — confirmed unbuilt on the backend too (2026-08-12:
//   the only matching artifact, SwiftFinancials.eStatementInvoker, is an
//   empty stub project, no controller exists anywhere). There is no
//   "Customer Account Statement" Code of its own anywhere in
//   NavigationMenu.cs. Originally removed here (leaving the page ungated)
//   since the match was wrong — **re-pointed at CustomerAccountStatement.jsx
//   per explicit user decision (2026-08-12)**: reuse this Code as a
//   deliberate stopgap so the page has a real nav slot, same as the
//   "Charges" → Commissions repoint precedent below. Revisit if a real
//   E-Statements feature ever gets built server-side — this Code would
//   need to move back to that at that point, not stay dual-purposed.
// - `26012` was pointed at Accounts/GeneralLedgerStatement, but Code
//   26012 belongs to the *Command Hub* module, not Accounts — it's
//   "Financial Position" (ControllerName: FinancialPosition), an unbuilt
//   feature. Removed; GeneralLedgerStatement.jsx is ungated (legacy). The
//   real Command Hub Code for "Approval Requests" is `26015` (previously
//   `26010`, which is actually "Instant Messaging" — also fixed below).
export const moduleRouteMap = {
  // ── Administration (0x00004E20 = 20000) ──────────────────────────
  // Setup (20001)
  20003: "/Administration/Company",       // Companies (ControllerName: Company)
  20004: "/Administration/Branches",      // Branches (ControllerName: Branch)
  20005: "/Administration/Banks",         // Banks (ControllerName: Bank) — replaces the legacy combined BankLinkages.jsx that used to render here
  20006: "/Administration/Locations",     // Locations (ControllerName: Location)
  // Operations (20002) > Security (20007)
  20008: "/Administration/AuditLogs",     // Audit Logs (ControllerName: AuditLogs)
  20009: "/Administration/Roles/Create",  // Roles (ControllerName: Role) — no roles-list route exists yet, points at the create form
  20010: "/Administration/Users",         // Users (ControllerName: Membership)
  // Operations (20002) > Access Control List (20011)
  20012: "/Administration/Modules",       // Modules (ControllerName: Module)
  // Operations (20002), direct leaf
  20014: "/Administration/Workflow",      // Workflow (ControllerName: Workflow)

  // ── Human Resource (0x000055F0 = 22000) ──────────────────────────
  // Setup (22001)
  22003: "/HumanResource/Departments",    // Departments (ControllerName: Department)
  22004: "/HumanResource/Designations",   // Designations (ControllerName: Designation)
  22006: "/HumanResource/EmployeeTypes",  // Employee Types (ControllerName: EmployeeType)
  // Operations (22002) > Employees (22007, area) > Register (22008, leaf)
  22008: "/HumanResource/Employees",      // Register (ControllerName: Employee) — 22007 itself is just the "Employees" folder node

  // ── Registry (0x00005208 = 21000) ────────────────────────────────
  21003: "/Registry/Employer",            // Setup > Employers (ControllerName: Employer)
  21004: "/Registry/Zone",                // Setup > Zones (ControllerName: Zone)
  21007: "/Registry/Customers",           // Operations > Customers > Register (ControllerName: Customer) — replaces the old Members flow

  // ── Accounts (0x000059D8 = 23000) ────────────────────────────────
  // Setup (23001) > G/L Accounts (23003)
  23004: "/Accounts/CostCenters",              // Cost Centers (ControllerName: CostCenter)
  23005: "/Accounts/ChartOfAccounts",          // Chart Of Accounts (ControllerName: ChartOfAccount) — was pointed at the legacy Finance/COA screen (api/values/GetGeneralLedgers, no JWT), repointed
  23006: "/Accounts/ChartOfAccounts/Mappings", // G/L Account Determination (ControllerName: SystemGeneralLedgerAccountMapping) — was pointed at the legacy Finance/Setup/AccountConfiguration screen, repointed
  // Setup (23001) > Levies & Charges (23007)
  23008: "/Accounts/Levies",              // Levies (ControllerName: Levy) — real match for the new LevyController.
  // Setup (23001) > Charge Determination (23010)
  23014: "/Accounts/AlternateChannels/Fees", // Alternate Channels (ControllerName: AlternateChannels) — per-channel-type fee config, docs/api/alternate-channel-api-spec.md §4
  // 23009 "Charges" (ControllerName: Charges) pointed at the OLD reference
  // app's Charges controller, a mostly-duplicate reimplementation of
  // Commission CRUD that was deliberately NOT ported (see
  // docs/api/commission-api-spec.md's History note) — but "Charges" is the
  // business-facing nav slot for this function regardless of which
  // controller implements it, and CommissionController is what actually
  // does now. Pointed at Accounts/Commissions per user decision (2026-08-09).
  23009: "/Accounts/Commissions",         // Charges (ControllerName: Charges, legacy) — repointed to the real, working Commission screen.
  // Setup (23001) > Financial Products (23015)
  23016: "/Accounts/SavingsProducts",     // Savings (ControllerName: SavingsProduct)
  23017: "/Accounts/InvestmentProducts",  // Investments (ControllerName: InvestmentProduct)
  // Was mapped to the legacy /Loaning/LoanProducts.jsx screen — but this
  // code's NavigationMenu AreaName is "Accounts" (matching sibling codes
  // 23016/23017 above, both /Accounts/...), not "Loaning". The real
  // Accounts-module LoanProductController (docs/api/loan-product-api-spec.md)
  // is a different LoanProduct concept from the legacy screen's backend —
  // repointed 2026-08-12 to the new screen actually built against it.
  23018: "/Accounts/LoanProducts",        // Loans (ControllerName: LoanProduct)
  // Setup (23001), direct leaves
  23020: "/Accounts/Treasuries",          // Treasuries (ControllerName: Treasuries)
  23021: "/Accounts/Tellers",             // Tellers (ControllerName: Teller, AreaName: FrontOffice)
  23022: "/Accounts/BankLinkages",        // Bank Linkages (ControllerName: BankLinkage) — was dead-pointed at /Finance/BanksSetup (no matching route), repointed
  23023: "/Accounts/ChequeTypes",         // Cheque Types (ControllerName: ChequeType) — was unmapped entirely; list/create/edit all built
  23028: "/Accounts/UnpayReasons",        // Unpay Reasons (ControllerName: UnpayReason) — real, documented controller (docs/api/unpayreason-api-spec.md); was previously unmapped, with FOSA/TellerTransactions/UnpayReasons.jsx calling an undocumented /api/unpay endpoint instead of this one
  23029: "/Accounts/FixedDepositTypes",   // Fixed Deposit Types (ControllerName: FixedDepositType) — controller was built 2026-08-16 (previously didn't exist at all, zero rows in swiftFin_FixedDepositTypes); closes the FixedDepositTypeId picker gap noted in FOSA/TellerTransactions/TODO.md
  // Operations (23002) > Recurring Procedures (23035)
  23039: "/Accounts/StandingOrders/Execution", // Standing Order Execution (ControllerName: SatndingOrderExecution — real backend typo, admin/ops only)
  // Operations (23002) > Customer Accounts (23043)
  23044: "/Accounts/CustomerAccounts",    // Register (ControllerName: CustomerAccounts)
  23047: "/Accounts/ChequeBooks",         // Cheque Books (ControllerName: CoA_ChequeBooks) — new ChequeBookController, docs/api/chequebook-api-spec.md; was unmapped entirely (only reachable via the legacy ChequeBookService.svc.cs WCF passthrough before this pass)
  23048: "/Accounts/StandingOrders",      // Standing Orders (ControllerName: CustomerAccountStandingOrder)
  // 23051 real Description is "E-Statements" (ControllerName: eStatements,
  // confirmed unbuilt server-side) — deliberately reused for
  // CustomerAccountStatement.jsx as a stopgap nav slot instead, per
  // explicit user decision; see the top-of-file audit note for the
  // reasoning and the caveat about revisiting if E-Statements ever ships.
  23051: "/Accounts/CustomerAccountStatement", // Nominally "E-Statements" — stopgap-mapped to the real, working Customer Account Statement screen (mini/full statement + PDF)
  // Operations (23002) > Alternate Channels (23052 folder) — linking/
  // lifecycle, docs/api/alternate-channel-api-spec.md §1-3. Reconciliation
  // (23055-23059, ControllerName: AlternatePeriods) has no backing
  // controller anywhere in this backend yet — deliberately left unmapped,
  // not an oversight.
  23053: "/Accounts/AlternateChannels/Register",   // Register (ControllerName: Register)
  23054: "/Accounts/AlternateChannels/Management", // Management (ControllerName: AlternatechannelManagement)
  // Batch Procedures (23068) — stage-level gating only, the 27 per-type
  // child codes (70-78/80-88/90-98) are commented out in NavigationMenu.cs,
  // see Areas/Accounts/BATCH-PROCEDURES-CONCEPTS.md §1.1. One shared shell
  // (BatchStageScreen.jsx) renders all 9 type-tabs under each stage code.
  23069: "/batch/origination",   // Batch Origination
  23079: "/batch/verification",  // Batch Verification
  23089: "/batch/authorization", // Batch Authorization

  // ── Back Office / Loan Origination (0x00011170 = 70000) ───────────
  // Real api/backoffice/loancases pipeline (WebApplication1/Areas/BackOffice/
  // WORKFLOW.md §15) — each of the 4 stages below is its own NavigationMenu
  // leaf code, unlike Batch Procedures' stage-only gating. Coexists with the
  // legacy /Loaning/LoanApplication screen (different, older backend
  // surface, VITE_APP_LOANING_URL) — deliberately not touched/replaced, per
  // user decision 2026-08-13.
  70007: "/Loaning/LoanCases/registration", // Registration (ControllerName: LoanRegistration)
  70008: "/Loaning/LoanCases/appraisal",    // Appraisal (ControllerName: AppraiseLoan)
  70009: "/Loaning/LoanCases/approval",     // Approval (ControllerName: ApproveLoan)
  70010: "/Loaning/LoanCases/audit",        // Verification (ControllerName: LoanVerification) — "Audit" internally, "Verify" in the UI
  70011: "/Loaning/LoanCases/cancellation", // Cancellation (ControllerName: LoanCancellation) — api/backoffice/loancases/{id}/cancel, docs/api/loan-case-api-spec.md §13. Only cases already Audited (awaiting disbursement) — a different queue from Verification's own.

  // ── Front-Office (0x000061A8 = 25000) ────────────────────────────
  // Operations (25001) > Treasury (25002)
  25003: "/FrontOffice/CashManagement",   // Cash Management (ControllerName: CashManagement)
  // 25004 "Authorizations" (ControllerName: CashWithdrawalRequest) has no screen of its own yet — not mapped
  25015: "/FrontOffice/FiscalCounts",     // Fiscal Counts (ControllerName: FiscalCount) — read-only catalogue, docs/api/frontoffice-api-spec.md §16; lives in FOSA/TreasuryTransactions/
  // Operations (25001) > Teller (25005)
  25006: "/FrontOffice/SavingsReceiptsPayments", // Savings Receipts/Payments (ControllerName: CashDeposit) — the ONLY real nav entry for the whole teller transaction cycle (deposit/withdrawal/cheque deposit/payment voucher are one screen server-side)
  25007: "/FrontOffice/SundryPayments",   // Sundry Receipts/Payments (ControllerName: SundryPayments) — Phase 2, receipt-only form (no list endpoint exists)
  25008: "/FrontOffice/CustomerReceipts", // Customer Receipts (ControllerName: CustomerReceipts) — Phase 2, receipt-only form (no list endpoint exists)
  25009: "/FrontOffice/Transfers",        // Cheques/Cash Transfer (ControllerName: Transfers) — one real nav Code covering two genuinely different request shapes (POST /cash vs POST /cheques); unified into one screen with Cash/Cheque tabs 2026-08-11, replacing the earlier CashTransfer.jsx/ChequeTransfer.jsx split where the cheque half wasn't reachable from this nav Code at all
  25010: "/FrontOffice/EndOfDay",         // End-Of-Day (ControllerName: EndOfDay)
  // Operations (25001), direct leaves
  25011: "/FrontOffice/Cheques",          // Cheques (ControllerName: Cheques) — one real nav Code covering Catalogue/Bank/Clear (GET /, POST /bank, POST /clear all on the same controller); unified into one screen with tabs 2026-08-11, replacing the earlier Catalogue.jsx/BankCheques.jsx/ClearCheques.jsx split where Bank/Clear weren't reachable from this nav Code at all
  25012: "/FrontOffice/FixedDeposits",   // Fixed Deposits (ControllerName: FixedDeposit) — Phase 2
  25013: "/FrontOffice/ExpensePayables", // Expense Payables (ControllerName: ExpensePayable) — Phase 2
  25014: "/FrontOffice/AccountClosure",  // Account Closure (ControllerName: AccountClosure) — Phase 2
  25016: "/FrontOffice/InHouseCheques",  // In-House Cheques (ControllerName: InHouse) — Phase 2
  25017: "/FrontOffice/AutomatedClearing", // Automated Clearing (ControllerName: AutomatedClearing) — Phase 2, last of the 7 areas

  // ── Command Hub (0x00006590 = 26000) ─────────────────────────────
  // Operations (26002) > Messaging (26007)
  26008: "/Messaging/TextAlerts",         // Text Alerts (ControllerName: TextAlerts) — textalert-api-spec.md §5: this is a different, read-only reference controller than the create-capable Areas/Messaging one this route actually serves; no seeded nav entry exists for the latter yet
  // Operations (26002) > Utilities (26011), direct leaves
  26015: "/CommandHub/ApprovalRequests",  // Approval Requests (ControllerName: Workflow, AreaName: Workflows)
};
