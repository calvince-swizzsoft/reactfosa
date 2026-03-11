import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaTimes } from "react-icons/fa";

export default function CreditBatchEntriesDrawer({
    open,
    onClose,
    creditBatchId,
}) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !creditBatchId) return;

        setLoading(true);
        fetch(
            `http://88.99.215.90:8600/api/values/${creditBatchId}/entries`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
        )
            .then((res) => res.json())
            .then((data) => {
                setEntries(Array.isArray(data) ? data : [data]);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [open, creditBatchId]);

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
                        className="fixed top-5 right-3 w-[900px] max-w-[95vw] bg-white shadow-xl z-50 rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl mb-4">
                            <h2 className="font-bold text-lg text-white">
                                Credit Batch Entries
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-4 max-h-[75vh] overflow-y-auto">
                            {loading ? (
                                <p className="text-gray-500">
                                    Loading entries...
                                </p>
                            ) : entries.length === 0 ? (
                                <p className="text-gray-500">
                                    No entries found.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-7 gap-4 bg-gray-700 text-white p-3 rounded-lg font-semibold text-sm">
                                        <span className="col-span-2">Account</span>
                                        <span>Customer</span>
                                        <span>Payroll No</span>
                                        <span>Principal</span>
                                        <span>Status</span>
                                        <span>Reference</span>
                                    </div>

                                    {/* Rows */}
                                    {entries.map((entry) => (
                                        <div
                                            key={entry.Id}
                                            className="grid grid-cols-7 gap-4 bg-gray-50 p-3 rounded-lg text-sm border hover:shadow"
                                        >
                                            <span className="col-span-2">
                                                {entry.ProductChartOfAccountCode}
                                                <br />
                                                <small className="text-gray-500">
                                                    {entry.ProductChartOfAccountName}
                                                </small>
                                            </span>

                                            <span>{entry.CustomerFullName}</span>

                                            <span>
                                                {entry.CustomerAccountCustomerIndividualPayrollNumbers}
                                            </span>

                                            <span className="font-semibold text-indigo-600">
                                                {entry.Principal?.toLocaleString()}
                                            </span>

                                            <span
                                                className={`px-2 py-1 rounded-full text-xs text-center h-7 ${entry.Status === 1
                                                    ? "bg-yellow-500 text-white"
                                                    : "bg-green-600 text-white"
                                                    }`}
                                            >
                                                {entry.StatusDescription}
                                            </span>

                                            <span>{entry.Reference}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
