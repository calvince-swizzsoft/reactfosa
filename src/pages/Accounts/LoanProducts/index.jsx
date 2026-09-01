import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaHandHoldingUsd, FaPlus, FaSearch, FaPencilAlt } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanProductsPaged } from "./api";
import { apiErrorMessage } from "@/lib/api";

// api/accounts/loanproducts — docs/api/loan-product-api-spec.md. A
// different, Accounts-module LoanProduct concept from the legacy loan API
// src/pages/Loaning/LoanProducts.jsx talks to (see moduleRouteMap.js —
// Code 23018 was misrouted to that legacy page; fixed to point here).
export default function LoanProducts() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const pageSize = 20;

  const fetchList = () => {
    setLoading(true);
    listLoanProductsPaged({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch((error) => {
        setItems([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load loan products."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [pageIndex]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(0);
    fetchList();
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaHandHoldingUsd /> Loan Products
        </h2>
        <Button onClick={() => navigate("/Accounts/LoanProducts/create")} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Loan Product
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search loan products..." className="pl-8" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Code</span>
          <span className="col-span-6">Description</span>
          <span className="col-span-2">Section</span>
          <span className="col-span-1">Category</span>
          <span className="col-span-1 text-center">Action</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((product) => (
              <div
                key={product.Id}
                className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-2 font-medium text-indigo-700">{product.PaddedCode}</span>
                  <span className="col-span-6 text-gray-700 truncate">{product.Description}</span>
                  <span className="col-span-2 text-gray-700">{product.LoanRegistrationLoanProductSectionDescription}</span>
                  <span className="col-span-1 text-gray-700 truncate">{product.LoanRegistrationLoanProductCategoryDescription}</span>
                  <span className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label={`Edit ${product.Description}`}
                      onClick={() => navigate(`/Accounts/LoanProducts/${product.Id}/edit`)}
                      className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    >
                      <FaPencilAlt className="mr-1" /> Edit
                    </Button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No loan products found.</p>
          </div>
        )}
      </div>

      {itemsCount > pageSize && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button variant="default" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-gray-600">Page {pageIndex + 1}</span>
          <Button variant="default" disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
