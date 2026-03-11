import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FaDollarSign, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import payrollsetupApiConfig from "../../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddEmployeeEarnings from "./AddEmployeeEarnings";
import EditEmployeeEarnings from "./EditEmployeeEarnings";

export default function EmployeeEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch earnings
  const fetchEarnings = async () => {
  try {
    setLoading(true);
    const res = await payrollsetupApiConfig.get("/employee-earnings");
    setEarnings(res.data?.data || []); 
  } catch (error) {
    console.error("Error fetching earnings:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the earning entry.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await payrollsetupApiConfig.delete(`/employee-earnings/${id}`);
          if (res.status !== 200) throw new Error("Failed to delete earning");
          Swal.fire("Deleted!", "Earning has been deleted.", "success");
          fetchEarnings();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete earning.", "error");
        }
      }
    });
  };

  // Unique employee numbers for filter dropdown
  const employeeNumbers = useMemo(() => {
    const setVals = new Set(earnings.map((e) => e.EmployeeNumber).filter(Boolean));
    return Array.from(setVals);
  }, [earnings]);

  // Filtered and paginated earnings
  const filteredEarnings = useMemo(() => {
    return earnings.filter((earning) => {
      const matchSearch =
        earning.EarningCode.toString().includes(search) ||
        earning.Amount.toString().includes(search);
      const matchEmployee =
        employeeFilter === "all" ||
        earning.EmployeeNumber === Number(employeeFilter);
      return matchSearch && matchEmployee;
    });
  }, [earnings, search, employeeFilter]);

  const paginatedEarnings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEarnings.slice(start, start + pageSize);
  }, [filteredEarnings, page, pageSize]);

  const totalPages = Math.ceil(filteredEarnings.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaDollarSign className="text-white" /> Employee Earnings
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Earning
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        {/* Search */}
        <Input
          placeholder="Search by earning code or amount..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-1/3"
        />

        {/* Employee filter */}
        <Select
          value={employeeFilter}
          onValueChange={(val) => {
            setEmployeeFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employeeNumbers.map((num) => (
              <SelectItem key={num} value={String(num)}>
                Employee #{num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
        <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Employee No</span>
          <span>Earning Code</span>
          <span>Amount</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-4 bg-gray-50 p-6 rounded"
              >
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded text-right"></div>
              </div>
            ))}
          </div>
        ) : paginatedEarnings.length > 0 ? (
          <div className="space-y-2">
            {paginatedEarnings.map((earning) => (
              <div
                key={earning.Id}
                className="grid grid-cols-6 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-indigo-700">
                  {earning.EmployeeNumber}
                </span>
                <span className="text-sm">{earning.EarningCode}</span>
                <span className="text-sm">{earning.Amount}</span>
                <span className="text-sm">
                  {new Date(earning.StartDate).toLocaleDateString()}
                </span>
                <span className="text-sm">
                  {earning.EndDate
                    ? new Date(earning.EndDate).toLocaleDateString()
                    : "Ongoing"}
                </span>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedEarning(earning);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(earning.Id)}
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
            <p className="font-medium text-gray-400">No earnings found.</p>
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

      {/* Modals/Drawers */}
      <AddEmployeeEarnings
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchEarnings}
      />
      <EditEmployeeEarnings
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchEarnings}
        earning={selectedEarning}
      />
    </div>
  );
}
