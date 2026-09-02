import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaEye, FaLayerGroup, FaSyncAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotFoundImage from "/assets/scopefinding.png";
import { listRecurringBatches, listRecurringBatchEntries } from "./api";

const TYPE_OPTIONS = [
  { value: 0, label: "Interest Capitalization" },
  { value: 1, label: "Dynamic Savings Fees" },
  { value: 2, label: "Indefinite Loan Charges" },
  { value: 3, label: "Standing Order" },
  { value: 4, label: "Investment Balances Adjustment" },
  { value: 5, label: "Investment Balances Pooling" },
  { value: 6, label: "Guarantor Releasing" },
  { value: 7, label: "E-Statement Order" },
  { value: 8, label: "Arrears Recovery" },
  { value: 9, label: "Arrears Recovery From Investment Product" },
];

const STATUS_OPTIONS = [
  { value: 1, label: "Pending" },
  { value: 2, label: "Posted" },
  { value: 4, label: "Rejected" },
  { value: 8, label: "Verified" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const statusClass = (status = "") => {
  const value = status.toLowerCase();
  if (value.includes("posted") || value.includes("complete")) return "bg-green-100 text-green-600";
  if (value.includes("reject") || value.includes("fail")) return "bg-red-100 text-red-600";
  if (value.includes("pending") || value.includes("audit")) return "bg-amber-100 text-amber-600";
  return "bg-gray-100 text-gray-600";
};

const money = (value) => `KES ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const meaningful = (value) => value && value !== "000-0000000-000-000" ? value : "—";

const cleanReference = (value = "") => value.replace(/~+\s*$/g, "").trim();

const readWorkerAmount = (remarks, label) => {
  const match = remarks.match(new RegExp(`${label}=([\\d,.-]+)`, "i"));
  return match ? Number(match[1].replace(/,/g, "")) : null;
};

const standingOrderSummary = (entry) => {
  const order = entry.standingOrder || {};
  const customer = order.benefactorCustomerAccountCustomerFullName || order.beneficiaryCustomerAccountCustomerFullName;
  const source = meaningful(order.benefactorFullAccountNumber);
  const destination = meaningful(order.beneficiaryFullAccountNumber);
  const amount = Number(order.principal || 0) + Number(order.interest || 0);

  return {
    customer: customer || "Member name unavailable",
    route: `${source} → ${destination}`,
    purpose: cleanReference(order.remarks || entry.reference) || "Standing order repayment",
    terms: [
      order.triggerDescription,
      order.scheduleFrequencyDescription,
      amount > 0 ? `${money(amount)} per run` : null,
    ].filter(Boolean).join(" · "),
  };
};

const friendlyOutcome = (entry, month) => {
  const remarks = entry.remarks || "";
  const lower = remarks.toLowerCase();
  const order = entry.standingOrder || {};
  const sourceAvailable = readWorkerAmount(remarks, "source available");
  const expectedPrincipal = readWorkerAmount(remarks, "expected principal");
  const expectedInterest = readWorkerAmount(remarks, "expected interest");
  const recoverablePrincipal = readWorkerAmount(remarks, "recoverable principal");
  const recoverableInterest = readWorkerAmount(remarks, "recoverable interest");
  const expected = Number(expectedPrincipal || 0) + Number(expectedInterest || 0);
  const recoverable = Number(recoverablePrincipal || 0) + Number(recoverableInterest || 0);

  if (lower.includes("schedule arrears recovery") && lower.includes("no transactions")) {
    return {
      title: `Already processed for ${month || "this period"}`,
      detail: "No additional principal or interest was due, so the system did not post another recovery.",
    };
  }
  if (lower.includes("execute fresh recovery") && expected > 0 && recoverable === 0 && Number(order.beneficiaryCustomerAccountCustomerAccountTypeProductCode) === 2) {
    return {
      title: "No outstanding loan balance was available to recover",
      detail: `The standing order expected ${money(expected)}, and the source account had ${money(sourceAvailable)}, but the destination loan account reported no recoverable principal or interest. Confirm that the loan was disbursed and that this standing order points to the correct loan account.`,
    };
  }
  if (lower.includes("execute fresh recovery") && expected > 0 && recoverable === 0 && sourceAvailable === 0) {
    return {
      title: "The source account had no available funds",
      detail: `This standing order expected ${money(expected)}, but the source account had no available balance when processing ran.`,
    };
  }
  if (lower.includes("no transactions")) {
    return {
      title: "Nothing was available to post",
      detail: "The calculated recoverable principal and interest were both zero.",
    };
  }
  if (!remarks) {
    return { title: "Waiting for processing", detail: "No processing result has been recorded yet." };
  }
  if (lower.startsWith("succeeded")) {
    return { title: "Posted successfully", detail: "The standing-order transaction was posted." };
  }
  return {
    title: lower.startsWith("failed") ? "Standing order was not posted" : "Processing details",
    detail: remarks.replace(/^failed\s*[-–>]+\s*/i, "").replace(/^succeeded\s*[-–>]+\s*/i, "").trim(),
  };
};

function BatchDrawer({ batch, onClose }) {
  const [entries, setEntries] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    if (!batch?.id) return;
    setLoading(true);
    listRecurringBatchEntries(batch.id, { text: search, pageIndex, pageSize })
      .then((page) => {
        setEntries(page?.pageCollection || []);
        setItemsCount(page?.itemsCount || 0);
      })
      .catch((error) => {
        setEntries([]);
        setItemsCount(0);
        Swal.fire("Unable to load entries", error.message, "error");
      })
      .finally(() => setLoading(false));
  }, [batch?.id, pageIndex, search]);

  if (!batch) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-3 right-3 h-[92vh] w-[88vw] max-w-[1050px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3 shrink-0">
          <div>
            <h2 className="font-bold text-white">Recurring Batch #{batch.paddedBatchNumber}</h2>
            <p className="text-xs text-indigo-100">{batch.typeDescription} · {batch.reference || "No reference"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm shrink-0">
          <div><p className="text-gray-400">Status</p><span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusClass(batch.statusDescription)}`}>{batch.statusDescription || "—"}</span></div>
          <div><p className="text-gray-400">Month</p><p className="font-medium">{batch.monthDescription || "—"}</p></div>
          <div><p className="text-gray-400">Posted entries</p><p className="font-medium">{batch.postedEntries || "0/0"}</p></div>
          <div><p className="text-gray-400">Created</p><p className="font-medium">{formatDateTime(batch.createdDate)}</p></div>
          <div className="col-span-2"><p className="text-gray-400">Batch ID</p><p className="font-mono text-xs break-all">{batch.id}</p></div>
          <div><p className="text-gray-400">Priority</p><p className="font-medium">{batch.priorityDescription || "—"}</p></div>
          <div><p className="text-gray-400">Created by</p><p className="font-medium">{batch.createdBy || "—"}</p></div>
        </div>

        <div className="px-5 pb-3 shrink-0">
          <Input value={search} onChange={(event) => { setSearch(event.target.value); setPageIndex(0); }} placeholder="Search entry account, reference or remarks..." />
        </div>

        <div className="px-5 pb-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
            <span className="col-span-2">Status</span><span className="col-span-4">Standing order</span><span className="col-span-4">What happened</span><span className="col-span-2">Processed</span>
          </div>
          {loading ? <div className="p-8 text-center text-gray-400">Loading entries...</div> : entries.length ? (
            <div className="space-y-2">
              {entries.map((entry) => {
                const summary = standingOrderSummary(entry);
                const outcome = friendlyOutcome(entry, batch.monthDescription);
                return (
                  <div key={entry.id} className="grid grid-cols-12 gap-3 bg-white border rounded-lg shadow p-3 text-sm items-start">
                    <span className={`col-span-2 w-fit px-2 py-1 rounded text-xs font-semibold ${statusClass(entry.statusDescription)}`}>{entry.statusDescription || "—"}</span>
                    <div className="col-span-4 min-w-0">
                      <p className="font-semibold text-gray-800 break-words">{summary.customer}</p>
                      <p className="font-medium text-indigo-700 break-words">{summary.route}</p>
                      <p className="text-xs text-gray-600 break-words">{summary.purpose}</p>
                      {summary.terms && <p className="text-xs text-gray-400 mt-1">{summary.terms}</p>}
                    </div>
                    <div className="col-span-4 min-w-0">
                      <p className="font-semibold text-gray-800">{outcome.title}</p>
                      <p className="text-xs text-gray-600 mt-1 break-words">{outcome.detail}</p>
                      <details className="mt-2 text-xs text-gray-500">
                        <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700">Technical details</summary>
                        <p className="font-mono break-all mt-1">Standing order ID: {entry.standingOrderId || "—"}</p>
                        <p className="whitespace-pre-wrap break-words mt-1">{entry.remarks || "No worker output recorded."}</p>
                      </details>
                    </div>
                    <div className="col-span-2 text-xs text-gray-600">
                      <p>{formatDateTime(entry.createdDate)}</p>
                      <p className="text-gray-400 mt-1 break-words">{entry.createdBy || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="p-8 text-center text-gray-400">No entries found for this batch.</div>}
        </div>

        <div className="border-t px-5 py-3 flex justify-center items-center gap-3 shrink-0">
          <Button size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((value) => value - 1)}><FaChevronLeft /> Prev</Button>
          <span className="text-sm">Page {pageIndex + 1} of {Math.max(1, Math.ceil(itemsCount / pageSize))}</span>
          <Button size="sm" disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((value) => value + 1)}>Next <FaChevronRight /></Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function RecurringBatches() {
  const [items, setItems] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    listRecurringBatches({
      type: type === "" ? undefined : type,
      status: status === "" ? undefined : status,
      pageIndex,
      pageSize,
    })
      .then((page) => { setItems(page?.pageCollection || []); setItemsCount(page?.itemsCount || 0); })
      .catch((error) => { setItems([]); setItemsCount(0); Swal.fire("Unable to load recurring batches", error.message, "error"); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [pageIndex, pageSize, type, status]);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaLayerGroup /> Recurring Batches</h2>
        <div className="flex gap-2">
          <Link to="/Accounts/StandingOrders"><Button variant="outline" className="bg-white"><FaArrowLeft /> Standing Orders</Button></Link>
          <Link to="/Accounts/StandingOrders/Execution"><Button variant="outline" className="bg-white"><FaSyncAlt /> Execution</Button></Link>
        </div>
      </div>

      <div className="flex justify-end gap-3 mb-4">
        <select value={type} onChange={(event) => { setType(event.target.value === "" ? "" : Number(event.target.value)); setPageIndex(0); }} className="border p-2 rounded-lg">
          <option value="">All batch types</option>
          {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value === "" ? "" : Number(event.target.value)); setPageIndex(0); }} className="border p-2 rounded-lg">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }} className="border p-2 rounded-lg">
          {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}
        </select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Batch</span><span className="col-span-2">Type</span><span className="col-span-2">Month</span><span className="col-span-2">Progress</span><span className="col-span-2">Status</span><span className="col-span-1">Created</span><span className="col-span-1 text-right">View</span>
        </div>
        {loading ? <div className="p-10 text-center text-gray-400">Loading recurring batches...</div> : items.length ? (
          <div className="space-y-2">
            {items.map((batch) => (
              <button key={batch.id} type="button" onClick={() => setSelected(batch)} className="w-full grid grid-cols-12 gap-4 items-center bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition-all text-left">
                <div className="col-span-2"><p className="font-semibold">#{batch.paddedBatchNumber}</p><p className="text-xs text-gray-400 truncate">{batch.reference || "—"}</p></div>
                <p className="col-span-2 text-sm">{batch.typeDescription || "—"}</p>
                <p className="col-span-2 text-sm">{batch.monthDescription || "—"}</p>
                <p className="col-span-2 text-sm font-semibold">{batch.postedEntries || "0/0"}</p>
                <span className={`col-span-2 w-fit px-2 py-1 rounded text-xs font-semibold ${statusClass(batch.statusDescription)}`}>{batch.statusDescription || "—"}</span>
                <p className="col-span-1 text-xs">{formatDateTime(batch.createdDate)}</p>
                <span className="col-span-1 flex justify-end"><FaEye className="text-indigo-600" /></span>
              </button>
            ))}
          </div>
        ) : <div className="text-center p-8"><img src={NotFoundImage} className="mx-auto w-32" alt="No recurring batches" /><p className="text-gray-400">No recurring batches found.</p></div>}

        <div className="flex justify-center items-center mt-4 gap-3">
          <Button size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((value) => value - 1)}><FaChevronLeft /> Prev</Button>
          <span>Page {pageIndex + 1} of {Math.max(1, Math.ceil(itemsCount / pageSize))}</span>
          <Button size="sm" disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((value) => value + 1)}>Next <FaChevronRight /></Button>
        </div>
      </div>

      {selected && <BatchDrawer batch={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
