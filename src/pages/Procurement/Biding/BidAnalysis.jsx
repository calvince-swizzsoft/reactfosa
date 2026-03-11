import { useEffect, useState } from "react";
import {
    FaBuilding,
    FaChevronDown,
    FaChevronUp,
    FaCalendarAlt,
    FaUserTie,
    FaEllipsisV,
    FaListAlt,
    FaClipboardCheck,
    FaPlusCircle,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddBidDrawer from "./AddBidDrawer";

export default function BidAnalysis() {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBid, setExpandedBid] = useState(null);
    const [addBidOpen, setAddBidOpen] = useState(false); // drawer state

    const fetchBids = () => {
        fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/BidAnalysis/GetAllBids`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((res) => res.json())
            .then((data) => {
                setBids(data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching bids:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBids();
    }, []);

    // Delete Handler Example
    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the bid record.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                Swal.fire("Deleted!", "Bid has been deleted.", "success");
            }
        });
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaClipboardCheck className="text-white" /> Bid Analysis
                </h2>
                <Button
                    onClick={() => setAddBidOpen(true)}
                    className="bg-white text-indigo-700 hover:bg-indigo-100 flex items-center gap-2"
                >
                    <FaPlusCircle /> Add Bid
                </Button>
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-13 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Bid Title</span>
                    <span className="col-span-2">Project ID</span>
                    <span className="col-span-3">Created By</span>
                    <span className="col-span-2">Date</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loader */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
                            >
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : bids.length > 0 ? (
                    <div className="space-y-2">
                        {bids.map((bid) => (
                            <div
                                key={bid.BidId}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                {/* Main Row */}
                                <div className="grid grid-cols-13 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-2 flex items-center gap-2">
                                        <FaListAlt className="text-indigo-500" /> {bid.BidTitle}
                                    </span>
                                    <span className="col-span-2">{bid.ProjectId}</span>
                                    <span className="flex items-center gap-2 col-span-3 text-gray-700">
                                        <FaUserTie className="text-gray-500" /> {bid.CreatedBy}
                                    </span>
                                    <span className="col-span-2 flex items-center gap-2 text-gray-600">
                                        <FaCalendarAlt className="text-gray-500" />{" "}
                                        {new Date(bid.BidDate).toLocaleDateString()}
                                    </span>
                                    <span
                                        className={`text-sm text-center rounded-2xl flex items-center justify-center p-1 col-span-2 ${bid.Status === "Auto Evaluated"
                                            ? "text-white bg-green-600"
                                            : "text-white bg-yellow-600"
                                            }`}
                                    >
                                        {bid.Status}
                                    </span>

                                    {/* Expand Button */}
                                    <div className="col-span-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
                                            onClick={() =>
                                                setExpandedBid(
                                                    expandedBid === bid.BidId ? null : bid.BidId
                                                )
                                            }
                                        >
                                            {expandedBid === bid.BidId ? (
                                                <>
                                                    <FaChevronUp /> Hide Vendors
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View Vendors
                                                </>
                                            )}
                                        </Button>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-2 h-8 w-8 p-0"
                                                >
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem
                                                    className="text-blue-600 hover:text-blue-700"
                                                    onClick={() =>
                                                        Swal.fire("Info", "View Bid clicked", "info")
                                                    }
                                                >
                                                    View Bid
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(bid.BidId)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expanded Vendor Section */}
                                {expandedBid === bid.BidId && (
                                    <div className="border-t bg-gray-100 p-4 rounded-b-lg">
                                        {bid.Vendors && bid.Vendors.length > 0 ? (
                                            <div className="divide-y">
                                                {bid.Vendors.map((vendor) => (
                                                    <div
                                                        key={vendor.VendorId}
                                                        className="grid grid-cols-8 gap-3 items-center px-6 py-3 bg-white rounded-lg border-2 border-gray-300 mb-2"
                                                    >
                                                        <span className="col-span-2 flex items-center gap-2 font-semibold text-indigo-700">
                                                            <FaBuilding className="text-indigo-600" />{" "}
                                                            {vendor.VendorName}
                                                        </span>
                                                        <span className="col-span-1 text-sm text-gray-600">
                                                            {vendor.ContactPerson}
                                                        </span>
                                                        <span className="col-span-1 text-sm text-gray-600">
                                                            {vendor.ContactPhone}
                                                        </span>
                                                        <span className="col-span-1 text-sm text-gray-600 truncate">
                                                            {vendor.ContactEmail}
                                                        </span>
                                                        <span className="col-span-1 text-right font-semibold text-gray-800">
                                                            {vendor.QuotationAmount?.toFixed(2)}
                                                        </span>
                                                        <span className="col-span-1 text-sm text-gray-600">
                                                            {vendor.DeliveryPeriod}
                                                        </span>
                                                        <span className="col-span-1 text-sm italic text-gray-500">
                                                            {vendor.Remarks}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm italic px-6 py-3">
                                                No vendor quotations found.
                                            </p>
                                        )}
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
                        <p className="font-medium text-gray-400">No Bids Found.</p>
                    </div>
                )}
            </div>
            {addBidOpen && (
                <AddBidDrawer
                    open={addBidOpen}
                    onClose={() => setAddBidOpen(false)}
                    onSuccess={fetchBids}
                />
            )}
        </div>
    );
}
