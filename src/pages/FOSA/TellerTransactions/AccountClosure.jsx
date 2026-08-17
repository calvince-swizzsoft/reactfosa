import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaUserSlash, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  listAccountClosures, getAccountClosure, approveAccountClosure,
  verifyAccountClosure, settleAccountClosure,
} from "./accountClosuresApi";
import { createSundryPayment } from "./sundryPaymentsApi";
import { AccountClosureRequestStatus, AccountClosureActionOption, GeneralTransactionType } from "../lib/frontOfficeEnums";
import StatusStepper from "../lib/StatusStepper";

// api/frontoffice/accountclosures — docs/api/frontoffice-api-spec.md §10.
const MODULE_NAVIGATION_ITEM_CODE = 25014;

const STEPS = ["Registered", "Approved", "Verified", "Settled"];
const STEP_INDEX = {
  [AccountClosureRequestStatus.Registered]: 0,
  [AccountClosureRequestStatus.Approved]: 1,
  [AccountClosureRequestStatus.Audited]: 2,
  [AccountClosureRequestStatus.Settled]: 3,
};

const STATUS_BADGE = {
  Registered: "bg-yellow-100 text-yellow-700",
  Approved: "bg-blue-100 text-blue-700",
  Verified: "bg-purple-100 text-purple-700",
  Settled: "bg-green-100 text-green-700",
  Deferred: "bg-gray-100 text-gray-500",
};

const STATUS_OPTIONS = [
  { value: AccountClosureRequestStatus.Registered, label: "Registered" },
  { value: AccountClosureRequestStatus.Approved, label: "Approved" },
  { value: AccountClosureRequestStatus.Audited, label: "Verified" },
  { value: AccountClosureRequestStatus.Settled, label: "Settled" },
  { value: AccountClosureRequestStatus.Deferred, label: "Deferred" },
];

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

