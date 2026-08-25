import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaBuilding,
    FaPlus,
    FaPhone,
    FaEnvelope,
    FaChevronDown,
    FaChevronUp,
    FaChevronLeft,
    FaChevronRight,
    FaEdit,
    FaLock,
    FaLockOpen,
    FaMapMarkerAlt,
    FaSearch,
    FaFilter,
} from "react-icons/fa";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddBranch from "./AddBranch";
import EditBranch from "./EditBranch";
import { apiErrorMessage, apiJson } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;
const BRANCH_BASE = `${FIN_BASE}/api/administration/branches`;

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBranch, setExpandedBranch] = useState(null);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [openBranch, setOpenBranch] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [companyFilter, setCompanyFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [uniqueCompanies, setUniqueCompanies] = useState([]);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [itemsCount, setItemsCount] = useState(0);

    // GET / returns PageCollectionInfo<BranchDTO> — { pageIndex, pageSize,
    // pageCollection, itemsCount } — not a bare array, sorted by
    // sequentialId ascending (oldest first), same convention as
    // company-api-spec.md.
    const normalizeList = (d) => {
        const payload = d?.data ?? d?.Data ?? d;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
        if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
        return [];
    };

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: String(pageIndex),
                pageSize: String(pageSize),
                text: searchQuery,
            });
            const json = await apiJson(`${BRANCH_BASE}?${params.toString()}`, {}, { fallbackMessage: "Failed to load branches." });
            const payload = json?.data ?? json?.Data ?? {};
            setBranches(normalizeList(json));
            setItemsCount(payload.itemsCount ?? payload.ItemsCount ?? 0);
        } catch (err) {
            Swal.fire("Error", apiErrorMessage(err, "Unable to load branches."), "error");
            setBranches([]);
            setItemsCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageIndex, pageSize]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPageIndex(0);
            fetchBranches();
        }, 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    useEffect(() => {
        if (branches.length > 0) {
            const companies = [...new Set(branches
                .map((branch) => branch.CompanyDescription)
                .filter((company) => company && company.trim() !== "")
            )];
            setUniqueCompanies(companies);
        }
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branches, companyFilter, sortBy, sortOrder]);

    // Company filter/sort apply on top of whatever page is currently
    // loaded — same pattern as the Companies list's status filter.
    const applyFilters = () => {
        let filtered = [...branches];

        if (companyFilter !== "all") {
            filtered = filtered.filter((branch) => branch.CompanyDescription === companyFilter);
        }

        filtered.sort((a, b) => {
            let valueA, valueB;
            switch (sortBy) {
                case "email":
                    valueA = a.AddressEmail || ""; valueB = b.AddressEmail || "";
                    break;
                case "company":
                    valueA = a.CompanyDescription || ""; valueB = b.CompanyDescription || "";
                    break;
                case "phone":
                    valueA = a.AddressMobileLine || ""; valueB = b.AddressMobileLine || "";
                    break;
                case "city":
                    valueA = a.AddressCity || ""; valueB = b.AddressCity || "";
                    break;
                default:
                    valueA = a.Description || ""; valueB = b.Description || "";
            }
            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredBranches(filtered);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setCompanyFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    // Branches don't have a hard delete — the old raw-SQL controller did,
    // but the rewritten one follows the same soft-lock convention as every
    // other aggregate here. PATCH /{id}/toggle-lock is the removal
    // equivalent.
    const handleToggleLock = async (branch) => {
        const willLock = !branch.IsLocked;
        const r = await Swal.fire({
            title: willLock ? "Lock this branch?" : "Unlock this branch?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: willLock ? "#dc2626" : "#4f46e5",
            confirmButtonText: willLock ? "Lock" : "Unlock",
        });
        if (!r.isConfirmed) return;
        try {
            const data = await apiJson(`${BRANCH_BASE}/${branch.Id}/toggle-lock`, { method: "PATCH" }, { fallbackMessage: "Failed to change the branch lock state." });
            Swal.fire("Done", data.message || `Branch ${willLock ? "locked" : "unlocked"} successfully`, "success");
            fetchBranches();
        } catch (err) {
            Swal.fire("Error", apiErrorMessage(err, "Unable to change the branch lock state."), "error");
        }
    };

    const hasNextPage = itemsCount
        ? (pageIndex + 1) * pageSize < itemsCount
        : branches.length === pageSize;

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBuilding className="text-white" /> Branches
                    <span className="text-sm font-normal ml-2">
                        ({itemsCount || filteredBranches.length} {itemsCount === 1 ? 'branch' : 'branches'})
                    </span>
                </h2>
                <Button
                    onClick={() => setOpenBranch(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                    <FaPlus /> Add Branch
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search branches by name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                        className="border border-gray-300 rounded-lg px-3"
                    >
                        {[10, 20, 50, 100].map((s) => (
                            <option key={s} value={s}>{s} per page</option>
                        ))}
                    </select>

                    {(searchQuery || companyFilter !== "all") && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Company (current page)
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={companyFilter}
                                onChange={(e) => setCompanyFilter(e.target.value)}
                            >
                                <option value="all">All Companies</option>
                                {uniqueCompanies.map((company, index) => (
                                    <option key={index} value={company}>{company}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By (current page)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['name', 'company', 'email', 'phone', 'city'].map((field) => (
                                    <Button
                                        key={field}
                                        size="sm"
                                        variant={sortBy === field ? "default" : "outline"}
                                        className="capitalize"
                                        onClick={() => handleSort(field)}
                                    >
                                        {field}
                                        {sortBy === field && (
                                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Branch</span>
                    <span className="col-span-3">Email</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-2">Company</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : filteredBranches.length > 0 ? (
                    <div className="space-y-2">
                        {filteredBranches.map((branch) => (
                            <div key={branch.Id} className="bg-white rounded-lg shadow-lg border">
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-3">
                                        {branch.Description}
                                        {branch.IsLocked && (
                                            <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600">Locked</span>
                                        )}
                                    </span>

                                    <span className="col-span-3 truncate">
                                        <FaEnvelope className="inline mr-1 text-gray-500" />
                                        {branch.AddressEmail}
                                    </span>

                                    <span className="col-span-2 flex items-center gap-2">
                                        <FaPhone className="text-gray-500" />
                                        {branch.AddressMobileLine}
                                    </span>

                                    <span className="col-span-2 text-sm text-gray-600">
                                        {branch.CompanyDescription}
                                    </span>

                                    <div className="col-span-2 flex justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedBranch(expandedBranch === branch.Id ? null : branch.Id)
                                            }
                                        >
                                            {expandedBranch === branch.Id ? <FaChevronUp /> : <FaChevronDown />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => { setSelectedBranch(branch); setOpenEdit(true); }}
                                        >
                                            <FaEdit className="text-indigo-600" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            title={branch.IsLocked ? "Unlock" : "Lock"}
                                            onClick={() => handleToggleLock(branch)}
                                        >
                                            {branch.IsLocked ? <FaLockOpen className="text-amber-600" /> : <FaLock className="text-gray-500" />}
                                        </Button>
                                    </div>
                                </div>

                                {expandedBranch === branch.Id && (
                                    <div className="border-t bg-gray-400 p-4 mx-1 mb-1 rounded-b-lg space-y-4">
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <div className="bg-gray-200 rounded-xl p-3">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    <FaMapMarkerAlt /> Address
                                                </h3>
                                                <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                                                    <span><b>Code:</b> {branch.PaddedCode || branch.Code}</span>
                                                    <span><b>Line 1:</b> {branch.AddressAddressLine1}</span>
                                                    <span><b>Line 2:</b> {branch.AddressAddressLine2}</span>
                                                    <span><b>Street:</b> {branch.AddressStreet}</span>
                                                    <span><b>Postal Code:</b> {branch.AddressPostalCode}</span>
                                                    <span><b>City:</b> {branch.AddressCity}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <div className="bg-gray-200 rounded-xl p-3">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2">
                                                    Parent Company
                                                </h3>
                                                <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                                                    <span><b>Company:</b> {branch.CompanyDescription}</span>
                                                    <span><b>Email:</b> {branch.CompanyAddressEmail}</span>
                                                    <span><b>City:</b> {branch.CompanyAddressCity}</span>
                                                    <span><b>Street:</b> {branch.CompanyAddressStreet}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
                        <p className="font-medium text-gray-400">
                            {searchQuery || companyFilter !== "all"
                                ? "No branches match your search criteria."
                                : "No Branches Found."}
                        </p>
                        {(searchQuery || companyFilter !== "all") && (
                            <Button variant="outline" className="mt-2" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex justify-center items-center mt-4">
                    <Button
                        type="button"
                        size="sm"
                        disabled={pageIndex === 0}
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        className="flex items-center gap-1 m-2"
                    >
                        <FaChevronLeft /> Prev
                    </Button>
                    <span>Page {pageIndex + 1}</span>
                    <Button
                        type="button"
                        size="sm"
                        disabled={!hasNextPage}
                        onClick={() => setPageIndex((p) => p + 1)}
                        className="flex items-center gap-1 m-2"
                    >
                        Next <FaChevronRight />
                    </Button>
                </div>
            </div>

            <AddBranch
                open={openBranch}
                onClose={() => setOpenBranch(false)}
                refresh={fetchBranches}
            />

            <EditBranch
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                data={selectedBranch}
                refresh={fetchBranches}
            />
        </div>
    );
}
