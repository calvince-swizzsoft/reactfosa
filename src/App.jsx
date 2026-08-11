import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import PlaceholderModule from "./pages/PlaceholderModule";
import { AuthProvider } from "./context/AuthContext";
import { ModuleTreeProvider } from "./context/ModuleTreeContext";


import Invcategory from "./pages/Inventory/Category/Invcategory";
import InvUom from "./pages/Inventory/UnitOfMeasure/InvUom";
import Invitem from "./pages/Inventory/Items/Invitem";
import InvJournal from "./pages/Inventory/Journals/InvJournal";
import InvTransactions from "./pages/Inventory/Transcations/InvTransactions";
import ChartOfAccounts from "./pages/Finance/COA/ChartsOfAccount";


import Home from "./pages/Home";
//import Channel from "./pages/Channel";


import Settings from "./pages/Settings";
import Leaves from "./pages/Payroll/Leave";
import Login from "./pages/Auth/Login";
import Procureone from "./pages/Procurement/procureone";
import Procuretwo from "./pages/Procurement/procuretwo";
import Payroll from "./pages/Payroll/Payroll.jsx";
//import Employees from "./pages/Payroll/Employees";
import Departments from "./pages/Payroll/Departments";
import Procument from "./pages/Procurement/Procument";
import Finance from "./pages/Finance/Finance";
//import GeneralLedger from "./pages/Finance/GeneralLedger";

// Account setup page
import AccountsSetup from "./pages/Payroll/Accounts/AccountsSetup.jsx";

import FixedAssetsSetup from "./pages/FixedAssets/FixedAssetsSetup.jsx";
import FixCategory from "./pages/FixedAssets/Category/fixCategory.jsx";
import Location from "./pages/FixedAssets/Location/Location.jsx";
import FixUnitOfMeasure from "./pages/FixedAssets/UnitOfMeasure/fixUnitOfMeasure.jsx";

import InvLocation from "./pages/Inventory/locations/InvLocation";
import InventoryDashboard from "./pages/Inventory/InventoryDashboard.jsx";
import ProVendors from "./pages/Procurement/Vendors/ProVendors.jsx";
import ProRequisitions from "./pages/Procurement/Requisitions/ProRequisitions.jsx";
import PurchaseOrder from "./pages/Procurement/PurchaseOrder/PurchaseOrder.jsx";
//import BankLinkages from "./pages/Finance/Setup/Bank/BankLinkages.jsx";
import AccountConfiguration from "./pages/Finance/Setup/AccountConfiguration/AccountConfiguration.jsx";

//import PurchaseInvoices from "./pages/Finance/PurchaseInvoice/PurchaseInvoices.jsx";
//import PurchaseCreditMemo from "./pages/Finance/PurchaseCreditMemo/PurchaseCreditMemo.jsx";
import PayrollSetup from "./pages/Payroll/PayrollSetup/PayrollSetup.jsx";
import StatutorySetup from "./pages/Payroll/Statutory setup/StatutorySetup.jsx";
import EmployeeSetup from "./pages/Payroll/EmployeeSetup/EmployeeSetup.jsx";



import StoreRequisitions from "./pages/Procurement/StoreRequisitions/StoreRequisitions.jsx";
import SalesCreditMemo from "./pages/Finance/AccountsReceivable/SalesCreditMemo/SalesCreditMemo.jsx";
import Setup from "./pages/Finance/Setup/Setup.jsx";
import AccountPayable from "./pages/Finance/AccountPayable/AccountPayable.jsx";
import AccountsReceivable from "./pages/Finance/AccountsReceivable/AccountsReceivable.jsx";
import PaymentVoucher from "./pages/Finance/PaymentVoucher/PaymentVoucher.jsx";
import RequestForQuotation from "./pages/Procurement/RFQ/RequestForQuotation.jsx";
import ProjectsWithBudgets from "./pages/Procurement/ProjectsWithBudgets/ProjectsWithBudgets.jsx";
import QuotationSubmission from "./pages/Procurement/Quotation/QuotationSubmission.jsx";
import Quotations from "./pages/Procurement/Quotation/Quotations.jsx";
import BidAnalysis from "./pages/Procurement/Biding/BidAnalysis.jsx";

