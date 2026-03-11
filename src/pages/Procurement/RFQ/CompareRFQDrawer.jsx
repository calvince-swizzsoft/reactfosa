// import React from "react";
// import { FaBalanceScale } from "react-icons/fa";

// export default function CompareRFQDrawer({
//     open,
//     onClose,
//     loading,
//     relatedRFQs = [],
// }) {
//     if (!open) return null;

//     return (
//         <div className="fixed top-0 right-0 w-[700px] h-full bg-white shadow-2xl border-l z-50 p-6 overflow-y-auto transition-transform animate-slide-left">
//             <div className="flex justify-between items-center border-b pb-3 mb-3">
//                 <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
//                     <FaBalanceScale /> Compare RFQs
//                 </h3>
//                 <button
//                     className="text-gray-500 hover:text-red-600"
//                     onClick={onClose}
//                 >
//                     ✕
//                 </button>
//             </div>

//             {loading ? (
//                 <p className="text-center text-gray-500 mt-10">Loading related RFQs...</p>
//             ) : relatedRFQs.length > 0 ? (
//                 <div className="space-y-4">
//                     {relatedRFQs.map((item, index) => {
//                         const r = item.RelatedRFQ;
//                         return (
//                             <div
//                                 key={index}
//                                 className="p-3 border rounded-lg shadow-sm hover:shadow-md"
//                             >
//                                 <p className="font-semibold text-indigo-700">
//                                     Vendor: {r.VendorName}
//                                 </p>
//                                 <p className="text-sm">RFQ #: {r.RFQNumber}</p>
//                                 <p className="text-sm text-gray-600">
//                                     Created: {new Date(r.CreatedDate).toLocaleString()}
//                                 </p>
//                                 <p className="text-sm text-gray-500 mb-2">
//                                     Status: {r.Status}
//                                 </p>
//                                 <div className="bg-gray-100 rounded-md p-2 text-sm">
//                                     {r.Lines?.map((line, i) => (
//                                         <div key={i} className="border-b py-1">
//                                             <p>
//                                                 <strong>{line.ItemDescription}</strong> ({line.Quantity}{" "}
//                                                 {line.UnitOfMeasure})
//                                             </p>
//                                             <p>
//                                                 Est. Unit: KES {line.EstimatedUnitPrice} | Total:{" "}
//                                                 <strong>KES {line.EstimatedTotal}</strong>
//                                             </p>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             ) : (
//                 <div className="text-center text-gray-500 mt-20">
//                     No related RFQs found for this ID.
//                 </div>
//             )}
//         </div>
//     );
// }














import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaBalanceScale } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";

export default function CompareRFQDrawer({ open, onClose, loading, relatedRFQs = [] }) {
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
                        className="fixed top-3 right-5 w-[1000px] max-h-[95vh] bg-white shadow-xl z-50 flex flex-col rounded-2xl overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                <FaBalanceScale /> Compare RFQs
                            </h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex-1 overflow-y-auto">
                            {loading ? (
                                // ✅ Skeleton Loader - matching your RFQ layout
                                <div className="space-y-4 bg-gray-400 p-3 rounded-lg animate-pulse">
                                    {[...Array(3)].map((_, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border rounded-lg shadow-sm bg-gray-50 space-y-3"
                                        >
                                            {/* Header skeleton */}
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                                                <div className="h-4 bg-gray-400 rounded w-16"></div>
                                            </div>

                                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-2/5 mb-2"></div>

                                            {/* Line items table skeleton */}
                                            <div className="bg-gray-200 rounded-md p-2 text-sm border space-y-2">
                                                <div className="grid grid-cols-4 gap-2 bg-gray-400 p-2 rounded-md">
                                                    <div className="h-3 bg-gray-300 rounded"></div>
                                                    <div className="h-3 bg-gray-300 rounded"></div>
                                                    <div className="h-3 bg-gray-300 rounded"></div>
                                                    <div className="h-3 bg-gray-300 rounded"></div>
                                                </div>
                                                {[...Array(3)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="grid grid-cols-4 gap-2 border-b py-1"
                                                    >
                                                        <div className="h-3 bg-gray-300 rounded"></div>
                                                        <div className="h-3 bg-gray-300 rounded"></div>
                                                        <div className="h-3 bg-gray-300 rounded"></div>
                                                        <div className="h-3 bg-gray-300 rounded"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : relatedRFQs.length > 0 ? (
                                <div className="space-y-4 bg-gray-400 p-3 rounded-lg">
                                    {relatedRFQs.map((item, index) => {
                                        const r = item.RelatedRFQ;
                                        return (
                                            <div
                                                key={index}
                                                className="p-3 border rounded-lg shadow-sm hover:shadow-md transition bg-gray-50"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="font-semibold text-indigo-700">
                                                        Vendor: <span className="text-gray-800">{r.VendorName}</span>
                                                    </p>
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-2xl text-white ${r.Status === "Open"
                                                            ? "bg-green-600"
                                                            : r.Status === "Closed"
                                                                ? "bg-gray-500"
                                                                : "bg-yellow-500"
                                                            }`}
                                                    >
                                                        {r.Status}
                                                    </span>
                                                </div>

                                                <p className="text-sm">RFQ #: {r.RFQNumber}</p>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Created: {new Date(r.CreatedDate).toLocaleString()}
                                                </p>

                                                {/* Line items */}
                                                <div className="bg-gray-300 rounded-md p-2 text-sm border">
                                                    <div className="grid grid-cols-4 font-semibold border-b pb-1 mb-1 bg-gray-600 text-white p-2 rounded-md">
                                                        <span>Description</span>
                                                        <span>Qty</span>
                                                        <span>Unit Price</span>
                                                        <span>Total</span>
                                                    </div>
                                                    {r.Lines?.map((line, i) => (
                                                        <div key={i} className="grid grid-cols-4 gap-2 border-b py-1">
                                                            <span>{line.ItemDescription}</span>
                                                            <span>{line.Quantity}</span>
                                                            <span>KES {line.EstimatedUnitPrice}</span>
                                                            <span className="font-semibold">
                                                                KES {line.EstimatedTotal}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (

                                <div className="text-gray-500 text-center mt-4 bg-gray-200 p-3 rounded-lg">
                                    <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
                                    <p className="font-medium text-gray-400">
                                        No Vendor Quotations found
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
