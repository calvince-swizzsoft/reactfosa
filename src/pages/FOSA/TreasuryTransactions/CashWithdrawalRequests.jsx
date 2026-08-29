import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerLookupModal from "@/pages/Registry/Customers/Documents/CustomerLookupModal";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { normalizeWorkflowItem, toApprovalWorkflowItemDto, WorkflowRecordStatus } from "@/lib/workflowFormat";
import { FaChevronLeft, FaChevronRight, FaClipboardList, FaInfoCircle, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const BASE = `${FIN_BASE}/api/frontoffice/cash-withdrawal-requests`;
const ADMIN_BASE = `${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/workflows`;
const CASH_WITHDRAWAL_PERMISSION = 44992;
const STATUSES = [
  { value: 1, label: "Pending" }, { value: 2, label: "Authorized" },
  { value: 4, label: "Rejected" }, { value: 8, label: "Paid" },
];
const FILTERS = [
  [0, "Serial Number"], [1, "Personal Identification #"], [2, "First Name"],
  [3, "Last Name"], [4, "Identity Card #"], [6, "Organisation Name"],
  [7, "Organisation Registration #"], [16, "Account Reference"],
];

const read = (item, ...keys) => keys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value) => value ? new Date(value).toLocaleDateString() : "—";
const customerName = (customer) => [customer?.IndividualFirstName, customer?.IndividualLastName].filter(Boolean).join(" ") || customer?.NonIndividualDescription || customer?.Description || "Selected customer";
const accountLabel = (account) => read(account, "FullAccountNumber", "CustomerAccountFullAccountNumber") || read(account, "CustomerAccountTypeTargetProductDescription") || read(account, "Id", "id");

function FieldGroup({ label, help, children }) {
  return <div>
    <div className="flex items-center gap-1.5 mb-1">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {help && <Popover><PopoverTrigger asChild><button type="button" aria-label={`Information about ${label}`} className="text-gray-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"><FaInfoCircle className="text-xs" /></button></PopoverTrigger><PopoverContent className="w-72 text-sm text-gray-600">{help}</PopoverContent></Popover>}
    </div>
    {children}
  </div>;
}

function Drawer({ title, onClose, children, footer }) {
  return <AnimatePresence><><motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.div className="fixed top-5 right-3 w-[460px] max-w-[calc(100vw-24px)] h-[calc(100vh-40px)] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
    <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0"><h2 className="font-bold text-lg text-white">{title}</h2><Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button></div>
    <div className="p-4 flex-1 overflow-y-auto">{children}</div>
    {footer && <div className="p-4 border-t border-gray-100 shrink-0">{footer}</div>}
  </motion.div></></AnimatePresence>;
}

