

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaFileInvoiceDollar,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaCalendarAlt,
    FaUserTie,
    FaMoneyBillWave,
    FaTruck,
    FaClipboardList,
    FaFileSignature,
    FaWarehouse,
} from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

export default function Quotations() {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedQuotation, setExpandedQuotation] = useState(null);
    const [awardingId, setAwardingId] = useState(null); // <-- loading indicator

    const fetchQuotations = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_PRO_URL}/api/rfq/GetAllQuotations`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            const data = await res.json();
            setQuotations(data || []); // data is already an array
        } catch (error) {
            console.error("Failed to load quotations", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchQuotations();
    }, []);

    // Example delete or edit placeholder
    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Quotation?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire("Deleted!", "Quotation has been deleted.", "success");
            }
        });
    };



    const handleAwardVendor = async (quotationId) => {
        // Find the quotation by Id
        const quotation = quotations.find((q) => q.Id === quotationId);
        if (!quotation) return;

        const payload = {
            RFQId: quotation.RFQId,
            VendorId: quotation.VendorId,
            VendorName: quotation.VendorName,
            ContactPerson: quotation.ContactPerson,
            Status: "Awarded",
        };

        console.log(payload)

        try {
            setAwardingId(quotationId); // start loading
            const res = await fetch(
                `${import.meta.env.VITE_APP_PRO_URL}/api/BidAnalysis/AwardVendor`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(payload),
                }
            );
            const dataresp = await res.json()
            console.log(dataresp)
            //if (!res.ok) throw new Error("Failed to award vendor");
            if (dataresp.success) {
                Swal.fire({
                    title: "Vendor Awarded!",
                    text: `${dataresp.message}.`,
                    icon: "success",
                });
            } else {
                Swal.fire({
                    title: "Error!",
                    text: `${dataresp.message}. Please try again.`,
                    icon: "error",
                });
            }
            // Update the awarded status in the table
            setQuotations((prev) =>
                prev.map((q) =>
                    q.Id === quotationId ? { ...q, Status: "Awarded" } : q
                )
            );
            // Optional: refresh quotations to reflect any status changes
            fetchQuotations();
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: "Error!",
                text: `${dataresp.message}. Please try again.`,
                icon: "error",
            });
        } finally {
            setAwardingId(null); // stop loading
        }
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaFileInvoiceDollar className="text-white" /> Bid Analysis
                </h2>
                <Button
                    onClick={fetchQuotations}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                    Refresh
                </Button>
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Vendor</span>
                    <span className="col-span-1">RFQ ID</span>
                    <span className="col-span-2">Quotation #</span>
                    <span className="col-span-2">Quoted Price</span>
                    <span className="col-span-2">Delivery Date</span>
                    <span className="col-span-1">Currency</span>
                    <span className="col-span-2">Actions</span>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : quotations.length > 0 ? (
                    <div className="space-y-2">
                        {quotations.map((q) => (
                            <div
                                key={q.Id}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                {/* Main Row */}
                                <div className="grid grid-cols-13 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-2 flex items-center gap-2">
                                        {q.VendorName}
                                    </span>
                                    <span className="col-span-1">{q.RFQId}</span>
                                    <span className="col-span-2 flex items-center gap-2">
                                        {q.QuotationNumber}
                                    </span>
                                    <span className="col-span-2 text-green-700 font-semibold flex items-center gap-2">
                                        {q.Currency}{" "}
                                        {q.Lines?.reduce((sum, line) => sum + (line.UnitPrice * line.Quantity), 0).toLocaleString()}
                                    </span>
                                    <span className="col-span-2 flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-500" />
                                        {q.Lines && q.Lines.length > 0
                                            ? new Date(q.Lines[0].DeliveryDate).toLocaleDateString()
                                            : "-"}
                                    </span>

                                    {/* <span className="col-span-2 flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-500" />
                                        {new Date(q.DeliveryDate).toLocaleDateString()}
                                    </span> */}
                                    <span className="col-span-2 uppercase">{q.Currency}</span>



                                    {/* Expand Button */}
                                    <div className="col-span-2 gap-2 flex justify-end">
                                        {/* Award Vendor Button */}
                                        <div className="col-span-2 flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAwardVendor(q.Id)}
                                                disabled={q.Status === "Awarded" || awardingId === q.Id}
                                                className="bg-indigo-700 hover:bg-indigo-600 text-white"
                                            >
                                                {awardingId === q.Id
                                                    ? "Awarding..."
                                                    : q.Status === "Awarded"
                                                        ? "Awarded"
                                                        : "Award Vendor"}
                                            </Button>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedQuotation(
                                                    expandedQuotation === q.Id ? null : q.Id
                                                )
                                            }
                                        >
                                            {expandedQuotation === q.Id ? (
                                                <>
                                                    <FaChevronUp /> Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View Details
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedQuotation === q.Id && (
                                    <div className=" bg-gray-200 p-4">
                                        <h4 className="font-semibold mb-2">Line Items:</h4>
                                        <table className="w-full border">
                                            <thead>
                                                <tr className="bg-white">
                                                    <th className="p-2 border">Item Code</th>
                                                    <th className="p-2 border">Description</th>
                                                    <th className="p-2 border">Qty</th>
                                                    <th className="p-2 border">Unit Price</th>
                                                    <th className="p-2 border">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {q.Lines?.map((line) => (
                                                    <tr key={line.Id} className="bg-gray-100">
                                                        <td className="border p-2">{line.ItemCode}</td>
                                                        <td className="border p-2">{line.ItemDescription}</td>
                                                        <td className="border p-2 text-center">{line.Quantity}</td>
                                                        <td className="border p-2 text-center">{line.UnitPrice}</td>
                                                        <td className="border p-2 text-center">
                                                            {(line.UnitPrice * line.Quantity).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img
                            src={NotFoundImage}
                            alt="Not Found"
                            className="mx-auto w-42 h-auto"
                        />
                        <p className="font-medium text-gray-400">No Quotations Found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

