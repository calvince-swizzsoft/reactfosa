import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEmployeeLeaveStatistics, listLeaveTypes } from "./api";
import { LEAVE_STATUS_LABEL, LEAVE_STATUS_BADGE_CLASS } from "./enums";

const dateText = (value) => value?.slice(0, 10) || "—";
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function LeaveStatisticsDrawer({ item, onClose }) {
  const [leaveTypeId, setLeaveTypeId] = useState(item.LeaveTypeId || "");
  const [asAt, setAsAt] = useState(localToday);
  const [types, setTypes] = useState([{ Id: item.LeaveTypeId, Description: item.LeaveTypeDescription }]);
  const [typeError, setTypeError] = useState("");
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    const keyboard = (event) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const elements = [...panel.current.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter((element) => element.getClientRects().length);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keyboard); previous?.focus(); };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadTypes() {
      const all = [];
      for (let index = 0; ; index++) {
        const result = await listLeaveTypes({ pageIndex: index, pageSize: 100 });
        const rows = result?.PageCollection || result?.pageCollection || [];
        all.push(...rows);
        if (!active) return;
        if (rows.length < 100 || all.length >= (result.ItemsCount ?? result.itemsCount ?? Infinity)) break;
      }
      if (active) setTypes(all.some((type) => type.Id === item.LeaveTypeId) ? all : [{ Id: item.LeaveTypeId, Description: item.LeaveTypeDescription }, ...all]);
    }
    loadTypes().catch((error) => { if (active) setTypeError(error.message); });
    return () => { active = false; };
  }, [item.LeaveTypeId, item.LeaveTypeDescription]);

  useEffect(() => {
    let active = true;
    if (!leaveTypeId || !asAt) { setState({ loading: false, data: null, error: "Select a leave type and balance date." }); return; }
    setState({ loading: true, data: null, error: "" });
    getEmployeeLeaveStatistics(item.EmployeeId, leaveTypeId, asAt, page)
      .then((data) => { if (active) setState({ loading: false, data, error: "" }); })
      .catch((error) => { if (active) setState({ loading: false, data: null, error: error.message }); });
    return () => { active = false; };
  }, [item.EmployeeId, leaveTypeId, asAt, page, refresh]);

  const data = state.data;
  const balance = data?.Balance;
  return createPortal(<>
    <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
    <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby="leave-statistics-title" initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed right-3 top-3 bottom-3 w-[calc(100%-1.5rem)] max-w-3xl rounded-2xl shadow-2xl bg-white z-50 flex flex-col">
      <div className="m-2 p-4 rounded-2xl bg-indigo-600 text-white flex justify-between items-center gap-3 shrink-0">
        <div><h2 id="leave-statistics-title" className="font-bold text-lg">Leave Statistics</h2><p className="text-sm">{item.EmployeeCustomerFullName?.trim()}</p></div>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label className="text-sm font-semibold text-gray-700">Leave type</Label><Select value={leaveTypeId} onValueChange={(value) => { if (value) { setLeaveTypeId(value); setPage(0); } }}><SelectTrigger aria-label="Leave type"><SelectValue placeholder="Select leave type" /></SelectTrigger><SelectContent className="max-h-60 overflow-y-auto">{types.filter((type) => type.Id).map((type) => <SelectItem key={type.Id} value={type.Id}>{type.Description}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="leave-statistics-date" className="text-sm font-semibold text-gray-700">Balance date</Label><Input id="leave-statistics-date" type="date" min="1900-01-01" max="9998-12-31" value={asAt} onChange={(event) => { setAsAt(event.target.value); setPage(0); }} /></div>
        </div>
        {typeError && <p role="alert" className="text-sm text-red-600">Could not load other leave types: {typeError}</p>}
        {state.loading && <div role="status" className="animate-pulse grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((value) => <div key={value} className="h-20 bg-gray-100 rounded-lg" />)}<span className="sr-only">Loading leave statistics…</span></div>}
        {state.error && <p role="alert" className="text-red-600">{state.error}</p>}
        {data?.BalanceError && <p role="alert" className="text-red-600">{data.BalanceError}</p>}
        {balance && <section aria-label="Leave balance" className="space-y-3">
          <h3 className="font-semibold text-gray-800">{data.LeaveTypeDescription} · {data.IsAccrued ? `Accrued through ${dateText(data.AsAt)}` : `${dateText(balance.Start)} to ${dateText(balance.End)}`}</h3>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[["Entitlement", balance.Entitlement], ["Taken through today", data.TakenDays], ["Upcoming approved", data.UpcomingDays], ["Pending reservations", balance.Reserved], ["Remaining balance", balance.Available]].map(([label, value]) => <div key={label} className="rounded-lg border bg-gray-50 p-3"><dt className="text-sm text-gray-600">{label}</dt><dd className={`mt-1 text-xl font-bold ${value < 0 ? "text-red-600" : "text-indigo-700"}`}>{value} <span className="text-xs font-normal text-gray-500">days</span></dd></div>)}
          </dl>
        </section>}
        {data && <section aria-label="Leave history" className="space-y-3">
          <h3 className="font-semibold text-gray-800">{asAt.slice(0, 4)} history · {data.LeaveTypeDescription}</h3>
          {!data.History.length ? <p className="text-sm text-gray-500 text-center py-6">No leave applications for this year and leave type.</p> : <div className="space-y-2 bg-gray-200 p-3 rounded-sm">{data.History.map((entry) => <article key={entry.Id} className="bg-white rounded-lg border shadow-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between flex-wrap gap-2"><span className="font-semibold text-gray-800">{dateText(entry.Start)} – {dateText(entry.End)}</span><span className={`px-2 py-1 rounded text-xs font-semibold ${LEAVE_STATUS_BADGE_CLASS[entry.Status] || "bg-gray-100 text-gray-500"}`}>{LEAVE_STATUS_LABEL[entry.Status] || "Unknown"}</span></div>
            <p className="text-gray-700">{entry.Status === 1 ? "Reserved" : "Charged"} in {asAt.slice(0, 4)}: <strong>{entry.ChargedDaysInYear} days</strong></p>
            {entry.EffectiveReturnDate && <p className="text-gray-600">Return date: {dateText(entry.EffectiveReturnDate)}</p>}
            {entry.AuthorizedBy && <p className="text-gray-600">Decision by: {entry.AuthorizedBy}</p>}
            {entry.Reason && <p className="text-gray-700 whitespace-pre-wrap break-words">{entry.Reason}</p>}
          </article>)}</div>}
          {data.HistoryCount > 0 && <div className="flex items-center justify-center gap-3"><Button disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Prev</Button><span className="text-sm">Page {page + 1} of {Math.ceil(data.HistoryCount / 10)}</span><Button disabled={(page + 1) * 10 >= data.HistoryCount} onClick={() => setPage((value) => value + 1)}>Next</Button></div>}
        </section>}
      </div>
      <div className="shrink-0 border-t p-4 flex justify-end"><Button disabled={state.loading} onClick={() => setRefresh((value) => value + 1)} className="bg-indigo-600 hover:bg-indigo-700">Refresh</Button></div>
    </motion.div>
  </>, document.body);
}
