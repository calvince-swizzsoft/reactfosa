import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    FaUserAlt,
    FaPlus,
    FaChevronLeft,
    FaChevronRight,
    FaEllipsisV,
    FaFilePdf,
    FaFilter,
    FaTimes,
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
import { MemberRegistrationProvider } from "./MemberRegistrationContext";
import MemberDetailsDrawer from "./MemberDetailDrawer";
import MemberEditDrawer from "./MemberEditDrawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MEMBERS_API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/GetMembersWithDetails`;

const normalizeMemberRecord = (member = {}) => {
    const customerFromPayload = member.Customer || {};
    const address = member.address || customerFromPayload.address || {};

    const normalizedCustomer = {
        ...customerFromPayload,
        ...member,
        Id: member.id || customerFromPayload.Id || "",
        Type: customerFromPayload.Type || member.type || 1,
        SerialNumber: member.serialNumber || customerFromPayload.SerialNumber || "",
        PersonalIdentificationNumber: member.personalIdentificationNumber || customerFromPayload.PersonalIdentificationNumber || "",
        IndividualType: customerFromPayload.IndividualType || member.individualType || 1,
        IndividualFirstName: member.firstName || customerFromPayload.IndividualFirstName || "",
        IndividualLastName: member.lastName || customerFromPayload.IndividualLastName || "",
        IndividualIdentityCardType: customerFromPayload.IndividualIdentityCardType || member.idCardType || 1,
        IndividualIdentityCardNumber: member.idNumber || customerFromPayload.IndividualIdentityCardNumber || "",
        IndividualPayrollNumbers: member.payrollNumber || customerFromPayload.IndividualPayrollNumbers || "",
        IndividualSalutation: customerFromPayload.IndividualSalutation || member.salutation || "1",
        IndividualGender: customerFromPayload.IndividualGender || member.gender || "",
        IndividualMaritalStatus: customerFromPayload.IndividualMaritalStatus || member.maritalStatus || "",
        IndividualNationality: customerFromPayload.IndividualNationality || member.nationality || "",
        IndividualBirthDate: customerFromPayload.IndividualBirthDate || member.birthDate || "",
        IndividualEmploymentDesignation: customerFromPayload.IndividualEmploymentDesignation || member.employmentDesignation || "",
        IndividualEmploymentTermsOfService: customerFromPayload.IndividualEmploymentTermsOfService || member.employmentTerms || "",
        IndividualEmploymentDate: customerFromPayload.IndividualEmploymentDate || member.employmentDate || "",
        IndividualClassification: customerFromPayload.IndividualClassification || member.classification || "",
        AddressAddressLine1: customerFromPayload.AddressAddressLine1 || address.addressLine1 || "",
        AddressAddressLine2: customerFromPayload.AddressAddressLine2 || address.addressLine2 || "",
        AddressStreet: customerFromPayload.AddressStreet || address.street || "",
        AddressPostalCode: customerFromPayload.AddressPostalCode || address.postalCode || "",
        AddressCity: customerFromPayload.AddressCity || address.city || "",
        AddressEmail: customerFromPayload.AddressEmail || address.email || "",
        AddressLandLine: customerFromPayload.AddressLandLine || address.landLine || "",
        AddressMobileLine: customerFromPayload.AddressMobileLine || address.mobileLine || "",
        RegistrationDate: customerFromPayload.RegistrationDate || member.registrationDate || "",
        Reference1: customerFromPayload.Reference1 || member.reference1 || "",
        Reference2: customerFromPayload.Reference2 || member.memberNumber || "",
        Reference3: customerFromPayload.Reference3 || member.reference3 || "",
        Remarks: customerFromPayload.Remarks || member.remarks || "",
        IsDefaulter: customerFromPayload.IsDefaulter ?? member.isDefaulter ?? false,
        IsLocked: customerFromPayload.IsLocked ?? member.isLocked ?? false,
        InhibitGuaranteeing: customerFromPayload.InhibitGuaranteeing ?? member.inhibitGuaranteeing ?? false,
        RecordStatus: customerFromPayload.RecordStatus || member.recordStatus || 1,
        RecruitedBy: customerFromPayload.RecruitedBy || member.recruitedBy || "SYSTEM",
        BankName: customerFromPayload.BankName || member.bankName || "",
        BranchName: customerFromPayload.BranchName || member.branchName || "",
    };

    return {
        ...member,
        Customer: normalizedCustomer,
        Accounts: Array.isArray(member.Accounts) ? member.Accounts : [],
        NextOfKin: Array.isArray(member.NextOfKin) ? member.NextOfKin : Array.isArray(member.nextOfKin) ? member.nextOfKin : [],
        Age: member.Age ?? member.age ?? null,
    };
};

