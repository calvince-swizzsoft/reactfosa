import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MemberExitDetailsDrawer({ open, onClose, exit }) {
    if (!exit) return null;

    const formatDate = (date) =>
        date && date !== "0001-01-01T00:00:00"
            ? new Date(date).toLocaleString()
            : "-";

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
                                <span className="flex items-center ml-3">
                                    Member Exit Details
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="text-gray-600"
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Member Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Member Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Full Name:</b> {exit.CustomerIndividualFirstName} {exit.CustomerIndividualLastName}</span>
                                    <span><b>Member No:</b> {exit.PaddedCustomerSerialNumber}</span>
                                    <span><b>ID Number:</b> {exit.CustomerIndividualIdentityCardNumber}</span>
                                    <span><b>Gender:</b> {exit.CustomerIndividualGenderDescription}</span>
                                    <span><b>Marital Status:</b> {exit.CustomerIndividualMaritalStatusDescription}</span>
                                    <span><b>Payroll No:</b> {exit.CustomerIndividualPayrollNumbers}</span>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Phone:</b> {exit.CustomerAddressMobileLine}</span>
                                    <span><b>Email:</b> {exit.CustomerAddressEmail}</span>
                                    <span><b>City:</b> {exit.CustomerAddressCity}</span>
                                    <span><b>Street:</b> {exit.CustomerAddressStreet}</span>
                                </div>
                            </div>

                            {/* Exit Details */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Exit Details
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Branch:</b> {exit.BranchDescription}</span>
                                    <span><b>Status:</b> {exit.StatusDescription}</span>
                                    <span><b>Settlement Type:</b> {exit.SettlementTypeDescription}</span>
                                    <span><b>Exit Category:</b> {exit.CategoryDescription || "-"}</span>
                                    <span><b>Created On:</b> {formatDate(exit.CreatedDate)}</span>
                                    <span><b>Maturity Date:</b> {formatDate(exit.MaturityDate)}</span>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Financial Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span><b>Net Refundable:</b> KES {exit.NetRefundable?.toLocaleString()}</span>
                                    <span><b>Total Loans Guaranteed:</b> {exit.TotalLoansGuaranteed}</span>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border space-y-2">
                                <h3 className="font-bold text-white bg-gray-600 p-2 pl-4 rounded-lg mb-4">
                                    Remarks
                                </h3>
                                <p className="text-sm">
                                    {exit.Remarks || "No remarks provided"}
                                </p>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
