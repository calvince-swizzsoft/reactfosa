import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { searchableCustomerText } from "../../LoanCases/lib/CustomerPickerModal";

export default function CustomerSelectModal({
    open,
    onClose,
    customers,
    onSelect,
}) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length === 0) return customers;
        return customers.filter(m => {
            const text = searchableCustomerText(m);
            return terms.every((term) => text.includes(term));
        });
    }, [customers, search]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-50"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed z-50 top left-1/2 w-[90vw] max-w-xl bg-white rounded-xl shadow-xl p-4"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        style={{ transform: "translate(-50%, -50%)" }}
                    >
                        <h3 className="font-semibold text-lg mb-3 bg-indigo-800 text-white p-3 rounded-lg shadow-md">
                            Select Customer
                        </h3>

                        <Input
                            placeholder="Search name, customer no., ID, payroll, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="mb-3"
                        />

                        <div className="max-h-72 overflow-y-auto border rounded-lg">
                            {filtered.map(m => {
                                const c = m.Customer;
                                return (
                                    <div
                                        key={c.Id}
                                        onClick={() => {
                                            onSelect(m);
                                            onClose();
                                        }}
                                        className="p-3 cursor-pointer hover:bg-indigo-50 border-b"
                                    >
                                        <p className="font-medium">
                                            {c.IndividualFirstName} {c.IndividualLastName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Payroll: {c.Reference3}
                                        </p>
                                    </div>
                                );
                            })}

                            {filtered.length === 0 && (
                                <p className="text-center text-sm text-gray-500 p-4">
                                    No matching members
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
