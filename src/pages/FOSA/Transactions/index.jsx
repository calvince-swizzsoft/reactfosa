import { useState } from "react";
import {
  FaExchangeAlt, FaUniversity, FaUserTie, FaFileAlt, FaPiggyBank,
} from "react-icons/fa";
import CashManagement from "./CashManagement";
import EndOfDay from "./EndOfDay";
import CashDeposit from "./CashDeposit";
import CashWithdrawal from "./CashWithdrawal";
import ChequeDeposit from "./ChequeDeposit";
import PaymentVoucher from "./PaymentVoucher";
import StandingOrder from "./StandingOrder";
import ChequeTransfer from "./ChequeTransfer";
import CashTransfer from "./CashTransfer";
import Catalogue from "./Catalogue";
import BankCheques from "./BankCheques";
import ClearCheques from "./ClearCheques";
import UnpayReasons from "./UnpayReasons";

function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-gray-300">
      <div className="text-6xl mb-5">🚧</div>
      <p className="text-base font-semibold text-gray-400">{label}</p>
      <p className="text-sm mt-1 text-gray-300">This section is under development.</p>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────────── */
const MODULES = [
  {
    id: "treasury",
    label: "Treasury",
    icon: FaUniversity,
    defaultItem: "cashmanagement",
    items: [
      { id: "cashmanagement", label: "Cash Management", subtitle: "Cash transactions" },
      // { id: "cashwithdrawal", label: "Cash Withdrawal Request", subtitle: "Withdrawal requests" },
      // { id: "fiscalcatalogue", label: "Fiscal Catalogue", subtitle: "Catalogue" },
    ],
  },

  {
    id: "teller",
    label: "Teller",
    icon: FaUserTie,
    defaultItem: "frontoffice",
    items: [
      // { id: "__g_customer", type: "group", label: "Customer Transaction" },
      { id: "frontoffice", label: "Cash Deposit", subtitle: "Customer transaction" },
      // { id: "__g_general", type: "group", label: "General Transaction" },
      // { id: "cashpayment", label: "Payment Voucher", subtitle: "General transaction" },
      // { id: "cashreceipt", label: "Cash Receipt", subtitle: "General transaction" },
      { id: "cashwithdrawal", label: "Cash Withdrawal", subtitle: "Withdrawal requests" },
      { id: "chequerecepit", label: "Cheque Deposit", subtitle: "General transaction" },
      //{ id: "backoffice", label: "Standing Order", subtitle: "Customer transaction" },
      // { id: "__g_other", type: "group", label: "" },

      { id: "endofday", label: "End-Of-Day", subtitle: "Daily closing" },
    ],
  },
  {
    id: "cheques",
    label: "Cheques",
    icon: FaFileAlt,
    defaultItem: "catalogue",
    items: [
      { id: "catalogue", label: "Catalogue", subtitle: "View all cheques" },
      { id: "bankcheques", label: "Bank", subtitle: "Bank cheques" },
      { id: "clearcheques", label: "Clear", subtitle: "Pay / UnPay cheques" },
      { id: "unpayreasons", label: "Unpay Reasons", subtitle: "Manage unpay reasons" },
    ],
  },
  {
    id: "Transfers",
    label: "Transfers",
    icon: FaPiggyBank,
    defaultItem: "chequetransfer",
    items: [
      { id: "chequetransfer", label: "Cheque Transfer", subtitle: "Transfer" },
      { id: "cashtransfer", label: "Cash Transfer", subtitle: "Transfer" },
    ],
  },
];

/* ── Component renderer ───────────────────────────────────────── */
function ActiveContent({ id }) {
  switch (id) {
    case "cashmanagement": return <CashManagement />;
    case "cashwithdrawal": return <CashWithdrawal />;
    case "frontoffice": return <CashDeposit />;
    case "backoffice": return <StandingOrder />;
    case "cashpayment": return <PaymentVoucher />;
    case "cashreceipt": return <CashDeposit />;
    case "chequerecepit": return <ChequeDeposit />;
    case "chequetransfer": return <ChequeTransfer />;
    case "cashtransfer": return <CashTransfer />;
    case "endofday": return <EndOfDay />;
    case "catalogue": return <Catalogue />;
    case "bankcheques": return <BankCheques />;
    case "clearcheques": return <ClearCheques />;
    case "unpayreasons": return <UnpayReasons />;
    default: {
      const found = MODULES.flatMap((m) => m.items).find((i) => i.id === id);
      return <ComingSoon label={found?.label || "Section"} />;
    }
  }
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function FOSATransactions() {
  const [activeModuleId, setActiveModuleId] = useState("teller");
  const [activeItemId, setActiveItemId] = useState("frontoffice");

  const activeModule = MODULES.find((m) => m.id === activeModuleId);
  const activeItem = activeModule?.items.find((i) => i.id === activeItemId);

  const handleModuleClick = (mod) => {
    setActiveModuleId(mod.id);
    setActiveItemId(mod.defaultItem);
  };

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
              onClick={() => handleModuleClick(mod)}
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
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm">

        {/* Sub-sidebar header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {activeModule?.label}
          </p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">Operations</p>
        </div>

        {/* Sub-items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-gray-200 mx-1.5 rounded-lg">
          {activeModule?.items.map((item) => {

            /* Group label */
            {/* if (item.type === "group") {
              return item.label ? (
                <p key={item.id} className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 px-2 pt-3 pb-0.5">
                  {item.label}
                </p>
              ) : (
                <div key={item.id} className="border-t border-gray-100 my-2" />
              );
            } */}

            /* Nav item */
            const active = activeItemId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItemId(item.id)}
                className={`w-full text-left px-3 py-2.5 mb-2 rounded-xl transition-all ${active
                  ? "bg-indigo-600 shadow-md shadow-indigo-200"
                  : "hover:bg-gray-50 bg-white"
                  }`}
              >
                <p className={`text-sm font-semibold leading-tight ${active ? "text-white" : "text-gray-700"}`}>
                  {item.label}
                </p>
                <p className={`text-xs mt-0.5 ${active ? "text-indigo-200" : "text-gray-400"}`}>
                  {item.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Content header */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {activeModule?.label}
            </p>
            <h2 className="text-lg font-bold text-gray-800 mt-0.5">
              {activeItem?.label ?? "Select an option"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>
        </div>

        {/* Component */}
        <div className="flex-1 overflow-y-auto p-6">
          <ActiveContent id={activeItemId} />
        </div>
      </div>
    </div>
  );
}
