import CreditBatchPanel from "./CreditBatchPanel";
import DebitBatchPanel from "./DebitBatchPanel";
import WireTransferBatchPanel from "./WireTransferBatchPanel";

// One entry per Batch Procedures type. `Panel` is null for types not yet
// built — BatchStageScreen renders those tabs disabled rather than hiding
// them, same convention as SundryPayments.jsx's disabled "Sundry Payment"
// tab (transactionType: 16, no backend case).
export const BATCH_TYPES = [
  { id: "credit", label: "Credit", Panel: CreditBatchPanel },
  { id: "debit", label: "Debit", Panel: DebitBatchPanel },
  { id: "wireTransfer", label: "Wire Transfer", Panel: WireTransferBatchPanel },
  { id: "refund", label: "Refund", Panel: null },
  { id: "reversal", label: "Reversal", Panel: null },
  { id: "disbursement", label: "Disbursement", Panel: null },
  { id: "voucher", label: "Voucher", Panel: null },
  { id: "generalLedger", label: "General Ledger", Panel: null },
  { id: "interAccountTransfer", label: "Inter Account Transfer", Panel: null },
];
