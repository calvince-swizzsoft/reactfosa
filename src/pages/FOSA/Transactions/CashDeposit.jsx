import { FaMoneyBillWave } from "react-icons/fa";
import TransactionRequestPage from "./TransactionRequestPage";
import { FrontOfficeTransactionType } from "../lib/frontOfficeEnums";

export default function CashDeposit() {
  return (
    <TransactionRequestPage
      type={FrontOfficeTransactionType.CashDeposit}
      title="Cash Deposit"
      icon={FaMoneyBillWave}
      finalLabel="Posted"
    />
  );
}
