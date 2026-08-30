import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaMoneyBillWave, FaPlus, FaPaperPlane, FaChevronLeft, FaChevronRight, FaInfoCircle, FaSearch, FaUndo, FaUser, FaWallet, FaBookOpen } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { listRequests, createTransaction, postAuthorizedRequest, resendApprovalRequest } from "./requestsApi";
import { FrontOfficeTransactionType, CashWithdrawalCategory } from "../lib/frontOfficeEnums";
import ReceiptModal from "../lib/ReceiptModal";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";
import DenominationCountFields, { emptyDenominationCounts, sumDenominations } from "../lib/DenominationCountFields";
import { getGlAccountStatement } from "@/pages/Accounts/GeneralLedgerStatement/api";
import { StatementRow } from "@/pages/Accounts/GeneralLedgerTransaction";

// Savings Receipts/Payments — the app's one real nav item for the whole
// teller transaction cycle (NavigationMenu.cs: ControllerName "CashDeposit",
// Description "Savings Receipts/Payments"). One screen, one
// POST api/frontoffice/requests and GET api/frontoffice/requests/queue,
// four FrontOfficeTransactionType
// values discriminated by `Type` — per
// WebApplication1/Areas/FrontOffice/SAVINGS-RECEIPTS-PAYMENTS-FLOW.md and
// -FORM-LAYOUT.md. Replaces the 4 separate pages Phase 1 built
// (CashDeposit/CashWithdrawal/ChequeDeposit/PaymentVoucher) — those were a
// deliberate scope choice at the time, superseded once the form-layout doc
// confirmed the reference app never had more than one menu entry here.

const TYPE_OPTIONS = [
  { value: FrontOfficeTransactionType.CashDeposit, label: "Cash Deposit" },
  { value: FrontOfficeTransactionType.CashWithdrawal, label: "Cash Withdrawal" },
  { value: FrontOfficeTransactionType.ChequeDeposit, label: "Cheque Deposit" },
  { value: FrontOfficeTransactionType.CashWithdrawalPaymentVoucher, label: "Payment Voucher" },
];

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// Pending/Authorized/Rejected share the same numeric values across
// CashDepositRequestAuthStatus/CashWithdrawalRequestAuthStatus, and the
// "final" state is 8 in both (Posted for deposits, Paid for withdrawals) —
// one status set covers the merged queue.
const STATUS = { Pending: 1, Authorized: 2, Rejected: 4, Final: 8 };
const STATUS_TABS = [
  { id: "Pending", label: "Pending" },
  { id: "Authorized", label: "Authorized" },
  { id: "Final", label: "Posted / Paid" },
  { id: "Rejected", label: "Rejected" },
];

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
];

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {help && <Popover><PopoverTrigger asChild><button type="button" aria-label={`Information about ${label}`} className="text-gray-400 hover:text-indigo-600 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"><FaInfoCircle className="text-xs" /></button></PopoverTrigger><PopoverContent className="w-72 text-sm text-gray-600">{help}</PopoverContent></Popover>}
      </div>
      {children}
    </div>
  );
}

const emptyForm = {
  Type: FrontOfficeTransactionType.CashDeposit,
  CreditCustomerAccountId: "",
  TotalValue: "",
  Remarks: "",
  // Group 2 — Cheque Deposit only
  ChequeNumber: "",
  Drawer: "",
  DrawerBank: "",
  DrawerBankBranch: "",
  ChequeType: "",
  WriteDate: "",
  // Group 3 — Payment Voucher only
  Payee: "",
  VoucherReference: "",
  ChequeBookId: "",
  PaymentVoucherId: "",
};

