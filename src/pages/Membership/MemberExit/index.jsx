import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight,
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
import MemberExitDetailsDrawer from "./MemberExitDetailsDrawer";
import AddMemberExitDrawer from "./AddMemberExitDrawer";
import { Verified } from "lucide-react";
import SettlementDetailsDrawer from "./SettlementDetailsDrawer";

export default function MemberExit() {
    const [exits, setExits] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
    const [selectedExit, setSelectedExit] = useState(null);
    const [openAddExit, setOpenAddExit] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [openSettlementDrawer, setOpenSettlementDrawer] = useState(false);


    useEffect(() => {
        fetchMemberExits();
    }, []);

    const fetchMemberExits = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                "http://88.99.215.90:8600/api/MemberExit/GetAll",
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            const json = await res.json();
            setExits(json.Data?.PageCollection || []);
        } catch (err) {
            console.error("Fetch Member Exit Error:", err);
            Swal.fire("Error", "Failed to load member exits", "error");
        } finally {
            setLoading(false);
        }
    };

    const getFullName = (m) =>
        `${m.CustomerIndividualFirstName || ""} ${m.CustomerIndividualLastName || ""}`;

    const formatDate = (date) =>
        date && date !== "0001-01-01T00:00:00"
            ? new Date(date).toLocaleDateString()
            : "-";

    // 🔍 Search filter
    const filteredExits = exits.filter((m) => {
        const term = search.toLowerCase();
        return (
            getFullName(m).toLowerCase().includes(term) ||
            (m.CustomerIndividualIdentityCardNumber || "")
                .toLowerCase()
                .includes(term) ||
            (m.CustomerAddressMobileLine || "")
                .toLowerCase()
                .includes(term) ||
            (m.PaddedCustomerSerialNumber || "")
                .toLowerCase()
                .includes(term)
        );
    });

    // 📄 Pagination (frontend)
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredExits.slice(
        startIndex,
        startIndex + pageSize
    );

    const totalPages = Math.ceil(filteredExits.length / pageSize);


    const handleSettle = async (exit) => {
        // Get current date-time in format YYYY-MM-DDTHH:MM
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, "0");
        const defaultDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const { value: formValues } = await Swal.fire({
            title: "Settle Member Exit",
            html: `
            <input type="datetime-local" id="settleDate" class="swal2-input" value="${defaultDate}">
            <input type="text" id="settleRemarks" class="swal2-input" placeholder="Enter remarks">
        `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                const date = document.getElementById("settleDate").value;
                const remarks = document.getElementById("settleRemarks").value;
                if (!date) {
                    Swal.showValidationMessage("Please select a settlement date");
                }
                return { date, remarks };
            },
        });

        if (!formValues) return; // Cancelled

        try {
            const payload = {
                Id: exit.Id,
                status: 1,
                SettledDate: new Date(formValues.date).toISOString(),
                SettlementRemarks: formValues.remarks || "",
            };

            const res = await fetch(`http://88.99.215.90:8600/api/MemberExit/Settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to settle member exit");
            }

            Swal.fire("Success", "Member exit settled successfully", "success");
            fetchMemberExits(); // Refresh table
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };


    console.log(exits);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaSignOutAlt /> Member Exits
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                        setSelectedCustomerId("PUT_CUSTOMER_ID_HERE");
                        setOpenAddExit(true);
                    }}
                >
                    Add Member Exit
                </Button>

            </div>

            {/* Search */}
            <div className="flex justify-start mb-6">
                <input
                    type="text"
                    placeholder="Search by name, ID, phone or Member No"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full max-w-md px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Member No</span>
                    <span className="col-span-2">Full Name</span>
                    <span className="col-span-2">ID No</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-4 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="p-6 text-center text-gray-500">
                        Loading member exits...
                    </div>
                ) : paginatedData.length === 0 ? (
                    <div className="flex flex-col justify-center items-center p-10">
                        <img src={NotFoundImage} className="w-40 opacity-70" />
                        <p className="mt-4 text-gray-500">
                            No Member Exit Records Found
                        </p>
                    </div>
                ) : (
                    paginatedData.map((m) => (
                        <div
                            key={m.Id}
                            className="bg-white shadow-sm rounded-lg p-4 mb-4"
                        >
                            <div className="grid grid-cols-14 gap-4 items-center">
                                <span className="col-span-2 font-semibold truncate">
                                    {m.PaddedCustomerSerialNumber}
                                </span>

                                <span className="col-span-2 font-semibold truncate">
                                    {getFullName(m)}
                                </span>

                                <span className="col-span-2">
                                    {m.CustomerIndividualIdentityCardNumber}
                                </span>

                                <span className="col-span-2">
                                    {m.CustomerAddressMobileLine}
                                </span>

                                <span className="col-span-2">
                                    {m.StatusDescription}
                                </span>
                                <span className="col-span-4 flex gap-2">
                                    {/* View Details Button */}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-gray-50 hover:text-white hover:bg-gray-800 bg-gray-700"
                                        onClick={() => {
                                            setSelectedExit(m);
                                            setOpenDetailsDrawer(true);
                                        }}
                                    >
                                        View Details
                                    </Button>

                                    {/* Settle Button */}
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => handleSettle(m)}
                                        disabled={m.StatusDescription === "Withdrawal Settled"} // Disabled if already settled

                                    >
                                        {m.StatusDescription === "Withdrawal Settled" ? "Settled" : "Settle"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => { setSelectedExit(m); setOpenSettlementDrawer(true); }}>
                                        View Settlement
                                    </Button>
                                </span>



                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        <FaChevronLeft /> Prev
                    </Button>

                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            )}

            <AddMemberExitDrawer
                open={openAddExit}
                onClose={() => setOpenAddExit(false)}
                customerId={selectedCustomerId}
                refresh={fetchMemberExits}
            />


            <MemberExitDetailsDrawer
                open={openDetailsDrawer}
                onClose={() => setOpenDetailsDrawer(false)}
                exit={selectedExit}
            />

            <SettlementDetailsDrawer
                open={openSettlementDrawer}
                onClose={() => setOpenSettlementDrawer(false)}
                exitId={selectedExit?.Id}
            />

        </div>
    );
}
