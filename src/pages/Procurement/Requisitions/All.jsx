
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaListAlt,
  FaPlus,
  FaUser,
  FaBuilding,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
} from "react-icons/fa";
import Swal from "sweetalert2";
import AddRequisitionDrawer from "./AddRequisitionDrawer"; // new drawer

export default function All() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const fetchRequisitions = () => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/requisitions`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setRequisitions(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  // Approve Handler
  const handleApprove = async (id) => {
    Swal.fire({
      title: "Approve Requisition?",
      text: "This action will mark the requisition as Approved.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, approve it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/${id}/submit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
              },
              body: JSON.stringify({ status: "Approved" }),
            }
          );

          if (!res.ok) throw new Error("Failed to approve requisition");

          Swal.fire("Approved!", "Requisition has been approved.", "success");
          fetchRequisitions();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to approve requisition.", "error");
        }
      }
    });
  };

  // Delete Handler
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/${id}`,
            {
              method: "DELETE",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );
          if (!res.ok) throw new Error("Failed to delete requisition");

          Swal.fire("Deleted!", "Requisition has been deleted.", "success");
          fetchRequisitions();
        } catch (err) {
          console.error(err);
          Swal.fire("Error!", "Failed to delete requisition.", "error");
        }
      }
    });
  };

  return (
    <div className="bg-white py-8 rounded-lg">
      {/* Header */}
      {/* <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaListAlt className="text-white" /> Requisitions
        </h2>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setAddDrawerOpen(true)}
        >
          <FaPlus /> New Requisition
        </Button>
      </div> */}

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-7 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Number</span>
          <span>Requested By</span>
          <span>Department</span>
          <span>Status</span>
          <span>Total</span>
          <span className="text-right col-span-2">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-7 gap-2 bg-gray-50 py-4 px-6 rounded"
              >
                {Array.from({ length: 7 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : requisitions.length > 0 ? (
          <div className="space-y-2">
            {requisitions.map((req) => (
              <div
                key={req.RequisitionId}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Row */}
                <div className="grid grid-cols-7 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700">
                    {req.RequisitionNumber}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaUser className="text-gray-500" />{" "}
                    {req.RequestedByFullname}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaBuilding className="text-gray-500" />{" "}
                    {req.DepartmentName}
                  </span>
                  <span
                    className={`text-sm w-28 rounded-2xl text-center flex items-start justify-center p-1 ${
                      req.Status === "Submitted"
                        ? "bg-yellow-500 text-white"
                        : req.Status === "Draft"
                        ? "bg-gray-500 text-white"
                        : req.Status === "ConvertedToPO"
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {req.Status}
                  </span>
                  <span className="font-semibold">${req.TotalAmount}</span>

                  <div className="flex justify-end gap-2 col-span-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === req.RequisitionId
                            ? null
                            : req.RequisitionId
                        )
                      }
                    >
                      {expandedRow === req.RequisitionId ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
                    </Button>
                    {req.Status !== "Approved" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(req.RequisitionId)}
                      >
                        <FaCheck /> Approve
                      </Button>
                    )}
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <FaEdit /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-white"
                      onClick={() => handleDelete(req.RequisitionId)}
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </div>

                {/* Dropdown Lines */}
                {expandedRow === req.RequisitionId && (
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <h4 className="font-semibold mb-2">Line Items</h4>
                    <div className="grid grid-cols-6 gap-4 font-semibold bg-gray-200 p-2 rounded">
                      <span>Line</span>
                      <span>Description</span>
                      <span>Qty</span>
                      <span>Unit Price</span>
                      <span>Account</span>
                      <span>Total</span>
                    </div>
                    {req.Lines.map((line, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-6 gap-4 py-2 border-b last:border-0"
                      >
                        <span>{line.LineNumber}</span>
                        <span>{line.ItemDescription}</span>
                        <span>{line.Quantity}</span>
                        <span>${line.UnitPrice}</span>
                        <span>{line.AccountCode}</span>
                        <span className="font-medium">
                          ${line.Quantity * line.UnitPrice}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center mt-4">
            No requisitions found.
          </p>
        )}
      </div>
      <AddRequisitionDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={fetchRequisitions}
      />
    </div>
  );
}