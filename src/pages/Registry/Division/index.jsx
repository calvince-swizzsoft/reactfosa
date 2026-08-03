import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NotFoundImage from "/assets/scopefinding.png";
import { FaSitemap, FaPlus, FaEllipsisV, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import DivisionDrawer from "./DivisionDrawer";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const DIVISION_BASE = `${FIN_BASE}/api/registry/division`;

export default function Divisions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);

  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  // The Registry API's response envelope is just { success, message, data }
  // — no total count is provided — so "is there a next page" is inferred
  // from whether this page came back full, not from a real total.
  const [hasNextPage, setHasNextPage] = useState(false);

  // The paged Registry endpoints wrap their array in data.PageCollection
  // (alongside PageIndex/PageSize/ItemsCount/TotalCount/TotalPages), not a
  // bare array or {data: [...]} like the unpaged endpoints — unwrap that
  // shape first, falling back to the simpler shapes just in case.
  const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
    if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
    return [];
  };

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams({
      pageIndex: String(pageIndex),
      pageSize: String(pageSize),
      text: search,
    });
    apiFetch(`${DIVISION_BASE}?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        const list = normalizeList(d);
        setItems(list);
        setHasNextPage(list.length === pageSize);
      })
      .catch(() => {
        setItems([]);
        setHasNextPage(false);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex, pageSize]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPageIndex(0);
  };

  const openCreate = () => {
    setEditingDivision(null);
    setDrawerOpen(true);
  };

  const openEdit = (division) => {
    setEditingDivision(division);
    setDrawerOpen(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Division?",
      text: "This also removes its zones and stations.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          const res = await apiFetch(`${DIVISION_BASE}/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete");
          setItems((prev) => prev.filter((x) => x.Id !== id));
          Swal.fire("Deleted!", "Division removed.", "success");
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaSitemap /> Divisions
        </h2>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> Add Division
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search Divisions..."
          value={search}
          onChange={handleSearchChange}
          className="border p-2 rounded-lg w-1/3"
        />
        <select value={pageSize} onChange={handlePageSizeChange} className="border p-2 rounded-lg">
          {[10, 20, 50].map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Division</span>
          <span className="col-span-4">Employer</span>
          <span className="col-span-3">Created</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

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
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-4 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-4 text-sm text-gray-600">{item.EmployerDescription || "—"}</span>
                  <span className="col-span-3 text-xs text-gray-400">{item.CreatedDate ? new Date(item.CreatedDate).toLocaleDateString() : "—"}</span>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <FaEdit className="mr-2 text-indigo-600" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.Id)}>
                          <FaTrash className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No Divisions Found.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button
            type="button"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 m-2"
          >
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button
            type="button"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setPageIndex((p) => p + 1)}
            className="flex items-center gap-1 m-2"
          >
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      <DivisionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={fetchItems}
        division={editingDivision}
      />
    </div>
  );
}