const normalizeMembersPayload = (payload) => {
    const fromMembersArray = Array.isArray(payload?.members)
        ? payload.members
        : Array.isArray(payload?.Data?.members)
            ? payload.Data.members
            : Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.Data)
                    ? payload.Data
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.result)
                            ? payload.result
                            : Array.isArray(payload?.results)
                                ? payload.results
                                : Array.isArray(payload?.value)
                                    ? payload.value
                                    : Array.isArray(payload?.items)
                                        ? payload.items
                                        : [];

    return fromMembersArray.map(normalizeMemberRecord);
};

export default function Members() {
    // allMembers holds the full dataset fetched once from the API
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Separate filter state for each column — applied client-side
    const [filters, setFilters] = useState({
        memberNo: "",
        fullName: "",
        idNo: "",
        phone: "",
        RegistrationDate: "",
    });

    // Track which filter popover is open
    const [activeFilter, setActiveFilter] = useState(null);

    const [openAddDrawer, setOpenAddDrawer] = useState(false);
    const [openEditDrawer, setOpenEditDrawer] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
    const [detailMember, setDetailMember] = useState(null);

    // Fetch all members once on mount
    useEffect(() => {
        fetchMembers();
    }, []);

    // Reset to page 0 when filters or page size change
    useEffect(() => {
        setCurrentPage(0);
    }, [filters, pageSize]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch(MEMBERS_API_URL);
            const json = await res.json();
            if (json.Success) {
                setAllMembers(normalizeMembersPayload(json.Data || json));
            } else {
                setAllMembers([]);
                Swal.fire("Error", json.Message || "Failed to fetch members.", "error");
            }
        } catch (err) {
            console.error("Fetch Members Error:", err);
            setAllMembers([]);
            Swal.fire("Error", "Failed to fetch members.", "error");
        } finally {
            setLoading(false);
        }
    };
    // Client-side filtering
    const filteredMembers = useMemo(() => {
        const safeMembers = Array.isArray(allMembers) ? allMembers : [];

        return safeMembers.filter((m) => {
            const c = m?.Customer || {};
            const fullName = `${c.IndividualFirstName || ""} ${c.IndividualLastName || ""}`.toLowerCase();
            if (filters.memberNo && !(c.Reference2 || "").toLowerCase().includes(filters.memberNo.toLowerCase())) return false;
            if (filters.fullName && !fullName.includes(filters.fullName.toLowerCase())) return false;
            if (filters.idNo && !(c.IndividualIdentityCardNumber || "").includes(filters.idNo)) return false;
            if (filters.phone && !(c.AddressMobileLine || c.AddressLandLine || "").includes(filters.phone)) return false;
            if (filters.RegistrationDate && !(c.RegistrationDate || "").startsWith(filters.RegistrationDate)) return false;
            return true;
        });
    }, [allMembers, filters]);

    // Client-side pagination derived values
    const totalCount = filteredMembers.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const members = filteredMembers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const isLastPage = currentPage + 1 >= totalPages;

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
                setAllMembers((prev) => prev.filter((m) => m.Customer.Id !== id));
                Swal.fire("Deleted!", "Member removed successfully.", "success");
            }
        });
    };

    const getFullName = (m) =>
        `${m.Customer?.IndividualFirstName || ""} ${m.Customer?.IndividualLastName || ""}`.trim();

    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString();
    };

    const handlePrintPDF = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/reporting/members-list-pdf`,
                {
                    method: "GET",
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

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: "" }));
        setActiveFilter(null);
    };

    const clearAllFilters = () => {
        setFilters({ memberNo: "", fullName: "", idNo: "", phone: "", RegistrationDate: "" });
        setActiveFilter(null);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== "");

    // Column filter button component
    const FilterButton = ({ filterKey, label, inputType = "text", placeholder }) => {
        const isActive = filters[filterKey] !== "";
        const isOpen = activeFilter === filterKey;

        return (
            <div className="relative inline-block">
                <button
                    onClick={() => setActiveFilter(isOpen ? null : filterKey)}
                    className={`ml-1 p-0.5 rounded transition-colors ${isActive
                        ? "text-yellow-300 bg-yellow-400/20"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                    title={`Filter by ${label}`}
                >
                    <FaFilter size={10} />
                </button>

                {isOpen && (
                    <div
                        className="absolute top-7 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Filter by {label}
                        </p>
                        <input
                            type={inputType}
                            autoFocus
                            value={filters[filterKey]}
                            onChange={(e) => updateFilter(filterKey, e.target.value)}
                            placeholder={placeholder || `Enter ${label}...`}
                            className="w-full px-3 py-2 text-sm border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") setActiveFilter(null);
                            }}
                        />
                        <div className="flex justify-between mt-2">
                            <button
                                onClick={() => clearFilter(filterKey)}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setActiveFilter(null)}
                                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative"
            onClick={() => activeFilter && setActiveFilter(null)}
        >
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

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <span className="text-sm text-gray-500 font-medium">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        const labels = {
                            memberNo: "Member No",
                            fullName: "Full Name",
                            idNo: "ID No",
                            phone: "Phone",
                            RegistrationDate: "Registration Date",
                        };
                        return (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
                            >
                                {labels[key]}: <strong>{value}</strong>
                                <button onClick={() => clearFilter(key)} className="ml-1 hover:text-red-500">
                                    <FaTimes size={10} />
                                </button>
                            </span>
                        );
                    })}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-500 hover:text-red-700 underline ml-1"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm" onClick={(e) => e.stopPropagation()}>
                {/* Table Header with per-column filters */}
                <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <div className="col-span-2 flex items-center">
                        Member No
                        <FilterButton filterKey="memberNo" label="Member No" placeholder="e.g. MEM001" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Full Name
                        <FilterButton filterKey="fullName" label="Full Name" placeholder="e.g. John Doe" />
                    </div>
                    <div className="col-span-3 flex items-center">
                        ID No
                        <FilterButton filterKey="idNo" label="ID No" placeholder="e.g. 12345678" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Phone
                        <FilterButton filterKey="phone" label="Phone" placeholder="e.g. 0712..." />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Registration Date
                        <FilterButton filterKey="RegistrationDate" label="Registration Date" inputType="date" />
                    </div>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col justify-center items-center p-10">
                        <img src={NotFoundImage} className="w-40 opacity-70" alt="Not found" />
                        <p className="mt-4 text-gray-500">No Members Found</p>
                    </div>
                ) : (
                    members.map((m) => (
                        <div
                            key={m.Customer.Id}
                            className="bg-white shadow-sm rounded-lg p-4 mb-4 transition hover:shadow-md"
                        >
                            <div className="grid grid-cols-14 gap-4 items-center">
                                <span className="col-span-2 font-semibold text-indigo-700">
                                    {m.Customer.Reference2}
                                </span>
                                <span className="col-span-2 font-semibold truncate">
                                    {getFullName(m)}
                                </span>
                                <span className="col-span-3 text-gray-600">
                                    {m.Customer.IndividualIdentityCardNumber}
                                </span>
                                <span className="col-span-2 text-gray-600">
                                    {m.Customer.AddressMobileLine}
                                </span>
                                <span className="col-span-2 text-gray-500 text-sm">
                                    {formatDate(m.Customer.RegistrationDate)}
                                </span>

                                <div className="col-span-2 flex items-center gap-2">
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

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-2 rounded hover:bg-gray-100 transition">
                                                <FaEllipsisV className="cursor-pointer text-gray-500" />
                                            </button>
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
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => handleDelete(m.Customer.Id)}
                                            >
                                                Delete
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
                {/* Page Size + Count */}
                <div className="flex items-center gap-4">
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
                    {totalCount > 0 && (
                        <span className="text-sm text-gray-500">
                            {Math.min(currentPage * pageSize + 1, totalCount)}–
                            {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} members
                        </span>
                    )}
                </div>

                {/* Page Controls */}
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
                        {totalPages ? ` of ${totalPages}` : ""}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLastPage}
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
            <MemberRegistrationProvider>
                <MemberRegistrationDrawer
                    open={openAddDrawer}
                    onClose={() => setOpenAddDrawer(false)}
                    refresh={fetchMembers}
                />
            </MemberRegistrationProvider>
            <MemberEditDrawer
                open={openEditDrawer}
                onClose={() => setOpenEditDrawer(false)}
                refresh={fetchMembers}
                member={selectedMember}
            />
        </div>
    );
}