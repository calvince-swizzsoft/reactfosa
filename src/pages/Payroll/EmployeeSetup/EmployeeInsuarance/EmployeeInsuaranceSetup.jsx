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
import { FaBuilding, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddInsuranceCompany from "./AddInsuaranceCompany";
import EditInsuranceCompany from "./EditInsuaranceCompany";

export default function InsuranceCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch Insurance Companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await payrollsetupApiConfig.get("/employee-insurance-companies");
      const normalized = (res.data || []).map((c) => ({
        id: c.Code,
        name: c.Name,
        address: c.Address,
      }));
      setCompanies(normalized);
    } catch (error) {
      console.error("Error fetching insurance companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the Insurance Company.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await payrollsetupApiConfig.delete(`/employee-insurance-companies/${id}`);
          if (res.status !== 200)
            throw new Error("Failed to delete insurance company");
          Swal.fire("Deleted!", "Insurance company has been deleted.", "success");
          fetchCompanies();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete insurance company.", "error");
        }
      }
    });
  };

  // Filtered and paginated insurance companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) =>
      c.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [companies, search]);

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, page, pageSize]);

  const totalPages = Math.ceil(filteredCompanies.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBuilding className="text-white" /> Insurance Companies
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Create Insurance Company
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
        <div className="grid grid-cols-4 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Name</span>
          <span>Address</span>
          <span className="text-center col-span-2">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-4 bg-gray-50 p-6 rounded"
              >
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
              </div>
            ))}
          </div>
        ) : paginatedCompanies.length > 0 ? (
          <div className="space-y-2">
            {paginatedCompanies.map((company) => (
              <div
                key={company.id}
                className="grid grid-cols-4 gap-4 items-center py-4 px-6 rounded-lg shadow-lg border transition-all bg-white hover:shadow-xl"
              >
                <span className="font-medium text-indigo-700">{company.name}</span>
                <span className="text-sm">{company.address}</span>

                {/* Actions */}
                <div className="flex justify-end gap-10">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedCompany(company);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(company.id)}
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
            <p className="font-medium text-gray-400">No insurance companies found.</p>
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
      <AddInsuranceCompany
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchCompanies}
      />

      <EditInsuranceCompany
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchCompanies}
        company={selectedCompany}
      />
    </div>
  );
}
