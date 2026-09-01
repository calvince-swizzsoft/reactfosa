import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import NotFoundImage from "/assets/scopefinding.png";
import { FaSms, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { statusBadgeClass } from "@/lib/workflowFormat";
import { listTextAlerts, DLRStatus } from "./api";
import CreateTextAlertDrawer from "./CreateTextAlertDrawer";

const DLR_STATUS_OPTIONS = [
  { value: DLRStatus.UnKnown, label: "Unknown" },
  { value: DLRStatus.Failed, label: "Failed" },
  { value: DLRStatus.Pending, label: "Pending" },
  { value: DLRStatus.Delivered, label: "Delivered" },
  { value: DLRStatus.NotApplicable, label: "Not Applicable" },
  { value: DLRStatus.Submitted, label: "Submitted" },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

export default function TextAlerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [dlrStatus, setDlrStatus] = useState("");
  const [text, setText] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listTextAlerts({ pageIndex, pageSize, dlrStatus: dlrStatus === "" ? undefined : dlrStatus, text })
      .then((page) => {
        setItems(page?.pageCollection || []);
        setItemsCount(page?.itemsCount || 0);
      })
      .catch(() => {
        setItems([]);
        setItemsCount(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlrStatus, text, pageIndex, pageSize]);

  const handleDlrStatusChange = (v) => {
    setDlrStatus(v === "all" ? "" : Number(v));
    // text is ignored server-side unless dlrStatus is also supplied — clear
    // it when going back to "All" so the box doesn't imply it's still doing
    // anything.
    if (v === "all") setText("");
    setPageIndex(0);
  };

  const hasNextPage = itemsCount
    ? (pageIndex + 1) * pageSize < itemsCount
    : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaSms /> Text Alerts
        </h2>
        <Button onClick={() => setDrawerOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Text Alert
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Select value={dlrStatus === "" ? "all" : String(dlrStatus)} onValueChange={handleDlrStatusChange}>
          <SelectTrigger className="w-48"><SelectValue placeholder="DLR Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {DLR_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="text"
          placeholder={dlrStatus === "" ? "Select a status to search..." : "Search Text Alerts..."}
          value={text}
          onChange={(e) => { setText(e.target.value); setPageIndex(0); }}
          disabled={dlrStatus === ""}
          title={dlrStatus === "" ? "Text search only works together with a DLR status filter — that's how the backend's filtered lookup works" : ""}
          className="border p-2 rounded-lg flex-1 min-w-[200px] disabled:bg-gray-100 disabled:text-gray-400"
        />
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
          className="border p-2 rounded-lg"
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Recipient</span>
          <span className="col-span-4">Message</span>
          <span className="col-span-2">Company</span>
          <span className="col-span-2">Delivery status</span>
          <span className="col-span-2">Created</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-2 font-medium text-indigo-700 break-all">{item.TextMessageRecipient || "—"}</span>
                  <span className="col-span-4 text-sm text-gray-700 break-words">
                    {item.MaskedTextMessageBody || item.TextMessageBody || "—"}
                  </span>
                  <span className="col-span-2 text-sm text-gray-600">{item.BranchCompanyDescription || "—"}</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusBadgeClass(item.TextMessageDLRStatusDescription)}`}>
                      {item.TextMessageDLRStatusDescription || "—"}
                    </span>
                    <span className="mt-1 block break-words text-[11px] leading-4 text-gray-500" title={item.TextMessageReference || ""}>
                      {item.TextMessageReference || "No provider response recorded"}
                    </span>
                  </span>
                  <span className="col-span-2 text-sm text-gray-500">{formatDate(item.CreatedDate)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No Text Alerts Found.</p>
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

      <CreateTextAlertDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={fetchItems} />
    </div>
  );
}