import PostingJournal from "./pages/Finance/postjournal/PostingJournal.jsx";
import SalesInvoice from "./pages/Finance/AccountsReceivable/Salesinvoice/salesInvoice.jsx";
import DocumentAttach from "./pages/Procurement/Document/index.jsx";
import VendorComparison from "./pages/Procurement/VendorComparison/index.jsx";
import Membership from "./pages/Membership/index.jsx";
import Customers from "./pages/Registry/Customers/index.jsx";
import RegistryZones from "./pages/Registry/Zone/index.jsx";
import RegistryDivisions from "./pages/Registry/Division/index.jsx";
import RegistryEmployers from "./pages/Registry/Employer/index.jsx";
import CustomerAccounts from "./pages/Accounts/CustomerAccounts/index.jsx";
import StandingOrders from "./pages/Accounts/StandingOrders/index.jsx";
import StandingOrderExecution from "./pages/Accounts/StandingOrders/Execution.jsx";
import CustomerAccountStatement from "./pages/Accounts/CustomerAccountStatement/index.jsx";
import GeneralLedgerStatement from "./pages/Accounts/GeneralLedgerStatement/index.jsx";
import Members from "./pages/Membership/Members/index.jsx";
import CustomersAccount from "./pages/Membership/CustomerAccounts/index.jsx";
import Employers from "./pages/Membership/Employers/index.jsx";
import CustomersAccounts from "./pages/Membership/CustomerAccounts/index.jsx";
import Companies from "./pages/Administration/Company/index.jsx";
import Branches from "./pages/Administration/Branches/index.jsx";
import TextAlerts from "./pages/Messaging/TextAlerts/index.jsx";
import Division from "./pages/Membership/Division/index.jsx";
import Zones from "./pages/Membership/Zones/index.jsx";
import Stations from "./pages/Membership/Stations/index.jsx";
import Administrative from "./pages/Membership/Administrative/index.jsx";
import Products from "./pages/Membership/Products/index.jsx";
import Loaning from "./pages/Loaning/index.jsx";
import LoanProducts from "./pages/Loaning/LoanProducts/index.jsx";
import LoanApplication from "./pages/Loaning/LoanApplication/index.jsx";
import MemberReceipting from "./pages/Finance/MemberReceipting/index.jsx";
import LoanSector from "./pages/Loaning/LoanSector/index.jsx";
import LoanSubSector from "./pages/Loaning/LoanSubSector/index.jsx";
import LoanCalculator from "./pages/Loaning/LoanCalculator/index.jsx";
import LoanReports from "./pages/Reports/LoanReports/index.jsx";
import Creditbatches from "./pages/Finance/Creditbatches/index.jsx";
import InterAccountTransfer from "./pages/Finance/InterAccountTransfer/index.jsx";

import FinanceReports from "./pages/Reports/FinanceReports/index.jsx";
import Insurance from "./pages/Membership/Insurance/index.jsx";
import MemberExit from "./pages/Membership/MemberExit/index.jsx";
//import InterTransfer from "./pages/Finance/InterTransfer/index.jsx";
import GenerateSasraForm from "./pages/Reports/GenerateSasraForm/index.jsx";
import MemberStatement from "./pages/Reports/MemberStatement/index.jsx";
import Reports from "./pages/Reports/index.jsx";
import LoanRegister from "./pages/Loaning/LoanRegister/index.jsx";
import Roles from "./pages/UserManagement/Roles/Roles.jsx";
import Users from "./pages/UserManagement/Users/index.jsx";
import AdministrationCreateRole from "./pages/Administration/Roles/create.jsx";
import AdministrationPermissionTypes from "./pages/Administration/Roles/PermissionTypes.jsx";
import AdministrationWorkflows from "./pages/Administration/Workflow/index.jsx";
import ApprovalRequests from "./pages/CommandHub/ApprovalRequests/index.jsx";
import AdministrationUsers from "./pages/Administration/Users/index.jsx";
import CreateUser from "./pages/Administration/Users/create.jsx";
import AdministrationModules from "./pages/Administration/Modules/index.jsx";
import AdministrationBanks from "./pages/Administration/Banks/index.jsx";
import CreateBank from "./pages/Administration/Banks/create.jsx";
import AccountsBankLinkages from "./pages/Accounts/BankLinkages/index.jsx";
import CreateBankLinkage from "./pages/Accounts/BankLinkages/create.jsx";
import AdministrationLocations from "./pages/Administration/Locations/index.jsx";
import AuditLogs from "./pages/Administration/Audit Logs/index.jsx";

