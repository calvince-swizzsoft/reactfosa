// src/pages/PayePersonalReliefs.jsx
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
import { FaGift, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddPayeReliefDrawer from "./AddPayeReliefDrawer";
import EditPayeReliefDrawer from "./EditPayeReliefDrawer";
import Base_Url from "../../../../../apis/BaseApi";

export default function PayePersonalReliefs() {
  const [reliefs, setReliefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRelief, setSelectedRelief] = useState(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Fetch reliefs
  const fetchReliefs = async () => {
    setLoading(true);
    try {
      const res = await Base_Url.get("/payepersonalrelief/all");
      if (res.status == 200) {
        setReliefs(res.data?.data || []);
      }
    } catch (error) {
      console.error("Error Fetching Paye Personal Reliefs: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReliefs();
  }, []);

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently remove the relief.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await Base_Url.delete(`/payepersonalrelief/delete/${id}`);

          if (res.status !== 200) throw new Error("Failed to delete relief");
          Swal.fire("Deleted!", "Relief has been deleted.", "success");
          fetchReliefs();
        } catch (err) {
          Swal.fire("Error!", "Failed to delete relief.", "error");
        }
      }
    });
  };

  // Filter + paginate
  const filteredReliefs = useMemo(() => {
    return reliefs.filter((r) => {
      const idMatch = r.Id?.toString().includes(search);
      const monthlyMatch = r.MonthlyRelief?.toString().includes(search);
      const startDateMatch = r.StartDate
        ? new Date(r.StartDate).getFullYear().toString().includes(search)
        : false;

      return idMatch || monthlyMatch || startDateMatch;
    });
  }, [reliefs, search]);

  const paginatedReliefs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReliefs.slice(start, start + pageSize);
  }, [filteredReliefs, page, pageSize]);

  const totalPages = Math.ceil(filteredReliefs.length / pageSize);

  return (
    <div className="bg-white px-4 py-4 rounded-lg relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaGift className="text-white" /> PAYE Personal Reliefs
        </h2>
        <Button
          onClick={() => setOpenAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-800 flex items-center gap-2"
        >
          <FaPlus /> Add Relief
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 justify-between">
        <Input
          placeholder="Search by year or relief..."
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
        <div className="grid grid-cols-5 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>ID</span>
          <span>Start Date</span>
          <span>End Date</span>
          <span>Monthly Relief</span>
          <span className="text-right">Actions</span>
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
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : paginatedReliefs.length > 0 ? (
          <div className="space-y-2">
            {paginatedReliefs.map((r) => (
              <div
                key={r.Id}
                className="grid grid-cols-5 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-green-700">{r.Id}</span>
                <span>{new Date(r.StartDate).toLocaleDateString()}</span>
                <span>
                  {r.EndDate
                    ? new Date(r.EndDate).toLocaleDateString()
                    : "Ongoing"}
                </span>
                <span>{r.MonthlyRelief}</span>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setSelectedRelief(r);
                      setOpenEdit(true);
                    }}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDelete(r.Id)}
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
            <p className="font-medium text-gray-400">No reliefs found.</p>
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
      <AddPayeReliefDrawer
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchReliefs}
      />
      <EditPayeReliefDrawer
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchReliefs}
        relief={selectedRelief}
      />
    </div>
  );
}