function CreateTransactionDrawer({ open, onClose, onSuccess, onDialog, initialCustomer = null, initialAccounts = [], initialAccountId = "" }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [chequeTypes, setChequeTypes] = useState([]);
  const [loadingChequeTypes, setLoadingChequeTypes] = useState(false);
  const [chequeBooks, setChequeBooks] = useState([]);
  const [paymentVouchers, setPaymentVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [operatorContext, setOperatorContext] = useState(null);
  const [tallyMode, setTallyMode] = useState("total");
  const [denominations, setDenominations] = useState(emptyDenominationCounts);

  useEffect(() => {
    if (!open) return;
    setForm({ ...emptyForm, CreditCustomerAccountId: initialAccountId || "" });
    setSelectedCustomer(initialCustomer);
    setAccounts(initialAccounts);
    setChequeTypes([]);
    setChequeBooks([]);
    setPaymentVouchers([]);
    setDenominations(emptyDenominationCounts);
    setTallyMode("total");
    setLoadingData(true);
    apiJson(`${FIN_BASE}/api/frontoffice/requests/context`).then((response) => {
      setOperatorContext(response?.data ?? response?.Data ?? null);
    }).catch((error) => {
      setOperatorContext(null);
      Swal.fire("Teller Context Unavailable", apiErrorMessage(error, "Your teller and branch context could not be resolved."), "error");
    }).finally(() => setLoadingData(false));
  }, [open, initialAccountId, initialCustomer, initialAccounts]);

  const isChequeDeposit = form.Type === FrontOfficeTransactionType.ChequeDeposit;

  // ChequeTypeController.GetAll (docs/api/cheque-type-api-spec.md §5.2) —
  // every cheque type, unpaged, meant for exactly this kind of picker.
  // Fetched lazily only once Cheque Deposit is actually selected, not
  // upfront with customers/branches.
  useEffect(() => {
    if (!open || !isChequeDeposit || chequeTypes.length > 0) return;
    setLoadingChequeTypes(true);
    apiJson(`${FIN_BASE}/api/accounts/chequetypes/all`)
      .then((d) => setChequeTypes(normalizeList(d)))
      .catch((error) => {
        setChequeTypes([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheque types."), "error");
      })
      .finally(() => setLoadingChequeTypes(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isChequeDeposit]);

  const handleCustomerChange = (customer) => {
    const customerId = customer?.Id ?? customer?.id;
    setSelectedCustomer(customer);
    setAccounts([]);
    setForm((p) => ({ ...p, CreditCustomerAccountId: "" }));
    if (!customerId) return;
    setLoadingAccounts(true);
    apiJson(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((d) => setAccounts(normalizeList(d)))
      .catch((error) => {
        setAccounts([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load customer accounts."), "error");
      })
      .finally(() => setLoadingAccounts(false));
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const selectedAccount = accounts.find((account) => String(account.Id) === String(form.CreditCustomerAccountId));
  const selectedCustomerName = selectedCustomer
    ? ([selectedCustomer.IndividualFirstName, selectedCustomer.IndividualLastName].filter(Boolean).join(" ") || selectedCustomer.NonIndividualDescription || selectedCustomer.Description)
    : "";

  const handleDenominationChange = (key, value) => {
    setDenominations((previous) => {
      const next = { ...previous, [key]: value };
      setForm((current) => ({ ...current, TotalValue: String(sumDenominations(next)) }));
      return next;
    });
  };

  const isPaymentVoucher = form.Type === FrontOfficeTransactionType.CashWithdrawalPaymentVoucher;

  useEffect(() => {
    if (!open || !isPaymentVoucher || !form.CreditCustomerAccountId) return;
    apiJson(`${FIN_BASE}/api/accounts/chequebooks/all`)
      .then((response) => setChequeBooks(normalizeList(response).filter((book) => String(book.CustomerAccountId) === String(form.CreditCustomerAccountId) && book.IsActive && !book.IsLocked)))
      .catch((error) => { setChequeBooks([]); Swal.fire("Unable to Load Cheque Books", apiErrorMessage(error, "The customer's active cheque books could not be loaded."), "error"); });
  }, [open, isPaymentVoucher, form.CreditCustomerAccountId]);

  const handleChequeBookChange = (chequeBookId) => {
    handleChange("ChequeBookId", chequeBookId);
    handleChange("PaymentVoucherId", "");
    setPaymentVouchers([]);
    setLoadingVouchers(true);
    apiJson(`${FIN_BASE}/api/accounts/chequebooks/${chequeBookId}/vouchers?pageIndex=0&pageSize=100`)
      .then((response) => setPaymentVouchers(normalizeList(response).filter((voucher) => Number(voucher.Status) === 0)))
      .catch((error) => Swal.fire("Unable to Load Vouchers", apiErrorMessage(error, "Available payment vouchers could not be loaded."), "error"))
      .finally(() => setLoadingVouchers(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!operatorContext || operatorContext.isLocked) {
      Swal.fire("Teller Unavailable", operatorContext?.isLocked ? "Your teller is locked and cannot post transactions." : "Your teller context could not be resolved.", "warning");
      return;
    }
    if (!form.CreditCustomerAccountId || !form.TotalValue || Number(form.TotalValue) <= 0) {
      Swal.fire("Missing Fields", "Select an account and enter an amount greater than zero.", "warning");
      return;
    }
    if (isChequeDeposit && (!/^\d{6}$/.test(form.ChequeNumber) || !form.Drawer.trim() || !form.DrawerBank.trim() || !form.DrawerBankBranch.trim() || !form.ChequeType || !form.WriteDate)) {
      Swal.fire("Cheque Details Required", "Enter a six-digit cheque number, drawer, bank, bank branch, cheque type, and write date.", "warning");
      return;
    }
    if (isPaymentVoucher && (!form.ChequeBookId || !form.PaymentVoucherId || !form.Payee.trim() || !form.VoucherReference.trim() || !form.WriteDate)) {
      Swal.fire("Payment Voucher Details Required", "Select a cheque book and active voucher, then enter its payee, reference, and write date.", "warning");
      return;
    }

    setLoading(true);
    try {
      // CreditCustomerAccountId is what the server reads to resolve "the
      // selected account" for every transaction type, not just deposits —
      // confirmed against CashDepositController.Create's actual lookup.
      const payload = {
        Type: form.Type,
        CreditCustomerAccountId: form.CreditCustomerAccountId,
        TotalValue: Number(form.TotalValue),
        Remarks: form.Remarks,
      };

      if (isChequeDeposit) {
        // Reference IS the cheque number for this type — the server used to
        // unconditionally clobber it with the customer's own reference
        // before branching on Type, which silently discarded whatever
        // cheque number was sent; that overwrite is now skipped for
        // ChequeDeposit (SAVINGS-RECEIPTS-PAYMENTS-FORM-LAYOUT.md note 2),
        // so this is safe to send now.
        Object.assign(payload, {
          Reference: form.ChequeNumber,
          Drawer: form.Drawer,
          DrawerBank: form.DrawerBank,
          DrawerBankBranch: form.DrawerBankBranch,
          // The current deposit contract requires a configured cheque type;
          // its maturity period determines when the cheque can be cleared.
          ChequeType: form.ChequeType,
          WriteDate: form.WriteDate ? new Date(form.WriteDate).toISOString() : null,
        });
      } else if (isPaymentVoucher) {
        // CustomerTransactionModel.PaymentVoucher isn't initialized in the
        // model's own constructor — ProcessCustomerTransactionAsync's
        // voucher branch dereferences PaymentVoucher.Reference/.Payee
        // directly, so omitting this object would NPE server-side.
        payload.PaymentVoucher = {
          Id: form.PaymentVoucherId,
          ChequeBookId: form.ChequeBookId,
          Payee: form.Payee,
          Reference: form.VoucherReference,
          Amount: Number(form.TotalValue),
          WriteDate: form.WriteDate ? new Date(form.WriteDate).toISOString() : null,
        };
      }
      // Types 1/2 (plain withdrawal/deposit) send nothing beyond the base
      // payload — Reference is server-derived for these, don't collect it.

      const data = await createTransaction(payload);

      if (data.success) {
        onSuccess(data.data, isChequeDeposit);
        onClose();
      } else if (data.data?.dialog) {
        onDialog(data.message, data.data);
        onClose();
      } else {
        Swal.fire("Error", data.message || "Failed to create transaction", "error");
      }
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the transaction."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">New Transaction</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            {/* Cheque Deposit alone adds 6 fields on top of the base 5 — tall
                enough on shorter viewports that the submit button used to
                scroll out of view along with everything else, inside a
                motion.div that only animates on open/close and gives no
                visual hint there's more below. Split into a scrolling body
                + a footer that always stays put, same <form> either way so
                onSubmit/Enter-to-submit still cover the whole thing. */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className={`rounded-lg border px-4 py-3 ${operatorContext?.isLocked ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-100"}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Signed-in teller context</p>
                <div className="flex justify-between gap-3 mt-1 text-sm"><span className="font-semibold text-gray-800">{loadingData ? "Resolving..." : operatorContext?.tellerDescription || "Unavailable"}</span><span className="text-gray-600">{operatorContext?.branchDescription || "Branch unavailable"}</span></div>
                {operatorContext?.isLocked && <p className="text-xs font-semibold text-red-600 mt-1">This teller is locked. Transactions are disabled.</p>}
              </div>

              <FieldGroup label="Transaction Type" help="Choose the operation before selecting its details. The server applies the product limits, teller controls, charges, and approval rules for that operation.">
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => handleChange("Type", option.value)} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${form.Type === option.value ? "bg-indigo-600 border-indigo-600 text-white shadow" : "bg-white border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200"}`}>{option.label}</button>)}
                </div>
              </FieldGroup>

              <FieldGroup label="Customer" help="Search the full customer registry by name, identity, payroll or organisation details. Results are fetched from the server as you search.">
                <Button type="button" onClick={() => setCustomerPickerOpen(true)} className="w-full justify-start bg-white text-gray-700 border hover:bg-indigo-50"><FaSearch className="mr-2 text-indigo-600" />{selectedCustomerName || "Search & select customer"}</Button>
              </FieldGroup>

              <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"} help="Select the savings, investment or loan account affected by this transaction. The API derives the correct debit and credit side from the transaction type.">
                <Select value={form.CreditCustomerAccountId ? String(form.CreditCustomerAccountId) : ""} onValueChange={(v) => handleChange("CreditCustomerAccountId", v)} disabled={loadingAccounts || !selectedCustomer}>
                  <SelectTrigger><SelectValue placeholder={loadingAccounts ? "Loading..." : !selectedCustomer ? "Select a customer first" : "Select account"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {accounts.map((a) => (
                      <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.FullAccountNumber || a.CustomerAccountFullAccountNumber || a.CustomerAccountTypeTargetProductDescription || a.Id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              {selectedAccount && <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 border p-3 text-sm">
                <div><span className="block text-xs text-gray-400">Product</span><span className="font-medium text-gray-700">{selectedAccount.CustomerAccountTypeTargetProductDescription || "—"}</span></div>
                <div><span className="block text-xs text-gray-400">Status</span><span className="font-medium text-gray-700">{selectedAccount.StatusDescription || selectedAccount.CustomerAccountStatusDescription || "—"}</span></div>
                <div><span className="block text-xs text-gray-400">Book Balance</span><span className="font-semibold text-indigo-700">{Number(selectedAccount.BookBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                <div><span className="block text-xs text-gray-400">Available Balance</span><span className="font-semibold text-indigo-700">{Number(selectedAccount.AvailableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>}

              {form.Type === FrontOfficeTransactionType.CashDeposit && <FieldGroup label="Cash Tally" help="Tally by total when the cash is already counted, or tally by count to enter the number of notes and coins. The counted total becomes the transaction amount."><div className="flex gap-2 mb-3"><button type="button" onClick={() => setTallyMode("total")} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${tallyMode === "total" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>Tally by Total</button><button type="button" onClick={() => setTallyMode("count")} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${tallyMode === "count" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>Tally by Count</button></div>{tallyMode === "count" && <><DenominationCountFields counts={denominations} onChange={handleDenominationChange} /><Button type="button" size="sm" onClick={() => { setDenominations(emptyDenominationCounts); handleChange("TotalValue", ""); }} className="mt-2 bg-gray-600 hover:bg-gray-700"><FaUndo className="mr-2" /> Reset Count</Button></>}</FieldGroup>}

              <FieldGroup label="Amount" help="For withdrawals, the API evaluates the product withdrawal limit, minimum balance, charges, account balance and teller cash availability. Transactions requiring authority are queued instead of posted.">
                <Input type="number" min="0.01" step="0.01" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="0.00" readOnly={form.Type === FrontOfficeTransactionType.CashDeposit && tallyMode === "count"} />
              </FieldGroup>

              {isChequeDeposit && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FieldGroup label="Cheque Number">
                    <Input inputMode="numeric" maxLength={6} value={form.ChequeNumber} onChange={(e) => handleChange("ChequeNumber", e.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="e.g. 000482" />
                  </FieldGroup>
                  <FieldGroup label="Write Date">
                    <Input type="date" max={new Date().toISOString().slice(0, 10)} value={form.WriteDate} onChange={(e) => handleChange("WriteDate", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Drawer (Cheque Owner)">
                    <Input value={form.Drawer} onChange={(e) => handleChange("Drawer", e.target.value)} required placeholder="e.g. John Doe" />
                  </FieldGroup>
                  <FieldGroup label="Drawer Bank">
                    <Input value={form.DrawerBank} onChange={(e) => handleChange("DrawerBank", e.target.value)} required placeholder="e.g. KCB" />
                  </FieldGroup>
                  <FieldGroup label="Drawer Bank Branch">
                    <Input value={form.DrawerBankBranch} onChange={(e) => handleChange("DrawerBankBranch", e.target.value)} required placeholder="e.g. Moi Avenue" />
                  </FieldGroup>
                  <FieldGroup label="Cheque Type">
                    <Select value={form.ChequeType ? String(form.ChequeType) : ""} onValueChange={(v) => handleChange("ChequeType", v)} disabled={loadingChequeTypes}>
                      <SelectTrigger><SelectValue placeholder={loadingChequeTypes ? "Loading..." : "Select cheque type"} /></SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {chequeTypes.map((ct) => <SelectItem key={String(ct.Id)} value={String(ct.Id)}>{ct.Description}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                </div>
              )}

              {isPaymentVoucher && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FieldGroup label="Cheque Book" help="Only active, unlocked cheque books issued against the selected customer account are available.">
                    <Select value={form.ChequeBookId} onValueChange={handleChequeBookChange}>
                      <SelectTrigger><SelectValue placeholder="Select cheque book" /></SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">{chequeBooks.map((book) => <SelectItem key={String(book.Id)} value={String(book.Id)}>{book.Reference || book.PaddedSerialNumber || book.Id}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Voucher Number" help="Only unused active voucher leaves from the selected cheque book can be presented for payment.">
                    <Select value={form.PaymentVoucherId} onValueChange={(value) => handleChange("PaymentVoucherId", value)} disabled={!form.ChequeBookId || loadingVouchers}>
                      <SelectTrigger><SelectValue placeholder={loadingVouchers ? "Loading vouchers..." : "Select voucher"} /></SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">{paymentVouchers.map((voucher) => <SelectItem key={String(voucher.Id)} value={String(voucher.Id)}>{voucher.PaddedVoucherNumber || voucher.VoucherNumber || voucher.Id}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Write Date">
                    <Input type="date" max={new Date().toISOString().slice(0, 10)} value={form.WriteDate} onChange={(e) => handleChange("WriteDate", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Payee">
                    <Input value={form.Payee} onChange={(e) => handleChange("Payee", e.target.value)} required placeholder="e.g. Jane Doe" />
                  </FieldGroup>
                  <FieldGroup label="Voucher Reference">
                    <Input value={form.VoucherReference} onChange={(e) => handleChange("VoucherReference", e.target.value)} required placeholder="Voucher reference" />
                  </FieldGroup>
                </div>
              )}

              <FieldGroup label="Remarks" help="Add useful transaction context such as a student name, admission number, voucher purpose, or depositor details. This is retained with the transaction request.">
                <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
              </FieldGroup>
            </div>

            <div className="p-4 pt-3 border-t shrink-0">
              <Button type="submit" disabled={loading || loadingData || !operatorContext || operatorContext.isLocked} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Submitting..." : "Submit Transaction"}
              </Button>
            </div>
            </form>
          </motion.div>
        </>
      )}
      {customerPickerOpen && <CustomerLookupModal onSelect={handleCustomerChange} onClose={() => setCustomerPickerOpen(false)} />}
    </AnimatePresence>
  );
}

function TypeBadge({ item }) {
  const isDeposit = item.TransactionType === FrontOfficeTransactionType.CashDeposit;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isDeposit ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
      {isDeposit ? "Deposit" : "Withdrawal"}
    </span>
  );
}

const read = (value, ...names) => names.map((name) => value?.[name]).find((candidate) => candidate !== undefined && candidate !== null);
const money = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
const customerName = (customer) => [read(customer, "IndividualFirstName", "individualFirstName"), read(customer, "IndividualLastName", "individualLastName")].filter(Boolean).join(" ") || read(customer, "NonIndividualDescription", "nonIndividualDescription", "Description", "description") || "—";

function CustomerWorkspace({ onUseAccount }) {
  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const selectCustomer = (nextCustomer) => {
    const id = read(nextCustomer, "Id", "id");
    setCustomer(nextCustomer);
    setAccounts([]);
    setSelectedAccountId("");
    setPickerOpen(false);
    if (!id) return;
    setLoadingAccounts(true);
    apiJson(`${FIN_BASE}/api/accounts/customer-accounts/${id}/accounts`)
      .then((response) => setAccounts(normalizeList(response)))
      .catch((error) => Swal.fire("Unable to Load Accounts", apiErrorMessage(error, "The customer's accounts could not be loaded."), "error"))
      .finally(() => setLoadingAccounts(false));
  };

  const selectedAccount = accounts.find((account) => String(read(account, "Id", "id")) === String(selectedAccountId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-gray-100 p-4">
        <div><p className="font-semibold text-gray-700">Customer workspace</p><p className="text-sm text-gray-500">Select a customer, review their accounts, then start a transaction from the required account.</p></div>
        <Button onClick={() => setPickerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><FaSearch className="mr-2" /> Select Customer</Button>
      </div>

      {!customer ? <div className="py-16 text-center"><img src={NotFoundImage} alt="Select customer" className="mx-auto w-32" /><p className="text-gray-400">Select a customer to preview their profile and accounts.</p></div> : <>
        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 text-sm md:grid-cols-4">
          <div><span className="block text-xs font-semibold uppercase text-gray-400">Customer</span><span className="font-medium text-gray-700">{customerName(customer)}</span></div>
          <div><span className="block text-xs font-semibold uppercase text-gray-400">Reference</span><span className="text-gray-700">{read(customer, "Reference1", "reference1", "PaddedSerialNumber", "paddedSerialNumber") || "—"}</span></div>
          <div><span className="block text-xs font-semibold uppercase text-gray-400">Identification</span><span className="text-gray-700">{read(customer, "PersonalIdentificationNumber", "personalIdentificationNumber", "IndividualIdentityCardNumber", "individualIdentityCardNumber") || "—"}</span></div>
          <div><span className="block text-xs font-semibold uppercase text-gray-400">Mobile</span><span className="text-gray-700">{read(customer, "AddressMobileLine", "addressMobileLine") || "—"}</span></div>
        </div>

        <div className="rounded-sm bg-gray-200 p-4">
          <div className="mb-3 grid grid-cols-12 gap-3 rounded-lg bg-gray-700 p-3 text-sm font-semibold text-gray-100"><span className="col-span-3">Account</span><span className="col-span-3">Product</span><span className="col-span-2">Status</span><span className="col-span-2 text-right">Book Balance</span><span className="col-span-2 text-right">Available</span></div>
          {loadingAccounts ? <div className="space-y-2 animate-pulse">{[1,2,3].map((item) => <div key={item} className="h-14 rounded-lg bg-gray-100" />)}</div> : accounts.length ? <div className="space-y-2">{accounts.map((account) => {
            const id = read(account, "Id", "id");
            const selected = String(id) === String(selectedAccountId);
            return <button type="button" key={id} onClick={() => setSelectedAccountId(String(id))} className={`grid w-full grid-cols-12 gap-3 rounded-lg border p-4 text-left text-sm shadow transition hover:shadow-lg ${selected ? "border-indigo-500 bg-indigo-50" : "bg-white"}`}><span className="col-span-3 break-words font-medium text-indigo-700">{read(account, "FullAccountNumber", "fullAccountNumber") || "—"}</span><span className="col-span-3 break-words text-gray-700">{read(account, "CustomerAccountTypeTargetProductDescription", "customerAccountTypeTargetProductDescription") || "—"}</span><span className="col-span-2 text-gray-600">{read(account, "StatusDescription", "statusDescription") || "—"}</span><span className="col-span-2 text-right text-gray-700">{money(read(account, "BookBalance", "bookBalance"))}</span><span className="col-span-2 text-right font-medium text-gray-800">{money(read(account, "AvailableBalance", "availableBalance"))}</span></button>;
          })}</div> : <p className="py-10 text-center text-gray-400">This customer has no available accounts.</p>}
        </div>

        <div className="flex justify-end"><Button disabled={!selectedAccount} onClick={() => onUseAccount(customer, accounts, selectedAccountId)} className="bg-indigo-600 hover:bg-indigo-700"><FaPlus className="mr-2" /> New Transaction for Selected Account</Button></div>
      </>}
      {pickerOpen && <CustomerLookupModal onSelect={selectCustomer} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => { const date = new Date(); date.setMonth(date.getMonth() - 1); return date.toISOString().slice(0, 10); };

function TellerGlStatement() {
  const [context, setContext] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(monthAgo());
  const [endDate, setEndDate] = useState(today());
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    apiJson(`${FIN_BASE}/api/frontoffice/requests/context`)
      .then((response) => setContext(response?.data ?? response?.Data ?? null))
      .catch((error) => Swal.fire("Teller Context Unavailable", apiErrorMessage(error), "error"));
  }, []);

  const fetchLines = () => {
    if (!context?.chartOfAccountId) { setLoading(false); return; }
    setLoading(true);
    getGlAccountStatement(context.chartOfAccountId, { startDate, endDate, pageIndex, pageSize })
      .then((page) => { setLines(page?.PageCollection ?? page?.pageCollection ?? []); setItemsCount(page?.ItemsCount ?? page?.itemsCount ?? 0); })
      .catch((error) => { setLines([]); Swal.fire("Unable to Load Statement", apiErrorMessage(error), "error"); })
      .finally(() => setLoading(false));
  };

  const refreshLines = () => {
    if (pageIndex === 0) fetchLines();
    else setPageIndex(0);
  };

  useEffect(() => { if (context?.chartOfAccountId) fetchLines(); }, [context?.chartOfAccountId, pageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-3 rounded-lg bg-gray-100 p-4 text-sm md:grid-cols-4"><div><span className="block text-xs font-semibold uppercase text-gray-400">Teller</span>{context?.tellerDescription || "—"}</div><div><span className="block text-xs font-semibold uppercase text-gray-400">Till G/L</span>{context?.chartOfAccountName || "—"}</div><div><span className="block text-xs font-semibold uppercase text-gray-400">Branch</span>{context?.branchDescription || "—"}</div><div><span className="block text-xs font-semibold uppercase text-gray-400">Current balance</span>{money(context?.bookBalance)}</div></div>
    {!context?.chartOfAccountId ? <p className="py-12 text-center text-gray-400">No cash G/L account is configured for this teller.</p> : <>
      <div className="flex flex-wrap items-end gap-3"><FieldGroup label="Start Date"><Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></FieldGroup><FieldGroup label="End Date"><Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></FieldGroup><Button onClick={refreshLines} className="bg-indigo-600 hover:bg-indigo-700">Refresh Statement</Button></div>
      <div className="rounded-sm bg-gray-200 p-4"><div className="grid grid-cols-12 gap-2 rounded-lg bg-gray-700 px-4 py-3 text-xs font-semibold text-gray-100"><span className="col-span-2">Date</span><span className="col-span-4">Description</span><span className="col-span-1">Reference</span><span className="col-span-1 text-right">Debit</span><span className="col-span-1 text-right">Credit</span><span className="col-span-1 text-right">Balance</span><span className="col-span-2 text-right">Status</span></div>{loading ? <p className="bg-white p-6 text-sm text-gray-400">Loading statement...</p> : lines.length ? <div className="bg-white">{lines.map((line, index) => <StatementRow key={line.Id || index} line={line} />)}</div> : <p className="bg-white p-10 text-center text-gray-400">No G/L transactions found for this period.</p>}</div>
      <div className="flex items-center justify-center gap-3"><Button disabled={pageIndex === 0} onClick={() => setPageIndex((value) => value - 1)}>Prev</Button><span className="text-sm text-gray-600">Page {pageIndex + 1}</span><Button disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((value) => value + 1)}>Next</Button></div>
    </>}
  </div>;
}

export default function SavingsReceiptsPayments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [postingIds, setPostingIds] = useState(new Set());
  const [resendingIds, setResendingIds] = useState(new Set());
  const [receiptJournal, setReceiptJournal] = useState(null);
  const [receiptIsChequeDeposit, setReceiptIsChequeDeposit] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewTab, setViewTab] = useState("queue");
  const [prefillCustomer, setPrefillCustomer] = useState(null);
  const [prefillAccounts, setPrefillAccounts] = useState([]);
  const [prefillAccountId, setPrefillAccountId] = useState("");

  const openBlankTransaction = () => {
    setPrefillCustomer(null);
    setPrefillAccounts([]);
    setPrefillAccountId("");
    setDrawerOpen(true);
  };

  const openAccountTransaction = (customer, accounts, accountId) => {
    setPrefillCustomer(customer);
    setPrefillAccounts(accounts);
    setPrefillAccountId(accountId);
    setDrawerOpen(true);
  };

  const fetchItems = () => {
    setLoading(true);
    // No `type` — merged deposit+withdrawal queue (form-layout doc). The
    // type filter below is applied client-side against this same page,
    // no second request needed.
    listRequests({ status: STATUS[activeTab], text: search.trim(), startDate, endDate, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load transaction requests."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pageIndex, pageSize]);

  const changeTab = (id) => { setActiveTab(id); setPageIndex(0); };
  const applyFilters = (event) => { event.preventDefault(); if (pageIndex === 0) fetchItems(); else setPageIndex(0); };

  const visibleItems = items.filter((item) => {
    if (typeFilter === "deposit") return item.TransactionType === FrontOfficeTransactionType.CashDeposit;
    if (typeFilter === "withdrawal") return item.TransactionType === FrontOfficeTransactionType.CashWithdrawal;
    return true;
  });

  const handlePost = async (id) => {
    const confirm = await Swal.fire({ title: "Post Authorized Transaction?", icon: "question", showCancelButton: true, confirmButtonColor: "#4f46e5", confirmButtonText: "Post" });
    if (!confirm.isConfirmed) return;
    setPostingIds((prev) => new Set(prev).add(id));
    try {
      const journal = await postAuthorizedRequest(id);
      setReceiptJournal(journal);
      fetchItems();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to post the authorized request."), "error");
    } finally {
      setPostingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleResendApproval = async (item) => {
    const confirm = await Swal.fire({ title: "Resend Approval Request?", text: "A new approval request will only be created when no unactioned approval is still open.", icon: "question", showCancelButton: true, confirmButtonColor: "#4f46e5", confirmButtonText: "Resend" });
    if (!confirm.isConfirmed) return;
    setResendingIds((prev) => new Set(prev).add(item.Id));
    try {
      const result = await resendApprovalRequest(item.Id);
      await Swal.fire("Approval Resent", result?.message || result?.Message || "The approval request was resent successfully.", "success");
      fetchItems();
    } catch (err) {
      Swal.fire("Unable to Resend Approval", apiErrorMessage(err, "The approval request could not be resent."), "error");
    } finally {
      setResendingIds((prev) => { const next = new Set(prev); next.delete(item.Id); return next; });
    }
  };

  const handleDialog = (message) => {
    Swal.fire("Submitted for Approval", message, "info").then(() => {
      // The new request sits Pending until a checker approves it — surface
      // that tab so the teller sees it land, rather than pointing at
      // Authorized (which is where it goes only after approval).
      setActiveTab("Pending");
      setPageIndex(0);
      fetchItems();
    });
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyBillWave /> Savings Receipts/Payments
        </h2>
        <Button onClick={openBlankTransaction} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Transaction
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-gray-200">
        {[{ id: "queue", label: "Transaction Queue", icon: FaWallet }, { id: "customer", label: "Customer Workspace", icon: FaUser }, { id: "gl", label: "My Till G/L", icon: FaBookOpen }].map((tab) => {
          const Icon = tab.icon;
          return <button type="button" key={tab.id} onClick={() => setViewTab(tab.id)} className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-semibold ${viewTab === tab.id ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-indigo-50"}`}><Icon /> {tab.label}</button>;
        })}
      </div>

      {viewTab === "queue" && <>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex gap-1 border-b border-gray-200">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-indigo-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${typeFilter === f.id ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-indigo-600"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
        <div className="relative md:col-span-6"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer details..." className="pl-8" /></div>
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="md:col-span-2" aria-label="Start date" />
        <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="md:col-span-2" aria-label="End date" />
        <Button type="submit" className="md:col-span-2 bg-indigo-600 hover:bg-indigo-700">Filter Queue</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Date</span>
          <span className="col-span-2 text-right">{activeTab === "Authorized" || activeTab === "Pending" ? "Actions" : ""}</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const isVoucher = item.Category === CashWithdrawalCategory.PaymentVoucher;
              return (
                <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                    <div className="col-span-2 flex flex-wrap gap-1">
                      <TypeBadge item={item} />
                      {isVoucher && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">Voucher</span>
                      )}
                    </div>
                    <span className="col-span-2 font-medium text-indigo-700">{typeof item.Amount === "number" ? item.Amount.toLocaleString() : "—"}</span>
                    <span className="col-span-4 text-sm text-gray-700">{item.CustomerName || "—"}</span>
                    <span className="col-span-2 text-xs text-gray-400">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : "—"}</span>
                    <div className="col-span-2 flex justify-end">
                      {activeTab === "Pending" && (
                        <Button size="sm" variant="outline" disabled={resendingIds.has(item.Id)} onClick={() => handleResendApproval(item)} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1">
                          <FaUndo /> {resendingIds.has(item.Id) ? "Resending..." : "Resend Approval"}
                        </Button>
                      )}
                      {activeTab === "Authorized" && (
                        <Button size="sm" disabled={postingIds.has(item.Id)} onClick={() => handlePost(item.Id)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
                          <FaPaperPlane /> {postingIds.has(item.Id) ? "Posting..." : "Post"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No {activeTab.toLowerCase()} transactions found.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>
      </>}

      {viewTab === "customer" && <CustomerWorkspace onUseAccount={openAccountTransaction} />}
      {viewTab === "gl" && <TellerGlStatement />}

      <CreateTransactionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={(journal, wasChequeDeposit) => { setReceiptJournal(journal); setReceiptIsChequeDeposit(wasChequeDeposit); fetchItems(); }}
        onDialog={handleDialog}
        initialCustomer={prefillCustomer}
        initialAccounts={prefillAccounts}
        initialAccountId={prefillAccountId}
      />

      <ReceiptModal
        open={!!receiptJournal}
        onClose={() => setReceiptJournal(null)}
        journal={receiptJournal}
        title="Transaction Receipt"
        notice={receiptIsChequeDeposit
          ? "Cheque deposited — pending clearance. Funds are not available until the cheque is transferred, banked, and cleared."
          : undefined}
      />
    </div>
  );
}