import Tellers from "./pages/Accounts/Tellers/Teller.jsx";
//import Treasuries from './pages/FOSA/'

import Employees from "./pages/HumanResource/Employees/Employees.jsx"
import FOSASetup from "./pages/FOSA/Setup/index.jsx"
import FOSATransactions from "./pages/FOSA/TellerTransactions/index.jsx"

import HRDepartments from "./pages/HumanResource/Departments/index.jsx";
import CreateDepartment from "./pages/HumanResource/Departments/create.jsx";
import Designations from "./pages/HumanResource/Designations/index.jsx";
import CreateDesignation from "./pages/HumanResource/Designations/create.jsx";
import EmployeeTypes from "./pages/HumanResource/EmployeeTypes/index.jsx";
import CreateEmployeeType from "./pages/HumanResource/EmployeeTypes/create.jsx";

import InvestmentProducts from "./pages/Accounts/InvestmentProducts/index.jsx";
import CreateInvestmentProduct from "./pages/Accounts/InvestmentProducts/create.jsx";
import SavingsProducts from "./pages/Accounts/SavingsProducts/index.jsx";
import CreateSavingsProduct from "./pages/Accounts/SavingsProducts/create.jsx";
import Treasuries from "./pages/Accounts/Treasuries/index.jsx";
import CreateTreasury from "./pages/Accounts/Treasuries/create.jsx";
import CostCenters from "./pages/Accounts/CostCenters/index.jsx";
import ChequeTypes from "./pages/Accounts/ChequeTypes/index.jsx";
import CreateChequeType from "./pages/Accounts/ChequeTypes/create.jsx";
import Commissions from "./pages/Accounts/Commissions/index.jsx";
import CreateCommission from "./pages/Accounts/Commissions/create.jsx";
import Levies from "./pages/Accounts/Levies/index.jsx";
import CreateLevy from "./pages/Accounts/Levies/create.jsx";
import ChequeBooks from "./pages/Accounts/ChequeBooks/index.jsx";
import CreateChequeBook from "./pages/Accounts/ChequeBooks/create.jsx";
import ChequeBookVouchers from "./pages/Accounts/ChequeBooks/Vouchers.jsx";
import CreateCostCenter from "./pages/Accounts/CostCenters/create.jsx";
import AccountsChartOfAccounts from "./pages/Accounts/ChartOfAccounts/index.jsx";
import CreateChartOfAccount from "./pages/Accounts/ChartOfAccounts/create.jsx";
import ChartOfAccountMappings from "./pages/Accounts/ChartOfAccounts/Mappings.jsx";
import CashManagement from "./pages/FOSA/TreasuryTransactions/CashManagement.jsx";
import FiscalCounts from "./pages/FOSA/TreasuryTransactions/FiscalCounts.jsx";
import SavingsReceiptsPayments from "./pages/FOSA/TellerTransactions/SavingsReceiptsPayments.jsx";
import EndOfDay from "./pages/FOSA/TellerTransactions/EndOfDay.jsx";
import Catalogue from "./pages/FOSA/TellerTransactions/Catalogue.jsx";
import BankCheques from "./pages/FOSA/TellerTransactions/BankCheques.jsx";
import ClearCheques from "./pages/FOSA/TellerTransactions/ClearCheques.jsx";
import UnpayReasons from "./pages/FOSA/TellerTransactions/UnpayReasons.jsx";
import ChequeTransfer from "./pages/FOSA/TellerTransactions/ChequeTransfer.jsx";
import CashTransfer from "./pages/FOSA/TellerTransactions/CashTransfer.jsx";
import SundryPayments from "./pages/FOSA/TellerTransactions/SundryPayments.jsx";
import CustomerReceipts from "./pages/FOSA/TellerTransactions/CustomerReceipts.jsx";
import ExpensePayables from "./pages/FOSA/TellerTransactions/ExpensePayables.jsx";
import CreateExpensePayable from "./pages/FOSA/TellerTransactions/ExpensePayables/create.jsx";




