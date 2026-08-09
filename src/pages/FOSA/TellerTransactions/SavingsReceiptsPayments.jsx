import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaMoneyBillWave, FaPlus, FaPaperPlane, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { listRequests, createTransaction, postAuthorizedRequest } from "./requestsApi";
import { FrontOfficeTransactionType, CashWithdrawalCategory } from "../lib/frontOfficeEnums";
import ReceiptModal from "../lib/ReceiptModal";

// Savings Receipts/Payments — the app's one real nav item for the whole
// teller transaction cycle (NavigationMenu.cs: ControllerName "CashDeposit",
// Description "Savings Receipts/Payments"). One screen, one
// POST/GET api/frontoffice/requests endpoint, four FrontOfficeTransactionType
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

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

const emptyForm = {
  Type: FrontOfficeTransactionType.CashDeposit,
  BranchId: "",
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
};

function CreateTransactionDrawer({ open, onClose, onSuccess, onDialog }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [chequeTypes, setChequeTypes] = useState([]);
  const [loadingChequeTypes, setLoadingChequeTypes] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setSelectedCustomerId("");
    setAccounts([]);
    setChequeTypes([]);
    setLoadingData(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/registry/customers`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
    ]).then(([customerData, branchData]) => {
      setCustomers(normalizeList(customerData));
      setBranches(normalizeList(branchData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

  const isChequeDeposit = form.Type === FrontOfficeTransactionType.ChequeDeposit;

  // ChequeTypeController.GetAll (docs/api/cheque-type-api-spec.md §5.2) —
  // every cheque type, unpaged, meant for exactly this kind of picker.
  // Fetched lazily only once Cheque Deposit is actually selected, not
  // upfront with customers/branches.
  useEffect(() => {
    if (!open || !isChequeDeposit || chequeTypes.length > 0) return;
    setLoadingChequeTypes(true);
    apiFetch(`${FIN_BASE}/api/accounts/chequetypes/all`)
      .then((r) => r.json())
      .then((d) => setChequeTypes(normalizeList(d)))
      .catch(() => setChequeTypes([]))
      .finally(() => setLoadingChequeTypes(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isChequeDeposit]);

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    setAccounts([]);
    setForm((p) => ({ ...p, CreditCustomerAccountId: "" }));
    if (!customerId) return;
    setLoadingAccounts(true);
    apiFetch(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const isPaymentVoucher = form.Type === FrontOfficeTransactionType.CashWithdrawalPaymentVoucher;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.CreditCustomerAccountId || !form.TotalValue) {
      Swal.fire("Missing Fields", "Branch, account, and amount are required.", "warning");
      return;
    }
    if (isChequeDeposit && (!form.ChequeNumber || !form.Drawer || !form.DrawerBank || !form.DrawerBankBranch)) {
      Swal.fire("Missing Fields", "Cheque number, drawer, drawer bank, and drawer bank branch are required.", "warning");
      return;
    }
    if (isPaymentVoucher && (!form.Payee || !form.VoucherReference)) {
      Swal.fire("Missing Fields", "Payee and voucher reference are required.", "warning");
      return;
    }

    setLoading(true);
    try {
      // CreditCustomerAccountId is what the server reads to resolve "the
      // selected account" for every transaction type, not just deposits —
      // confirmed against CashDepositController.Create's actual lookup.
      const payload = {
        Type: form.Type,
        BranchId: form.BranchId,
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
          ChequeType: form.ChequeType,
          WriteDate: form.WriteDate ? new Date(form.WriteDate).toISOString() : null,
        });
      } else if (isPaymentVoucher) {
        // CustomerTransactionModel.PaymentVoucher isn't initialized in the
        // model's own constructor — ProcessCustomerTransactionAsync's
        // voucher branch dereferences PaymentVoucher.Reference/.Payee
        // directly, so omitting this object would NPE server-side.
        payload.PaymentVoucher = {
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
        onSuccess(data.data);
        onClose();
      } else if (data.data?.dialog) {
        onDialog(data.message, data.data);
        onClose();
      } else {
        Swal.fire("Error", data.message || "Failed to create transaction", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
              <FieldGroup label="Transaction Type">
                <Select value={String(form.Type)} onValueChange={(v) => handleChange("Type", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Customer">
                <Select value={selectedCustomerId ? String(selectedCustomerId) : ""} onValueChange={handleCustomerChange} disabled={loadingData}>
                  <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Search & select customer"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {customers.map((c) => {
                      const name = [c.IndividualFirstName, c.IndividualLastName].filter(Boolean).join(" ")
                        || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
                      return <SelectItem key={String(c.Id)} value={String(c.Id)}>{name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"}>
                <Select value={form.CreditCustomerAccountId ? String(form.CreditCustomerAccountId) : ""} onValueChange={(v) => handleChange("CreditCustomerAccountId", v)} disabled={loadingAccounts || !selectedCustomerId}>
                  <SelectTrigger><SelectValue placeholder={loadingAccounts ? "Loading..." : !selectedCustomerId ? "Select a customer first" : "Select account"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {accounts.map((a) => (
                      <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Branch">
                <Select value={form.BranchId ? String(form.BranchId) : ""} onValueChange={(v) => handleChange("BranchId", v)} disabled={loadingData}>
                  <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} /></SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Amount">
                <Input type="number" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="1000" />
              </FieldGroup>

              {isChequeDeposit && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <FieldGroup label="Cheque Number">
                    <Input value={form.ChequeNumber} onChange={(e) => handleChange("ChequeNumber", e.target.value)} required placeholder="e.g. 000482" />
                  </FieldGroup>
                  <FieldGroup label="Write Date">
                    <Input type="date" value={form.WriteDate} onChange={(e) => handleChange("WriteDate", e.target.value)} />
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
                  <FieldGroup label="Write Date">
                    <Input type="date" value={form.WriteDate} onChange={(e) => handleChange("WriteDate", e.target.value)} />
                  </FieldGroup>
                  <FieldGroup label="Payee">
                    <Input value={form.Payee} onChange={(e) => handleChange("Payee", e.target.value)} required placeholder="e.g. Jane Doe" />
                  </FieldGroup>
                  <FieldGroup label="Voucher Reference">
                    <Input value={form.VoucherReference} onChange={(e) => handleChange("VoucherReference", e.target.value)} required placeholder="Voucher reference" />
                  </FieldGroup>
                </div>
              )}

              <FieldGroup label="Remarks">
                <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
              </FieldGroup>
            </div>

            <div className="p-4 pt-3 border-t shrink-0">
              <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Submitting..." : "Submit Transaction"}
              </Button>
            </div>
            </form>
          </motion.div>
        </>
      )}
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
  const [receiptJournal, setReceiptJournal] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    // No `type` — merged deposit+withdrawal queue (form-layout doc). The
    // type filter below is applied client-side against this same page,
    // no second request needed.
    listRequests({ status: STATUS[activeTab], pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pageIndex, pageSize]);

  const changeTab = (id) => { setActiveTab(id); setPageIndex(0); };

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
      Swal.fire("Error", err.message, "error");
    } finally {
      setPostingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
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
        <Button onClick={() => setDrawerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Transaction
        </Button>
      </div>

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

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Type</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Date</span>
          <span className="col-span-2 text-right">{activeTab === "Authorized" ? "Actions" : ""}</span>
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

      <CreateTransactionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={(journal) => { setReceiptJournal(journal); fetchItems(); }}
        onDialog={handleDialog}
      />

      <ReceiptModal open={!!receiptJournal} onClose={() => setReceiptJournal(null)} journal={receiptJournal} title="Transaction Receipt" />
    </div>
  );
}
