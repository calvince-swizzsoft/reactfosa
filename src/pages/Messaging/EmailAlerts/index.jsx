import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaEnvelope, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusBadgeClass } from "@/lib/workflowFormat";
import NotFoundImage from "/assets/scopefinding.png";
import { DLRStatus, listEmailAlerts } from "./api";
import { ComposeEmailDrawer, EmailAlertDetailsDrawer } from "./EmailAlertDrawers";

const statuses = [
  [DLRStatus.UnKnown, "Unknown"], [DLRStatus.Failed, "Failed"], [DLRStatus.Pending, "Pending"],
  [DLRStatus.Delivered, "Delivered"], [DLRStatus.NotApplicable, "Not Applicable"], [DLRStatus.Submitted, "Submitted"],
];

const pick = (item, camel, pascal) => item?.[camel] ?? item?.[pascal];
const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString() : "—";

export default function EmailAlerts() {
  const [items, setItems] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [dlrStatus, setDlrStatus] = useState(DLRStatus.Delivered);
  const [text, setText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchItems = () => {
    if (Boolean(startDate) !== Boolean(endDate)) return;
    setLoading(true);
    listEmailAlerts({ dlrStatus, text, startDate, endDate, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", error.message || "Unable to load email alerts.", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlrStatus, text, startDate, endDate, pageIndex, pageSize]);

  const hasNext = (pageIndex + 1) * pageSize < itemsCount;
  const handleQueued = () => {
    setDlrStatus(DLRStatus.Pending);
    setPageIndex(0);
  };

  return (
    <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaEnvelope /> Email Alerts</h2>
        <Button onClick={() => setComposeOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Compose Email</Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <Select value={String(dlrStatus)} onValueChange={(value) => { setDlrStatus(Number(value)); setPageIndex(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(([status, label]) => <SelectItem key={status} value={String(status)}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <input value={text} onChange={(event) => { setText(event.target.value); setPageIndex(0); }} placeholder="Search recipient, subject, or body" className="rounded-lg border p-2 md:col-span-2" />
        <input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPageIndex(0); }} className="rounded-lg border p-2" title="Start date" />
        <input type="date" min={startDate || undefined} value={endDate} onChange={(event) => { setEndDate(event.target.value); setPageIndex(0); }} className="rounded-lg border p-2" title="End date" />
      </div>
      {Boolean(startDate) !== Boolean(endDate) && <p className="mb-3 text-sm text-amber-600">Choose both start and end dates to apply a date range.</p>}

      <div className="rounded-sm bg-gray-200 p-4">
        <div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 font-semibold text-gray-100">
          <span className="col-span-3">Recipient</span><span className="col-span-3">Subject</span><span className="col-span-2">Company</span><span className="col-span-2">Status</span><span className="col-span-2">Created</span>
        </div>
        {loading ? <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-gray-50" />)}</div> : items.length ? (
          <div className="space-y-2">{items.map((item) => {
            const id = pick(item, "id", "Id");
            const status = pick(item, "mailMessageDLRStatusDescription", "MailMessageDLRStatusDescription");
            return <button key={id} type="button" onClick={() => setSelectedId(id)} className="grid w-full grid-cols-12 items-center gap-4 rounded-lg border bg-white px-6 py-4 text-left shadow-lg transition-all hover:shadow-xl">
              <span className="col-span-3 break-all text-sm font-medium text-indigo-700">{pick(item, "mailMessageTo", "MailMessageTo") || "—"}</span>
              <span className="col-span-3 truncate text-sm text-gray-700">{pick(item, "mailMessageSubject", "MailMessageSubject") || "—"}</span>
              <span className="col-span-2 truncate text-sm text-gray-600">{pick(item, "branchCompanyDescription", "BranchCompanyDescription") || "—"}</span>
              <span className="col-span-2"><span className={`rounded px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>{status || "—"}</span></span>
              <span className="col-span-2 text-sm text-gray-500">{formatDate(pick(item, "createdDate", "CreatedDate"))}</span>
            </button>;
          })}</div>
        ) : <div className="py-6 text-center"><img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" /><p className="font-medium text-gray-400">No email alerts found.</p></div>}

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((page) => Math.max(0, page - 1))}><FaChevronLeft /> Prev</Button>
          <span className="text-sm text-gray-600">Page {pageIndex + 1}</span>
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }} className="rounded border p-2 text-sm">{[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}</select>
          <Button size="sm" disabled={!hasNext} onClick={() => setPageIndex((page) => page + 1)}>Next <FaChevronRight /></Button>
        </div>
      </div>

      <ComposeEmailDrawer open={composeOpen} onClose={() => setComposeOpen(false)} onSuccess={handleQueued} />
      <EmailAlertDetailsDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
