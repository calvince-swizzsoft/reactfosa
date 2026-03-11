import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaUser,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/adra.png";


export default function Rejected() {
  const [storeRequisitions, setStoreRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch Rejected Store Requisitions
  const fetchStoreRequisitions = () => {
    fetch(
      `${import.meta.env.VITE_APP_PRO_URL}/api/storerequisition/status?status=Rejected`,
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



  const downloadPDF = (req) => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const red = [220, 53, 69]; // Red color for Rejected

    // -------------------------
    // HEADER (Logo + Banner)
    // -------------------------
    doc.addImage(logo, "PNG", 40, 30, 40, 40);
    doc.setFillColor(...red);
    doc.rect(40, 90, pageWidth - 80, 50, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("REJECTED STORE REQUISITION", pageWidth / 2, 122, { align: "center" });

    // -------------------------
    // REQUESTER / DEPARTMENT
    // -------------------------
    const leftX = 40;
    const rightX = pageWidth / 2 + 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...red);

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
      headStyles: { fillColor: red, textColor: "#FFFFFF", fontStyle: "bold", halign: "center" },
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
    // FOOTER / NOTE
    // -------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...red);
    doc.text("This requisition has been rejected.", pageWidth / 2, finalY + 40, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "This document is confidential. Do not share without proper authorization.",
      pageWidth / 2,
      finalY + 60,
      { align: "center", maxWidth: pageWidth - 80 }
    );

    doc.save(`RejectedReq_${req.RequisitionNumber}.pdf`);
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
          <span className="col-span-4 text-right">Actions</span>
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
                  <span className="col-span-2 text-sm w-28 rounded-2xl text-center flex items-center justify-center p-1 bg-red-600 text-white">
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white col-span-1"
                      onClick={() => downloadPDF(req)}
                    >
                      Download PDF
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
              No Rejected Requisitions found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
