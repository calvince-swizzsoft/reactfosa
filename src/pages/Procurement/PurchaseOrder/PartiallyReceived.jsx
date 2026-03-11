// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   FaChevronDown,
//   FaChevronUp,
//   FaBuilding,
// } from "react-icons/fa";
// import NotFoundImage from "/assets/scopefinding.png";

// export default function PartiallyReceived() {
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [expandedRow, setExpandedRow] = useState(null);

//   const fetchPurchaseOrders = () => {
//     fetch(
//       `${import.meta.env.VITE_APP_PRO_URL}/api/purchaseorders/status/Partially Received`,
//       { headers: { "ngrok-skip-browser-warning": "true" } }
//     )
//       .then((res) => res.json())
//       .then((data) => {
//         setPurchaseOrders(data || []);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   };

//   useEffect(() => {
//     fetchPurchaseOrders();
//   }, []);

//   return (
//     <div className="bg-white py-8 rounded-lg">
//       <div className="bg-gray-200 p-4 rounded-sm">
//         {/* Table Headers */}
//         <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
//           <span className="col-span-1">PO Number</span>
//           <span className="col-span-1">Supplier</span>
//           <span className="col-span-1">Order Date</span>
//           <span className="col-span-1">Status</span>
//           <span className="col-span-1">Total</span>
//           <span className="text-right col-span-1 mr-4">Actions</span>
//         </div>

//         {loading ? (
//           // Skeleton Loader
//           <div className="space-y-2 animate-pulse">
//             {Array.from({ length: 3 }).map((_, i) => (
//               <div key={i} className="grid grid-cols-6 gap-2 bg-gray-50 py-4 px-6 rounded">
//                 {Array.from({ length: 6 }).map((__, j) => (
//                   <div key={j} className="h-4 bg-gray-200 rounded"></div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         ) : purchaseOrders.length > 0 ? (
//           // Data Rows
//           <div className="space-y-2">
//             {purchaseOrders.map((po) => (
//               <div key={po.PurchaseOrderId} className="bg-white rounded-lg shadow-lg border">
//                 {/* Row */}
//                 <div className="grid grid-cols-6 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
//                   <span className="font-medium text-indigo-700 col-span-1">{po.PONumber}</span>
//                   <span className="flex items-center gap-2 col-span-1">
//                     <FaBuilding className="text-gray-500" /> {po.SupplierName}
//                   </span>
//                   <span className="col-span-1">{new Date(po.OrderDate).toLocaleDateString()}</span>
//                   <span className="text-sm w-32 rounded-2xl col-span-1 text-center flex items-center justify-center p-1 bg-yellow-600 text-white">
//                     {po.Status}
//                   </span>
//                   <span className="font-semibold col-span-1">
//                     {po.Currency} {po.TotalAmount.toLocaleString()}
//                   </span>
//                   <div className="flex gap-2 col-span-1 justify-end">
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
//                       onClick={() =>
//                         setExpandedRow(expandedRow === po.PurchaseOrderId ? null : po.PurchaseOrderId)
//                       }
//                     >
//                       {expandedRow === po.PurchaseOrderId ? (
//                         <>
//                           <FaChevronUp /> Hide Items
//                         </>
//                       ) : (
//                         <>
//                           <FaChevronDown /> View Items
//                         </>
//                       )}
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Dropdown Lines */}
//                 {expandedRow === po.PurchaseOrderId && (
//                   <div className="bg-gray-100 px-6 py-4 border-t">
//                     <h4 className="font-semibold mb-2">Line Items</h4>
//                     <div className="bg-gray-300 p-2 rounded-lg">
//                       <div className="grid grid-cols-5 gap-4 font-semibold bg-gray-700 text-white py-2 px-4 rounded">
//                         <span>Line</span>
//                         <span>Description</span>
//                         <span>Qty</span>
//                         <span>Unit Price</span>
//                         <span>Total</span>
//                       </div>
//                       {po.Lines.map((line, i) => (
//                         <div key={i} className="grid grid-cols-5 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0">
//                           <span>{line.LineNumber}</span>
//                           <span>{line.ItemDescription}</span>
//                           <span>{line.QuantityOrdered}</span>
//                           <span>{po.Currency} {line.UnitPrice}</span>
//                           <span className="font-medium">
//                             {po.Currency} {(line.QuantityOrdered * line.UnitPrice).toLocaleString()}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           // Empty State
//           <div className="text-gray-500 text-center mt-4">
//             <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
//             <p className="font-medium text-gray-400">No Partially Received Purchase Orders found.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }









