import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaChevronDown, FaChevronUp, FaBuilding, FaPlus, FaFilePdf, FaBalanceScale } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddRFQ from "./AddRFQ";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CompareRFQDrawer from "./CompareRFQDrawer";
import logo from "../../../assets/adra.png";


export default function RequestForQuotation() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [convertingId, setConvertingId] = useState(null); // ✅ track conversion state
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [relatedRFQs, setRelatedRFQs] = useState([]);
  const [refresh, setRefresh] = useState(false)

  const fetchRFQs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/rfq/GetRFQs`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();

      if (data.Success && Array.isArray(data.Data)) {
        setRfqs(data.Data);
      } else {
        setRfqs([]);
      }
    } catch (error) {
      console.error("Error fetching RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [refresh]);

  // // ✅ Convert RFQ to Purchase Order
  // const handleConvertToPO = async (rfq) => {
  //   if (!rfq || !rfq.Lines || rfq.Lines.length === 0) {
  //     Swal.fire("No Line Items", "This RFQ has no lines to convert.", "warning");
  //     return;
  //   }

  //   setConvertingId(rfq.Id);

  //   // Map RFQ lines into the API format
  //   const poData = {
  //     PurchaseOrderId: rfq.Id,
  //     PONumber: rfq.RFQNumber,
  //     SupplierId: rfq.VendorId || 0,
  //     SupplierName: rfq.VendorName,
  //     OrderDate: new Date().toISOString(),
  //     ExpectedDeliveryDate: rfq.ExpectedDeliveryDate,
  //     Currency: "KES",
  //     Status: "Open",
  //     TotalAmount: rfq.EstimatedBudget || 0,
  //     Projectcode: rfq.ProjectCode || "",
  //     ProjectId: rfq.ProjectId || 0,
  //     ProjectDescription: rfq.ProjectDescription || "",
  //     CreatedBy: "018bf26c-bef7-425f-bc0f-1c7a31f0d474",
  //     Lines: rfq.Lines.map((line, i) => ({
  //       POLineId: 0,
  //       PurchaseOrderId: 0,
  //       LineNumber: i + 1,
  //       ItemId: line.ItemId || crypto.randomUUID(),
  //       ItemDescription: line.ItemDescription,
  //       QuantityOrdered: line.Quantity,
  //       UnitPrice: line.EstimatedUnitPrice,
  //       BudgetLine: line.BudgetLine || 0,
  //       Budgetdescription: line.BudgetDescription || "",
  //       ReceivedQuantity: 0,
  //     })),
  //   };

  //   try {
  //     const response = await fetch(
  //       `${import.meta.env.VITE_APP_PRO_URL}/api/rfq/CreatePurchaseOrder`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "ngrok-skip-browser-warning": "true",
  //         },
  //         body: JSON.stringify(poData),
  //       }
  //     );

  //     if (!response.ok) throw new Error("Failed to create purchase order");
  //     const result = await response.json();

  //     Swal.fire({
  //       icon: "success",
  //       title: "PO Created",
  //       text: `Purchase Order ${result.PONumber || "successfully created!"}`,
  //     });

  //     fetchRFQs();
  //   } catch (error) {
  //     console.error("Error creating PO:", error);
  //     Swal.fire("Error", "Failed to convert RFQ to Purchase Order.", "error");
  //   } finally {
  //     setConvertingId(null);
  //   }
  // };




  // ✅ Convert RFQ to RFQ (POST → create purchase order style RFQ)
  const handleConvertToRFQ = async (rfq) => {
    if (!rfq || !rfq.Lines || rfq.Lines.length === 0) {
      Swal.fire("No Line Items", "This RFQ has no lines to convert.", "warning");
      return;
    }

    setConvertingId(rfq.Id);

    const rfqData = {
      PurchaseOrderId: rfq.Id,
      PONumber: rfq.RFQNumber,
      SupplierId: rfq.VendorId || 0,
      SupplierName: rfq.VendorName,
      OrderDate: new Date().toISOString(),
      ExpectedDeliveryDate: rfq.ExpectedDeliveryDate,
      Currency: rfq.Currency || "KES",
      Status: "RFQ",
      TotalAmount: rfq.EstimatedBudget || 0,
      Projectcode: rfq.ProjectCode || "",
      ProjectId: rfq.ProjectId || 0,
      ProjectDescription: rfq.ProjectDescription || "",
      CreatedBy: "4e31854e-6517-4ae5-9590-329f26c4ae03",
      Lines: rfq.Lines.map((line, index) => ({
        POLineId: 0,
        PurchaseOrderId: 0,
        LineNumber: index + 1,
        ItemId: line.ItemId || crypto.randomUUID(),
        ItemDescription: line.ItemDescription,
        QuantityOrdered: line.Quantity,
        UnitPrice: line.EstimatedUnitPrice,
        BudgetLine: line.BudgetLine || 0,
        Budgetdescription: line.BudgetDescription || "",
        ReceivedQuantity: 0
      }))
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/purchaseorders/create2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(rfqData),
        }
      );

      if (!response.ok) throw new Error("Failed to convert to RFQ");

      const result = await response.json();

      Swal.fire({
        icon: "success",
        title: "RFQ Created",
        text: `RFQ ${result.PONumber || ""} created successfully!`,
      });

      fetchRFQs();
    } catch (error) {
      console.error("Error creating RFQ:", error);
      Swal.fire("Error", "Failed to convert to RFQ.", "error");
    } finally {
      setConvertingId(null);
    }
  };







  const downloadPDF = (req) => {
    const doc = new jsPDF("p", "mm", "a4");
    const green = [0, 87, 63];
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- LOGO ---
    doc.addImage(logo, "PNG", 15, 10, 25, 25);

    // --- HEADER RECTANGLE ---
    doc.setFillColor(...green);
    doc.rect(60, 15, pageWidth - 75, 15, "F");

    // --- HEADER TEXT ---
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("REQUEST FOR QUOTATION", 65, 24);

    // --- RFQ TO / FROM SECTION ---
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...green);
    doc.setFontSize(11);
    doc.text("RFQ To:", 15, 50);
    doc.text("RFQ From:", pageWidth / 2, 50);

    // --- RFQ DETAILS (LEFT) ---
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(req.VendorName || "Vendor Name", 15, 56);
    doc.text(req.Department || "Department", 15, 62);

    // --- RFQ DETAILS (RIGHT) ---
    doc.text("ADRA Kenya", pageWidth / 2, 56);
    doc.text("Procurement Department", pageWidth / 2, 62);
    doc.text("www.adrakenya.org", pageWidth / 2, 68);

    // --- TABLE CONTENT ---
    const tableColumn = ["Item Description", "Quantity", "Unit", "Amount (KES)"];
    const tableRows = req.Lines.map((line) => [
      line.ItemDescription ?? "",
      line.Quantity ?? "",
      line.UnitPrice ?? "",
      ((Number(line.Quantity) || 0) * (Number(line.UnitPrice) || 0)).toFixed(2),
    ]);

    autoTable(doc, {
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 10, valign: "middle" },
      headStyles: {
        fillColor: green,
        textColor: [255, 255, 255],
        halign: "center",
      },
      bodyStyles: { halign: "center" },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // --- ORIGINAL RFQ SUMMARY DETAILS ---
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Request For Quotation", 14, finalY + 10);

    doc.setFontSize(10);
    doc.text(`Requisition No: ${req.RFQNumber || "-"}`, 14, finalY + 20);
    doc.text(`Vendor Name: ${req.VendorName || "-"}`, 14, finalY + 27);
    doc.text(`Department: ${req.Department || "-"}`, 14, finalY + 34);
    doc.text(`Status: ${req.Status || "-"}`, 14, finalY + 41);

    // --- TOTAL AMOUNT ---
    const totalAmount = req.Lines.reduce(
      (sum, l) => sum + (l.Quantity || 0) * (l.UnitPrice || 0),
      0
    );
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: Ksh ${totalAmount.toFixed(2)}`, 14, finalY + 52);

    // --- THANK YOU NOTE ---
    doc.setTextColor(...green);
    doc.setFontSize(12);
    doc.text("Thank you for your collaboration.", pageWidth / 2, finalY + 70, {
      align: "center",
    });

    // --- GREEN FOOTER BOX (like in the image) ---
    doc.setFillColor(...green);
    doc.rect(pageWidth - 70, finalY + 40, 60, 20, "F");

    // --- CONFIDENTIALITY NOTE ---
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      "This document is confidential and intended solely for the recipient. Unauthorized sharing or duplication is prohibited.",
      pageWidth / 2,
      finalY + 90,
      { align: "center", maxWidth: pageWidth - 30 }
    );


    // --- SAVE PDF ---
    doc.save(`${req.VendorName || "RFQ"}.pdf`);
  };






  // ✅ Comparison feature
  const handleCompareRFQ = async (rfq) => {
    setSelectedRfq(rfq);
    setCompareDrawerOpen(true);
    setLoadingComparison(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/BidAnalysis/AnalyzeRelatedRFQs/${rfq.Id}`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRelatedRFQs(data.data);
      } else {
        setRelatedRFQs([]);
      }
    } catch (error) {
      console.error("Error fetching related RFQs:", error);
      Swal.fire("Error", "Failed to fetch related RFQs.", "error");
    } finally {
      setLoadingComparison(false);
    }
  };




  // File upload handler
  const handleFileUpload = async (rfqId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(",")[1]; // strip metadata

      try {
        const res = await fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/rfq/api/rfq/${rfqId}/file`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ FileBase64: base64String }),
        });

        if (!res.ok) throw new Error("Upload failed");
        Swal.fire("Success", "File uploaded successfully!", "success");
        setRefresh(true)
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to upload file", "error");
      }
    };
    reader.readAsDataURL(file);
    setRefresh(false);
  };




  return (
    <div className="bg-white m-8 px-8 py-8 rounded-lg">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBuilding className="text-white" /> Request For Quotation
        </h2>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setAddDrawerOpen(true)}
        >
          <FaPlus /> Add Request For Quotation
        </Button>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-18 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-2">RFQ #</span>
          <span className="col-span-2">Vendor</span>
          <span className="col-span-1">Priority</span>
          <span className="col-span-2">Department</span>
          <span className="col-span-2">Budget</span>
          <span className="col-span-2 text-sm">Delivery Date</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 bg-gray-50 py-4 px-6 rounded">
                {Array.from({ length: 12 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : rfqs.length > 0 ? (
          <div className="space-y-2">
            {rfqs.map((rfq) => (
              <div key={rfq.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-19 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-2 font-medium text-sm text-indigo-700 truncate">{rfq.RFQNumber}</span>
                  <span className="col-span-2 flex items-center text-sm gap-2 truncate">
                    {rfq.VendorName || "—"}
                  </span>
                  <span className="col-span-1 text-sm font-semibold">{rfq.Priority}</span>
                  <span className="col-span-2 text-sm">{rfq.Department}</span>
                  <span className="col-span-2 font-semibold text-sm">
                    {rfq.EstimatedBudget
                      ? `KES ${rfq.EstimatedBudget.toLocaleString()}`
                      : "—"}
                  </span>
                  <span className="col-span-2 text-sm">
                    {new Date(rfq.ExpectedDeliveryDate).toLocaleDateString()}
                  </span>
                  <span
                    className={`col-span-2 text-sm rounded-2xl text-center py-1 px-1 text-white ${rfq.Status === "Open"
                      ? "bg-green-600"
                      : rfq.Status === "Closed"
                        ? "bg-gray-500"
                        : "bg-yellow-500"
                      }`}
                  >
                    {rfq.Status}
                  </span>

                  <div className="col-span-3 flex gap-2 ">

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                      onClick={() => downloadPDF(rfq)}
                    >
                      <FaFilePdf /> PDF
                    </Button>

                    {/* <Button
                      size="sm"
                      disabled={
                        convertingId === rfq.Id ||
                        rfq.Status === "ConvertedToPO" ||
                        rfq.Status === "Open"
                      }
                      onClick={() => handleConvertToPO(rfq)}
                      className={`text-white ${convertingId === rfq.Id
                        ? "bg-gray-400 cursor-not-allowed"
                        : rfq.Status === "ConvertedToPO" || rfq.Status === "Open"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-indigo-700 hover:bg-indigo-600"
                        }`}
                    >
                      {rfq.Status === "ConvertedToPO"
                        ? "Already Converted"
                        : rfq.Status === "Open"
                          ? "Awaiting Approval"
                          : convertingId === rfq.Id
                            ? "Converting..."
                            : "Convert To PO"}
                    </Button> */}


                    <Button
                      size="sm"
                      disabled={rfq.Status === "ConvertedToPO"}
                      onClick={() => handleConvertToRFQ(rfq)}
                      className={`text-white ${convertingId === rfq.Id
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-700 hover:bg-indigo-600"
                        }`}
                    >
                      {convertingId === rfq.Id ? "Converting..." : "Convert To PO"}
                    </Button>



                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
                      onClick={() =>
                        setExpandedRow(expandedRow === rfq.Id ? null : rfq.Id)
                      }
                    >
                      {expandedRow === rfq.Id ? (
                        <>
                          <FaChevronUp /> Hide Lines
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> View Lines
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {expandedRow === rfq.Id && (
                  <div className="bg-gray-100 px-6 py-4 border-t">
                    <div className="flex justify-between mb-3">
                      <h4 className="font-semibold mb-2">Line Items</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-amber-600 text-white hover:bg-amber-700"
                        onClick={() => handleCompareRFQ(rfq)}
                      >
                        <FaBalanceScale /> Compare Vendor
                      </Button>
                    </div>
                    {/* LINES TABLE */}
                    <div className="bg-gray-300 p-2 rounded-lg">
                      <div className="grid grid-cols-8 gap-4 font-semibold bg-gray-700 text-white py-2 px-4 rounded">
                        <span>#</span>
                        <span>Item Code</span>
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit</span>
                        <span>Unit Price (Est.)</span>
                        <span>Total (Est.)</span>
                        <span>Notes</span>
                      </div>

                      {rfq.Lines && rfq.Lines.length > 0 ? (
                        rfq.Lines.map((line, i) => (
                          <div
                            key={line.Id}
                            className="grid grid-cols-8 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0"
                          >
                            <span>{i + 1}</span>
                            <span>{line.ItemCode}</span>
                            <span>{line.ItemDescription}</span>
                            <span>{line.Quantity}</span>
                            <span>{line.UnitOfMeasure}</span>
                            <span>
                              KES {line.EstimatedUnitPrice.toLocaleString()}
                            </span>
                            <span className="font-medium">
                              KES {line.EstimatedTotal.toLocaleString()}
                            </span>
                            <span>{line.Notes}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-2 text-gray-600">
                          No Line Items found.
                        </p>
                      )}
                    </div>

                    {/* ADDITIONAL DETAILS */}
                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Created Date:</strong>{" "}
                        {new Date(rfq.CreatedDate).toLocaleString()}
                      </p>
                      <p>
                        <strong>Delivery Location:</strong>{" "}
                        {rfq.DeliveryLocation}
                      </p>
                      <p>
                        <strong>Additional Notes:</strong>{" "}
                        {rfq.AdditionalNotes}
                      </p>
                      {rfq.VendorIds && rfq.VendorIds.length > 0 && (
                        <p>
                          <strong>Vendor IDs:</strong>{" "}
                          {rfq.VendorIds.join(", ")}
                        </p>
                      )}
                      <p>
                        <strong>Requested By:</strong>{" "}
                        {rfq.RequestedBy}
                      </p>
                      <div className="space-y-4">
                        {rfq.FileBase64 ? (
                          // ✅ Show download button if file exists
                          <a
                            href={`data:application/pdf;base64,${rfq.FileBase64}`}
                            download={`RFQ-${rfq.id || "document"}.pdf`}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
                          >
                            Download PDF
                          </a>
                        ) : (
                          // 🚀 Show attach file button if no file found
                          <label className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded cursor-pointer flex items-center gap-2 text-sm w-[200px]">
                            📎 Attach File
                            <input
                              type="file"
                              accept="*"
                              hidden
                              onChange={(e) => handleFileUpload(rfq.Id, e.target.files[0])}
                            />
                          </label>
                        )}
                      </div>

                    </div>
                  </div>
                )}


              </div>

            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">
              No Request for Quotations found.
            </p>
          </div>
        )}
      </div>

      <AddRFQ open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} />
      <CompareRFQDrawer
        open={compareDrawerOpen}
        onClose={() => setCompareDrawerOpen(false)}
        loading={loadingComparison}
        relatedRFQs={relatedRFQs}
      />

    </div>
  );
}
