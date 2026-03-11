import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FaCreditCard, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddAccountDrawer from "./EmployeeAccount/AddAccountDrawer";
import EditAccountDrawer from "./EmployeeAccount/EditAccountDrawer";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";

export default function EmployeeAccountSetup() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // For modals/drawers
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await payrollsetupApiConfig.get("/account-details")
      setAccounts(data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Delete Handler
  const handleDelete = async (accountId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the employee account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await payrollsetupApiConfig.delete(`/account-details/${accountId}`);
          Swal.fire("Deleted!", "Account has been removed.", "success");
          fetchAccounts();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete account.", "error");
        }
      }
    });
  };

  // Filtered + Paginated accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(
      (acc) =>
        acc.Name?.toLowerCase().includes(search.toLowerCase()) ||
        String(acc.Code || acc.id).includes(search)
    );
  }, [accounts, search]);

  const paginatedAccounts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, page, pageSize]);

  const totalPages = Math.ceil(filteredAccounts.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaCreditCard className="text-white" /> Employee Accounts
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add New Account
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        <Input
          placeholder="Search by account name or code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-1/3"
        />

        <Select
          value={String(pageSize)}
          onValueChange={(val) => {
            setPageSize(Number(val));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Code</span>
          <span>Name</span>
          <span>Linked G/L Account</span>
          <span>Taxable Earnings</span>
          <span>Allowable Deductions</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-4 bg-gray-50 p-6 rounded"
              >
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : paginatedAccounts.length > 0 ? (
          <div className="space-y-2">
            {paginatedAccounts.map((acc) => (
              <div
                key={acc.id || acc.Code}
                className="grid grid-cols-6 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-indigo-700">
                  {acc.Code || acc.id}
                </span>
                <span>{acc.Name}</span>
                <span>{acc.LinkedGLAccount}</span>
                <span>{acc.TaxableEarnings ? "Yes" : "No"}</span>
                <span>{acc.AllowableDeductions ? "Yes" : "No"}</span>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedAccount(acc);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(acc.id || acc.Code)}
                  >
                    <FaTrash /> Delete
                  </Button>
                </div>
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
            <p className="font-medium text-gray-400">No accounts found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3"
          >
            Prev
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3"
          >
            Next
          </Button>
        </div>
      )}

      {/* Optional Add/Edit drawers or modals */}
      <AddAccountDrawer open={openAdd} onClose={() => setOpenAdd(false)} onSuccess={fetchAccounts}/>
      <EditAccountDrawer open={openEdit} onClose={() => setOpenEdit(false)} onSuccess={fetchAccounts} account={selectedAccount} />
    </div>
  );
}
