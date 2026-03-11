import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaWallet,
    FaPlus,
    FaChevronDown,
    FaChevronUp,
    FaEllipsisV,
    FaTrash,
    FaPercentage,
    FaBalanceScale,
    FaLink,
    FaSearch,
    FaFilter,
} from "react-icons/fa";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddProducts from "./AddProducts";
import LinkProductDrawer from "./LinkProductDrawer";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [openDrawer, setOpenDrawer] = useState(false);

    //linkage product
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [coaFilter, setCoaFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showFilters, setShowFilters] = useState(false);
    const [uniqueCOAs, setUniqueCOAs] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            // Extract unique Chart of Accounts for filter dropdown
            const coas = [...new Set(products
                .map(product => {
                    // Safely handle different data types
                    const coa = product.ChartOfAccountName;
                    return coa ? String(coa).trim() : "";
                })
                .filter(coa => coa && coa !== "")
            )];
            setUniqueCOAs(coas);
        }
        applyFilters();
    }, [products, searchQuery, statusFilter, coaFilter, sortBy, sortOrder]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/savings-products`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );

            const json = await res.json();
            setProducts(json.data || []);
        } catch (err) {
            console.error("Fetch Savings Products Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...products];

        // Search filter - safely handle all data types
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => {
                // Convert all values to strings safely for comparison
                const description = String(product.Description || "").toLowerCase();
                const paddedCode = String(product.PaddedCode || "").toLowerCase();
                const chartOfAccountName = String(product.ChartOfAccountName || "").toLowerCase();
                const chartOfAccountAccountCode = String(product.ChartOfAccountAccountCode || "").toLowerCase();
                const chartOfAccountAccountName = String(product.ChartOfAccountAccountName || "").toLowerCase();
                
                return description.includes(query) ||
                       paddedCode.includes(query) ||
                       chartOfAccountName.includes(query) ||
                       chartOfAccountAccountCode.includes(query) ||
                       chartOfAccountAccountName.includes(query);
            });
        }

        // Status filter
        if (statusFilter !== "all") {
            if (statusFilter === "default") {
                filtered = filtered.filter(product => product.IsDefault);
            } else if (statusFilter === "mandatory") {
                filtered = filtered.filter(product => product.IsMandatory);
            } else if (statusFilter === "locked") {
                filtered = filtered.filter(product => product.IsLocked);
            } else if (statusFilter === "active") {
                filtered = filtered.filter(product => !product.IsLocked);
            }
        }

        // COA filter - safely handle comparison
        if (coaFilter !== "all") {
            filtered = filtered.filter(product => 
                String(product.ChartOfAccountName || "") === coaFilter
            );
        }

        // Sorting - safely handle all data types
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case "name":
                    valueA = String(a.Description || "").toLowerCase();
                    valueB = String(b.Description || "").toLowerCase();
                    break;
                case "code":
                    valueA = String(a.PaddedCode || "").toLowerCase();
                    valueB = String(b.PaddedCode || "").toLowerCase();
                    break;
                case "apy":
                    valueA = parseFloat(a.AnnualPercentageYield) || 0;
                    valueB = parseFloat(b.AnnualPercentageYield) || 0;
                    break;
                case "coa":
                    valueA = String(a.ChartOfAccountName || "").toLowerCase();
                    valueB = String(b.ChartOfAccountName || "").toLowerCase();
                    break;
                case "maxDeposit":
                    valueA = parseFloat(a.MaximumAllowedDeposit) || 0;
                    valueB = parseFloat(b.MaximumAllowedDeposit) || 0;
                    break;
                case "minBalance":
                    valueA = parseFloat(a.MinimumBalance) || 0;
                    valueB = parseFloat(b.MinimumBalance) || 0;
                    break;
                default:
                    valueA = String(a.Description || "").toLowerCase();
                    valueB = String(b.Description || "").toLowerCase();
            }

            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredProducts(filtered);
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
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
        setCoaFilter("all");
        setSortBy("name");
        setSortOrder("asc");
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Product?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // NOTE: Your API does not include delete, adjust accordingly
                    Swal.fire("Error", "Delete API not provided.", "error");
                } catch (error) {
                    Swal.fire("Error", error.message, "error");
                }
            }
        });
    };

    const openLinkageDrawer = (p) => {
        setSelectedProduct(p);
        setDrawerOpen(true);
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaWallet className="text-white" /> Savings Products
                    <span className="text-sm font-normal ml-2">
                        ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
                    </span>
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setOpenDrawer(true)}
                >
                    <FaPlus /> Add Product
                </Button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products by name, code, COA name, or account code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    {/* Clear Filters Button */}
                    {(searchQuery || statusFilter !== "all" || coaFilter !== "all") && (
                        <Button
                            variant="ghost"
                            onClick={clearFilters}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status Filter
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Products</option>
                                <option value="default">Default Products</option>
                                <option value="mandatory">Mandatory Products</option>
                                <option value="locked">Locked Products</option>
                                <option value="active">Active Products</option>
                            </select>
                        </div>

                        {/* COA Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Chart of Account
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={coaFilter}
                                onChange={(e) => setCoaFilter(e.target.value)}
                            >
                                <option value="all">All COAs</option>
                                {uniqueCOAs.map((coa, index) => (
                                    <option key={index} value={coa}>
                                        {coa.length > 40 ? `${coa.substring(0, 40)}...` : coa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['name', 'code', 'apy', 'coa', 'maxDeposit', 'minBalance'].map((field) => (
                                    <Button
                                        key={field}
                                        size="sm"
                                        variant={sortBy === field ? "default" : "outline"}
                                        className="capitalize"
                                        onClick={() => handleSort(field)}
                                    >
                                        {field === 'apy' ? 'APY' : 
                                         field === 'maxDeposit' ? 'Max Deposit' :
                                         field === 'minBalance' ? 'Min Balance' :
                                         field === 'coa' ? 'COA' : field}
                                        {sortBy === field && (
                                            <span className="ml-1">
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-3">Description</span>
                    <span className="col-span-2">Code</span>
                    <span className="col-span-3">COA</span>
                    <span className="col-span-2">APY</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loading State */}
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
                ) : filteredProducts.length > 0 ? (
                    <div className="space-y-2">
                        {filteredProducts.map((p) => (
                            <div key={p.Id} className="bg-white rounded-lg shadow-lg border">
                                {/* Main Row */}
                                <div className="grid grid-cols-14 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-3">
                                        {p.Description || "N/A"}
                                    </span>

                                    <span className="col-span-2">{p.PaddedCode || "N/A"}</span>

                                    <span className="col-span-3 truncate" title={p.ChartOfAccountName || ""}>
                                        {p.ChartOfAccountName && p.ChartOfAccountName.length > 40 
                                            ? `${String(p.ChartOfAccountName).substring(0, 40)}...` 
                                            : String(p.ChartOfAccountName || "N/A")}
                                    </span>

                                    <span className="col-span-2 flex gap-1 items-center">
                                        {p.AnnualPercentageYield || 0}%
                                    </span>

                                    {/* Expand Button */}
                                    <span className="col-span-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpanded(expanded === p.Id ? null : p.Id)
                                            }
                                        >
                                            {expanded === p.Id ? (
                                                <>
                                                    <FaChevronUp /> Hide
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> Details
                                                </>
                                            )}
                                        </Button>
                                    </span>

                                    {/* LINK BUTTON */}
                                    <span className="col-span-2 flex justify-center">
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 text-white col-span-1"
                                            onClick={() => openLinkageDrawer(p)}
                                        >
                                            <FaLink /> Link
                                        </Button>
                                    </span>
                                    
                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32">
                                                <DropdownMenuItem>Edit</DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(p.Id)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expanded Section */}
                                {expanded === p.Id && (
                                    <div className="border-t bg-gray-400 p-4 mx-1 mb-1 rounded-b-lg space-y-4">

                                        {/* Basic Details */}
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                Product Details
                                            </h3>

                                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                                                <span><b>Max Deposit:</b> {p.MaximumAllowedDeposit || "N/A"}</span>
                                                <span><b>Max Withdrawal:</b> {p.MaximumAllowedWithdrawal || "N/A"}</span>
                                                <span><b>Min Balance:</b> {p.MinimumBalance || "N/A"}</span>
                                                <span><b>Operating Balance:</b> {p.OperatingBalance || "N/A"}</span>
                                                <span><b>Notice Amount:</b> {p.WithdrawalNoticeAmount || "N/A"}</span>
                                                <span><b>Notice Period:</b> {p.WithdrawalNoticePeriod || "N/A"} days</span>
                                                <span><b>Interval:</b> {p.WithdrawalInterval || "N/A"} days</span>
                                            </div>
                                        </div>

                                        {/* Account Mapping */}
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                Chart of Accounts
                                            </h3>

                                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                                                <span><b>Account Code:</b> {p.ChartOfAccountAccountCode || "N/A"}</span>
                                                <span><b>Account Name:</b> {p.ChartOfAccountAccountName || "N/A"}</span>
                                                <span><b>Full COA:</b> {p.ChartOfAccountName || "N/A"}</span>
                                                <span><b>Type:</b> {p.ChartOfAccountAccountType || "N/A"}</span>
                                            </div>
                                        </div>

                                        {/* Settings */}
                                        <div className="bg-white p-4 rounded-lg shadow border">
                                            <h3 className="font-bold text-white bg-indigo-700 p-3 rounded-xl mb-2 flex items-center gap-2">
                                                Settings
                                            </h3>

                                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border text-sm">
                                                <span><b>Default:</b> {p.IsDefault ? "Yes" : "No"}</span>
                                                <span><b>Mandatory:</b> {p.IsMandatory ? "Yes" : "No"}</span>
                                                <span><b>Locked:</b> {p.IsLocked ? "Yes" : "No"}</span>
                                                <span><b>Auto Fee:</b> {p.AutomateLedgerFeeCalculation ? "On" : "Off"}</span>
                                                <span><b>Throttle OTC:</b> {p.ThrottleOverTheCounterWithdrawals ? "Yes" : "No"}</span>
                                                <span><b>Charge Type:</b> {p.ChargeTypeDescription || "N/A"}</span>
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
                            {searchQuery || statusFilter !== "all" || coaFilter !== "all" 
                                ? "No products match your search criteria." 
                                : "No Savings Products Found."}
                        </p>
                        {(searchQuery || statusFilter !== "all" || coaFilter !== "all") && (
                            <Button
                                variant="outline"
                                className="mt-2"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
            
            {/* ADD PRODUCT DRAWER*/}
            <AddProducts
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                refresh={fetchProducts}
            />
            
            {/* Linkage Drawer */}
            <LinkProductDrawer
                open={drawerOpen}
                product={selectedProduct}
                onClose={() => setDrawerOpen(false)}
            />
        </div>
    );
}