// import React, { useState } from "react";
// import axios from "axios";
// import { FaCheckCircle } from "react-icons/fa";

// export default function QuotationSubmission() {
//     const [step, setStep] = useState(1);
//     const [formData, setFormData] = useState({
//         Id: "",
//         RFQId: "",
//         VendorId: "",
//         VendorName: "",
//         QuotedPrice: "",
//         Currency: "",
//         DeliveryDate: "",
//         Notes: "",
//         CreatedDate: new Date().toISOString(),
//         QuotationNumber: "",
//         Discount: "",
//         TaxAmount: "",
//         ShippingCost: "",
//         PaymentTerms: "",
//         WarrantyInfo: "",
//         ContactPerson: "",
//     });

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleNext = () => setStep((prev) => prev + 1);
//     const handleBack = () => setStep((prev) => prev - 1);

//     const handleSubmit = async () => {
//         try {
//             const response = await axios.post(
//                 `${import.meta.env.VITE_APP_PRO_URL}/api/rfq/SubmitQuotation`,
//                 formData
//             );
//             alert("Quotation submitted successfully!");
//             console.log(response.data);
//         } catch (error) {
//             console.error(error);
//             alert("Failed to submit quotation");
//         }
//     };

//     const steps = [
//         "Vendor Info",
//         "Quotation Details",
//         "Additional Info",
//         "Overview",
//     ];

//     return (
//         <div className="flex justify-center m-8">
//             <div className="flex bg-white rounded-xl shadow-lg w-full overflow-hidden">
//                 {/* Sidebar Steps */}
//                 <div className="bg-indigo-800 p-8">
//                     <h2 className="text-2xl font-semibold text-gray-100 mb-8 pb-4 border-b-2">
//                         Submit Quotation
//                     </h2>
//                     <div className="space-y-8">
//                         {steps.map((label, index) => (
//                             <div key={index} className="flex items-center">
//                                 <div
//                                     className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border-2 ${step > index + 1
//                                         ? "bg-indigo-500 text-white border-indigo-500"
//                                         : step === index + 1
//                                             ? "border-gray-100 text-gray-100"
//                                             : "border-gray-100 text-gray-100"
//                                         }`}
//                                 >
//                                     {step > index + 1 ? <FaCheckCircle size={14} /> : index + 1}
//                                 </div>
//                                 <span
//                                     className={`ml-3 text-sm ${step === index + 1
//                                         ? "text-gray-100 font-medium"
//                                         : "text-gray-100"
//                                         }`}
//                                 >
//                                     {label}
//                                 </span>
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Main Form Area */}
//                 <div className="flex-1 p-10">
//                     {step === 1 && (
//                         <div>
//                             <h3 className="text-lg font-semibold mb-6 text-gray-700">
//                                 Vendor Information
//                             </h3>
//                             <div className="grid grid-cols-2 gap-6">
//                                 <input
//                                     name="VendorId"
//                                     onChange={handleChange}
//                                     placeholder="Vendor ID"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="VendorName"
//                                     onChange={handleChange}
//                                     placeholder="Vendor Name"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="ContactPerson"
//                                     onChange={handleChange}
//                                     placeholder="Contact Person"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="RFQId"
//                                     onChange={handleChange}
//                                     placeholder="RFQ ID"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     {step === 2 && (
//                         <div>
//                             <h3 className="text-lg font-semibold mb-6 text-gray-700">
//                                 Quotation Details
//                             </h3>
//                             <div className="grid grid-cols-2 gap-6">
//                                 <input
//                                     name="QuotedPrice"
//                                     type="number"
//                                     onChange={handleChange}
//                                     placeholder="Quoted Price"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="Currency"
//                                     onChange={handleChange}
//                                     placeholder="Currency (e.g., USD)"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="DeliveryDate"
//                                     type="date"
//                                     onChange={handleChange}
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="QuotationNumber"
//                                     onChange={handleChange}
//                                     placeholder="Quotation Number"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     {step === 3 && (
//                         <div>
//                             <h3 className="text-lg font-semibold mb-6 text-gray-700">
//                                 Additional Information
//                             </h3>
//                             <div className="grid grid-cols-2 gap-6">
//                                 <input
//                                     name="Discount"
//                                     type="number"
//                                     onChange={handleChange}
//                                     placeholder="Discount"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="TaxAmount"
//                                     type="number"
//                                     onChange={handleChange}
//                                     placeholder="Tax Amount"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="ShippingCost"
//                                     type="number"
//                                     onChange={handleChange}
//                                     placeholder="Shipping Cost"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="PaymentTerms"
//                                     onChange={handleChange}
//                                     placeholder="Payment Terms"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <input
//                                     name="WarrantyInfo"
//                                     onChange={handleChange}
//                                     placeholder="Warranty Info"
//                                     className="border rounded-lg p-3 focus:ring-2 focus:ring-teal-400"
//                                 />
//                                 <textarea
//                                     name="Notes"
//                                     onChange={handleChange}
//                                     placeholder="Additional Notes"
//                                     className="border rounded-lg p-3 col-span-2 focus:ring-2 focus:ring-teal-400"
//                                 />
//                             </div>
//                         </div>
//                     )}


