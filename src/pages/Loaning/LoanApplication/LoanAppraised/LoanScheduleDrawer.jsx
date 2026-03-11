import { motion, AnimatePresence } from "framer-motion";
import LoanCalculator from "../LoanCalculator"; // reuse existing

export default function LoanScheduleDrawer({ open, onClose, loan }) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay (lighter, secondary) */}
                    <motion.div
                        className="fixed inset-0 bg-black z-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-[calc(85vw+16px)]
                        w-[90vw] max-w-[1050px] h-[90vh]
                        bg-white shadow-2xl z-60
                        rounded-2xl overflow-y-auto"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 240, damping: 28 }}
                    >
                        <div className="p-4 space-y-4">

                            {/* Header */}
                            <div className="flex justify-between items-center
                                bg-indigo-700 text-white p-3 rounded-2xl">
                                <h2 className="font-bold text-lg">
                                    Loan Calculator & Repayment Schedule
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-white font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Calculator + Schedule */}
                            <LoanCalculator
                                presetLoan={{
                                    amount: loan.ApprovedAmount || loan.AmountApplied,
                                    interest: loan.LoanInterestAnnualPercentageRate,
                                    termMonths: loan.LoanRegistrationTermInMonths,
                                    frequency: loan.LoanRegistrationPaymentFrequencyPerYear || 12
                                }}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
