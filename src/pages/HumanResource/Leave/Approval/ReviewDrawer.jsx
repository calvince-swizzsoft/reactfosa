import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LeaveBalancePreview from "../lib/LeaveBalancePreview";

export default function ReviewDrawer({ item, onClose, onApprove, busy }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => { const escape = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", escape); return () => document.removeEventListener("keydown", escape); }, [onClose]);
  return createPortal(<>
    <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
    <motion.div role="dialog" aria-modal="true" aria-label="Review leave application" initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed right-3 top-3 bottom-3 w-[calc(100%-1.5rem)] max-w-xl rounded-2xl shadow-2xl bg-white z-50 flex flex-col">
      <div className="m-2 p-4 rounded-2xl bg-indigo-600 text-white flex justify-between items-center"><h2 className="font-bold text-lg">Review Leave</h2><Button variant="outline" onClick={onClose}>Close</Button></div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">{item.EmployeeCustomerFullName?.trim()}</h3>
        <p className="text-sm text-gray-700">{item.LeaveTypeDescription} · {item.DurationStartDate?.slice(0, 10)} to {item.DurationEndDate?.slice(0, 10)}</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.Reason}</p>
        <LeaveBalancePreview employeeId={item.EmployeeId} leaveTypeId={item.LeaveTypeId} start={item.DurationStartDate?.slice(0, 10)} end={item.DurationEndDate?.slice(0, 10)} excludedId={item.Id} onChange={setPreview} />
      </div>
      <div className="shrink-0 border-t p-4 flex justify-end"><Button disabled={busy || !preview?.CanSubmit} onClick={() => onApprove(item)} className="bg-indigo-600 hover:bg-indigo-700">{busy ? "Approving…" : "Approve"}</Button></div>
    </motion.div>
  </>, document.body);
}