export default function App() {
  return (
    <AuthProvider>
      <ModuleTreeProvider>
      <Router>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login route WITHOUT Layout */}
          <Route path="/login" element={<Login />} />

          {/* All other routes require authentication and get the Layout */}
          <Route element={<RequireAuth />}>
          <Route path="/*" element={<Layout />}>

          {/* Generic landing page for any backend module without a dedicated page yet */}
          <Route path="modules/:code" element={<PlaceholderModule />} />

          {/* Post-login landing page: redirects to the user's first granted module */}
          <Route path="home" element={<Home />} />

          <Route path="department" element={<Departments />} />
          <Route path="leave" element={<Leaves />} />

          {/* FixedAssets */}
          <Route path="FixedAssets" element={<FixedAssetsSetup />} />
          <Route path="FixedAssets/Category" element={<FixCategory />} />
          <Route path="FixedAssets/Location" element={<Location />} />
          <Route path="FixedAssets/FixedAssetCard" element={<FixedAssetsSetup />} />

          {/* Procurement */}
          <Route path="Procurement" element={<Procument />} />
          <Route path="Procurement/Vendors" element={<ProVendors />} />
          <Route path="Procurement/requisitions" element={<ProRequisitions />} />
          <Route path="Procurement/StoreRequisitions" element={<StoreRequisitions />} />
          <Route path="Procurement/PurchaseOrder" element={<PurchaseOrder />} />
          <Route path="Procurement/SubmitQuotation" element={<QuotationSubmission />} />
          <Route path="Procurement/Quotation" element={<Quotations />} />
          <Route path="Procurement/RFQ" element={<RequestForQuotation />} />
          <Route path="Procurement/ProjectsWithBudgets" element={<ProjectsWithBudgets />} />
          <Route path="Procurement/Biding" element={<BidAnalysis />} />
          <Route path="Procurement/Document" element={<DocumentAttach />} />
          <Route path="Procurement/comparison" element={<VendorComparison />} />


          {/* Finance */}
          <Route path="Finance" element={<Finance />} />
          <Route path="Finance/ChartsOfAccount" element={<ChartOfAccounts />} />
          <Route path="Finance/PostingJournal" element={<PostingJournal />} />
          <Route path="Finance/AccountConfiguration" element={<AccountConfiguration />} />
          <Route path="Finance/salesInvoice" element={<SalesInvoice />} />
          <Route path="Finance/salesCreditMemo" element={<SalesCreditMemo />} />
          <Route path="Finance/Setup" element={<Setup />} />
          <Route path="Finance/PaymentVoucher" element={<PaymentVoucher />} />
          {/* <Route path="Finance/GeneralLedger" element={<GeneralLedger />} /> */}
          <Route path="GeneralLedger/reports" element={<h1>GL Reports</h1>} />
          {/* <Route path="GeneralLedger/settings" element={<h1>GL Settings</h1>} /> */}
          <Route path="Finance/MemberReceipting" element={<MemberReceipting />} />

          <Route path="Finance/AccountsPayable" element={<AccountPayable />} />
          <Route path="Finance/AccountsReceivable" element={<AccountsReceivable />} />
          <Route path="Finance/Creditbatches" element={<Creditbatches />} />
          <Route path="Finance/InterAccountTransfer" element={<InterAccountTransfer />} />
          <Route path="AccountsPayable/reports" element={<h1>AP Reports</h1>} />

          <Route path="AccountsPayable/settings" element={<h1>AP Settings</h1>} />
          <Route path="AccountsReceivable" element={<h1>Accounts Receivable</h1>} />
          <Route path="BudgetingForecasting" element={<h1>Budgeting & Forecasting</h1>} />
          <Route path="BankReconciliation" element={<h1>Bank Reconciliation</h1>} />
          <Route path="FinancialReporting" element={<h1>Financial Reporting</h1>} />

          {/* Payroll Account Setup */}
          <Route path="Payroll/Accounts" element={<AccountsSetup />} />
          {/* Payroll */}
          <Route path="Payroll" element={<Payroll />} />
          <Route path="Payroll/payrollsetup" element={<PayrollSetup />} />
          <Route path="Payroll/statutorysetup" element={<StatutorySetup />} />
          <Route path="Payroll/Employees" element={<EmployeeSetup />} />

          {/* Administration */}
          <Route path="Administration/Roles/create" element={<AdministrationCreateRole />} />
          <Route path="Administration/Roles/PermissionTypes" element={<AdministrationPermissionTypes />} />
          <Route path="Administration/Users" element={<AdministrationUsers />} />
          <Route path="Administration/Users/create" element={<CreateUser />} />
          <Route path="Administration/Modules" element={<AdministrationModules />} />
          <Route path="Administration/Banks" element={<AdministrationBanks />} />
          <Route path="Administration/Banks/create" element={<CreateBank />} />
          <Route path="Administration/Locations" element={<AdministrationLocations />} />
          <Route path="Administration/AuditLogs" element={<AuditLogs />} />
          <Route path="Administration/Workflow" element={<AdministrationWorkflows />} />

          {/* Inventory */}
          <Route path="Inventory" element={<InventoryDashboard />} />
          <Route path="Inventory/Inventory" element={<InventoryDashboard />} />
          <Route path="Inventory/invcategories" element={<Invcategory />} />
          <Route path="Inventory/Invlocations" element={<InvLocation />} />
          <Route path="Inventory/invUnitOfMeasure" element={<InvUom />} />
          <Route path="Inventory/InvItems" element={<Invitem />} />
          <Route path="Inventory/InvJournals" element={<InvJournal />} />
          <Route path="Inventory/InvTransactions" element={<InvTransactions />} />
          <Route path="Inventory/StockReceipts" element={<h1>Stock Receipts</h1>} />
          <Route path="Inventory/StockIssues" element={<h1>Stock Issues</h1>} />
          <Route path="Inventory/TransfersbetweenWarehouses" element={<h1>Transfers between Warehouses</h1>} />
          <Route path="Inventory/StockAdjustments" element={<h1>Stock Adjustments</h1>} />
          <Route path="Inventory/StockReportingAndAlerts" element={<h1>Stock Reporting & Alerts</h1>} />

          {/**Membership */}
          <Route path="Membership" element={<Membership />} />
          <Route path="Registry/Customers" element={<Customers />} />
          <Route path="Registry/Zone" element={<RegistryZones />} />
          <Route path="Registry/Division" element={<RegistryDivisions />} />
          <Route path="Registry/Employer" element={<RegistryEmployers />} />
          <Route path="Accounts/CustomerAccounts" element={<CustomerAccounts />} />
          <Route path="Accounts/StandingOrders" element={<StandingOrders />} />
          <Route path="Accounts/StandingOrders/Execution" element={<StandingOrderExecution />} />
          <Route path="Accounts/CustomerAccountStatement" element={<CustomerAccountStatement />} />
          <Route path="Accounts/GeneralLedgerStatement" element={<GeneralLedgerStatement />} />
          <Route path="Administration/Company" element={<Companies />} />
          <Route path="Administration/Branches" element={<Branches />} />
          <Route path="Messaging/TextAlerts" element={<TextAlerts />} />
          <Route path="Membership/Division" element={<Division />} />
          <Route path="Membership/Zones" element={<Zones />} />
          <Route path="Membership/Stations" element={<Stations />} />
          <Route path="Membership/Employers" element={<Employers />} />
          <Route path="Membership/Administrative" element={<Administrative />} />
          <Route path="Membership/Products" element={<Products />} />
          <Route path="Membership/Members" element={<Members />} />
          <Route path="Membership/customersAccount" element={<CustomersAccounts />} />
          <Route path="Membership/Insurance" element={<Insurance />} />
          <Route path="Membership/MemberExit" element={<MemberExit />} />

          {/**Loaning */}
          <Route path="Loaning" element={<Loaning />} />
          <Route path="Loaning/LoanProducts" element={<LoanProducts />} />
          <Route path="Loaning/LoanApplication" element={<LoanApplication />} />
          <Route path="Loaning/LoanSector" element={<LoanSector />} />
          <Route path="Loaning/LoanSubSector" element={<LoanSubSector />} />
          <Route path="Loaning/LoanCalculator" element={<LoanCalculator />} />
          <Route path="Loaning/LoanRegister" element={<LoanRegister />} />


          {/**Reports */}
          <Route path="Reports" element={<Reports />} />
          <Route path="Reports/LoanReports" element={<LoanReports />} />
          <Route path="Reports/FinancialReports" element={<FinanceReports />} />
          <Route path="Reports/GenerateSasraForm" element={<GenerateSasraForm />} />
          <Route path="Reports/MemberStatement" element={<MemberStatement />} />


          {/**User Management */}
          {/* <Route path="UserManagement" element={<UserManagement />} /> */}
          <Route path="UserManagement/Users" element={<Users />} />
          <Route path="UserManagement/Roles" element={<Roles />} />
          {/* <Route path="UserManagement/Permissions" element={<Permissions />} /> */}

             {/**FOSA Management */}
          <Route path="FosaManagement/Setup" element={<FOSASetup />} />

          {/**Human Resource */}
          <Route path="HumanResource/Employees" element={<Employees />} />
          <Route path="HumanResource/Departments" element={<HRDepartments />} />
          <Route path="HumanResource/Departments/create" element={<CreateDepartment />} />
          <Route path="HumanResource/Designations" element={<Designations />} />
          <Route path="HumanResource/Designations/create" element={<CreateDesignation />} />
          <Route path="HumanResource/EmployeeTypes" element={<EmployeeTypes />} />
          <Route path="HumanResource/EmployeeTypes/create" element={<CreateEmployeeType />} />

          {/**Accounts */}
          <Route path="Accounts/InvestmentProducts" element={<InvestmentProducts />} />
          <Route path="Accounts/InvestmentProducts/create" element={<CreateInvestmentProduct />} />
          <Route path="Accounts/SavingsProducts" element={<SavingsProducts />} />
          <Route path="Accounts/SavingsProducts/create" element={<CreateSavingsProduct />} />
          <Route path="Accounts/Treasuries" element={<Treasuries />} />
          <Route path="Accounts/Treasuries/create" element={<CreateTreasury />} />
          <Route path="Accounts/BankLinkages" element={<AccountsBankLinkages />} />
          <Route path="Accounts/BankLinkages/create" element={<CreateBankLinkage />} />
          <Route path="Accounts/CostCenters" element={<CostCenters />} />
          <Route path="Accounts/ChequeTypes" element={<ChequeTypes />} />
          <Route path="Accounts/ChequeTypes/create" element={<CreateChequeType />} />
          <Route path="Accounts/Commissions" element={<Commissions />} />
          <Route path="Accounts/Commissions/create" element={<CreateCommission />} />
          <Route path="Accounts/Levies" element={<Levies />} />
          <Route path="Accounts/Levies/create" element={<CreateLevy />} />
          <Route path="Accounts/ChequeBooks" element={<ChequeBooks />} />
          <Route path="Accounts/ChequeBooks/create" element={<CreateChequeBook />} />
          <Route path="Accounts/ChequeBooks/:id/vouchers" element={<ChequeBookVouchers />} />
          <Route path="Accounts/CostCenters/create" element={<CreateCostCenter />} />
          <Route path="Accounts/ChartOfAccounts" element={<AccountsChartOfAccounts />} />
          <Route path="Accounts/ChartOfAccounts/create" element={<CreateChartOfAccount />} />
          <Route path="Accounts/ChartOfAccounts/Mappings" element={<ChartOfAccountMappings />} />
          <Route path="Accounts/Tellers" element={<Tellers />} />

          {/**Front Office */}
          {/* No moduleRouteMap.js codes exist for any of these yet — routes
              only, add codes once they're assigned (same pattern as every
              other module this session before its code arrived). */}
          <Route path="FrontOffice/CashManagement" element={<CashManagement />} />
          <Route path="FrontOffice/FiscalCounts" element={<FiscalCounts />} />
          <Route path="FrontOffice/SavingsReceiptsPayments" element={<SavingsReceiptsPayments />} />
          <Route path="FrontOffice/EndOfDay" element={<EndOfDay />} />
          <Route path="FrontOffice/Catalogue" element={<Catalogue />} />
          <Route path="FrontOffice/BankCheques" element={<BankCheques />} />
          <Route path="FrontOffice/ClearCheques" element={<ClearCheques />} />
          <Route path="FrontOffice/SundryPayments" element={<SundryPayments />} />
          <Route path="FrontOffice/CustomerReceipts" element={<CustomerReceipts />} />
          <Route path="FrontOffice/ExpensePayables" element={<ExpensePayables />} />
          <Route path="FrontOffice/ExpensePayables/create" element={<CreateExpensePayable />} />
          <Route path="FrontOffice/UnpayReasons" element={<UnpayReasons />} />
          <Route path="FrontOffice/ChequeTransfer" element={<ChequeTransfer />} />
          <Route path="FrontOffice/CashTransfer" element={<CashTransfer />} />

          <Route path="FrontOffice/Transactions" element={<FOSATransactions />} />

          {/**Approval Requests */}
          <Route path="CommandHub/ApprovalRequests" element={<ApprovalRequests />} />

          </Route>
          </Route>
        </Routes>
      </Router>
      </ModuleTreeProvider>
    </AuthProvider>
  );
}
