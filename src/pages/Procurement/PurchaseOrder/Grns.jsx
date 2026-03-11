



import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaBoxes,
  FaPlus,
  FaCalendarAlt,
  FaUser,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/adra.png";


export default function Grns() {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGrns = () => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/grns`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setGrns(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchGrns();
  }, []);


  const downloadPDF = (grn) => {
    const doc = new jsPDF("p", "pt", "a4");

    // COLORS
    const green = "#0a6b3c";

    // ---------------------------
    //  HEADER (Logo + Title)
    // ---------------------------
    doc.addImage(logo, "PNG", 15, 10, 80, 80);

    doc.setFillColor(green);
    doc.rect(100, 40, 500, 50, "F");

    doc.setFontSize(16);
    doc.setTextColor("#FFFFFF");
    doc.text("GOODS RECEIVED NOTE (GRN)", 230, 70);

    // ---------------------------
    //  GRN DETAILS LEFT
    // ---------------------------
    doc.setTextColor(green);
    doc.setFontSize(14);
    doc.text("GRN Details:", 40, 140);

    doc.setFontSize(12);
    doc.setTextColor("#000");

    doc.text(`GRN Number: ${grn.GRNNumber}`, 40, 160);
    doc.text(`PO Number: ${grn.PONumber}`, 40, 180);
    doc.text(
      `Received Date: ${new Date(grn.ReceivedDate).toLocaleString()}`,
      40,
      200
    );
    doc.text(`Status: ${grn.Status}`, 40, 220);

    // ---------------------------
    // GRN DETAILS RIGHT
    // ---------------------------
    doc.setTextColor(green);
    doc.setFontSize(14);
    doc.text("Received By:", 300, 140);

    doc.setFontSize(12);
    doc.setTextColor("#000");

    doc.text(grn.ReceivedByFirstName || "N/A", 300, 160);
    doc.text("Procurement Department", 300, 180);
    doc.text("ADRA Kenya", 300, 200);

    // ---------------------------
    // TABLE
    // ---------------------------
    const tableData = grn.Lines?.map((line) => [
      line.ItemDescription,
      line.QuantityReceived,
      line.Unit,
      `KES ${line.UnitPrice.toLocaleString()}`,
      `KES ${(line.QuantityReceived * line.UnitPrice).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 260,
      headStyles: {
        fillColor: green,
        textColor: "#fff",
        halign: "center",
      },
      head: [["Item Description", "Qty", "Unit", "Unit Price", "Total"]],
      body: tableData || [],
      styles: { fontSize: 11 },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    // ---------------------------
    // FOOTER
    // ---------------------------
    const finalY = doc.lastAutoTable.finalY + 60;
    doc.setTextColor(green);
    doc.setFontSize(14);
    doc.text("Thank you for your collaboration.", 200, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "This document is confidential and intended solely for the recipient. Unauthorized sharing or duplication is prohibited.",
      50, finalY + 15,
    );

    doc.save(`GRN_${grn.GRNNumber}.pdf`);
  };



  return (
    <div className="bg-white py-8 rounded-lg">


      {/* Table */}
      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-7 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-1">GRN Number</span>
          <span className="col-span-1">PO Number</span>
          <span className="col-span-2">Received Date</span>
          <span>Status</span>
          <span>Total Amount</span>
          <span>Received By</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-7 gap-4 bg-gray-50 p-6 rounded"
              >
                {Array.from({ length: 7 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : grns.length > 0 ? (
          <div className="space-y-2">
            {grns.map((grn) => (
              <div
                key={grn.GRNId}
                className="grid grid-cols-8 gap-4 items-center bg-white py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all border"
              >
                <span className="font-medium text-indigo-700 col-span-1">
                  {grn.GRNNumber}
                </span>
                <span className="col-span-1 truncate" >{grn.PONumber}</span>
                <span className="flex items-center gap-2 col-span-2">
                  <FaCalendarAlt className="text-gray-500" />{" "}
                  {new Date(grn.ReceivedDate).toLocaleString()}
                </span>
                <span
                  className={`text-sm w-24 rounded-2xl text-center flex items-start justify-center p-1 ${grn.Status === "Received"
                    ? "text-white bg-green-600"
                    : "text-white bg-red-600"
                    }`}
                >
                  {grn.Status}
                </span>
                <span>KES {grn.TotalAmount.toFixed(2)}</span>
                <span className="flex items-center gap-2">
                  <FaUser className="text-gray-500" />{" "}
                  {grn.ReceivedByFirstName || "N/A"}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => downloadPDF(grn)}
                >
                  Download PDF
                </Button>


              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
            <p className="font-medium text-gray-400">No Goods Received Notes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

