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
    FaMapMarkerAlt,
    FaSearch,
    FaFilter,
} from "react-icons/fa";

import NotFoundImage from "/assets/scopefinding.png";
import AddCompanies from "./AddCompanies";
import EditCompanies from "./EditCompanies";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;
const COMPANY_BASE = `${FIN_BASE}/api/administration/companies`;

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCompany, setExpandedCompany] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [itemsCount, setItemsCount] = useState(0);

    // GET / returns PageCollectionInfo<CompanyDTO> — { pageIndex, pageSize,
    // pageCollection, itemsCount } — not a bare array, and sorted by
    // sequentialId ascending (oldest first) rather than newest-first like
    // the old MVC grid, hence the client-side "date desc" default below.
    const normalizeList = (d) => {
        const payload = d?.data ?? d?.Data ?? d;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
        if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
        return [];
    };

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageIndex: String(pageIndex),
                pageSize: String(pageSize),
                text: searchQuery,
            });
            const res = await apiFetch(`${COMPANY_BASE}?${params.toString()}`);
            const json = await res.json();
            const payload = json?.data ?? json?.Data ?? {};
            setCompanies(normalizeList(json));
            setItemsCount(payload.itemsCount ?? payload.ItemsCount ?? 0);
        } catch (err) {
            console.error("Fetch Companies Error:", err);
            setCompanies([]);
            setItemsCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageIndex, pageSize]);

    // Server-side text search is debounced-by-submit (Enter/blur) via a
    // separate effect so every keystroke doesn't refetch the page.
    useEffect(() => {
        const timeout = setTimeout(() => {
            setPageIndex(0);
            fetchCompanies();
        }, 400);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companies, statusFilter, sortBy, sortOrder]);

    // Status filter/sort apply on top of whatever page is currently
    // loaded — there's no server-side equivalent for these, same pattern
    // as CustomerAccounts' client-side product-type filter.
    const applyFilters = () => {
        let filtered = [...companies];

        if (statusFilter !== "all") {
            filtered = filtered.filter((company) => {
                if (statusFilter === "2fa_enabled") return company.EnforceTwoFactorAuthentication === true;
                if (statusFilter === "2fa_disabled") return company.EnforceTwoFactorAuthentication === false;
                if (statusFilter === "biometrics_enabled") return company.EnforceBiometricsForCashWithdrawal === true;
                if (statusFilter === "locked") return company.IsLocked === true;
                return true;
            });
        }

        filtered.sort((a, b) => {
            let valueA, valueB;
            switch (sortBy) {
                case "email":
                    valueA = a.AddressEmail || ""; valueB = b.AddressEmail || "";
                    break;
                case "date":
                    valueA = new Date(a.CreatedDate); valueB = new Date(b.CreatedDate);
                    break;
                case "phone":
                    valueA = a.AddressMobileLine || ""; valueB = b.AddressMobileLine || "";
                    break;
                default:
                    valueA = a.Description || ""; valueB = b.Description || "";
            }
            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredCompanies(filtered);
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
        setStatusFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    const hasNextPage = itemsCount
        ? (pageIndex + 1) * pageSize < itemsCount
        : companies.length === pageSize;

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaBuilding className="text-white" /> Companies
                    <span className="text-sm font-normal ml-2">
                        ({itemsCount || filteredCompanies.length} {itemsCount === 1 ? 'company' : 'companies'})
                    </span>
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenDrawer(true)}
                >
                    <FaPlus /> Add Company
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search companies by name, registration, or PIN..."
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

                    {(searchQuery || statusFilter !== "all") && (
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
                                Status Filter
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Companies</option>
                                <option value="2fa_enabled">2FA Enabled</option>
                                <option value="2fa_disabled">2FA Disabled</option>
                                <option value="biometrics_enabled">Biometrics Enabled</option>
                                <option value="locked">Locked</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By (current page)
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {['name', 'email', 'date', 'phone'].map((field) => (
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
                    <span className="col-span-3">Company</span>
                    <span className="col-span-3">Email</span>
                    <span className="col-span-2">Phone</span>
                    <span className="col-span-2">Created</span>
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
                ) : filteredCompanies.length > 0 ? (
                    <div className="space-y-2">
                        {filteredCompanies.map((company) => (
                            <div key={company.Id} className="bg-white rounded-lg shadow-lg border">
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-3">
                                        {company.Description}
                                    </span>

                                    <span className="col-span-3 truncate">
                                        <FaEnvelope className="inline mr-1 text-gray-500" />
                                        {company.AddressEmail}
                                    </span>

                                    <span className="col-span-2 flex items-center gap-2">
                                        <FaPhone className="text-gray-500" />
                                        {company.AddressMobileLine}
                                    </span>

                                    <span className="col-span-2 text-sm text-gray-600">
                                        {company.CreatedDate ? new Date(company.CreatedDate).toLocaleDateString() : "—"}
                                    </span>

                                    <div className="col-span-2 flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedCompany(expandedCompany === company.Id ? null : company.Id)
                                            }
                                        >
                                            {expandedCompany === company.Id ? <FaChevronUp /> : <FaChevronDown />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => { setSelectedCompany(company); setOpenEdit(true); }}
                                        >
                                            <FaEdit className="text-indigo-600" />
                                        </Button>
                                    </div>
                                </div>

                                {expandedCompany === company.Id && (
                                    <div className="border-t bg-gray-400 p-4 mx-1 mb-1 rounded-b-lg space-y-4">
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <div className="bg-gray-200 rounded-xl p-3">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    <FaMapMarkerAlt /> Address
                                                </h3>
                                                <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                                                    <span><b>Line 1:</b> {company.AddressAddressLine1}</span>
                                                    <span><b>Line 2:</b> {company.AddressAddressLine2}</span>
                                                    <span><b>Street:</b> {company.AddressStreet}</span>
                                                    <span><b>Postal Code:</b> {company.AddressPostalCode}</span>
                                                    <span><b>City:</b> {company.AddressCity}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <div className="bg-gray-200 rounded-xl p-3">
                                                <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                    System Settings
                                                </h3>
                                                <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl border-2 gap-3 text-sm text-gray-700">
                                                    <span><b>Registration No:</b> {company.RegistrationNumber}</span>
                                                    <span><b>PIN:</b> {company.PersonalIdentificationNumber}</span>
                                                    <span><b>2FA:</b> {company.EnforceTwoFactorAuthentication ? "Enabled" : "Disabled"}</span>
                                                    <span><b>Biometrics:</b> {company.EnforceBiometricsForCashWithdrawal ? "Required" : "No"}</span>
                                                    <span><b>Locked:</b> {company.IsLocked ? "Yes" : "No"}</span>
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
                            {searchQuery || statusFilter !== "all"
                                ? "No companies match your search criteria."
                                : "No Companies Found."}
                        </p>
                        {(searchQuery || statusFilter !== "all") && (
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

            <AddCompanies
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                refresh={fetchCompanies}
            />
            <EditCompanies
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                data={selectedCompany}
                refresh={fetchCompanies}
            />
        </div>
    );
}