import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaChevronDown, FaChevronUp, FaBuilding } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../../assets/adra.png";


export default function PartiallyReceived() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [quantity, setQuantity] = useState("");

  const fetchPurchaseOrders = () => {
    fetch(
      `${import.meta.env.VITE_APP_PRO_URL}/api/purchaseorders/status/Partially Received`,
      { headers: { "ngrok-skip-browser-warning": "true" } }
    )
      .then((res) => res.json())
      .then((data) => {
        setPurchaseOrders(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Open modal
  const openModal = (po) => {
    setSelectedPO(po);
    setQuantity("");
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPO(null);
    setQuantity("");
  };

  // Convert PO -> GRN
  const handleConvertToGrn = async () => {
    if (!quantity || quantity <= 0) {
      Swal.fire("Missing Quantity", "Please enter a valid quantity.", "warning");
      return;
    }

    Swal.fire({
      title: "Convert to GRN?",
      text: `This will create a Fully Received with quantity ${quantity}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Convert",
    }).then(async (result) => {
      if (result.isConfirmed && selectedPO) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_APP_PRO_URL}/api/grns/${selectedPO.PurchaseOrderId}/ConvertPurchaseOrderToGRN2/${quantity}`,
            {
              method: "POST",
              headers: { "ngrok-skip-browser-warning": "true" },
            }
          );

          const responsedata = await res.json();
          if (!res.ok) {
            Swal.fire("Error!", responsedata.message, "error");
          } else {
            Swal.fire("Success!", "Purchase Order converted to GRN.", "success");
            fetchPurchaseOrders();
          }
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Something went wrong.", "error");
        } finally {
          closeModal();
        }
      }
    });
  };


  const downloadPDF = (po) => {
    const doc = new jsPDF("p", "pt", "a4");

    const green = "#0a6b3c";

    // ---------------------------
    // HEADER (Logo + Title)
    // ---------------------------
    doc.addImage(logo, "PNG", 15, 10, 80, 80);

    doc.setFillColor(green);
    doc.rect(100, 40, 500, 50, "F");

    doc.setFontSize(16);
    doc.setTextColor("#FFFFFF");
    doc.text("PARTIALLY RECEIVED PURCHASE ORDER", 180, 70);

    // ---------------------------
    // DETAILS LEFT
    // ---------------------------
    doc.setTextColor(green);
    doc.setFontSize(14);
    doc.text("Purchase Order Details:", 40, 140);

    doc.setTextColor("#000");
    doc.setFontSize(12);
    doc.text(`PO Number: ${po.PONumber}`, 40, 160);
    doc.text(`Supplier: ${po.SupplierName}`, 40, 180);
    doc.text(
      `Order Date: ${new Date(po.OrderDate).toLocaleDateString()}`,
      40,
      200
    );
    doc.text(`Status: ${po.Status}`, 40, 220);
    doc.text(
      `Total Amount: ${po.Currency} ${po.TotalAmount.toLocaleString()}`,
      40,
      240
    );

    // ---------------------------
    // DETAILS RIGHT
    // ---------------------------
    doc.setTextColor(green);
    doc.setFontSize(14);
    doc.text("Procurement Officer:", 300, 140);

    doc.setFontSize(12);
    doc.setTextColor("#000");
    doc.text("Procurement Department", 300, 160);
    doc.text("ADRA Kenya", 300, 180);

    // ---------------------------
    // TABLE
    // ---------------------------
    if (po.Lines && po.Lines.length > 0) {
      const tableData = po.Lines.map((line) => [
        line.ItemDescription,
        line.QuantityOrdered,
        line.Unit,
        `${po.Currency} ${line.UnitPrice.toLocaleString()}`,
        `${po.Currency} ${(line.QuantityOrdered * line.UnitPrice).toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: 280,
        headStyles: {
          fillColor: green,
          textColor: "#fff",
          halign: "center",
        },
        head: [["Description", "Qty", "Unit", "Unit Price", "Total"]],
        body: tableData,
        styles: { fontSize: 11 },
        columnStyles: {
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });
    }

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

    doc.save(`PartiallyReceived_${po.PONumber}.pdf`);
  };


  return (
    <div className="bg-white py-8 rounded-lg">
      <div className="bg-gray-200 p-4 rounded-sm">
        {/* Table Headers */}
        <div className="grid grid-cols-6 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-1">PO Number</span>
          <span className="col-span-1">Supplier</span>
          <span className="col-span-1">Order Date</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1">Total</span>
          <span className="text-right col-span-1 mr-4">Actions</span>
        </div>

        {loading ? (
          // Skeleton Loader
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
        ) : purchaseOrders.length > 0 ? (
          // Data Rows
          <div className="space-y-2">
            {purchaseOrders.map((po) => (
              <div
                key={po.PurchaseOrderId}
                className="bg-white rounded-lg shadow-lg border"
              >
                {/* Row */}
                <div className="grid grid-cols-7 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="font-medium text-indigo-700 col-span-1 truncate">
                    {po.PONumber}
                  </span>
                  <span className="flex items-center gap-2 col-span-1">
                    <FaBuilding className="text-gray-500" /> {po.SupplierName}
                  </span>
                  <span className="col-span-1">
                    {new Date(po.OrderDate).toLocaleDateString()}
                  </span>
                  <span className="text-sm w-32 rounded-2xl col-span-1 text-center flex items-center justify-center p-1 bg-yellow-600 text-white">
                    {po.Status}
                  </span>
                  <span className="font-semibold col-span-2">
                    {po.Currency} {po.TotalAmount.toLocaleString()}
                  </span>
                  <div className="flex gap-2 col-span-1 justify-end">
                    <Button
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => openModal(po)}
                    >
                      Convert to Fully Received
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-600 text-white hover:bg-green-700"
                      onClick={() => downloadPDF(po)}
                    >
                      Download PDF
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === po.PurchaseOrderId
                            ? null
                            : po.PurchaseOrderId
                        )
                      }
                    >
                      {expandedRow === po.PurchaseOrderId ? (
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
                {expandedRow === po.PurchaseOrderId && (
                  <div className="bg-gray-100 px-6 py-4 border-t">
                    <h4 className="font-semibold mb-2">Line Items</h4>
                    <div className="bg-gray-300 p-2 rounded-lg">
                      <div className="grid grid-cols-5 gap-4 font-semibold bg-gray-700 text-white py-2 px-4 rounded">
                        <span>Line</span>
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Unit Price</span>
                        <span>Total</span>
                      </div>
                      {po.Lines.map((line, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-5 gap-4 py-2 px-4 border-b-2 border-gray-50 last:border-0"
                        >
                          <span>{line.LineNumber}</span>
                          <span>{line.ItemDescription}</span>
                          <span>{line.QuantityOrdered}</span>
                          <span>
                            {po.Currency} {line.UnitPrice}
                          </span>
                          <span className="font-medium">
                            {po.Currency}{" "}
                            {(
                              line.QuantityOrdered * line.UnitPrice
                            ).toLocaleString()}
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
          // Empty State
          <div className="text-gray-500 text-center mt-4">
            <img
              src={NotFoundImage}
              alt="Not Found"
              className="mx-auto w-42 h-auto"
            />
            <p className="font-medium text-gray-400">
              No Partially Received Purchase Orders found.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-96 z-50">
            <h3 className="text-lg font-semibold mb-4">
              Enter Quantity for Purchase Order
            </h3>
            <input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="bg-gray-300 text-black hover:bg-gray-400"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleConvertToGrn}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
