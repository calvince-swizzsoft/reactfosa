import { motion, AnimatePresence } from "framer-motion";
import { Button } from "flowbite-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { fmt, generateRepaymentSchedule } from "./loanUtils";

export default function LoanScheduleDrawer({ open, loan, onClose }) {
    if (!loan) return null;

    const schedule = generateRepaymentSchedule(
        loan.AmountApplied,
        loan.LoanInterestAnnualPercentageRate,
        loan.LoanRegistrationTermInMonths
    );

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Repayment Schedule - ${loan.PaddedCaseNumber}`, 10, 10);

        doc.autoTable({
            head: [["Month", "Payment", "Principal", "Interest", "Balance"]],
            body: schedule.map((s) => [
                s.month,
                fmt(s.payment),
                fmt(s.principal),
                fmt(s.interest),
                fmt(s.balance),
            ]),
            startY: 20,
        });

        doc.save(`${loan.PaddedCaseNumber}-schedule.pdf`);
    };

    const exportCSV = () => {
        const headers = ["Month", "Payment", "Principal", "Interest", "Balance"];
        const rows = schedule.map((s) => [
            s.month,
            s.payment,
            s.principal,
            s.interest,
            s.balance,
        ]);

        const csv = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${loan.PaddedCaseNumber}-schedule.csv`;
        a.click();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-4 right-4 w-[92vw] max-w-[840px] h-[94vh]
                       bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-indigo-700 text-white flex justify-between items-center m-4 rounded-2xl">
                            <div>
                                <h2 className="text-lg font-bold">
                                    Repayment Schedule
                                </h2>
                                <p className="text-sm text-indigo-200">
                                    Case: {loan.PaddedCaseNumber}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {/* <Button size="sm" onClick={exportPDF}>
                                    PDF
                                </Button> */}
                                <Button size="sm" color="gray" onClick={exportCSV}>
                                    CSV
                                </Button>
                                <Button size="sm" color="light" onClick={onClose}>
                                    Close
                                </Button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 overflow-y-auto m-4 bg-gray-100 rounded-2xl">
                            <table className="min-w-full text-sm border">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="p-2">Month</th>
                                        <th className="p-2 text-right">Payment</th>
                                        <th className="p-2 text-right">Principal</th>
                                        <th className="p-2 text-right">Interest</th>
                                        <th className="p-2 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedule.map((s, i) => (
                                        <tr
                                            key={i}
                                            className={i % 2 ? "bg-gray-50" : ""}
                                        >
                                            <td className="p-2">{s.month}</td>
                                            <td className="p-2 text-right">
                                                {fmt(s.payment)}
                                            </td>
                                            <td className="p-2 text-right">
                                                {fmt(s.principal)}
                                            </td>
                                            <td className="p-2 text-right">
                                                {fmt(s.interest)}
                                            </td>
                                            <td className="p-2 text-right">
                                                {fmt(s.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
