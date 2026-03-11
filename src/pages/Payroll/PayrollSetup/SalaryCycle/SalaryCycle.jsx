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
import {
  FaDollarSign,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddSalaryCycle from "./AddSalaryCycleDrawer";
import EditSalaryCycle from "./EditSalaryCycleDrawer";
import Base_Url from "../../../../apis/BaseApi";

export default function SalaryCycle() {
  const [salaryCycles, setSalaryCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch salary cycles
  const fetchSalaryCycles = async () => {
    try {
      setLoading(true);
      const res = await payrollsetupApiConfig.get("/salary-cycles");
      const normalized = (res.data?.data || []).map((c) => ({
        id: c.Id,
        name: c.Name,
        startDate: c.StartDate,
        endDate: c.EndDate,
        isProcessed: c.IsProcessed,
      }));
      setSalaryCycles(normalized);
    } catch (error) {
      console.error("Error fetching salary cycles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryCycles();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the Salary Cycle entry.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await payrollsetupApiConfig.delete(`/salary-cycles/${id}`);
          if (res.status !== 200)
            throw new Error("Failed to delete salary cycle");
          Swal.fire("Deleted!", "Salary cycle has been deleted.", "success");
          fetchSalaryCycles();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete salary cycle.", "error");
        }
      }
    });
  };

  // Process Handler
  const handleProcess = async (id) => {
    const cycle = salaryCycles.find((c) => c.id === id);

    if (cycle.isProcessed) {
      Swal.fire("Info", "This salary cycle is already processed.", "info");
      return;
    }

    Swal.fire({
      title: "Generate Payslips?",
      text: "This will generate payslips for all employees under this cycle.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, generate!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await Base_Url.post(`/payslips/generate`, {
            SalaryCycleId: id,
          });
          console.log(res)

          if (res.status === 200) {
            Swal.fire(
              "Success!",
              res.data.message ||
                `Payslips generated successfully for ${res.data.data.GeneratedCount} employees.`,
              "success"
            );
            fetchSalaryCycles();
          } else {
            Swal.fire("Error!", "Failed to generate payslips.", "error");
          }
        } catch (err) {
          console.error(err);
          Swal.fire(
            "Error!",
            "Something went wrong while generating payslips.",
            "error"
          );
        }
      }
    });
  };

  // Filtered and paginated salary cycles
  const filteredCycles = useMemo(() => {
    return salaryCycles.filter((cycle) =>
      cycle.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [salaryCycles, search]);

  const paginatedCycles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCycles.slice(start, start + pageSize);
  }, [filteredCycles, page, pageSize]);

  const totalPages = Math.ceil(filteredCycles.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaDollarSign className="text-white" /> Salary Cycles
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Create Salary Cycle
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        <Input
          placeholder="Search by name..."
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
        <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Name</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span>Processed</span>
          <span className="text-center">Actions</span>
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
                <div className="h-4 bg-gray-200 rounded text-right"></div>
              </div>
            ))}
          </div>
        ) : paginatedCycles.length > 0 ? (
          <div className="space-y-2">
            {paginatedCycles.map((cycle) => (
              <div
                key={cycle.id}
                className={`grid grid-cols-6 gap-4 items-center py-4 px-6 rounded-lg shadow-lg border transition-all
                ${
                  cycle.isProcessed
                    ? "bg-green-50 border-green-400"
                    : "bg-white hover:shadow-xl"
                }`}
              >
                <span className="font-medium text-indigo-700">
                  {cycle.name}
                </span>
                <span className="text-sm">
                  {new Date(cycle.startDate).toLocaleDateString()}
                </span>
                <span className="text-sm">
                  {new Date(cycle.endDate).toLocaleDateString()}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    cycle.isProcessed ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {cycle.isProcessed ? "Yes" : "No"}
                </span>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  {!cycle.isProcessed && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                      onClick={() => handleProcess(cycle.id)}
                    >
                      <FaCheckCircle /> Process
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={cycle.isProcessed}
                    onClick={() => {
                      setSelectedCycle(cycle);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    disabled={cycle.isProcessed}
                    onClick={() => handleDelete(cycle.id)}
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
            <p className="font-medium text-gray-400">No salary cycles found.</p>
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

      {/* Modals */}
      <AddSalaryCycle
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchSalaryCycles}
      />

      <EditSalaryCycle
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchSalaryCycles}
        cycle={selectedCycle}
      />
    </div>
  );
}
