import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import {
  FaHandHoldingUsd, FaPaperPlane, FaSearch, FaChevronDown, FaTimes, FaSpinner,
} from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { createSundryPayment, listCreditBatchEntriesByType } from "./sundryPaymentsApi";
import { listAccountClosures } from "./accountClosuresApi";
import {
  GeneralTransactionType, CreditBatchType, BatchEntryStatus, AccountClosureRequestStatus,
} from "../lib/frontOfficeEnums";
import ReceiptModal from "../lib/ReceiptModal";

// api/frontoffice/sundrypayments — docs/api/frontoffice-api-spec.md §13.1-13.3.
// One screen, six tabs, two shapes:
// - Shape A (Cash Payment/Cash Receipt/Cheque Receipt): teller types a G/L
//   account + amount, posts directly.
// - Shape B (Cash Payment (Account Closure)/Cash Pickup): teller browses an
//   existing queue on a DIFFERENT controller (account closures / credit
//   batches) and the client resolves chartOfAccountId/totalValue off the
//   picked row — no typed amount, no typed account.
// Sundry Payment (16) has no server-side implementation at all
// (SundryPaymentsController.Create's switch has no case for it, falls to
// "Unsupported transaction type") — shown as a disabled tab, not built.
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 25007;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

/* ══════════════════════ Shared: G/L account typeahead ══════════════════════ */

