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
import { FaUsers, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import OnboardEmployeeDrawer from "./OnboardEmployeeDrawer";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";
// import AddEmployeeDrawer from "./AddEmployeeDrawer";
// import EditEmployeeDrawer from "./EditEmployeeDrawer";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data  = await payrollsetupApiConfig.get("/employee-profiles");
      setEmployees(data.data?.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Delete Handler
  const handleDelete = async (empNo) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the employee profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await payrollsetupApiConfig.delete(`/employee-profiles/${empNo}`);
          Swal.fire("Deleted!", "Employee has been removed.", "success");
          fetchEmployees();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete employee.", "error");
        }
      }
    });
  };

  // Filtered + Paginated employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.Name.toLowerCase().includes(search.toLowerCase()) ||
        String(emp.EmployeeNumber).includes(search)
    );
  }, [employees, search]);

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, page, pageSize]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUsers className="text-white" /> Employees
        </h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Onboard New 
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        <Input
          placeholder="Search by name or employee number..."
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
          <span>Emp No.</span>
          <span>Name</span>
          <span>Branch</span>
          <span>Designation</span>
          <span>Job Group</span>
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
        ) : paginatedEmployees.length > 0 ? (
          <div className="space-y-2">
            {paginatedEmployees.map((emp) => (
              <div
                key={emp.EmployeeNumber}
                className={`grid grid-cols-6 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border ${
                  emp.Disabled ? "opacity-50" : ""
                }`}
              >
                <span className="font-medium text-indigo-700">
                  {emp.EmployeeNumber}
                </span>
                <span>{emp.Name}</span>
                <span>{emp.Branch}</span>
                <span>{emp.Designation}</span>
                <span>{emp.JobGroup}</span>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(emp.EmployeeNumber)}
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
            <p className="font-medium text-gray-400">No employees found.</p>
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

      <OnboardEmployeeDrawer
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEmployees}
      />

      {/* <EditEmployeeDrawer
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchEmployees}
        employee={selectedEmployee}
      /> */}
    </div>
  );
}