//                     {step === 4 && (
//                         <div>
//                             <h3 className="text-lg font-semibold mb-6 text-gray-700">
//                                 Quotation Overview
//                             </h3>
//                             <div className="bg-gray-200 rounded-xl p-4">
//                                 <div className="bg-white border border-gray-300 shadow-sm rounded-lg p-8 max-w-3xl mx-auto">
//                                     <div className="flex justify-between mb-6">
//                                         <div>
//                                             <h2 className="text-2xl font-bold text-indigo-700 mb-1">Quotation</h2>
//                                             <p className="text-sm text-gray-500">Quotation No: {formData.QuotationNumber || "—"}</p>
//                                             <p className="text-sm text-gray-500">Date: {new Date(formData.CreatedDate).toLocaleDateString()}</p>
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="font-semibold text-gray-700">{formData.VendorName || "Vendor Name"}</p>
//                                             <p className="text-gray-500">{formData.ContactPerson || "Contact Person"}</p>
//                                             <p className="text-gray-500">Vendor ID: {formData.VendorId || "—"}</p>
//                                         </div>
//                                     </div>

//                                     <hr className="mb-6 border-gray-300" />

//                                     <div className="space-y-3 text-gray-700">
//                                         <div className="flex justify-between">
//                                             <span>RFQ ID:</span>
//                                             <span className="font-medium">{formData.RFQId || "—"}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Quoted Price:</span>
//                                             <span className="font-medium">
//                                                 {formData.Currency || "USD"} {formData.QuotedPrice || "0.00"}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Discount:</span>
//                                             <span className="font-medium">{formData.Discount || "0"}%</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Tax Amount:</span>
//                                             <span className="font-medium">
//                                                 {formData.Currency || "USD"} {formData.TaxAmount || "0.00"}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Shipping Cost:</span>
//                                             <span className="font-medium">
//                                                 {formData.Currency || "USD"} {formData.ShippingCost || "0.00"}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Total:</span>
//                                             <span className="font-bold text-green-700">
//                                                 {formData.Currency || "USD"}{" "}
//                                                 {(
//                                                     (parseFloat(formData.QuotedPrice || 0) +
//                                                         parseFloat(formData.TaxAmount || 0) +
//                                                         parseFloat(formData.ShippingCost || 0)) -
//                                                     parseFloat(formData.Discount || 0)
//                                                 ).toFixed(2)}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Delivery Date:</span>
//                                             <span className="font-medium">
//                                                 {formData.DeliveryDate
//                                                     ? new Date(formData.DeliveryDate).toLocaleDateString()
//                                                     : "—"}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Payment Terms:</span>
//                                             <span className="font-medium">{formData.PaymentTerms || "—"}</span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                             <span>Warranty Info:</span>
//                                             <span className="font-medium">{formData.WarrantyInfo || "—"}</span>
//                                         </div>
//                                     </div>