function CreateDrawer({ onClose, onCreated }) {
  const [customer, setCustomer] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState("0");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saving, setSaving] = useState(false);
  const account = accounts.find((item) => String(read(item, "Id", "id")) === accountId);

  const selectCustomer = (selected) => {
    setCustomer(selected); setAccountId(""); setAccounts([]); setLoadingAccounts(true);
    apiJson(`${FIN_BASE}/api/accounts/customer-accounts/${read(selected, "Id", "id")}/accounts`)
      .then((response) => setAccounts(normalizeList(response)))
      .catch((error) => Swal.fire("Unable to Load Accounts", apiErrorMessage(error, "The customer's accounts could not be loaded."), "error"))
      .finally(() => setLoadingAccounts(false));
  };

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!account || !Number.isFinite(numericAmount) || numericAmount <= 0 || !remarks.trim()) {
      Swal.fire("Missing Information", "Select a savings account, enter an amount greater than zero, and provide remarks.", "warning"); return;
    }
    const branchId = read(account, "BranchId", "CustomerAccountBranchId");
    if (!branchId) { Swal.fire("Account Configuration", "The selected account has no branch linkage.", "error"); return; }
    setSaving(true);
    try {
      await apiJson(BASE, { method: "POST", body: JSON.stringify({
        BranchId: branchId,
        CustomerAccountId: read(account, "Id", "id"),
        CustomerAccountBranchId: branchId,
        CustomerAccountCustomerAccountTypeTargetProductId: read(account, "CustomerAccountTypeTargetProductId"),
        Type: Number(type), Amount: numericAmount, Remarks: remarks.trim(),
      }) });
      await Swal.fire("Request Created", "The cash withdrawal request is pending authorization.", "success"); onCreated();
    } catch (error) { Swal.fire("Unable to Create Request", apiErrorMessage(error, "The cash withdrawal request could not be created."), "error"); }
    finally { setSaving(false); }
  };

  return <><Drawer title="New Cash Withdrawal Request" onClose={onClose} footer={<Button type="button" disabled={saving} onClick={submit} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Creating..." : "Create Request"}</Button>}>
    <div className="space-y-4">
      <FieldGroup label="Customer" help="Search for the customer who is lodging the withdrawal notice."><Button type="button" onClick={() => setShowCustomerPicker(true)} className="w-full justify-start bg-white text-gray-700 border hover:bg-indigo-50">{customer ? customerName(customer) : "Search & select customer"}</Button></FieldGroup>
      <FieldGroup label="Savings Account" help="The account from which the customer intends to withdraw. Its branch and savings product determine how the request matures."><Select value={accountId} onValueChange={setAccountId} disabled={!customer || loadingAccounts}><SelectTrigger><SelectValue placeholder={!customer ? "Select a customer first" : loadingAccounts ? "Loading accounts..." : "Select savings account"} /></SelectTrigger><SelectContent className="max-h-60 overflow-y-auto">{accounts.map((item) => <SelectItem key={String(read(item, "Id", "id"))} value={String(read(item, "Id", "id"))}>{accountLabel(item)}</SelectItem>)}</SelectContent></Select></FieldGroup>
      <FieldGroup label="Notice Type" help="Immediate notice matures today. Future notice uses the savings product's withdrawal-notice period and the business-day calendar."><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Immediate Notice</SelectItem><SelectItem value="1">Future Notice</SelectItem></SelectContent></Select></FieldGroup>
      <FieldGroup label="Amount" help="The amount the customer is notifying the institution that they intend to withdraw."><Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></FieldGroup>
      <FieldGroup label="Remarks" help="Record the purpose or context of the notice. This remains part of the audit trail."><textarea className="w-full min-h-24 border rounded-md p-2 text-sm" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></FieldGroup>
    </div>
  </Drawer>{showCustomerPicker && <CustomerLookupModal onSelect={selectCustomer} onClose={() => setShowCustomerPicker(false)} />}</>;
}

