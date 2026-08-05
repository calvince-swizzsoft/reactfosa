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
    FaWallet,
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
import { apiFetch, normalizeList } from "@/lib/api";

const MEMBERS_API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/values/GetMembersWithDetails?pageIndex=0&pageSize=1000`;
const ACCOUNTS_API_URL = `${import.meta.env.VITE_APP_FOSA_URL}/api/accounts/customer-accounts`;
const PRODUCTS_API_URL = `${import.meta.env.VITE_APP_FOSA_URL}/api/accounts/savingsproducts`;
const BRANCHES_API_URL = `${import.meta.env.VITE_APP_FOSA_URL}/api/administration/branches`;

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

    // Add Account states
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [accountMember, setAccountMember] = useState(null);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [addingAccount, setAddingAccount] = useState(false);

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
            console.log("Members Response:", json);

            // Updated: members are in Data.members array
            if (json.Success && json.Data) {
                setAllMembers(json.Data.members || []);
            } else {
                setAllMembers([]);
                Swal.fire("Error", json.Message || "Failed to fetch members.", "error");
            }
        } catch (err) {
            console.error("Fetch Members Error:", err);
            Swal.fire("Error", "Failed to fetch members.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch(PRODUCTS_API_URL);
            const json = await res.json();
            console.log("Products Response:", json);

            const productsList = Array.isArray(json)
                ? json
                : Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json?.Data)
                        ? json.Data
                        : [];

            setProducts(productsList);

            if (productsList.length === 0 && !Array.isArray(json)) {
                console.warn("Products response did not contain an array payload:", json);
            }
        } catch (err) {
            console.error("Fetch Products Error:", err);
            Swal.fire("Error", "Failed to fetch products.", "error");
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const res = await apiFetch(BRANCHES_API_URL);
            const json = await res.json();

            // GET / now returns PageCollectionInfo<BranchDTO> (paged), not
            // a bare array — normalizeList unwraps pageCollection too.
            setBranches(normalizeList(json));

            if (branchesList.length > 0) {
                setSelectedBranch(branchesList[0].Id);
            }
        } catch (err) {
            console.error("Fetch Branches Error:", err);
            Swal.fire("Error", "Failed to fetch branches.", "error");
        } finally {
            setLoadingBranches(false);
        }
    };

    // Open Add Account Modal
    const handleAddAccount = async (member) => {
        setAccountMember(member);
        setSelectedProduct("");
        setSelectedBranch("");
        await Promise.all([fetchProducts(), fetchBranches()]);
        setShowAddAccountModal(true);
    };

    // Submit Add Account
    const handleSubmitAccount = async () => {
        if (!selectedProduct) {
            Swal.fire("Error", "Please select a product.", "error");
            return;
        }

        if (!selectedBranch) {
            Swal.fire("Error", "Please select a branch.", "error");
            return;
        }

        if (!accountMember) {
            Swal.fire("Error", "No member selected.", "error");
            return;
        }

        const product = products.find(p => p.Code === parseInt(selectedProduct));
        if (!product) {
            Swal.fire("Error", "Selected product could not be found.", "error");
            return;
        }

        try {
            setAddingAccount(true);

            const requestBody = {
                customerId: accountMember.id,
                branchId: selectedBranch,
                customerAccountTypeProductCode: product.Code,
                customerAccountTypeTargetProductId: product.Id,
            };

            console.log("Creating account with request:", requestBody);

            const response = await fetch(ACCOUNTS_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log("Account creation response:", data);

            if (data.success) {
                const productName = product.Description || "Account";

                // Get branch description
                const branch = branches.find(b => b.Id === selectedBranch);
                const branchName = branch?.Description || "Unknown Branch";

                await Swal.fire({
                    title: "Success!",
                    html: `
                        <p><strong>${productName}</strong> account created successfully.</p>
                        <p style="font-size: 13px; color: #666; margin-top: 8px;">
                            Member: ${accountMember.firstName} ${accountMember.lastName}
                            <br>Member No: ${accountMember.memberNumber || accountMember.Reference2 || "N/A"}
                            <br>Branch: ${branchName}
                            ${data.data?.CustomerReference2 ? `<br>Account Number: ${data.data.CustomerReference2}` : ''}
                        </p>
                    `,
                    icon: "success",
                    confirmButtonColor: "#4f46e5"
                });

                setShowAddAccountModal(false);
                setAccountMember(null);
                setSelectedProduct("");
                setSelectedBranch("");
                // Refresh members to update accounts list
                await fetchMembers();
            } else {
                throw new Error(data.message || "Failed to create account");
            }
        } catch (error) {
            console.error("Error creating account:", error);

            let errorMessage = error.message || "Failed to create account. Please try again.";

            // Check for specific error messages
            if (error.message?.includes("CustomerId")) {
                errorMessage = "Invalid customer ID. Please try again.";
            } else if (error.message?.includes("TargetProductId") || error.message?.includes("ProductCode")) {
                errorMessage = "Invalid product selected. Please choose a different product.";
            } else if (error.message?.includes("BranchId")) {
                errorMessage = "Invalid branch selected. Please choose a different branch.";
            }

            Swal.fire({
                title: "Error",
                text: errorMessage,
                icon: "error",
                confirmButtonColor: "#4f46e5"
            });
        } finally {
            setAddingAccount(false);
        }
    };

    // Client-side filtering - Updated for new data structure
    const filteredMembers = useMemo(() => {
        if (!Array.isArray(allMembers) || allMembers.length === 0) {
            return [];
        }

        return allMembers.filter((m) => {
            if (!m) return false;

            const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();

            if (filters.memberNo && !(m.memberNumber || m.Reference2 || "").toLowerCase().includes(filters.memberNo.toLowerCase())) return false;
            if (filters.fullName && !fullName.includes(filters.fullName.toLowerCase())) return false;
            if (filters.idNo && !(m.idNumber || "").includes(filters.idNo)) return false;
            if (filters.phone && !(m.address?.mobileLine || m.address?.landLine || "").includes(filters.phone)) return false;
            if (filters.RegistrationDate && !(m.registrationDate || "").startsWith(filters.RegistrationDate)) return false;
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
                setAllMembers((prev) => prev.filter((m) => m.id !== id));
                Swal.fire("Deleted!", "Member removed successfully.", "success");
            }
        });
    };

    const getFullName = (m) => {
        if (!m) return "";
        return `${m.firstName || ""} ${m.lastName || ""}`.trim();
    };

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
                <div className="grid grid-cols-15 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <div className="col-span-2 flex items-center">
                        Member No
                        <FilterButton filterKey="memberNo" label="Member No" placeholder="e.g. MEM001" />
                    </div>
                    <div className="col-span-2 flex items-center">
                        Full Name
                        <FilterButton filterKey="fullName" label="Full Name" placeholder="e.g. John Doe" />
                    </div>
                    <div className="col-span-2 flex items-center">
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
                    <span className="col-span-4 text-right">Actions</span>
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
                            key={m.id}
                            className="bg-white shadow-sm rounded-lg p-4 mb-4 transition hover:shadow-md"
                        >
                            <div className="grid grid-cols-15 gap-4 items-center">
                                <span className="col-span-2 font-semibold text-indigo-700">
                                    {m.memberNumber || m.Reference2 || "N/A"}
                                </span>
                                <span className="col-span-2 font-semibold truncate">
                                    {getFullName(m)}
                                </span>
                                <span className="col-span-2 text-gray-600">
                                    {m.idNumber || "N/A"}
                                </span>
                                <span className="col-span-2 text-gray-600">
                                    {m.address?.mobileLine || m.address?.landLine || "N/A"}
                                </span>
                                <span className="col-span-2 text-gray-500 text-sm">
                                    {formatDate(m.registrationDate)}
                                </span>

                                <div className="col-span-4 flex items-center gap-2 justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                                        onClick={() => handleAddAccount(m)}
                                        title="Add Account"
                                    >
                                        <FaWallet className="text-xs" /> Add Account
                                    </Button>

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
                                                onClick={() => handleDelete(m.id)}
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

            {/* Add Account Modal */}
            {showAddAccountModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddAccountModal(false)}>
                    <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FaWallet className="text-indigo-600" />
                                Add Account
                            </h3>
                            <button
                                onClick={() => setShowAddAccountModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Member Info */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-500">Member</p>
                                <p className="font-medium text-gray-800">
                                    {getFullName(accountMember)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Member No: {accountMember?.memberNumber || accountMember?.Reference2 || "N/A"}
                                </p>
                            </div>

                            {/* Branch Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Branch <span className="text-red-500">*</span>
                                </label>
                                {loadingBranches ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        <span className="ml-2 text-sm text-gray-500">Loading branches...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select a branch...</option>
                                        {branches.map((branch) => (
                                            <option key={branch.Id} value={branch.Id}>
                                                {branch.Description} ({branch.PaddedCode})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    Select the branch where this account will be created.
                                </p>
                            </div>

                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Account Type <span className="text-red-500">*</span>
                                </label>
                                {loadingProducts ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        <span className="ml-2 text-sm text-gray-500">Loading products...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select a product...</option>
                                        {products
                                            .filter(p => p.Description !== "ENTRANCE FEE" && p.Description !== "RUBANI BENOVELENT FUND (RBF)")
                                            .map((product) => (
                                                <option key={product.Id} value={product.Code}>
                                                    {product.Description} (Code: {product.PaddedCode})
                                                </option>
                                            ))
                                        }
                                    </select>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    Select the type of account to create for this member.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddAccountModal(false)}
                                    disabled={addingAccount}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                    onClick={handleSubmitAccount}
                                    disabled={!selectedProduct || !selectedBranch || addingAccount}
                                >
                                    {addingAccount ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus /> Create Account
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}