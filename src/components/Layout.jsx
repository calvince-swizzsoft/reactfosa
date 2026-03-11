
import { useLocation } from "react-router-dom";
import MiniSidebar from "./MiniSidebar";
import MainSidebar from "./MainSidebar";
import Navbar from "./Navbar";
import { IoIosAlbums } from "react-icons/io";
import { GrResources } from "react-icons/gr";
import { SiFsecure } from "react-icons/si";
import { RiBankFill } from "react-icons/ri";
import { MdInventory2 } from "react-icons/md";
import { MdBusinessCenter } from "react-icons/md";
import bgcircle from "../assets/circle.jpg";
import { Outlet } from "react-router-dom";
import { FaRegFileAlt, FaRegUser, FaWallet } from "react-icons/fa";



const mockWorkspaces = [
  {
    id: "ws1",
    name: "Payroll",
    title: "Payroll",
    icon: <GrResources className="text-2xl" />,
    dms: [
      {
        id: "Payroll/payrollsetup",
        name: "Payroll Setup",
        sublinks: [],
      },
      {
        id: "Payroll/statutorysetup",
        name: "Statutory Setup",
        sublinks: [],
      },
      {
        id: "Payroll/Accounts",
        name: "Accounts",
        sublinks: [],
      },
      {
        id: "Payroll/Employees",
        name: "Employees Setup",
        sublinks: [],
      },
    ],
  },
  {
    id: "ws2",
    name: "Procurement",
    title: "Procu..",
    icon: <SiFsecure className="text-2xl" />,
    dms: [
      {
        id: "Procurement/Vendors",
        name: "Vendors",
        sublinks: []
      },
      {
        id: "Procurement/ProjectsWithBudgets",
        name: "Projects Budgets",
        sublinks: []
      },
      {
        id: "Procurement/requisitions",
        name: "Requisitions",
        sublinks: []
      },

      {
        id: "Procurement/RFQ",
        name: "Request For Quotation",
        sublinks: []
      },


      {
        id: "Procurement/SubmitQuotation",
        name: "Submit Quotation",
        sublinks: []
      },
      {
        id: "Procurement/Quotation",
        name: "Bid Analysis",
        sublinks: []
      },



      // {
      //   id: "Procurement/Biding",
      //   name: "Bidding",
      //   sublinks: []
      // },
      {
        id: "Procurement/StoreRequisitions",
        name: "Store Requisitions",
        sublinks: []
      },
      {
        id: "Procurement/PurchaseOrder",
        name: "Purchase Order",
        sublinks: []
      },

      {
        id: "Procurement/Document",
        name: "Document",
        sublinks: []
      },
      // {
      //   id: "Procurement/comparison",
      //   name: "Vendor Comparison",
      //   sublinks: []
      // },


      /*{
        id: "maria",
        name: "Procure Two",
        sublinks: [
          { id: "overview", name: "Overview" },
          { id: "settings", name: "Settings" },
        ],
      },*/
    ],
  },
  {
    id: "ws3",
    name: "Finance",
    title: "Finance",
    icon: <RiBankFill className="text-2xl" />,
    dms: [
      { id: "Finance/Setup", name: "Setup", sublinks: [], },
      { id: "Finance/ChartsOfAccount", name: "Charts Of Account", sublinks: [] },
      { id: "Finance/PostingJournal", name: "Posting Journal", sublinks: [] },
      { id: "Finance/AccountsPayable", name: "Accounts Payable", sublinks: [] },
      { id: "Finance/AccountsReceivable", name: "Accounts Receivable", sublinks: [] },
      { id: "Finance/PaymentVoucher", name: "Payment voucher", sublinks: [] },
      { id: "Finance/MemberReceipting", name: "Receipt", sublinks: [] },
      { id: "Finance/Creditbatches", name: "Creditbatches", sublinks: [] },
      { id: "Finance/InterAccountTransfer", name: "InterAccountTransfer", sublinks: [] },

      //{ id: "Finance/InterTransfer", name: "Inter Transfer", sublinks: [] },




      //{ id: "Finance/PurchaseInvoices", name: "Purchase Invoices", sublinks: [] },
      //{ id: "Finance/PurchaseCreditMemo", name: "Purchase Credit Memo", sublinks: [] },
      //{ id: "Finance/salesInvoice", name: "Sales Invoice", sublinks: [] },
      //{ id: "Finance/salesCreditMemo", name: "Sales Credit Memo", sublinks: [] },
      //{ id: "Finance/BankLinkages", name: "Bank Linkages", sublinks: [] },
      /*{
        id: "GeneralLedger",
        name: "General Ledger",
        sublinks: [
          { id: "reports", name: "Reports" },
          { id: "settings", name: "Settings" },
        ],
      },
      */
    ],
  },
  {
    id: "ws4",
    name: "Inventory",
    title: "Invent..",
    icon: <MdInventory2 className="text-2xl" />,
    dms: [
      /* {
         id: "StockReceipts",
         name: "Stock Receipts",
         sublinks: [
           { id: "report", name: "Receipt Reports" },
           { id: "history", name: "History" },
         ],
       },*/

      { id: "Inventory/invCategories", name: "Categories", sublinks: [] },
      { id: "Inventory/invUnitOfMeasure", name: "Unit Of Measure", sublinks: [] },
      { id: "Inventory/Invlocations", name: "Locations", sublinks: [] },
      { id: "Inventory/InvItems", name: "Items", sublinks: [] },
      { id: "Inventory/InvJournals", name: "Journals", sublinks: [] },
      { id: "Inventory/InvTransactions", name: "Transactions", sublinks: [] },
    ],
  },
  {
    id: "ws5",
    name: "FixedAssets",
    title: "Fixed Assets",
    icon: <MdBusinessCenter className="text-2xl" />,
    dms: [
      { id: "FixedAssets/Category", name: "Fixed Asset Class", sublinks: [] },
      { id: "FixedAssets/Location", name: "Location", sublinks: [] },
      { id: "FixedAssets/FixedAssetCard", name: "Fixed Asset Card", sublinks: [] },
    ],
  },
  {
    id: "ws6",
    name: "Membership",
    title: "Member..",
    icon: <MdBusinessCenter className="text-2xl" />,
    dms: [
      { id: "Membership/companies", name: "Companies", sublinks: [] },
      { id: "Membership/branches", name: "Branches", sublinks: [] },
      { id: "Membership/Employers", name: "Employers", sublinks: [] },
      //{ id: "Membership/Division", name: "Division", sublinks: [] },
      //{ id: "Membership/Zones", name: "Zones", sublinks: [] },
      { id: "Membership/Stations", name: "Stations", sublinks: [] },
      //{ id: "Membership/Administrative", name: "Administrative", sublinks: [] },
      { id: "Membership/Products", name: "Savings Products", sublinks: [] },
      { id: "Membership/Insurance", name: "Insurance", sublinks: [] },
      { id: "Membership/Members", name: "Members", sublinks: [] },
      { id: "Membership/MemberExit", name: "Member Exit", sublinks: [] },
      //{ id: "Membership/customersAccount ", name: "Customers Account ", sublinks: [] },
    ],
  },
  {
    id: "ws7",
    name: "Loaning",
    title: "Loaning",
    icon: <FaWallet className="text-2xl" />,
    dms: [
      { id: "Loaning/LoanProducts", name: "Loan Products", sublinks: [] },
      { id: "Loaning/LoanApplication", name: "Loan Application", sublinks: [] },
      { id: "Loaning/LoanSector", name: "Loan Sector", sublinks: [] },
      { id: "Loaning/LoanSubSector", name: "Loan SubSector", sublinks: [] },
      { id: "Loaning/LoanCalculator", name: "Loan Calculator", sublinks: [] },
      { id: "Loaning/LoanRegister", name: "Loan Register", sublinks: [] },
    ],
  },
  {
    id: "ws8",
    name: "Reports",
    title: "Reports",
    icon: <FaRegFileAlt className="text-2xl" />,
    dms: [
      { id: "Reports/LoanReports", name: "Loan Reports", sublinks: [] },
      { id: "Reports/FinancialReports", name: "Finance Reports", sublinks: [] },
      { id: "Reports/GenerateSasraForm", name: "Generate Sasra Form", sublinks: [] },
      { id: "Reports/MemberStatement", name: "Member Statement", sublinks: [] },
    ],
  },
  {
    id: "ws9",
    name: "UserManagement",
    title: "User Manage..",
    icon: <FaRegUser className="text-2xl" />,
    dms: [
      { id: "UserManagement/Users", name: "Users", sublinks: [] },
      { id: "UserManagement/Roles", name: "Roles", sublinks: [] },
    ],
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  // Determine current workspace from path
  const currentWorkspace = mockWorkspaces.find((ws) =>
    location.pathname.startsWith(`/${ws.name}`) ||
    ws.dms.some((dm) =>
      location.pathname.startsWith(`/${dm.id}`)
    )
  ) || mockWorkspaces[0]; // fallback to first workspace

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 bg-indigo-800">
        <MiniSidebar
          workspaces={mockWorkspaces}
          activeWorkspace={currentWorkspace.id} // maintain active highlight
          onSelect={() => { }} // can be empty; URL drives the selection
        />
        <MainSidebar workspace={currentWorkspace} />

        {/* Page Content */}
        <div
          className="flex-1 bg-indigo-100 p-1 overflow-auto"
          style={{
            backgroundImage: `url(${bgcircle})`,
            backgroundColor: "rgba(224, 231, 255, 0.7)",
            backgroundSize: "200px",
            backgroundBlendMode: "saturation",
            backgroundPosition: "center",
          }}
        >
          <Outlet /> {/* Shows the selected route content */}
        </div>
      </div>
    </div>
  );
}
