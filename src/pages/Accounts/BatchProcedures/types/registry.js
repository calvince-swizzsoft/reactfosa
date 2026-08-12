import CreditBatchPanel from "./CreditBatchPanel";
import DebitBatchPanel from "./DebitBatchPanel";
import WireTransferBatchPanel from "./WireTransferBatchPanel";
import RefundBatchPanel from "./RefundBatchPanel";
import ReversalBatchPanel from "./ReversalBatchPanel";
import DisbursementBatchPanel from "./DisbursementBatchPanel";
import VoucherBatchPanel from "./VoucherBatchPanel";
import GeneralLedgerPanel from "./GeneralLedgerPanel";

// One entry per Batch Procedures type. `Panel` is null for types not yet
// built — BatchStageScreen renders those tabs disabled rather than hiding
// them, same convention as SundryPayments.jsx's disabled "Sundry Payment"
// tab (transactionType: 16, no backend case).
export const BATCH_TYPES = [
  { id: "credit", label: "Credit", Panel: CreditBatchPanel },
  { id: "debit", label: "Debit", Panel: DebitBatchPanel },
  { id: "wireTransfer", label: "Wire Transfer", Panel: WireTransferBatchPanel },
  { id: "refund", label: "Refund", Panel: RefundBatchPanel },
  { id: "reversal", label: "Reversal", Panel: ReversalBatchPanel },
  { id: "disbursement", label: "Disbursement", Panel: DisbursementBatchPanel },
  { id: "voucher", label: "Voucher", Panel: VoucherBatchPanel },
  { id: "generalLedger", label: "General Ledger", Panel: GeneralLedgerPanel },
  { id: "interAccountTransfer", label: "Inter Account Transfer", Panel: null },
];
