import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaUser,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
} from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/adra.png";


export default function Approved() {
  const [storeRequisitions, setStoreRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  // Fetch Approved Requisitions
  const fetchStoreRequisitions = () => {
    fetch(
      `${import.meta.env.VITE_APP_PRO_URL}/api/storerequisition/status?status=Approve`,
      { headers: { "ngrok-skip-browser-warning": "true" } }
    )
      .then((res) => res.json())
      .then((data) => {
        setStoreRequisitions(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStoreRequisitions();
  }, []);

  // Post Requisition
  const handlePostRequisition = async (storeRequisitionId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to post this requisition?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, post",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(storeRequisitionId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/storerequisition/${storeRequisitionId}/updateStatus?status=Post`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (res.ok) {
        Swal.fire("Success!", "Requisition posted successfully.", "success");
        fetchStoreRequisitions();
      } else {
        Swal.fire("Error!", "Failed to post requisition.", "error");
      }
    } catch (err) {
      Swal.fire("Error!", "Something went wrong.", "error");
    } finally {
      setSubmitting(null);
    }
  };



  const downloadPDF = (req) => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const green = [0, 77, 64]; // ADRA Green

    // -------------------------
    // HEADER (Logo + Banner)
    // -------------------------
    doc.addImage(logo, "PNG", 40, 30, 40, 40);
    doc.setFillColor(...green);
    doc.rect(40, 90, pageWidth - 80, 50, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("APPROVED STORE REQUISITION", pageWidth / 2, 122, { align: "center" });

    // -------------------------
    // REQUESTER / DEPARTMENT
    // -------------------------
    const leftX = 40;
    const rightX = pageWidth / 2 + 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...green);

    doc.text("Requested By:", leftX, 170);
    doc.text("Department:", rightX, 170);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    doc.text(req.RequesterName || "-", leftX, 190);
    doc.text(req.DepartmentName || "-", rightX, 190);

    doc.text(`Status: ${req.Status}`, leftX, 210);
    doc.text(`Requisition No: ${req.RequisitionNumber}`, rightX, 210);

    // -------------------------
    // TABLE OF ITEMS
    // -------------------------
    const tableData = req.Lines.map((line) => [
      line.ItemDescription,
      line.QuantityRequested,
      line.UnitOfMeasure || "Unit",
      `Ksh ${line.UnitPrice.toFixed(2)}`,
      line.Remarks || "-",
      `Ksh ${(line.QuantityRequested * line.UnitPrice).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 240,
      head: [["Description", "Qty", "Unit", "Unit Price", "Remarks", "Total (KES)"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: green, textColor: "#FFFFFF", fontStyle: "bold", halign: "center" },
      styles: { fontSize: 11, cellPadding: 6 },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        5: { halign: "right" },
      },
      margin: { left: 40, right: 40 },
    });

    const finalY = doc.lastAutoTable.finalY + 20;

    // -------------------------
    // TOTAL AMOUNT
    // -------------------------
    const totalAmount = req.Lines?.reduce(
      (sum, l) => sum + (l.QuantityRequested || 0) * (l.UnitPrice || 0),
      0
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Total Amount: Ksh ${totalAmount.toLocaleString()}`, 40, finalY);

    // -------------------------
    // THANK YOU / FOOTER
    // -------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...green);
    doc.text("Thank you for your collaboration.", pageWidth / 2, finalY + 40, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "This document is confidential and intended solely for the recipient. Unauthorized sharing or duplication is prohibited.",
      pageWidth / 2,
      finalY + 60,
      { align: "center", maxWidth: pageWidth - 80 }
    );

    doc.save(`ApprovedReq_${req.RequisitionNumber}.pdf`);
  };


  return (
    <div className="bg-white py-8 rounded-lg">
      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-14 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">Number</span>
          <span className="col-span-2">Requested By</span>
          <span className="col-span-2">Department</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Total</span>
          <span className="col-span-3 text-right">Actions</span>
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
        ) : storeRequisitions.length > 0 ? (
          <div className="space-y-2">
            {storeRequisitions.map((req) => (
              <div
                key={req.StoreRequisitionID}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Row */}
                <div className="grid grid-cols-14 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-2">
                    {req.RequisitionNumber}
                  </span>
                  <span className="flex items-center gap-2 col-span-2">
                    <FaUser className="text-gray-500" /> {req.RequesterName}
                  </span>
                  <span className="flex items-center gap-2 col-span-2">
                    <FaBuilding className="text-gray-500" /> {req.DepartmentName}
                  </span>
                  <span className="col-span-2 text-sm w-28 rounded-2xl text-center flex items-center justify-center p-1 bg-green-700 text-white">
                    {req.Status}
                  </span>
                  <span className="font-semibold col-span-2">
                    Ksh{" "}
                    {req.Lines.reduce(
                      (sum, l) => sum + l.QuantityRequested * l.UnitPrice,
                      0
                    )}
                  </span>

                  <div className="flex justify-end gap-2 col-span-4">
                    {/* Download PDF */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-600 text-white hover:bg-gray-700"
                      onClick={() => downloadPDF(req)}
                    >
                      Download PDF
                    </Button>
                    {/* Post button */}
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-indigo-700 hover:bg-indigo-800 text-white"
                      onClick={() => handlePostRequisition(req.StoreRequisitionID)}
                      disabled={submitting === req.StoreRequisitionID}
                    >
                      {submitting === req.StoreRequisitionID
                        ? "Posting..."
                        : (
                          <>
                            <FaPaperPlane className="mr-2" />
                            Post
                          </>
                        )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white col-span-1"
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === req.StoreRequisitionID
                            ? null
                            : req.StoreRequisitionID
                        )
                      }
                    >
                      {expandedRow === req.StoreRequisitionID ? (
                        <>
                          <FaChevronUp /> Hide Items
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> View Items
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Dropdown Lines */}
                {expandedRow === req.StoreRequisitionID && (
                  <div className="bg-gray-100 px-6 py-4 border-t">
                    <h4 className="font-semibold mb-2">Line Items</h4>
                    <div className="bg-gray-300 p-2 rounded-lg">
                      <div className="grid grid-cols-5 gap-4 font-semibold bg-gray-700 text-white py-2 px-4 rounded">
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit Price</span>
                        <span>Remarks</span>
                        <span>Total</span>
                      </div>
                      {req.Lines.map((line) => (
                        <div
                          key={line.LineID}
                          className="grid grid-cols-5 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0"
                        >
                          <span>{line.ItemDescription}</span>
                          <span>{line.QuantityRequested}</span>
                          <span>Ksh {line.UnitPrice}</span>
                          <span>{line.Remarks}</span>
                          <span className="font-medium">
                            Ksh {line.QuantityRequested * line.UnitPrice}
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
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">
              No Approved Requisitions found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