function DecisionDrawer({ item, workflowItem, onClose, onSaved }) {
  const [option, setOption] = useState("1"); const [remarks, setRemarks] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!remarks.trim()) { Swal.fire("Remarks Required", "Explain the authorization or rejection decision.", "warning"); return; }
    setSaving(true);
    try { const workflowStatus = option === "1" ? WorkflowRecordStatus.Approved : WorkflowRecordStatus.Rejected; const result = await apiJson(`${ADMIN_BASE}/items/approve`, { method: "POST", body: JSON.stringify({ WorkflowItem: toApprovalWorkflowItemDto(workflowItem, { status: workflowStatus, remarks: remarks.trim() }), UsedBiometrics: false }) }); await Swal.fire("Decision Recorded", result?.message || result?.Message || "The workflow decision was recorded. The request status will update when the workflow processor completes it.", "success"); onSaved(); }
    catch (error) { Swal.fire("Unable to Update Request", apiErrorMessage(error, "The decision could not be saved."), "error"); }
    finally { setSaving(false); }
  };
  return <Drawer title="Authorize or Reject Request" onClose={onClose} footer={<Button type="button" disabled={saving} onClick={submit} className={`w-full ${option === "2" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>{saving ? "Saving..." : option === "1" ? "Authorize Request" : "Reject Request"}</Button>}><div className="space-y-4">
    <div className="rounded-lg border divide-y px-3 text-sm"><div className="flex justify-between py-2"><span className="text-gray-500">Customer</span><span className="font-medium">{item.CustomerName || item.CustomerAccountCustomerFullName || "—"}</span></div><div className="flex justify-between py-2"><span className="text-gray-500">Account</span><span className="font-medium">{item.CustomerAccountFullAccountNumber || "—"}</span></div><div className="flex justify-between py-2"><span className="text-gray-500">Amount</span><span className="font-semibold text-indigo-700">{money(item.Amount)}</span></div><div className="flex justify-between py-2"><span className="text-gray-500">Maturity</span><span className="font-medium">{date(item.MaturityDate)}</span></div></div>
    <FieldGroup label="Decision" help="Only pending, mature requests may be authorized or rejected. Authorized requests become available to the teller for payment."><Select value={option} onValueChange={setOption}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Authorize</SelectItem><SelectItem value="2">Reject</SelectItem></SelectContent></Select></FieldGroup>
    <FieldGroup label="Decision Remarks" help="Required audit explanation for either authorization or rejection."><textarea className="w-full min-h-28 border rounded-md p-2 text-sm" value={remarks} onChange={(event) => setRemarks(event.target.value)} /></FieldGroup>
  </div></Drawer>;
}

export default function CashWithdrawalRequests() {
  const [items, setItems] = useState([]); const [count, setCount] = useState(0); const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(1); const [search, setSearch] = useState(""); const [filter, setFilter] = useState(2); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [page, setPage] = useState(0); const [createOpen, setCreateOpen] = useState(false); const [decision, setDecision] = useState(null); const [workflowItems, setWorkflowItems] = useState([]); const pageSize = 20;
  const load = useCallback(() => { setLoading(true); const params = new URLSearchParams({ status: String(status), customerFilter: String(filter), pageIndex: String(page), pageSize: String(pageSize) }); if (search.trim()) params.set("text", search.trim()); if (startDate) params.set("startDate", startDate); if (endDate) params.set("endDate", endDate); const workflowParams = new URLSearchParams({ status: String(WorkflowRecordStatus.Pending), text: "", startDate: "0001-01-01T00:00:00", endDate: "9999-12-31T23:59:59", pageIndex: "0", pageSize: "1000" }); Promise.all([apiJson(`${BASE}?${params}`), apiJson(`${ADMIN_BASE}/items/mine?${workflowParams}`)]).then(([response, workflowResponse]) => { const payload = response?.data ?? response?.Data ?? response; setItems(payload?.PageCollection || payload?.pageCollection || []); setCount(payload?.ItemsCount ?? payload?.itemsCount ?? 0); setWorkflowItems(normalizeList(workflowResponse).map(normalizeWorkflowItem).filter((workflow) => Number(workflow.workflowSystemPermissionType) === CASH_WITHDRAWAL_PERMISSION && !workflow.isLocked)); }).catch((error) => { setItems([]); setCount(0); setWorkflowItems([]); Swal.fire("Unable to Load Requests", apiErrorMessage(error, "Cash withdrawal requests could not be loaded."), "error"); }).finally(() => setLoading(false)); }, [status, filter, page, search, startDate, endDate]);
  useEffect(() => { load(); }, [load]);
  const applyFilters = (event) => { event.preventDefault(); if (page === 0) load(); else setPage(0); };
  const refreshAndClose = () => { setCreateOpen(false); setDecision(null); load(); };
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const openDecision = (item) => { if (item.Status !== 1) return; if (new Date(item.MaturityDate).setHours(0,0,0,0) > new Date().setHours(0,0,0,0)) { Swal.fire("Notice Not Mature", `This request matures on ${date(item.MaturityDate)}.`, "info"); return; } const workflowItem = workflowItems.find((workflow) => String(workflow.workflowRecordId).toLowerCase() === String(item.Id).toLowerCase()); if (!workflowItem) { Swal.fire("Approval Not Available", "You do not currently have an unlocked Cash Withdrawal Request Authorization workflow item for this request. The required permission is Cash Withdrawal Request Authorization.", "info"); return; } setDecision({ request: item, workflowItem }); };
  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FaClipboardList /> Cash Withdrawal Requests</h2><Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><FaPlus className="mr-2" /> New Request</Button></div>
    <div className="flex flex-wrap gap-2 mb-4">{STATUSES.map((item) => <button type="button" key={item.value} onClick={() => { setStatus(item.value); setPage(0); }} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${status === item.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"}`}>{item.label}</button>)}</div>
    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4"><Select value={String(filter)} onValueChange={(value) => setFilter(Number(value))}><SelectTrigger className="md:col-span-3"><SelectValue /></SelectTrigger><SelectContent>{FILTERS.map(([value, label]) => <SelectItem key={value} value={String(value)}>{label}</SelectItem>)}</SelectContent></Select><Input className="md:col-span-4" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." /><Input className="md:col-span-2" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><Input className="md:col-span-2" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /><Button className="bg-indigo-600 hover:bg-indigo-700">Filter</Button></form>
    <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4"><span className="col-span-2">Customer</span><span className="col-span-2">Account</span><span className="col-span-2">Amount</span><span className="col-span-2">Notice / Maturity</span><span className="col-span-2">Status</span><span className="col-span-2">Created</span></div>
      {loading ? <div className="space-y-2 animate-pulse">{[1,2,3].map((key) => <div key={key} className="grid grid-cols-12 gap-3 bg-gray-50 p-6 rounded-lg">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="col-span-2 h-4 bg-gray-200 rounded" />)}</div>)}</div> : items.length ? <div className="space-y-2">{items.map((item) => <button type="button" key={item.Id} onClick={() => openDecision(item)} className={`w-full text-left bg-white rounded-lg shadow-lg border transition-all ${item.Status === 1 ? "hover:shadow-xl" : "cursor-default"}`}><div className="grid grid-cols-12 gap-4 items-center py-4 px-6"><span className="col-span-2 text-sm text-gray-700">{item.CustomerName || item.CustomerAccountCustomerFullName || "—"}</span><span className="col-span-2 text-sm text-gray-700">{item.CustomerAccountFullAccountNumber || "—"}</span><span className="col-span-2 text-sm font-semibold text-indigo-700">{money(item.Amount)}</span><span className="col-span-2 text-sm text-gray-700">{item.TypeDescription || "—"}<small className="block text-gray-400">{date(item.MaturityDate)}</small></span><span className="col-span-2"><span className={`px-2 py-1 rounded text-xs font-semibold ${item.Status === 2 ? "bg-green-100 text-green-600" : item.Status === 4 ? "bg-red-100 text-red-600" : item.Status === 8 ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>{item.StatusDescription || "Pending"}</span></span><span className="col-span-2 text-xs text-gray-500">{date(item.CreatedDate)}<small className="block">{item.CreatedBy || "—"}</small></span></div></button>)}</div> : <div className="text-center text-gray-400"><img src={NotFoundImage} alt="No requests" className="mx-auto w-42" /><p>No cash withdrawal requests match the selected filters.</p></div>}
      <div className="text-center text-sm text-gray-500 mt-4">{count} request{count === 1 ? "" : "s"}</div><div className="flex justify-center items-center"><Button type="button" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="m-2"><FaChevronLeft className="mr-1" /> Prev</Button><span>Page {page + 1} of {pages}</span><Button type="button" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)} className="m-2">Next <FaChevronRight className="ml-1" /></Button></div>
    </div>
    {createOpen && <CreateDrawer onClose={() => setCreateOpen(false)} onCreated={refreshAndClose} />}{decision && <DecisionDrawer item={decision.request} workflowItem={decision.workflowItem} onClose={() => setDecision(null)} onSaved={refreshAndClose} />}
  </div>;
}