//                                     <hr className="my-6 border-gray-300" />

//                                     <div>
//                                         <p className="text-sm text-gray-600 mb-1 font-semibold">Notes:</p>
//                                         <p className="text-sm text-gray-700 italic whitespace-pre-line">
//                                             {formData.Notes || "No additional notes provided."}
//                                         </p>
//                                     </div>

//                                     <div className="text-center mt-10 text-sm text-gray-500 italic">
//                                         — End of Quotation —
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}


//                     {/* Buttons */}
//                     <div className="flex justify-between mt-10">
//                         {step > 1 ? (
//                             <button
//                                 onClick={handleBack}
//                                 className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
//                             >
//                                 Back
//                             </button>
//                         ) : (
//                             <button
//                                 disabled
//                                 className="px-5 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
//                             >
//                                 Back
//                             </button>
//                         )}

//                         {step < 4 ? (
//                             <button
//                                 onClick={handleNext}
//                                 className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
//                             >
//                                 Next
//                             </button>
//                         ) : (
//                             <button
//                                 onClick={handleSubmit}
//                                 className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
//                             >
//                                 Submit Quotation
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }



















import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheckCircle, FaTrash, FaPlus } from "react-icons/fa";

export default function QuotationSubmission() {
    const [step, setStep] = useState(1);
    const [vendors, setVendors] = useState([]);
    const [rfqs, setRfqs] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState()


    const [formData, setFormData] = useState({
        Id: "",
        RFQId: "",
        VendorId: "",
        VendorName: "",
        QuotationNumber: "",
        Currency: "",
        Discount: "",
        TaxAmount: "",
        ShippingCost: "",
        PaymentTerms: "",
        WarrantyInfo: "",
        ContactPerson: "",
        Notes: "",
        CreatedDate: new Date().toISOString(),
        Status: "Pending",
        Lines: [],
    });

    const fetchRFQs = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_PRO_URL}/api/rfq/GetRFQs`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            if (res.data.Success && res.data.Data) {
                setRfqs(res.data.Data);
            }
        } catch (err) {
            console.error("Failed to load RFQs:", err);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_PRO_URL}/api/vendors`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );
            setVendors(res.data.data || []);
        } catch (err) {
            console.error("Failed to load vendors", err);
        }
    };

    useEffect(() => {
        fetchRFQs();
        fetchVendors();
    }, []);

    console.log(vendors);

    const handleVendorSelect = (e) => {
        const selected = vendors.find(
            (v) => v.VendorId === parseInt(e.target.value)
        );
        if (selected) {
            setEmail(selected.Email)
            setFormData((prev) => ({
                ...prev,
                VendorId: selected.VendorId,
                VendorName: selected.VendorName || "",
                ContactPerson: selected.Email || "",
            }));
        }
    };



    const handleRFQSelect = (rfqId) => {
        const selectedRFQ = rfqs.find((r) => r.Id === parseInt(rfqId));
        if (selectedRFQ) {
            setFormData((prev) => ({
                ...prev,
                RFQId: selectedRFQ.Id,
                VendorId: selectedRFQ.VendorId,
                VendorName: selectedRFQ.VendorName,
                ContactPerson: email,
                Lines:
                    selectedRFQ.Lines?.map((line) => ({
                        Id: line.Id,
                        ItemCode: line.ItemCode,
                        ItemDescription: line.ItemDescription,
                        Quantity: line.Quantity,
                        UnitOfMeasure: line.UnitOfMeasure,
                        UnitPrice: line.EstimatedUnitPrice,
                        DeliveryDate: selectedRFQ.ExpectedDeliveryDate?.split("T")[0],
                        Notes: line.Notes,
                    })) || [],
            }));
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const response = await axios.post(
                `${import.meta.env.VITE_APP_PRO_URL}/api/rfq/SubmitQuotationWithLines`,
                formData
            );
            alert("Quotation submitted successfully!");
            console.log(response.data);
        } catch (error) {
            console.error(error);
            alert("Failed to submit quotation");
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        "Vendor Info",
        "Quotation Details",
        "Quotation Lines",
        "Additional Info",
        "Overview",
    ];

    console.log(rfqs);

    return (
        <div className="flex justify-center m-8">
            <div className="flex bg-white rounded-xl shadow-lg w-full overflow-hidden">
                {/* Sidebar */}
                <div className="bg-indigo-800 p-8">
                    <h2 className="text-2xl font-semibold text-gray-100 mb-8 pb-4 border-b-2">
                        Submit Quotation
                    </h2>
                    <div className="space-y-8">
                        {steps.map((label, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className={`w-6 h-6 m-2 flex items-center justify-center rounded-full text-xs font-bold border-2 ${step > index + 1
                                        ? "bg-indigo-500 text-white border-indigo-500"
                                        : step === index + 1
                                            ? "border-gray-100 text-gray-100"
                                            : "border-gray-100 text-gray-100"
                                        }`}
                                >
                                    {step > index + 1 ? (
                                        <FaCheckCircle size={14} />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span
                                    className={`ml - 3 text - sm ${step === index + 1
                                        ? "text-gray-100 font-medium"
                                        : "text-gray-100"
                                        } `}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Form */}
                <div className="flex-1 p-10">
                    {/* Step 1 — Vendor Info */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-6 text-gray-700">
                                Vendor Information
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                {/* RFQ ID */}
                                <select
                                    name="RFQId"
                                    onChange={(e) => handleRFQSelect(e.target.value)}
                                    className="border rounded-lg p-3"
                                    value={formData.RFQId || ""}
                                >
                                    <option value="">Select RFQ</option>
                                    {rfqs.map((rfq) => (
                                        <option key={rfq.Id} value={rfq.Id}>
                                            {rfq.Id} — {rfq.VendorName} — {rfq.AdditionalNotes}
                                        </option>
                                    ))}
                                </select>


                                {/* Vendor Dropdown */}
                                <select
                                    onChange={handleVendorSelect}
                                    className="border rounded-lg p-3"
                                    value={formData.VendorId || ""}
                                >
                                    <option value="">Select Vendor</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.VendorId} value={vendor.VendorId}>
                                            {vendor.VendorName}
                                        </option>
                                    ))}
                                </select>

                                {/* Vendor ID */}
                                <input

                                    name="VendorId"
                                    value={formData.VendorId || ""}
                                    onChange={handleChange}
                                    placeholder="Vendor ID"
                                    className="border rounded-lg p-3"
                                    readOnly
                                />

                                {/* Vendor Name */}
                                <input
                                    name="VendorName"
                                    value={formData.VendorName || ""}
                                    onChange={handleChange}
                                    placeholder="Vendor Name"
                                    className="border rounded-lg p-3"
                                    readOnly
                                />

                                {/* Contact Person / Phone */}
                                <input
                                    name="ContactPerson"
                                    value={formData.ContactPerson || ""}
                                    onChange={handleChange}
                                    placeholder="Contact Person / Phone"
                                    className="border rounded-lg p-3"
                                />



                            </div>
                        </div>
                    )}

                    {/* Step 2 — Quotation Details */}
                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-6 text-gray-700">
                                Quotation Details
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <input
                                    name="QuotationNumber"
                                    onChange={handleChange}
                                    placeholder="Quotation Number"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="Currency"
                                    onChange={handleChange}
                                    placeholder="Currency (e.g., USD)"
                                    className="border rounded-lg p-3"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Quotation Lines */}
                    {step === 3 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-6 text-gray-700">
                                Quotation Line Items
                            </h3>
                            <button
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        Lines: [
                                            ...prev.Lines,
                                            {
                                                Id: prev.Lines.length + 1,
                                                ItemCode: "",
                                                ItemDescription: "",
                                                Quantity: "",
                                                UnitOfMeasure: "",
                                                UnitPrice: "",
                                                DeliveryDate: "",
                                                Notes: "",
                                            },
                                        ],
                                    }))
                                }
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg mb-6 hover:bg-indigo-700"
                            >
                                <FaPlus /> Add New Line
                            </button>
                            {formData.Lines.length === 0 && (
                                <p className="text-gray-500 italic mb-4">
                                    No line items added yet. Click “Add New Line” to begin.
                                </p>
                            )}
                            <QuotationLinesAccordion
                                lines={formData.Lines}
                                setFormData={setFormData}
                            />
                        </div>
                    )}

                    {/* Step 4 — Additional Info */}
                    {step === 4 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-6 text-gray-700">
                                Additional Information
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <input
                                    name="Discount"
                                    onChange={handleChange}
                                    placeholder="Discount"
                                    type="number"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="TaxAmount"
                                    onChange={handleChange}
                                    placeholder="Tax Amount"
                                    type="number"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="ShippingCost"
                                    onChange={handleChange}
                                    placeholder="Shipping Cost"
                                    type="number"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="PaymentTerms"
                                    onChange={handleChange}
                                    placeholder="Payment Terms"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="WarrantyInfo"
                                    onChange={handleChange}
                                    placeholder="Warranty Info"
                                    className="border rounded-lg p-3"
                                />
                                <textarea
                                    name="Notes"
                                    onChange={handleChange}
                                    placeholder="Additional Notes"
                                    className="border rounded-lg p-3 col-span-2"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 5 — Overview */}
                    {step === 5 && (
                        <div className="bg-gray-200 rounded-lg p-3">
                            <div className="bg-white border  shadow p-8">
                                <div className="text-center border-b pb-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800 uppercase">Quotation Document</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Ref: RFQ #{formData.RFQId} — {formData.Currency}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                                    <div>
                                        <p><strong>Vendor Name:</strong> {formData.VendorName}</p>
                                        <p><strong>Contact:</strong> {formData.ContactPerson}</p>
                                        <p><strong>Quotation No:</strong> {formData.QuotationNumber}</p>
                                    </div>
                                    <div>
                                        <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                                        <p><strong>Status:</strong> {formData.Status}</p>
                                        <p><strong>Currency:</strong> {formData.Currency}</p>
                                    </div>
                                </div>

                                <table className="w-full text-sm border">
                                    <thead className="bg-gray-100 border-b">
                                        <tr>
                                            <th className="p-2 text-left border">#</th>
                                            <th className="p-2 text-left border">Item Code</th>
                                            <th className="p-2 text-left border">Description</th>
                                            <th className="p-2 text-center border">Qty</th>
                                            <th className="p-2 text-center border">Unit</th>
                                            <th className="p-2 text-right border">Unit Price</th>
                                            <th className="p-2 text-right border">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.Lines.map((line, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="p-2 border">{i + 1}</td>
                                                <td className="p-2 border">{line.ItemCode}</td>
                                                <td className="p-2 border">{line.ItemDescription}</td>
                                                <td className="p-2 text-center border">{line.Quantity}</td>
                                                <td className="p-2 text-center border">{line.UnitOfMeasure}</td>
                                                <td className="p-2 text-right border">
                                                    {parseFloat(line.UnitPrice || 0).toFixed(2)}
                                                </td>
                                                <td className="p-2 text-right border">
                                                    {(line.Quantity * line.UnitPrice || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Summary Section */}
                                <div className="mt-6 flex justify-end">
                                    <div className="w-1/3 text-sm">
                                        <div className="flex justify-between border-b py-1">
                                            <span>Subtotal</span>
                                            <span>
                                                {formData.Lines
                                                    .reduce((sum, l) => sum + (l.Quantity * l.UnitPrice || 0), 0)
                                                    .toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b py-1">
                                            <span>Discount</span>
                                            <span>{formData.Discount || 0}</span>
                                        </div>
                                        <div className="flex justify-between border-b py-1">
                                            <span>Tax</span>
                                            <span>{formData.TaxAmount || 0}</span>
                                        </div>
                                        <div className="flex justify-between border-b py-1">
                                            <span>Shipping</span>
                                            <span>{formData.ShippingCost || 0}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold py-2">
                                            <span>Grand Total</span>
                                            <span>
                                                {(
                                                    formData.Lines.reduce(
                                                        (sum, l) => sum + (l.Quantity * l.UnitPrice || 0),
                                                        0
                                                    ) +
                                                    (parseFloat(formData.TaxAmount || 0) || 0) +
                                                    (parseFloat(formData.ShippingCost || 0) || 0) -
                                                    (parseFloat(formData.Discount || 0) || 0)
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {formData.Notes && (
                                    <div className="mt-6 border-t pt-4 text-sm italic text-gray-600">
                                        <strong>Notes:</strong> {formData.Notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Buttons */}
                    <div className="flex justify-between mt-10">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`px-5 py-2 rounded-lg ${step === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                } `}
                        >
                            Back
                        </button>

                        {step < 5 ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 ${isSubmitting
                                    ? "bg-green-400 cursor-wait"
                                    : "bg-green-600 hover:bg-green-700"
                                    } text-white`}
                            >
                                {isSubmitting && (
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        ></path>
                                    </svg>
                                )}
                                {isSubmitting ? "Submitting..." : "Submit Quotation"}
                            </button>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- Quotation Line Accordion --- */
function QuotationLinesAccordion({ lines, setFormData }) {
    const [openIndexes, setOpenIndexes] = useState([]);

    const toggle = (i) =>
        setOpenIndexes((prev) =>
            prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
        );

    const handleLineChange = (index, e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = [...prev.Lines];
            updated[index] = { ...updated[index], [name]: value || "" };
            return { ...prev, Lines: updated };
        });
    };

    const removeLine = (index) => {
        setFormData((prev) => ({
            ...prev,
            Lines: prev.Lines.filter((_, i) => i !== index),
        }));
        setOpenIndexes((prev) => prev.filter((i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {lines.map((line, index) => {
                const isOpen = openIndexes.includes(index);
                return (
                    <div
                        key={index}
                        className="border rounded-lg overflow-hidden bg-white shadow-sm"
                    >
                        {/* Header */}
                        <div
                            className="flex justify-between items-center px-4 py-3 bg-gray-100 cursor-pointer"
                            onClick={() => toggle(index)}
                        >
                            <div>
                                <p className="font-semibold text-gray-700">
                                    Line {index + 1}: {line.ItemDescription || "New Item"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {line.ItemCode ? `Code: ${line.ItemCode} ` : "Click to expand"}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeLine(index);
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <FaTrash />
                                </button>
                                <span
                                    className={`transform transition - transform ${isOpen ? "rotate-180" : "rotate-0"
                                        } `}
                                >
                                    ▼
                                </span>
                            </div>
                        </div>

                        {/* Collapsible body */}
                        {isOpen && (
                            <div className="p-4 grid grid-cols-3 gap-4 bg-gray-50 border-t">
                                <input
                                    name="ItemCode"
                                    value={line.ItemCode || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    placeholder="Item Code"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="ItemDescription"
                                    value={line.ItemDescription || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    placeholder="Description"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="Quantity"
                                    value={line.Quantity || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    placeholder="Quantity"
                                    type="number"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="UnitOfMeasure"
                                    value={line.UnitOfMeasure || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    placeholder="Unit"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="UnitPrice"
                                    value={line.UnitPrice || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    placeholder="Unit Price"
                                    type="number"
                                    className="border rounded-lg p-3"
                                />
                                <input
                                    name="DeliveryDate"
                                    value={line.DeliveryDate || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    type="date"
                                    className="border rounded-lg p-3"
                                />
                                <textarea
                                    name="Notes"
                                    value={line.Notes || ""}
                                    onChange={(e) => handleLineChange(index, e)}
                                    placeholder="Notes"
                                    className="border rounded-lg p-3 col-span-3"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
