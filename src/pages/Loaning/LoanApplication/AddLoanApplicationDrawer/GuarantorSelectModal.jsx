import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

export default function GuarantorSelectModal({
    open,
    onClose,
    customers,
    applicantId,
    allowSelfGuarantee = false,
    selectedGuarantorIds = [],
    onSelect,
}) {
    const [search, setSearch] = useState("");

    // const filtered = useMemo(() => {
    //     return customers.filter(m => {
    //         const c = m.Customer;

    //         // prevent applicant & already-selected guarantors
    //         if (c.Id === applicantId) return false;
    //         if (selectedGuarantorIds.includes(c.Id)) return false;

    //         const text = `${c.IndividualFirstName} ${c.IndividualLastName} ${c.IndividualIdentityCardNumber} ${c.Reference3}`.toLowerCase();
    //         return text.includes(search.toLowerCase());
    //     });
    // }, [customers, search, applicantId, selectedGuarantorIds]);


    const filtered = useMemo(() => {
        return customers.filter(m => {
            const c = m.Customer;

            // ❌ prevent applicant ONLY if self-guarantee is NOT allowed
            if (!allowSelfGuarantee && c.Id === applicantId) {
                return false;
            }

            // ❌ prevent duplicate guarantors (always)
            if (selectedGuarantorIds.includes(c.Id)) {
                return false;
            }

            const text =
                `${c.IndividualFirstName} ${c.IndividualLastName} ${c.Reference3}`
                    .toLowerCase();

            return text.includes(search.toLowerCase());
        });
    }, [
        customers,
        search,
        applicantId,
        allowSelfGuarantee,
        selectedGuarantorIds,
    ]);


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
                            Select Guarantor
                        </h3>

                        <Input
                            placeholder="Search by name, ID or payroll"
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
                                    No available guarantors
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
