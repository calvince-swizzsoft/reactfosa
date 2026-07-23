









import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Row = ({ label, value }) => (
    <div className="grid grid-cols-12 gap-3 py-2 text-xs border-2 p-3 rounded-xl m-2 bg-gray-50">
        <span className="col-span-4 text-gray-600 font-medium">
            {label}
        </span>
        <span className="col-span-8 font-semibold text-gray-50 bg-gray-500 p-1 pl-4 py-1 rounded-xl">
            {value || "-"}
        </span>
    </div>
);

export default function LoanCaseDetailsDrawer({ open, loan, onClose }) {
    const [loadingGuarantors, setLoadingGuarantors] = useState(false);
    const [guarantors, setGuarantors] = useState([]);

    useEffect(() => {
        if (!open || !loan) return;

        setLoadingGuarantors(true);
        fetch(
            `${import.meta.env.VITE_APP_LOANING_URL}/api/GuarantorManagement/GetLoanGuarantors/${loan.Id}`
        )
            .then((r) => r.json())
            .then((d) => setGuarantors(d?.Data || []))
            .catch(() =>
                Swal.fire("Error", "Failed to load guarantors", "error")
            )
            .finally(() => setLoadingGuarantors(false));
    }, [open, loan]);

    if (!loan) return null;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-2 right-3 w-[920px] h-[95vh] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <div>
                                <h2 className="font-bold text-lg text-white">
                                    Loan Case Detail
                                </h2>
                                <p className="text-xs text-indigo-200">
                                    Case No: {loan.PaddedCaseNumber}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto space-y-4 bg-gray-300 p-3 rounded-2xl">
                            <div className="flex w-full gap-3">
                                {/* Member Section */}
                                <div className="bg-white rounded-xl p-4 border w-1/2">
                                    <h3 className="font-semibold text-sm text-indigo-100 mb-3 bg-indigo-700 p-3 rounded-xl">
                                        Member Information
                                    </h3>
                                    <div className="bg-gray-200 rounded-2xl p-1">
                                        <Row
                                            label="Full Name"
                                            value={`${loan.CustomerIndividualFirstName} ${loan.CustomerIndividualLastName}`}
                                        />
                                        <Row
                                            label="ID Number"
                                            value={loan.CustomerIndividualIdentityCardNumber}
                                        />
                                        <Row label="Status" value={loan.StatusDescription} />
                                    </div>
                                </div>

                                {/* Loan Section */}
                                <div className="bg-white rounded-xl p-4 border w-1/2">
                                    <h3 className="font-semibold text-sm text-indigo-100 mb-3 bg-indigo-700 p-3 rounded-xl">
                                        Loan Information
                                    </h3>
                                    <Row
                                        label="Product"
                                        value={loan.LoanProductDescription}
                                    />
                                    <Row
                                        label="Amount Applied"
                                        value={`Ksh ${loan.AmountApplied?.toLocaleString()}`}
                                    />
                                    <Row
                                        label="Interest Rate"
                                        value={`${loan.LoanInterestAnnualPercentageRate}%`}
                                    />
                                    <Row
                                        label="Term"
                                        value={`${loan.LoanRegistrationTermInMonths} Months`}
                                    />
                                </div>
                            </div>
                            {/* Guarantors Section */}
                            <div className="bg-white rounded-xl p-4 border">
                                <h3 className="font-semibold text-sm  mb-3 text-indigo-100  bg-indigo-700 p-3 rounded-xl">
                                    Guarantors
                                </h3>

                                {loadingGuarantors && (
                                    <p className="text-xs text-muted-foreground">
                                        Loading guarantors...
                                    </p>
                                )}

                                {!loadingGuarantors && guarantors.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        No guarantors found.
                                    </p>
                                )}

                                {!loadingGuarantors && guarantors.length > 0 && (
                                    <div className="space-y-2 bg-gray-200 rounded-xl p-2  max-h-[260px] overflow-y-auto">
                                        {guarantors.map((g, i) => (
                                            <div
                                                key={i}
                                                className="grid grid-cols-12 gap-3 items-center border rounded-lg px-3 py-2 text-xs bg-gray-50"
                                            >
                                                <span className="col-span-4 font-medium">
                                                    {g.CustomerIndividualFirstName}{" "}
                                                    {g.CustomerIndividualLastName}
                                                </span>
                                                <span className="col-span-3">
                                                    {g.CustomerIndividualIdentityCardNumber}
                                                </span>
                                                <span className="col-span-3 font-semibold text-green-700">
                                                    Ksh {g.AmountGuaranteed?.toLocaleString()}
                                                </span>
                                                <span className="col-span-2 text-right">
                                                    <Badge variant="outline">
                                                        {g.StatusDescription}
                                                    </Badge>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
