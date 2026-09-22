import { useEffect, useRef, useState } from "react";
import { previewLeave } from "./api";

export default function LeaveBalancePreview({ employeeId, leaveTypeId, start, end, excludedId, onChange }) {
  const [state, setState] = useState({ loading: false, data: null, error: "" });
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    let active = true;
    callback.current?.(null);
    if (!employeeId || !leaveTypeId || !start || !end) { setState({ loading: false, data: null, error: "" }); return; }
    setState({ loading: true, data: null, error: "" });
    const timer = setTimeout(() => previewLeave(employeeId, leaveTypeId, start, end, excludedId)
      .then((data) => { if (active) { setState({ loading: false, data, error: "" }); callback.current?.(data); } })
      .catch((error) => { if (active) setState({ loading: false, data: null, error: error.message || "Could not calculate leave days." }); }), 200);
    return () => { active = false; clearTimeout(timer); };
  }, [employeeId, leaveTypeId, start, end, excludedId]);
  if (state.loading) return <p role="status" className="text-sm text-gray-500">Calculating leave days…</p>;
  if (state.error) return <p role="alert" className="text-sm text-red-600">{state.error}</p>;
  if (!state.data) return null;
  const { RequestedDays, Cycles = [], Error: error } = state.data;
  return <section className="rounded-lg bg-gray-100 p-4 space-y-3 text-sm" aria-label="Leave balance preview">
    <p className="font-semibold text-gray-800">Chargeable days: {RequestedDays}</p>
    {Cycles.map((cycle) => <div key={cycle.Start} className="bg-white border rounded-lg p-3">
      <p className="font-semibold text-indigo-700 mb-2">{cycle.Start?.slice(0, 10)}{cycle.End?.startsWith("9999") ? " onward" : ` to ${cycle.End?.slice(0, 10)}`}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[["Entitlement", cycle.Entitlement], ["Approved / taken", cycle.Used], ["Pending reservations", cycle.Reserved], ["Available", cycle.Available], ["This request", cycle.Requested], ["Remaining", cycle.Remaining]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt className="text-gray-600">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
      </dl>
    </div>)}
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </section>;
}
