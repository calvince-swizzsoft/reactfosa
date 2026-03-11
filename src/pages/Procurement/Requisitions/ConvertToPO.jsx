import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaListAlt,
  FaUser,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaFilePdf,
} from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/adra.png";

export default function ConvertToPO() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchRequisitions = () => {
    fetch(
      `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/getAllByStatus?status=ConvertedToRFQ`,
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


  const downloadPDF = (req) => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const green = [0, 77, 64]; // ADRA Green

    // ---------------------------------
    // HEADER (Logo + Banner)
    // ---------------------------------
    doc.addImage(logo, "PNG", 40, 30, 40, 40);
    doc.setFillColor(...green);
    doc.rect(40, 90, pageWidth - 80, 50, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Convert To RFQ: Requisitions", pageWidth / 2, 122, { align: "center" });

    // ---------------------------------
    // PO TO / FROM
    // ---------------------------------
    const leftX = 40;
    const rightX = pageWidth / 2 + 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...green);

    doc.text("RFQ To:", leftX, 170);
    doc.text("RFQ From:", rightX, 170);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // LEFT
    doc.text(req.VendorName || "Vendor Name", leftX, 190);
    doc.text(req.DepartmentName || "Department", leftX, 210);
    doc.text(req.SupplierAddress || "Address", leftX, 230);

    // RIGHT
    doc.text("ADRA Kenya", rightX, 190);
    doc.text("Procurement Department", rightX, 210);
    doc.text("www.adrakenya.org", rightX, 230);

    // ---------------------------------
    // TABLE
    // ---------------------------------
    const tableData = req.Lines.map((line) => [
      line.ItemDescription,
      line.Quantity,
      line.UnitOfMeasure || "Unit",
      `Ksh ${(line.Quantity * line.UnitPrice).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 270,
      head: [["Item Description", "Quantity", "Unit", "Amount (KES)"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: green, textColor: "#FFFFFF", fontSize: 12, fontStyle: "bold", halign: "center" },
      styles: { fontSize: 11, cellPadding: 6 },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });

    const finalY = doc.lastAutoTable.finalY + 30;

    // ---------------------------------
    // SUMMARY
    // ---------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("RFQ Summary", 40, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Requisition No: ${req.RequisitionNumber}`, 40, finalY + 25);
    doc.text(`Vendor Name: ${req.VendorName}`, 40, finalY + 45);
    doc.text(`Department: ${req.DepartmentName}`, 40, finalY + 65);
    doc.text(`Status: ${req.Status}`, 40, finalY + 85);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const totalAmount = req.Lines?.reduce((sum, l) => sum + l.Quantity * l.UnitPrice, 0) || 0;
    doc.text(`Total Amount: Ksh ${totalAmount.toLocaleString()}`, 40, finalY + 120);

    // ---------------------------------
    // SIDE GREEN BOX (Right)
    // ---------------------------------
    doc.setFillColor(...green);
    doc.rect(pageWidth - 220, finalY - 10, 180, 100, "F");

    // ---------------------------------
    // THANK YOU
    // ---------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...green);
    doc.text("Thank you for your collaboration.", pageWidth / 2, finalY + 180, { align: "center" });

    // ---------------------------------
    // DISCLAIMER FOOTER
    // ---------------------------------
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "This document is confidential and intended solely for the recipient. Unauthorized sharing or duplication is prohibited.",
      pageWidth / 2,
      finalY + 210,
      { align: "center", maxWidth: pageWidth - 80 }
    );

    // Save PDF
    doc.save(`RFQ_${req.RequisitionNumber}.pdf`);
  };


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
                  <span className="text-sm w-32 rounded-2xl text-center flex items-center justify-center p-1 bg-green-600 text-white">
                    {req.Status}
                  </span>
                  <span className="font-semibold">${req.TotalAmount}</span>

                  <div className="flex gap-2 ">
                    {/* ✅ PDF Download Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
                      onClick={() => downloadPDF(req)}
                    >
                      <FaFilePdf className="mr-2" /> Download PDF
                    </Button>
                    <Button
                      className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white col-span-1"
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
                        <><FaChevronUp /> Hide Items</>
                      ) : (
                        <><FaChevronDown /> View Items</>
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
                          className="grid grid-cols-6 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0 "
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

