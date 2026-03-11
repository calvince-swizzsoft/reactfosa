
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUsers,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaPlus,
    FaPhoneAlt,
    FaMapMarkerAlt,
} from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddCustomerDrawer from "./AddCustomerDrawer";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [showAddDrawer, setShowAddDrawer] = useState(false);

    const fetchCustomers = () => {
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetARCustomers`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((res) => res.json())
            .then((data) => {
                setCustomers(data.Data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = (custNo) => {
        Swal.fire({
            title: "Confirm Delete",
            text: `Are you sure you want to delete ${custNo}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire("Deleted!", "Customer record removed (simulated).", "success");
            }
        });
    };

    return (
        <div className="bg-white px-4 py-8 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUsers /> Customers
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setShowAddDrawer(true)}
                >
                    <FaPlus /> Add Customer
                </Button>
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-1">No</span>
                    <span className="col-span-3">Name</span>
                    <span className="col-span-3">Contact</span>
                    <span className="col-span-3">Address</span>
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
                ) : customers.length > 0 ? (
                    <div className="space-y-2">
                        {customers.map((cust, index) => (
                            <div
                                key={cust.Id || index}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                {/* Main Row */}
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-1">
                                        {cust.No || index + 1}
                                    </span>
                                    <span className="col-span-3 truncate">{cust.Name}</span>
                                    <span className="col-span-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm flex items-center gap-2">
                                                {cust.MobilePhoneNumber || "N/A"}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {cust.ContactPersonName}
                                            </span>
                                        </div>
                                    </span>
                                    <span className="col-span-3 text-sm flex flex-col">
                                        <span className="flex items-center gap-2">
                                            {cust.Town},{" "}
                                            {cust.City}
                                        </span>
                                        <span>{cust.Country}</span>
                                    </span>

                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
                                            onClick={() =>
                                                setExpandedCustomer(
                                                    expandedCustomer === index ? null : index
                                                )
                                            }
                                        >
                                            {expandedCustomer === index ? (
                                                <>
                                                    <FaChevronUp /> Hide
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> Details
                                                </>
                                            )}
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem
                                                    className="hover:text-indigo-600"
                                                    onClick={() =>
                                                        Swal.fire("Info", "Edit customer (coming soon).", "info")
                                                    }
                                                >
                                                    ✏️ Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="hover:text-red-600 text-indigo-600"
                                                    onClick={() => handleDelete(cust.No)}
                                                >
                                                    🗑️ Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedCustomer === index && (
                                    <div className="border-t bg-gray-100 p-4 rounded-b-lg grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-indigo-700 mb-1">
                                                Customer Info
                                            </p>
                                            <p>
                                                <strong>No:</strong> {cust.No}
                                            </p>
                                            <p>
                                                <strong>Name:</strong> {cust.Name}
                                            </p>
                                            <p>
                                                <strong>Balance:</strong>{" "}
                                                <span
                                                    className={`font-bold ${cust.Balance > 0
                                                        ? "text-green-700"
                                                        : "text-gray-500"
                                                        }`}
                                                >
                                                    {cust.Balance.toLocaleString()} /=
                                                </span>
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-indigo-700 mb-1">
                                                Contact Person
                                            </p>
                                            <p>{cust.ContactPersonName}</p>
                                            <p>{cust.ContactPersonPhoneNo}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-indigo-700 mb-1">
                                                Location
                                            </p>
                                            <p>{cust.Address}</p>
                                            <p>
                                                {cust.Town}, {cust.City}
                                            </p>
                                            <p>{cust.Country}</p>
                                        </div>
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
                        <p className="font-medium text-gray-400">No Customers Found.</p>
                    </div>
                )}
            </div>

            {/* Add Customer Drawer */}
            <AddCustomerDrawer
                open={showAddDrawer}
                onClose={() => setShowAddDrawer(false)}
                onSuccess={fetchCustomers}
            />
        </div>
    );
}
