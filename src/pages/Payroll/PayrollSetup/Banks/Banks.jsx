import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FaUniversity, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddBankDrawer from "./AddBankDrawer";
import EditBankDrawer from "./EditBankDrawer";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";
import Base_Url from "../../../../apis/BaseApi";

export default function Banks() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [postalFilter, setPostalFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch banks
  const fetchBanks = async () => {
    setLoading(true);
    try {
      const response = await payrollsetupApiConfig.get("/employee-banks");
      setBanks(response.data?.data || [])
    } catch (error) {
      console.error("Error Fetching Banks", Error)
      throw error
    } finally { setLoading(false) }
  };
  useEffect(() => {
    fetchBanks();
  }, []);

  // Delete Handler
  const handleDelete = async (code) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the bank entry.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await Base_Url.delete(`/employee-banks/${code}`);
          if (res.data.success) {
            Swal.fire("Deleted!", res.data.message, "success");
          } else {
            Swal.fire("Error", res.data.message, "error");
          }

          fetchBanks();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete bank.", "error");
        }
      }
    });
  };

  // Unique postal addresses for filter dropdown
  const postalAddresses = useMemo(() => {
    const setVals = new Set(banks.map((b) => b.PostalAddress).filter(Boolean));
    return Array.from(setVals);
  }, [banks]);

  // Filtered and paginated banks
  const filteredBanks = useMemo(() => {
    return banks.filter((bank) => {
      const matchSearch =
        bank.Name.toLowerCase().includes(search.toLowerCase()) ||
        bank.BankCode.toLowerCase().includes(search.toLowerCase());
      const matchPostal =
        postalFilter === "all" || bank.PostalAddress === postalFilter;
      return matchSearch && matchPostal;
    });
  }, [banks, search, postalFilter]);

  const paginatedBanks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBanks.slice(start, start + pageSize);
  }, [filteredBanks, page, pageSize]);

  const totalPages = Math.ceil(filteredBanks.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUniversity className="text-white" /> Banks
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Bank
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        {/* Search */}
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-1/3"
        />


        {/* Page size */}
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
        <div className="grid grid-cols-5 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Name</span>
          <span>Bank Code</span>
          <span>Postal Address</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 bg-gray-50 p-6 rounded"
              >
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded text-right"></div>
              </div>
            ))}
          </div>
        ) : paginatedBanks.length > 0 ? (
          <div className="space-y-2">
            {paginatedBanks.map((bank) => (
              <div
                key={bank.Code}
                className="grid grid-cols-5 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-indigo-700">{bank.Name}</span>
                <span className="text-sm">{bank.BankCode}</span>
                <span className="text-sm">{bank.PostalAddress}</span>

                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedBank(bank);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(bank.Code)}
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
            <p className="font-medium text-gray-400">No banks found.</p>
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

      {/* Drawers */}
      <AddBankDrawer
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchBanks}
      />
      <EditBankDrawer
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchBanks}
        bank={selectedBank}
      />
    </div>
  );
}
