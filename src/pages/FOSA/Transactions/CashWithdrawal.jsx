import { FaWallet } from "react-icons/fa";
import TransactionRequestPage from "./TransactionRequestPage";
import { FrontOfficeTransactionType } from "../lib/frontOfficeEnums";

export default function CashWithdrawal() {
  return (
    <TransactionRequestPage
      type={FrontOfficeTransactionType.CashWithdrawal}
      title="Cash Withdrawal"
      icon={FaWallet}
      finalLabel="Paid"
    />
  );
}
