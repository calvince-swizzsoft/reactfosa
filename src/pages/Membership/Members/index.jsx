

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUserAlt,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaEllipsisV,
    FaFilePdf,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import MemberRegistrationDrawer from "./MemberRegistrationDrawer";
import MemberDetailsDrawer from "./MemberDetailDrawer";
import MemberEditDrawer from "./MemberEditDrawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function Members() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");

    const [openAddDrawer, setOpenAddDrawer] = useState(false);
    const [openEditDrawer, setOpenEditDrawer] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
    const [detailMember, setDetailMember] = useState(null);

    const totalPages = pagination?.TotalPages;
    const totalMembers = pagination?.TotalCount ?? members.length;

    const [pageSize, setPageSize] = useState(10);


    // Reset currentPage if search or totalPages change
    useEffect(() => {
        setCurrentPage(totalPages);
    }, [totalPages]);

    // Debounced fetch
    useEffect(() => {
        const timeout = setTimeout(() => fetchMembers(), 400);
        return () => clearTimeout(timeout);
    }, [currentPage, search, pageSize]);


    useEffect(() => {
        setCurrentPage(0);
    }, [pageSize]);


    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/GetMembersWithDetails` +
                `?pageIndex=${currentPage}` +
                `&pageSize=${pageSize}` +
                `&includeAccounts=true` +
                `&includeNextOfKin=true` +
                (search ? `&searchTerm=${encodeURIComponent(search)}` : ""),
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );

            const json = await res.json();
            setMembers(json.Data?.Members || []);
            setPagination(json.Data?.Pagination || null);
        } catch (err) {
            console.error("Fetch Members Error:", err);
            Swal.fire("Error", "Failed to fetch members.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Member?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then((result) => {
            if (result.isConfirmed) {
                setMembers((prev) => prev.filter((m) => m.Id !== id));
                Swal.fire("Deleted!", "Member removed successfully.", "success");
            }
        });
    };

    const getFullName = (m) =>
        `${m.Customer?.IndividualFirstName || ""} ${m.Customer?.IndividualLastName || ""}`;

    const formatDate = (date) => new Date(date).toLocaleDateString();

    const handlePrintPDF = async () => {
        try {
            const res = await fetch(
                "http://88.99.215.90:8600/api/reporting/members-list-pdf",
                {
                    method: "GET",
                    headers: { "ngrok-skip-browser-warning": "true" },
                }
            );

            if (!res.ok) throw new Error("Failed to generate PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Members_List.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };

    console.log(members);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaUserAlt /> Members
                </h2>
                <div className="flex gap-3">
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                        onClick={() => setOpenAddDrawer(true)}
                    >
                        <FaPlus /> Add Member
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                        onClick={handlePrintPDF}
                    >
                        <FaFilePdf /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="flex justify-start mb-6">
                <div className="relative w-full max-w-md">
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, ID No, phone or Member No"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-300 bg-white text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-md transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Member No</span>
                    <span className="col-span-2">Full Name</span>
                    <span className="col-span-3">ID No</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-2">Created</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

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
                ) : members.length === 0 ? (
                    <div className="flex flex-col justify-center items-center p-10">
                        <img src={NotFoundImage} className="w-40 opacity-70" />
                        <p className="mt-4 text-gray-500">No Members Found</p>
                    </div>
                ) : (
                    members.map((m) => (
                        <div key={m.Id} className="bg-white shadow-sm rounded-lg p-4 mb-4 transition">
                            <div className="grid grid-cols-14 gap-4 items-center">
                                <span className="col-span-2 font-semibold">{m.Customer.Reference2}</span>
                                <span className="col-span-2 font-semibold">{getFullName(m)}</span>
                                <span className="col-span-3">{m.Customer.IndividualIdentityCardNumber}</span>
                                <span className="col-span-2">{m.Customer.AddressMobileLine}</span>
                                <span className="col-span-2">{formatDate(m.Customer.RegistrationDate)}</span>

                                <div className="col-span-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-gray-700 hover:bg-gray-600 text-white"
                                        onClick={() => {
                                            setDetailMember(m);
                                            setOpenDetailsDrawer(true);
                                        }}
                                    >
                                        <FaChevronRight /> More Info
                                    </Button>
                                </div>

                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <FaEllipsisV className="cursor-pointer" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setSelectedMember(m);
                                                    setOpenEditDrawer(true);
                                                }}
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>


            {/* Pagination */}

            <div className="flex justify-between items-center mt-6">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => setPageSize(Number(value))}
                    >
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 0}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                    >
                        <FaChevronLeft /> Prev
                    </Button>

                    <span className="text-sm text-gray-600">
                        Page {currentPage + 1}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        //disabled={currentPage + 1 >= totalPages}
                        //backend dev didn't add the total pages inside api json
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            </div>




            {/* Drawers */}
            <MemberDetailsDrawer
                open={openDetailsDrawer}
                onClose={() => setOpenDetailsDrawer(false)}
                member={detailMember}
            />
            <MemberRegistrationDrawer open={openAddDrawer} onClose={() => setOpenAddDrawer(false)} refresh={fetchMembers} />
            <MemberEditDrawer open={openEditDrawer} onClose={() => setOpenEditDrawer(false)} refresh={fetchMembers} member={selectedMember} />
        </div >
    );
}
