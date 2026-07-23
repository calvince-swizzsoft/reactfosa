import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";



export default function ParentLoanSelectModal({
    open,
    onClose,
    customers = [],
    selectedCustomerId,
    onSelect,
}) {

    const [loading, setLoading] = useState(false);
    const [loans, setLoans] = useState([]);

    const selectedCustomer = customers.find(
        c => c.Customer?.Id === selectedCustomerId
    );

    const memberNo =
        selectedCustomer?.Customer?.Reference2 || "";


    useEffect(() => {
        if (!open || !memberNo) return;

        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetAllLoanByMemberNo?MemberNo=${memberNo}`
        )
            .then(res => res.json())
            .then(data => {
                console.log("Raw loans data:", data);
                const list = Array.isArray(data) ? data : [data];
                setLoans(list.filter(l => l.Id));
            })
            .catch(() => {
                Swal.fire("Error", "Failed to load parent loans", "error");
            });
    }, [open, memberNo]);

    console.log("Fetched Loans:", loans);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed top-1/2 right-3 z-50 w-[420px] -translate-x-1/2 -translate-y-1/2"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <Card className="p-4">
                            <h3 className="font-semibold mb-3">
                                Select Parent Loan
                            </h3>

                            {loading && (
                                <p className="text-sm text-gray-500">
                                    Loading loans…
                                </p>
                            )}

                            {!loading && loans.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    No previous loans found
                                </p>
                            )}

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {loans.map(loan => (
                                    <div
                                        key={loan.Id}
                                        className="border rounded-md p-3 flex justify-between items-center hover:bg-gray-50"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {loan.LoanProductDescription}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Amount:{" "}
                                                {loan.TotalLoansBalance?.toLocaleString()}{" "}
                                                | Status:{" "}
                                                {loan.StatusDescription}
                                            </p>
                                        </div>

                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                onSelect(loan);
                                                onClose();
                                            }}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
