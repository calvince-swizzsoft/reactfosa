import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaExchangeAlt, FaUniversity, FaUserTie, FaFileAlt, FaPiggyBank,
} from "react-icons/fa";

// Pure launcher — every item below now has its own real <Route> in
// App.jsx, so this just navigates instead of switching an inline
// component, matching FOSA/Setup/index.jsx's existing pattern.
const MODULES = [
  {
    id: "treasury",
    label: "Treasury",
    icon: FaUniversity,
    items: [
      { id: "cashmanagement", label: "Cash Management", subtitle: "Cash transactions", route: "/FrontOffice/CashManagement" },
    ],
  },
  {
    id: "teller",
    label: "Teller",
    icon: FaUserTie,
    items: [
      { id: "cashdeposit", label: "Cash Deposit", subtitle: "Customer transaction", route: "/FrontOffice/CashDeposit" },
      { id: "cashwithdrawal", label: "Cash Withdrawal", subtitle: "Withdrawal requests", route: "/FrontOffice/CashWithdrawal" },
      { id: "chequedeposit", label: "Cheque Deposit", subtitle: "General transaction", route: "/FrontOffice/ChequeDeposit" },
      { id: "paymentvoucher", label: "Payment Voucher", subtitle: "General transaction", route: "/FrontOffice/PaymentVoucher" },
      { id: "endofday", label: "End-Of-Day", subtitle: "Daily closing", route: "/FrontOffice/EndOfDay" },
    ],
  },
  {
    id: "cheques",
    label: "Cheques",
    icon: FaFileAlt,
    items: [
      { id: "catalogue", label: "Catalogue", subtitle: "View all cheques", route: "/FrontOffice/Catalogue" },
      { id: "bankcheques", label: "Bank", subtitle: "Bank cheques", route: "/FrontOffice/BankCheques" },
      { id: "clearcheques", label: "Clear", subtitle: "Pay / UnPay cheques", route: "/FrontOffice/ClearCheques" },
      { id: "unpayreasons", label: "Unpay Reasons", subtitle: "Manage unpay reasons", route: "/FrontOffice/UnpayReasons" },
    ],
  },
  {
    id: "transfers",
    label: "Transfers",
    icon: FaPiggyBank,
    items: [
      { id: "chequetransfer", label: "Cheque Transfer", subtitle: "Transfer", route: "/FrontOffice/ChequeTransfer" },
      { id: "cashtransfer", label: "Cash Transfer", subtitle: "Transfer", route: "/FrontOffice/CashTransfer" },
    ],
  },
];

export default function FOSATransactions() {
  const navigate = useNavigate();
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);

  const activeModule = MODULES.find((m) => m.id === activeModuleId);

  return (
    <div className="flex bg-[#f4f6fb] h-full">

      {/* ══ PRIMARY SIDEBAR — modules only ═══════════════════════ */}
      <aside className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-1 flex-shrink-0 shadow-sm">

        {/* Brand icon */}
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
          <FaExchangeAlt className="text-white text-sm" />
        </div>

        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const active = activeModuleId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModuleId(mod.id)}
              title={mod.label}
              className={`w-14 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${active
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-gray-400 hover:bg-gray-50 hover:text-indigo-600"
                }`}
            >
              <Icon className="text-lg" />
              <span className="text-[9px] font-bold leading-tight text-center px-1 whitespace-pre-wrap">
                {mod.label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ══ SECONDARY SIDEBAR — sub-items of active module ═══════ */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">

        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {activeModule?.label}
          </p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">Operations</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-gray-200 mx-1.5 rounded-lg">
          {activeModule?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="w-full text-left px-3 py-2.5 mb-2 rounded-xl bg-white hover:bg-indigo-50 transition-all"
            >
              <p className="text-sm font-semibold leading-tight text-gray-700">
                {item.label}
              </p>
              <p className="text-xs mt-0.5 text-gray-400">
                {item.subtitle}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex-shrink-0 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {activeModule?.label}
          </p>
          <h2 className="text-lg font-bold text-gray-800 mt-0.5">Select an operation</h2>
        </div>

        <div className="flex-1 flex items-center justify-center text-gray-300">
          <p className="text-sm">Choose an item from the left to open it.</p>
        </div>
      </div>
    </div>
  );
}
