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
  20003: "/Membership/companies",
  // Administration > Setup > Branches (ControllerName: Branch)
  20004: "/Membership/branches",

  // Administration > Operations > Security > Roles (ControllerName: Role)
  20009: "/UserManagement/Roles",
  // Administration > Operations > Security > Users
  20010: "/UserManagement/Users",

  // Administration > Operations > Access Control List > Modules (ControllerName: Module)
  20012: "/Administration/Modules",

  // Accounts > Setup > Tellers (ControllerName: Teller, AreaName: FrontOffice)
  23021: "/FosaManagement/Tellers",
  // Accounts > Setup > Bank Linkages (ControllerName: BankLinkage, matches BankLinkages.jsx)
  23022: "/Finance/BanksSetup",

  // Accounts > Setup > G/L Accounts > Chart Of Accounts (ControllerName: ChartOfAccount)
  23005: "/Finance/ChartsOfAccount",
  // Accounts > Setup > G/L Accounts > G/L Account Determination
  // (SystemGeneralLedgerAccountMapping controller — matches the
  // SystemGeneralLedgerAccountCode fields used in AccountConfiguration.jsx)
  23006: "/Finance/AccountConfiguration",

  // Accounts > Setup > Financial Products > Loans (ControllerName: LoanProduct)
  23018: "/Loaning/LoanProducts",

  // Accounts > Operations > Customer Accounts > Register (ControllerName: CustomerAccounts)
  23044: "/Membership/customersAccount",
};
