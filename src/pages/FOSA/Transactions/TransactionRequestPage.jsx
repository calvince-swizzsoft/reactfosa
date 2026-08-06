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
import { FaPlus, FaPaperPlane, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { listRequests, createTransaction, postAuthorizedRequest } from "./requestsApi";
import ReceiptModal from "../lib/ReceiptModal";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// Pending/Authorized/Rejected are the same numeric values for both
// CashDepositRequestAuthStatus and CashWithdrawalRequestAuthStatus; the
// "final" state is 8 in both too (Posted for deposits, Paid for
// withdrawals — same value, different label), so one status set works for
// both pages, driven by `finalLabel`.
const STATUS = { Pending: 1, Authorized: 2, Rejected: 4, Final: 8 };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function CustomerSelect({ customers, value, onChange, disabled }) {
  return (
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Search & select customer"} /></SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {customers.map((c) => {
          const name = [c.IndividualFirstName, c.IndividualLastName].filter(Boolean).join(" ")
            || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
          return <SelectItem key={String(c.Id)} value={String(c.Id)}>{name}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}

function AccountSelect({ accounts, value, onChange, disabled, placeholder }) {
  return (
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder || "Select account"} /></SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {accounts.map((a) => (
          <SelectItem key={String(a.Id)} value={String(a.Id)}>
            {a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BranchSelect({ branches, value, onChange, disabled }) {
  return (
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Branch"} /></SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {branches.map((b) => (
          <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const emptyForm = { BranchId: "", CreditCustomerAccountId: "", TotalValue: "", Remarks: "" };

function CreateTransactionDrawer({ open, onClose, onSuccess, type, title, onDialog }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setSelectedCustomerId("");
    setAccounts([]);
    setLoadingData(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/registry/customers`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/administration/branches`).then((r) => r.json()),
    ]).then(([customerData, branchData]) => {
      setCustomers(normalizeList(customerData));
      setBranches(normalizeList(branchData));
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, [open]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.CreditCustomerAccountId || !form.TotalValue) {
      Swal.fire("Missing Fields", "Branch, account, and amount are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      // CreditCustomerAccountId is what the server reads to resolve "the
      // selected account" for every transaction type, not just deposits —
      // confirmed against CashDepositController.Create's actual lookup.
      const data = await createTransaction({
        Type: type,
        BranchId: form.BranchId,
        CreditCustomerAccountId: form.CreditCustomerAccountId,
        TotalValue: Number(form.TotalValue),
        Remarks: form.Remarks,
      });

      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else if (data.data?.dialog) {
        onDialog(data.message, data.data);
        onClose();
      } else {
        Swal.fire("Error", data.message || `Failed to create ${title.toLowerCase()}`, "error");
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
          <motion.div className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">New {title}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FieldGroup label="Customer">
                <CustomerSelect customers={customers} value={selectedCustomerId} onChange={handleCustomerChange} disabled={loadingData} />
              </FieldGroup>
              <FieldGroup label={loadingAccounts ? "Loading accounts..." : "Customer Account"}>
                <AccountSelect
                  accounts={accounts}
                  value={form.CreditCustomerAccountId}
                  onChange={(v) => handleChange("CreditCustomerAccountId", v)}
                  disabled={loadingAccounts || !selectedCustomerId}
                  placeholder={loadingAccounts ? "Loading..." : !selectedCustomerId ? "Select a customer first" : "Select account"}
                />
              </FieldGroup>
              <FieldGroup label="Branch">
                <BranchSelect branches={branches} value={form.BranchId} onChange={(v) => handleChange("BranchId", v)} disabled={loadingData} />
              </FieldGroup>
              <FieldGroup label="Amount">
                <Input type="number" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} required placeholder="1000" />
              </FieldGroup>
              <FieldGroup label="Remarks">
                <Input value={form.Remarks} onChange={(e) => handleChange("Remarks", e.target.value)} placeholder="Optional" />
              </FieldGroup>
              <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Submitting..." : `Submit ${title}`}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const TAB_ORDER = ["Pending", "Authorized", "Final", "Rejected"];

// Shared by CashDeposit.jsx and CashWithdrawal.jsx — the only two
// FrontOfficeTransactionType values GET / actually returns rows for.
// ChequeDeposit/PaymentVoucher don't reuse this: cheque deposits never
// create a pending request (always post directly), and an
// above-limit payment voucher is stored as a plain CashWithdrawalRequest
// server-side with no way to filter it out of this same queue — see
// requestsApi.js's module comment.
export default function TransactionRequestPage({ type, title, icon: Icon, finalLabel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [postingIds, setPostingIds] = useState(new Set());
  const [receiptJournal, setReceiptJournal] = useState(null);

  const tabs = TAB_ORDER.map((id) => ({ id, label: id === "Final" ? finalLabel : id, status: STATUS[id] }));

  const fetchItems = () => {
    setLoading(true);
    listRequests({ type, status: STATUS[activeTab], pageIndex, pageSize })
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
  }, [type, activeTab, pageIndex, pageSize]);

  const changeTab = (id) => { setActiveTab(id); setPageIndex(0); };

  const handlePost = async (id) => {
    const confirm = await Swal.fire({ title: `Post Authorized ${title}?`, icon: "question", showCancelButton: true, confirmButtonColor: "#4f46e5", confirmButtonText: "Post" });
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

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon /> {title}s
        </h2>
        <Button onClick={() => setDrawerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New {title}
        </Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-indigo-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Amount</span>
          <span className="col-span-5">Customer</span>
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
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-3 font-medium text-indigo-700">{typeof item.Amount === "number" ? item.Amount.toLocaleString() : "—"}</span>
                  <span className="col-span-5 text-sm text-gray-700">{item.CustomerName || "—"}</span>
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
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No {activeTab.toLowerCase()} {title.toLowerCase()} requests found.</p>
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
        type={type}
        title={title}
        onSuccess={(journal) => { setReceiptJournal(journal); fetchItems(); }}
        onDialog={(message) => Swal.fire("Authorization Required", message, "info").then(() => fetchItems())}
      />

      <ReceiptModal open={!!receiptJournal} onClose={() => setReceiptJournal(null)} journal={receiptJournal} title={`${title} Receipt`} />
    </div>
  );
}
