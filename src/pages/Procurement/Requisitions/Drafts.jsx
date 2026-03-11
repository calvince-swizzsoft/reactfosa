import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaUser,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
  FaFilePdf,
} from "react-icons/fa";
import Swal from "sweetalert2";
//import NotFoundImage from "/assets/notfoundimage.png";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/adra.png";

export default function Drafts() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [refresh, setRefresh] = useState(true);

  const fetchRequisitions = () => {
    fetch(
      `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/getAllByStatus?status=Draft`,
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
  }, [refresh]);

  const handleSubmitForApproval = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to send this requisition for approval?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, send it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
    });

    if (!confirm.isConfirmed) return;

    console.log(id);

    setSubmitting(id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/${id}/submit/PendingApproval`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ status: "PendingApproval" }),
        }
      );
      if (res.ok) {
        Swal.fire("Success!", "Requisition sent for approval.", "success");
        fetchRequisitions();
      } else {
        Swal.fire("Error!", "Failed to submit requisition.", "error");
      }
    } catch (err) {
      Swal.fire("Error!", "Something went wrong.", "error");
    } finally {
      setSubmitting(null);
    }
  };



  // 🔥 Fully Styled RFQ PDF (Same Style as Pending Approval)
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
    doc.text("DRAFT REQUISITION", pageWidth / 2, 122, {
      align: "center",
    });

    // ---------------------------------
    // RFQ TO / FROM
    // ---------------------------------
    const leftX = 40;
    const rightX = pageWidth / 2 + 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...green);

    doc.text("Requisitions To:", leftX, 170);
    doc.text("Requisitions From:", rightX, 170);

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
      line.Unit || "",
      `Ksh ${(line.Quantity * line.UnitPrice).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 270,
      head: [["Item Description", "Quantity", "Unit", "Amount (KES)"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: green,
        textColor: "#FFFFFF",
        fontSize: 12,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 11,
        cellPadding: 6,
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
      },
      margin: { left: 40, right: 40 },
    });

    const finalY = doc.lastAutoTable.finalY + 30;

    // ---------------------------------
    // SUMMARY
    // ---------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Requisitions Summary", 40, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(`Requisition No:    ${req.RequisitionNumber}`, 40, finalY + 25);
    doc.text(`Vendor Name:       ${req.VendorName}`, 40, finalY + 45);
    doc.text(`Department:        ${req.DepartmentName}`, 40, finalY + 65);
    doc.text(`Status:            ${req.Status}`, 40, finalY + 85);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(
      `Total Amount: Ksh ${req.TotalAmount.toLocaleString()}`,
      40,
      finalY + 120
    );

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
    doc.text(
      "Thank you for your collaboration.",
      pageWidth / 2,
      finalY + 180,
      { align: "center" }
    );

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

    // Save
    doc.save(`Requisitions_${req.RequisitionNumber}.pdf`);
  };


  return (
    <div className="bg-white py-8 rounded-lg">
      <div className="flex justify-end mb-4">
        <Button
          size="sm"
          variant="outline"
          className="bg-gray-600 text-white hover:bg-gray-700"
          onClick={() => setRefresh(!refresh)}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-7 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-1">Number</span>
          <span className="col-span-1">Requested By</span>
          <span className="col-span-1">Department</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Total</span>
          <span className="text-right col-span-2 mr-4">Actions</span>
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
                <div className="grid grid-cols-8 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-1">
                    {req.RequisitionNumber}
                  </span>
                  <span className="flex items-center gap-2 col-span-1">
                    <FaUser className="text-gray-500" />{" "}
                    {req.RequestedByFullname}
                  </span>
                  <span className="flex items-center gap-2 col-span-1">
                    <FaBuilding className="text-gray-500" />{" "}
                    {req.DepartmentName}
                  </span>
                  <span className="text-sm w-28 rounded-2xl col-span-1 text-center flex items-center justify-center p-1 bg-gray-500 text-white">
                    {req.Status}
                  </span>
                  <span className="font-semibold col-span-1">Ksh {req.TotalAmount}</span>

                  <div className="flex gap-2 col-span-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-600 text-white hover:bg-gray-700"
                      onClick={() => downloadPDF(req)}
                    >
                      <FaFilePdf className="mr-2" /> PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-indigo-600 text-white col-span-1"
                      onClick={() => handleSubmitForApproval(req.RequisitionId)}
                      disabled={submitting === req.RequisitionId}
                    >
                      {submitting === req.RequisitionId ? "Submitting..." : (
                        <>
                          <FaPaperPlane className="mr-2" /> Send for Approval
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white col-span-1"
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
                          className="grid grid-cols-6 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0"
                        >
                          <span>{line.LineNumber}</span>
                          <span>{line.ItemDescription}</span>
                          <span>{line.Quantity}</span>
                          <span>Ksh {line.UnitPrice}</span>
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
