import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaUndo, FaChevronLeft, FaChevronRight, FaHistory } from "react-icons/fa";
import { listLeaveApplications, recallLeaveApplication } from "../lib/api";
import { LeaveApplicationStatus } from "../lib/enums";

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

export default function LeaveRecallList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [actingIds, setActingIds] = useState(new Set());

  const fetchItems = () => {
    setLoading(true);
    listLeaveApplications({ text: search, status: LeaveApplicationStatus.Approved, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.PageCollection || page?.pageCollection || []);
        setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const handleRecall = async (item) => {
    const { value: remarks, isConfirmed } = await Swal.fire({
      title: `Recall leave for ${item.EmployeeCustomerFullName?.trim()}?`,
      text: "This returns the applied days back to their balance.",
      input: "textarea",
      inputPlaceholder: "Optional remarks",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Recall",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;

    setActingIds((prev) => new Set(prev).add(item.Id));
    try {
      await recallLeaveApplication(item.Id, remarks);
      Swal.fire("Recalled", "Leave application recalled.", "success");
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setActingIds((prev) => { const next = new Set(prev); next.delete(item.Id); return next; });
    }
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaHistory /> Leave Recall
        </h2>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by employee..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Employee</span>
          <span className="col-span-2">Leave Type</span>
          <span className="col-span-3">Duration</span>
          <span className="col-span-2">Authorized By</span>
          <span className="col-span-2 text-right">Actions</span>
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
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{item.EmployeeCustomerFullName?.trim() || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700 truncate">{item.LeaveTypeDescription || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-700">{formatDate(item.DurationStartDate)} – {formatDate(item.DurationEndDate)}</span>
                  <span className="col-span-2 text-sm text-gray-500 truncate">{item.AuthorizedBy || "—"}</span>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingIds.has(item.Id)}
                      onClick={() => handleRecall(item)}
                      className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                    >
                      <FaUndo /> Recall
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No approved leave applications to recall.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