// Settle only flips status + closes the account (WORKFLOW.md §9) — the
// refund payout is a genuinely separate manual call, no server-enforced
// ordering, per frontoffice-api-spec.md §10. Prompted here right after a
// successful Settle so it isn't forgotten as a second trip through the app.
async function promptPayout(request) {
  if (!(request.NetRefundable > 0)) return;
  const confirm = await Swal.fire({
    title: "Process the refund payout now?",
    html: `Net refundable: <b>${request.NetRefundable.toLocaleString()}</b> to G/L account <b>${request.CustomerAccountTypeTargetProductChartOfAccountName || request.CustomerAccountTypeTargetProductChartOfAccountId}</b>`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#4f46e5",
    confirmButtonText: "Pay Out Now",
    cancelButtonText: "Later",
  });
  if (!confirm.isConfirmed) return;
  try {
    await createSundryPayment({
      TransactionType: GeneralTransactionType.CashPaymentAccountClosure,
      ChartOfAccountId: request.CustomerAccountTypeTargetProductChartOfAccountId,
      TotalValue: request.NetRefundable,
      Reference: request.CustomerAccountFullAccountNumber,
      PrimaryDescription: `Account closure refund — ${request.CustomerAccountCustomerFullName}`,
      ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
    });
    Swal.fire("Success", "Refund payout posted", "success");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

function AccountClosureDetailDrawer({ id, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOne = () => {
    if (!id) return;
    setLoading(true);
    getAccountClosure(id).then(setRequest).catch(() => setRequest(null)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOne(); setRemarks(""); }, [id]);

  if (!id) return null;

  const isDeferred = request?.Status === AccountClosureRequestStatus.Deferred;
  const stepIndex = request ? (STEP_INDEX[request.Status] ?? 0) : 0;

  // A Deferred record always re-enters through Approve, regardless of
  // which step deferred it — confirmed against the app service's own
  // preconditions: Verify only accepts an Approved request and Settle only
  // accepts an Audited one, neither ever accepts Deferred, only Approve does.
  const step = isDeferred || request?.Status === AccountClosureRequestStatus.Registered
    ? "approve"
    : request?.Status === AccountClosureRequestStatus.Approved
      ? "verify"
      : request?.Status === AccountClosureRequestStatus.Audited
        ? "settle"
        : null;

  const STEP_CONFIG = {
    approve: { label: "Approve", fn: approveAccountClosure, successAct: "approved" },
    verify: { label: "Verify", fn: verifyAccountClosure, successAct: "verified" },
    settle: { label: "Settle", fn: settleAccountClosure, successAct: "settled" },
  };

  const runTransition = async (option) => {
    if (!step) return;
    const cfg = STEP_CONFIG[step];
    const label = option === AccountClosureActionOption.Defer ? "Defer" : cfg.label;
    const confirm = await Swal.fire({
      title: `${label} this account closure request?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: option === AccountClosureActionOption.Defer ? "#f59e0b" : "#4f46e5",
      confirmButtonText: label,
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(true);
    try {
      const updated = await cfg.fn(id, { Option: option, Remarks: remarks });
      setRequest(updated);
      setRemarks("");
      onChanged?.();
      if (step === "settle" && option === AccountClosureActionOption.Act) {
        await promptPayout(updated);
      } else {
        Swal.fire("Success", `Request ${label.toLowerCase()}d`, "success");
      }
      fetchOne();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-5 right-3 w-[460px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
          <h2 className="font-bold text-lg text-white">Account Closure Request</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {loading || !request ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <>
              <StatusStepper steps={STEPS} currentIndex={stepIndex} deferred={isDeferred} />
              {isDeferred && (
                <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Deferred — awaiting re-submission for the last pending step.
                </p>
              )}

              <div className="divide-y divide-gray-100 border rounded-lg px-3">
                <DetailRow label="Customer" value={request.CustomerAccountCustomerFullName} />
                <DetailRow label="Account" value={request.CustomerAccountFullAccountNumber} />
                <DetailRow label="Reason" value={request.Reason} />
                <DetailRow label="Net Refundable" value={typeof request.NetRefundable === "number" ? request.NetRefundable.toLocaleString() : "—"} />
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BADGE[request.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                    {request.StatusDescription || "—"}
                  </span>
                </div>
                {request.ApprovalRemarks && <DetailRow label="Approval Remarks" value={request.ApprovalRemarks} />}
                {request.AuditRemarks && <DetailRow label="Verification Remarks" value={request.AuditRemarks} />}
              </div>

              {step && (
                <div className="space-y-2 border-t pt-3">
                  <Label className="font-semibold text-gray-700 block">{STEP_CONFIG[step].label}</Label>
                  <Input placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  <div className="flex gap-2">
                    <Button disabled={submitting} onClick={() => runTransition(AccountClosureActionOption.Act)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                      {STEP_CONFIG[step].label}
                    </Button>
                    <Button disabled={submitting} onClick={() => runTransition(AccountClosureActionOption.Defer)} variant="outline" className="flex-1 text-amber-700">
                      Defer
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AccountClosure() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    listAccountClosures({ status: statusFilter === "" ? undefined : Number(statusFilter), text: search, pageIndex, pageSize })
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
  }, [search, statusFilter, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };
  const handleStatusChange = (v) => { setStatusFilter(v === "all" ? "" : v); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUserSlash /> Account Closure
        </h2>
        <Link
          to="/FrontOffice/AccountClosure/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> New Closure Request
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input value={search} onChange={handleSearchChange} placeholder="Search..." className="max-w-xs" />
        <Select value={statusFilter === "" ? "all" : statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Customer</span>
          <span className="col-span-3">Account</span>
          <span className="col-span-3">Net Refundable</span>
          <span className="col-span-2">Status</span>
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
              <button key={item.Id} onClick={() => setSelectedId(item.Id)} className="w-full text-left bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-4 font-medium text-indigo-700 truncate">{item.CustomerAccountCustomerFullName || "—"}</span>
                  <span className="col-span-3 text-xs font-mono text-gray-500 truncate">{item.CustomerAccountFullAccountNumber || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-700">{typeof item.NetRefundable === "number" ? item.NetRefundable.toLocaleString() : "—"}</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_BADGE[item.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                      {item.StatusDescription || "—"}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No account closure requests found.</p>
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

      {selectedId && (
        <AccountClosureDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchItems} />
      )}
    </div>
  );
}
