import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaListAlt,
  FaUser,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";

export default function Submitted() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchRequisitions = () => {
    fetch(
      `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/getAllByStatus?status=Submitted`,
      { headers: { "ngrok-skip-browser-warning": "true" } }
    )
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

  return (
    <div className="bg-white py-8 rounded-lg">
      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-7 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span>Number</span>
          <span>Requested By</span>
          <span>Department</span>
          <span>Status</span>
          <span>Total</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-2 bg-gray-50 py-4 px-6 rounded"
              >
                {Array.from({ length: 6 }).map((__, j) => (
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
                <div className="grid grid-cols-6 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
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
                  <span className="text-sm w-32 rounded-2xl text-center flex items-center justify-center p-1 bg-blue-600 text-white">
                    {req.Status}
                  </span>
                  <span className="font-semibold">${req.TotalAmount}</span>

                  <div className="flex justify-end gap-2">
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
                  </div>
                </div>

                {/* Dropdown Lines */}
                {expandedRow === req.RequisitionId && (
                  <div className="bg-gray-100 px-6 py-4 border-t">
                    <h4 className="font-semibold mb-2">Line Items</h4>
                    <div className="bg-gray-300 p-2 rounded-lg">
                      <div className="grid grid-cols-6 gap-4 font-semibold bg-gray-700 text-white py-2 px-4 rounded">
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
                          className="grid grid-cols-6 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0"
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
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
         <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No Requisitions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
