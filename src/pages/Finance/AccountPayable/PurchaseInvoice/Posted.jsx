import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
} from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import UpdatePurchaseInvoiceDrawer from "./UpdatePurchaseInvoiceDrawer";
import { MdOutlinePostAdd } from "react-icons/md";

export default function Posted() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedInvoice, setExpandedInvoice] = useState(null);
    const [showUpdateDrawer, setShowUpdateDrawer] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const fetchInvoices = () => {
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoices?Posted=true`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((res) => res.json())
            .then((data) => {
                setInvoices(data.Data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const confirmAndPostInvoice = (invoiceId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to post this invoice?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, post it!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                handlePostInvoice(invoiceId);
            }
        });
    };

    const handlePostInvoice = async (invoiceNo) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/PostPurchaseInvoice/${invoiceNo}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                }
            );

            const resData = await response.json();
            if (response.ok && resData.success === true) {
                Swal.fire("Success!", resData.message, "success");
                fetchInvoices();
            } else {
                Swal.fire("Error!", resData.message || "Failed to post invoice.", "error");
            }
        } catch {
            Swal.fire("Error!", "Failed to post invoice.", "error");
        }
    };

    return (
        <div className="bg-white relative">
            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-11 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-1">No</span>
                    <span className="col-span-2">Vendor</span>
                    <span className="col-span-2">Address</span>
                    <span className="col-span-2">Document Date</span>
                    <span className="col-span-2">Due Date</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loader */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-13 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : invoices.length > 0 ? (
                    <div className="space-y-2">
                        {invoices.map((invoice, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-lg border">
                                {/* Main Row */}
                                <div className="grid grid-cols-11 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-1">{index + 1}</span>
                                    <span className="col-span-2">{invoice.VendorName || `Vendor ${invoice.VendorNo}`}</span>
                                    <span className="col-span-2">{invoice.VendorAddress}</span>
                                    <span className="col-span-2">{new Date(invoice.DocumentDate).toLocaleDateString()}</span>
                                    <span className="col-span-2">{new Date(invoice.DueDate).toLocaleDateString()}</span>

                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
                                            onClick={() =>
                                                setExpandedInvoice(expandedInvoice === index ? null : index)
                                            }
                                        >
                                            {expandedInvoice === index ? (
                                                <>
                                                    <FaChevronUp /> Hide Lines
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View Lines
                                                </>
                                            )}
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem
                                                    className="hover:text-indigo-600"
                                                    onClick={() => {
                                                        setSelectedInvoice(invoice);
                                                        setShowUpdateDrawer(true);
                                                    }}
                                                >
                                                    ✏️ Update
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="hover:text-red-600 text-indigo-600"
                                                    onClick={() => confirmAndPostInvoice(invoice.Id)}
                                                >
                                                    <MdOutlinePostAdd className="mr-2" /> Post
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expanded Lines */}
                                {expandedInvoice === index && (
                                    <div className="border-t bg-gray-200 p-3 rounded-b-lg">
                                        {invoice.PurchaseInvoiceLines?.length > 0 ? (
                                            <div className="divide-y">
                                                {invoice.PurchaseInvoiceLines.map((line, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="grid grid-cols-6 gap-2 items-center px-6 py-3 mb-2 bg-white rounded-lg border-2 border-gray-400"
                                                    >
                                                        <span className="col-span-1 font-semibold text-indigo-700">
                                                            {line.TypeDescription || "Line"}
                                                        </span>
                                                        <span className="col-span-2 text-gray-700">{line.Description}</span>
                                                        <span className="col-span-1 text-gray-600">Qty: {line.Quantity}</span>
                                                        <span className="col-span-2 text-right font-bold text-green-700">
                                                            {Number(line.TotalAmount || 0).toLocaleString()} /=
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm italic px-6 py-3">
                                                No invoice lines found.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
                        <p className="font-medium text-gray-400">No Invoices Found.</p>
                    </div>
                )}
            </div>

            {/* Update Drawer */}
            <UpdatePurchaseInvoiceDrawer
                open={showUpdateDrawer}
                onClose={() => setShowUpdateDrawer(false)}
                invoice={selectedInvoice}
                onSuccess={fetchInvoices}
            />
        </div>
    );
}
