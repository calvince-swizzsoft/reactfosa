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
import { FaMoneyBillWave, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddPayeTaxBandDrawer from "./AddPayeTaxBandDrawer";
import EditPayeTaxBandDrawer from "./EditPayeTaxBandDrawer";
import Base_Url from "../../../../../apis/BaseApi";

export default function PayeTaxBands() {
  const [taxBands, setTaxBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedBand, setSelectedBand] = useState(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch tax bands
  const fetchTaxBands = async () => {
    setLoading(true);

    try {
      const res = await Base_Url.get("/payetaxbands/all");

      if (res.status === 200) {
        setTaxBands(res.data?.data || []);
      } else {
        console.warn("Unexpected status:", res.status);
      }
    } catch (error) {
      console.error("Error fetching Tax Bands:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxBands();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the tax band.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await Base_Url.delete(`/payetaxbands/delete/${id}`);

          if (res.status !== 200) throw new Error("Failed to delete tax band");
          Swal.fire("Deleted!", "Tax band has been deleted.", "success");
          fetchTaxBands();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete tax band.", "error");
        }
      }
    });
  };

  // Filtered and paginated bands
  const filteredBands = useMemo(() => {
    return taxBands.filter(
      (b) =>
        (b.StartDate?.split("T")[0] || "").includes(search) ||
        (b.EndDate ? b.EndDate.split("T")[0] : "").includes(search) ||
        (b.LowerLimit?.toString() || "").includes(search) ||
        (b.UpperLimit?.toString() || "").includes(search) ||
        (b.Rate?.toString() || "").includes(search)
    );
  }, [taxBands, search]);

  const paginatedBands = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBands.slice(start, start + pageSize);
  }, [filteredBands, page, pageSize]);

  const totalPages = Math.ceil(filteredBands.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyBillWave className="text-white" /> PAYE Tax Bands
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
        >
          <FaPlus /> Add Tax Band
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        <Input
          placeholder="Search by year, limits or rate..."
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
        <div className="grid grid-cols-7 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>ID</span>
          <span>Lower Limit</span>
          <span>Upper Limit</span>
          <span>Rate (%)</span>
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
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : paginatedBands.length > 0 ? (
          <div className="space-y-2">
            {paginatedBands.map((b) => (
              <div
                key={b.Id}
                className="grid grid-cols-7 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-green-700">{b.Id}</span>
                <span>{b.LowerLimit?.toLocaleString()}</span>
                <span>
                  {b.UpperLimit ? b.UpperLimit.toLocaleString() : "∞"}
                </span>
                <span>{b.Rate}%</span>
                <span className="text-sm">
                  {b.StartDate
                    ? new Date(b.StartDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
                <span className="text-sm">
                  {b.EndDate
                    ? new Date(b.EndDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Ongoing"}
                </span>
                <span className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedBand(b);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(b.Id)}
                  >
                    <FaTrash /> Delete
                  </Button>
                </span>
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
            <p className="font-medium text-gray-400">No tax bands found.</p>
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
      <AddPayeTaxBandDrawer
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchTaxBands}
      />
      <EditPayeTaxBandDrawer
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchTaxBands}
        taxBand={selectedBand}
      />
    </div>
  );
}
