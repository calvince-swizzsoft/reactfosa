import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getPaySlip, listPaySlipEntries } from "./lib/api";
import { MONTH_LABEL, PAYSLIP_STATUS_LABEL, PAYSLIP_STATUS_BADGE_CLASS } from "./lib/enums";

const money = (value) => Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount = (entry) => Number(entry.Principal || 0) + Number(entry.Interest || 0);

function Entries({ title, entries }) {
  return <section className="space-y-2">
    <h3 className="bg-gray-700 text-white font-semibold px-3 py-2 rounded-lg">{title}</h3>
    {entries.length ? entries.map((entry, index) => (
      <div key={entry.Id || index} className="flex justify-between gap-4 border-b py-2 px-3 text-sm text-gray-700">
        <span>{entry.Description || entry.SalaryHeadTypeDescription || "Salary item"}
          {Number(entry.Interest || 0) !== 0 && <span className="block text-xs text-gray-500">Principal {money(entry.Principal)} · Interest {money(entry.Interest)}</span>}
        </span>
        <span className="tabular-nums whitespace-nowrap">{money(amount(entry))}</span>
      </div>
    )) : <p className="px-3 text-sm text-gray-500">None</p>}
  </section>;
}

export default function PayslipDrawer({ id, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const panel = useRef(null);
  const close = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setData(null);
    Promise.all([getPaySlip(id), listPaySlipEntries(id)])
      .then(([slip, entries]) => {
        if (!slip?.Id || !Array.isArray(entries)) throw new Error("The payslip is unavailable. Refresh the salary period and try again.");
        if (active) setData({ slip, entries });
      })
      .catch((err) => { if (active) setError(err.message || "Could not load the payslip."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, attempt]);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const buttons = [...panel.current.querySelectorAll('button:not([disabled]), [href], [tabindex="0"]')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  const slip = data?.slip;
  const earnings = data?.entries.filter((entry) => Number(entry.SalaryHeadCategory) === 1) || [];
  const deductions = data?.entries.filter((entry) => Number(entry.SalaryHeadCategory) === 2) || [];
  const gross = earnings.reduce((sum, entry) => sum + amount(entry), 0);
  const deducted = deductions.reduce((sum, entry) => sum + amount(entry), 0);
  return createPortal(<>
    <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} onClick={onClose} />
    <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby="payslip-title"
      className="fixed top-3 bottom-3 right-3 w-[calc(100%-1.5rem)] max-w-2xl bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
      initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 p-4 flex justify-between items-center bg-indigo-600 rounded-2xl shrink-0">
        <h2 id="payslip-title" className="font-bold text-lg text-white">Payslip</h2>
        <Button ref={close} variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" aria-busy={loading}>
        {loading ? <p role="status" className="text-gray-500">Loading payslip…</p> : error ? (
          <div role="alert" className="space-y-3"><p className="text-red-600">{error}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry</Button></div>
        ) : slip && <>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{slip.SalaryCardEmployeeCustomerFullName?.trim() || [slip.SalaryCardEmployeeCustomerIndividualFirstName, slip.SalaryCardEmployeeCustomerIndividualLastName].filter(Boolean).join(" ") || "Employee"}</h3>
            <p className="text-sm text-gray-500 mt-1">{MONTH_LABEL[slip.SalaryPeriodMonth]} · {slip.SalaryPeriodPostingPeriodDescription}</p>
            <span className={`inline-block mt-3 px-2 py-1 rounded text-xs font-semibold ${PAYSLIP_STATUS_BADGE_CLASS[slip.Status] || "bg-gray-100 text-gray-600"}`}>{PAYSLIP_STATUS_LABEL[slip.Status] || slip.StatusDescription || "Unknown status"}</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Payroll number", slip.SalaryCardEmployeeCustomerIndividualPayrollNumbers],
              ["Salary group", slip.SalaryCardSalaryGroupDescription],
              ["Department", slip.SalaryCardEmployeeDepartmentDescription],
              ["Designation", slip.SalaryCardEmployeeDesignationDescription],
              ["Branch", slip.SalaryCardEmployeeBranchDescription],
              ["KRA PIN", slip.SalaryCardEmployeeCustomerPersonalIdentificationNumber],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-gray-500">{label}</dt><dd className="font-medium text-gray-800 break-words">{value}</dd></div>)}
          </dl>
          <p className="text-xs text-gray-500 text-right">Amounts in KSh</p>
          <Entries title="Earnings" entries={earnings} />
          <div className="flex justify-between text-sm font-semibold px-3"><span>Gross pay</span><span>{money(gross)}</span></div>
          <Entries title="Deductions" entries={deductions} />
          <div className="flex justify-between text-sm font-semibold px-3"><span>Total deductions</span><span>{money(deducted)}</span></div>
          <div className="flex justify-between gap-4 bg-indigo-50 text-indigo-900 p-4 rounded-lg font-bold text-lg"><span>Net pay</span><span>KSh {money(slip.NetPay ?? gross - deducted)}</span></div>
        </>}
      </div>
    </motion.div>
  </>, document.body);
}
