// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";

// export default function LoanProductDetailsDrawer({ open, onClose, product }) {
//     if (!product) return null;

//     return (
//         <AnimatePresence>
//             {open && (
//                 <>
//                     {/* Overlay */}
//                     <motion.div
//                         className="fixed inset-0 bg-black z-40"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 0.4 }}
//                         exit={{ opacity: 0 }}
//                         onClick={onClose}
//                     />

//                     {/* Drawer */}
//                     <motion.div
//                         className="fixed top-3 right-3 w-[85vw] max-w-[800px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
//                         initial={{ x: "100%" }}
//                         animate={{ x: 0 }}
//                         exit={{ x: "100%" }}
//                         transition={{ type: "spring", stiffness: 260, damping: 30 }}
//                     >
//                         <div className="p-3 m-1">
//                             <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl mb-2">
//                                 <div></div>
//                                 <Button variant="outline" onClick={onClose}>
//                                     Close
//                                 </Button>
//                             </div>
//                             <div className="border-t bg-gray-200 p-2 mx-1 m-1 rounded-2xl space-y-4 ">
//                                 {/* Loan Details */}
//                                 <div className="bg-white p-4 rounded-lg shadow border">
//                                     <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
//                                         {product.Description} Loan Details
//                                     </h3>
//                                     <div className="grid grid-cols-2 gap-4 text-sm">
//                                         <span><b>Max Amount:</b> {product.LoanRegistrationMaximumAmount}</span>
//                                         <span><b>Min Amount:</b> {product.LoanRegistrationMinimumAmount}</span>
//                                         <span><b>Term (Months):</b> {product.LoanRegistrationTermInMonths}</span>
//                                         <span><b>Payment Frequency:</b> {product.LoanRegistrationPaymentFrequencyPerYearDescription}</span>
//                                         <span><b>Take Home Type:</b> {product.TakeHomeTypeDescription}</span>
//                                         <span><b>Take Home Fixed:</b> {product.TakeHomeFixedAmount}</span>
//                                     </div>
//                                 </div>

//                                 {/* Chart of Accounts */}
//                                 <div className="bg-gray-50 p-4 rounded-lg shadow border">
//                                     <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">Chart of Accounts</h3>
//                                     <div className="grid grid-cols-2 gap-4 text-sm">
//                                         <span><b>Account Code:</b> {product.ChartOfAccountAccountCode}</span>
//                                         <span><b>Account Name:</b> {product.ChartOfAccountAccountName}</span>
//                                         <span><b>Full COA:</b> {product.ChartOfAccountName}</span>
//                                         <span><b>Type:</b> {product.ChartOfAccountAccountType}</span>
//                                     </div>
//                                 </div>


//                             </div>
//                         </div>
//                     </motion.div>
//                 </>
//             )}
//         </AnimatePresence>
//     );
// }







import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LoanProductDetailsDrawer({ open, onClose, product }) {
    if (!product) return null;

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
                        className="fixed top-3 right-3 w-[85vw] max-w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="p-3 m-1 space-y-4">
                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl mb-2 text-white font-semibold">
                                <span className="flex justify-center items-center ml-3">{product.Description} Details</span>
                                <Button variant="outline" onClick={onClose} className="text-gray-600">Close</Button>
                            </div>

                            {/* Basic Info */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white flex justify-between bg-gray-600 p-2 pl-4 rounded-lg mb-4">Basic Info</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Extended Description:</b> {product.ExtendedDescription}</span>
                                    <span><b>Priority:</b> {product.Priority}</span>
                                    <span><b>Section:</b> {product.LoanRegistrationLoanProductSectionDescription}</span>
                                    <span><b>Category:</b> {product.LoanRegistrationLoanProductCategoryDescription}</span>
                                    <span><b>Created Date:</b> {new Date(product.CreatedDate).toLocaleString()}</span>
                                    <span><b>Locked:</b> {product.IsLocked ? "Yes" : "No"}</span>
                                </div>
                            </div>

                            {/* Loan Details */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white flex justify-between bg-gray-600 p-2 pl-4 rounded-lg mb-4">Loan Details</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Max Amount:</b> {product.LoanRegistrationMaximumAmount}</span>
                                    <span><b>Min Amount:</b> {product.LoanRegistrationMinimumAmount}</span>
                                    <span><b>Term (Months):</b> {product.LoanRegistrationTermInMonths}</span>
                                    <span><b>Payment Frequency:</b> {product.LoanRegistrationPaymentFrequencyPerYearDescription}</span>
                                    <span><b>Payment Due:</b> {product.LoanRegistrationPaymentDueDateDescription}</span>
                                    <span><b>Take Home Type:</b> {product.TakeHomeTypeDescription}</span>
                                    <span><b>Take Home Fixed:</b> {product.TakeHomeFixedAmount}</span>
                                    <span><b>Interest Rate (%):</b> {product.LoanInterestAnnualPercentageRate}</span>
                                    <span><b>Interest Charge Mode:</b> {product.LoanInterestChargeModeDescription}</span>
                                    <span><b>Interest Recovery Mode:</b> {product.LoanInterestRecoveryModeDescription}</span>
                                    <span><b>Interest Calculation Mode:</b> {product.LoanInterestCalculationModeDescription}</span>
                                    <span><b>Microcredit:</b> {product.LoanRegistrationMicrocredit ? "Yes" : "No"}</span>
                                </div>
                            </div>

                            {/* Chart of Accounts */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white flex justify-between bg-gray-600 p-2 pl-4 rounded-lg mb-4">Chart of Accounts</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Account Code:</b> {product.ChartOfAccountAccountCode}</span>
                                    <span><b>Chart Of Account Name:</b> {product.ChartOfAccountAccountName}</span>
                                    <span><b>Type:</b> {product.ChartOfAccountAccountType}</span>
                                    <span><b>Interest Received Account:</b> {product.InterestReceivedChartOfAccountAccountName}</span>
                                    <span><b>Interest Receivable Account:</b> {product.InterestReceivableChartOfAccountAccountName}</span>
                                    <span><b>Interest Charged Account:</b> {product.InterestChargedChartOfAccountAccountName || "N/A"}</span>
                                </div>
                            </div>

                            {/* Security & Guarantees */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white flex justify-between bg-gray-600 p-2 pl-4 rounded-lg mb-4">Security & Guarantees</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Security Required:</b> {product.LoanRegistrationSecurityRequired ? "Yes" : "No"}</span>
                                    <span><b>Min Guarantors:</b> {product.LoanRegistrationMinimumGuarantors}</span>
                                    <span><b>Max Guarantees:</b> {product.LoanRegistrationMaximumGuarantees}</span>
                                    <span><b>Self Guarantee Allowed:</b> {product.LoanRegistrationAllowSelfGuarantee ? "Yes" : "No"}</span>
                                    <span><b>Max Self Guarantee %:</b> {product.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage}%</span>
                                    <span><b>Guarantor Security Mode:</b> {product.LoanRegistrationGuarantorSecurityModeDescription}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