function AccountPickerModal({ onSelect, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiFetch(`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`)
      .then((r) => r.json())
      .then((d) => setAccounts(normalizeList(d)))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return accounts;
    const q = query.toLowerCase();
    return accounts.filter((a) =>
      String(a.AccountCode || "").toLowerCase().includes(q) || (a.AccountName || "").toLowerCase().includes(q)
    );
  }, [query, accounts]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">Select G/L Account</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code or name..." className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" /><span className="text-sm">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No accounts found.</p>
          ) : (
            filtered.map((a) => (
              <button
                key={a.Id}
                onClick={() => { onSelect(a); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{a.AccountCode} — {a.AccountName}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AccountPickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

/* ══════════════════════ Shape A: manual entry ══════════════════════ */

const emptyManualForm = { ChartOfAccountId: "", ChartOfAccountLabel: "", TotalValue: "", Reference: "", PrimaryDescription: "" };

function ManualEntryPanel({ transactionType, title, hint, onPosted }) {
  const [form, setForm] = useState(emptyManualForm);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ChartOfAccountId || !(Number(form.TotalValue) > 0)) {
      Swal.fire("Missing Fields", "G/L account and a positive amount are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const journal = await createSundryPayment({
        TransactionType: transactionType,
        ChartOfAccountId: form.ChartOfAccountId,
        TotalValue: Number(form.TotalValue),
        Reference: form.Reference,
        PrimaryDescription: form.PrimaryDescription,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      onPosted(journal);
      setForm(emptyManualForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {hint && (
        <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {hint}
        </p>
      )}

      <AccountPickerField
        label="G/L Account"
        value={form.ChartOfAccountLabel}
        placeholder="Search & select G/L account..."
        onClick={() => setPickerOpen(true)}
      />

      <FieldGroup label="Amount">
        <Input type="number" min="0" value={form.TotalValue} onChange={(e) => setForm((p) => ({ ...p, TotalValue: e.target.value }))} required placeholder="e.g. 5000" />
      </FieldGroup>

      <FieldGroup label="Reference">
        <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} placeholder="Optional" />
      </FieldGroup>

      <FieldGroup label="Description">
        <Input value={form.PrimaryDescription} onChange={(e) => setForm((p) => ({ ...p, PrimaryDescription: e.target.value }))} placeholder="Optional" />
      </FieldGroup>

      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
        <FaPaperPlane /> {loading ? "Posting..." : `Post ${title}`}
      </Button>

      {pickerOpen && (
        <AccountPickerModal
          onSelect={(a) => setForm((p) => ({ ...p, ChartOfAccountId: a.Id, ChartOfAccountLabel: `${a.AccountCode} — ${a.AccountName}` }))}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </form>
  );
}

/* ══════════════════════ Shape B: Cash Payment (Account Closure) ══════════════════════ */

function AccountClosurePickPanel({ onPosted }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = () => {
    setLoading(true);
    listAccountClosures({ status: AccountClosureRequestStatus.Audited, pageSize: 100 })
      .then((page) => setRequests(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      Swal.fire("Missing Selection", "Pick an account closure request first.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const journal = await createSundryPayment({
        TransactionType: GeneralTransactionType.CashPaymentAccountClosure,
        ChartOfAccountId: selected.CustomerAccountTypeTargetProductChartOfAccountId,
        TotalValue: selected.NetRefundable,
        Reference: reference,
        PrimaryDescription: description,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      onPosted(journal);
      setSelected(null);
      setReference("");
      setDescription("");
      fetchQueue();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs text-gray-400">
        Verified (Audited) account closure requests awaiting their refund payout. Pick one to resolve the G/L account and amount automatically.
      </p>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-5">Customer</span>
          <span className="col-span-4">Account</span>
          <span className="col-span-3">Net Refundable</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map((r) => {
              const isSelected = selected?.Id === r.Id;
              return (
                <button
                  key={r.Id}
                  type="button"
                  onClick={() => setSelected(r)}
                  className={`w-full text-left rounded-lg shadow-lg border transition-all ${isSelected ? "bg-indigo-50 border-indigo-300" : "bg-white hover:shadow-xl"}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                    <span className="col-span-5 font-medium text-indigo-700 truncate">{r.CustomerAccountCustomerFullName || "—"}</span>
                    <span className="col-span-4 text-xs font-mono text-gray-500 truncate">{r.CustomerAccountFullAccountNumber || "—"}</span>
                    <span className="col-span-3 font-semibold text-gray-800">{typeof r.NetRefundable === "number" ? r.NetRefundable.toLocaleString() : "—"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No verified account closure requests awaiting payout.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Reference">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
          </FieldGroup>
          <FieldGroup label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </FieldGroup>
        </div>
        <Button type="submit" disabled={submitting || !selected} className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPaperPlane /> {submitting ? "Posting..." : selected ? `Pay Out ${(selected.NetRefundable ?? 0).toLocaleString()}` : "Select a request first"}
        </Button>
      </form>
    </div>
  );
}

/* ══════════════════════ Shape B: Cash Pickup ══════════════════════ */

function CashPickupPickPanel({ onPosted }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = () => {
    setLoading(true);
    listCreditBatchEntriesByType(CreditBatchType.CashPickup, { pageSize: 200 })
      .then((page) => {
        const all = page?.pageCollection || page?.PageCollection || [];
        // Not filtered by status server-side — only Pending entries are
        // actually still payable (Posted ones were already picked up).
        setEntries(all.filter((e) => e.Status === BatchEntryStatus.Pending));
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQueue(); }, []);

  // Principal + Interest, not entry.Amount — CreditBatchEntry has no Amount
  // column, AutoMapper always leaves it 0 (confirmed against source, a
  // preexisting domain-model gap, not something to work around further).
  const payAmount = (entry) => (entry?.Principal ?? 0) + (entry?.Interest ?? 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      Swal.fire("Missing Selection", "Pick a pickup entry first.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const journal = await createSundryPayment({
        TransactionType: GeneralTransactionType.CashPickup,
        ChartOfAccountId: selected.CreditBatchCreditTypeChartOfAccountId,
        TotalValue: payAmount(selected),
        CreditBatchEntryId: selected.Id,
        Reference: reference,
        PrimaryDescription: description,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      onPosted(journal);
      setSelected(null);
      setReference("");
      setDescription("");
      fetchQueue();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs text-gray-400">
        Pending cash-pickup entries pre-captured under Accounts &gt; Credit Batch. If a batch's entries are expected but missing here, the batch likely hasn't been authorized (Posted) yet.
      </p>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-5">Beneficiary</span>
          <span className="col-span-4">G/L Account</span>
          <span className="col-span-3">Amount</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => {
              const isSelected = selected?.Id === entry.Id;
              return (
                <button
                  key={entry.Id}
                  type="button"
                  onClick={() => setSelected(entry)}
                  className={`w-full text-left rounded-lg shadow-lg border transition-all ${isSelected ? "bg-indigo-50 border-indigo-300" : "bg-white hover:shadow-xl"}`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                    <span className="col-span-5 font-medium text-indigo-700 truncate">{entry.Beneficiary || entry.CreditCustomerAccountFullName || "—"}</span>
                    <span className="col-span-4 text-xs text-gray-500 truncate">{entry.CreditBatchCreditTypeChartOfAccountAccountName || "—"}</span>
                    <span className="col-span-3 font-semibold text-gray-800">{payAmount(entry).toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No pending cash-pickup entries found.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Reference">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
          </FieldGroup>
          <FieldGroup label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </FieldGroup>
        </div>
        <Button type="submit" disabled={submitting || !selected} className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPaperPlane /> {submitting ? "Posting..." : selected ? `Pay Out ${payAmount(selected).toLocaleString()}` : "Select an entry first"}
        </Button>
      </form>
    </div>
  );
}

/* ══════════════════════ Unified screen ══════════════════════ */

const TABS = [
  { id: "cashPayment", label: "Cash Payment", transactionType: GeneralTransactionType.CashPayment,
    hint: null },
  { id: "cashReceipt", label: "Cash Receipt", transactionType: GeneralTransactionType.CashReceipt,
    hint: null },
  { id: "chequeReceipt", label: "Cheque Receipt", transactionType: GeneralTransactionType.ChequeReceipt,
    hint: "This only posts the G/L journal — it does not register the physical cheque (number, drawer, drawer's bank) anywhere. If you need those recorded, put them in Reference/Description as free text for now; real cheque capture on this screen is a backend gap." },
  { id: "accountClosure", label: "Cash Payment (Account Closure)", shapeB: "accountClosure" },
  { id: "cashPickup", label: "Cash Pickup", shapeB: "cashPickup" },
  { id: "sundryPayment", label: "Sundry Payment", disabled: true },
];

export default function SundryPayments() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [receiptJournal, setReceiptJournal] = useState(null);

  const tab = TABS.find((t) => t.id === activeTab);
  const handlePosted = (journal) => setReceiptJournal(journal);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaHandHoldingUsd /> Sundry Receipts/Payments
        </h2>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => setActiveTab(t.id)}
            title={t.disabled ? "Not available yet — no server-side implementation for this transaction type." : undefined}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
              t.disabled
                ? "text-gray-300 cursor-not-allowed"
                : activeTab === t.id
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab?.shapeB === "accountClosure" && <AccountClosurePickPanel onPosted={handlePosted} />}
      {tab?.shapeB === "cashPickup" && <CashPickupPickPanel onPosted={handlePosted} />}
      {!tab?.shapeB && !tab?.disabled && (
        <ManualEntryPanel
          key={tab.id}
          transactionType={tab.transactionType}
          title={tab.label}
          hint={tab.hint}
          onPosted={handlePosted}
        />
      )}

      <ReceiptModal open={!!receiptJournal} onClose={() => setReceiptJournal(null)} journal={receiptJournal} title="Sundry Payment Receipt" />
    </div>
  );
}
