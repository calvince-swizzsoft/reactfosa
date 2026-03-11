

// import React, { useEffect, useState } from "react";

// export default function RfqSidebarComparison() {
//     const [rfqs, setRfqs] = useState([]);
//     const [selectedRfq, setSelectedRfq] = useState(null);
//     const [comparisonData, setComparisonData] = useState([]);
//     const [loading, setLoading] = useState(false);

//     // Fetch RFQs
//     useEffect(() => {
//         const fetchRFQs = async () => {
//             try {
//                 const res = await fetch("https://82df5e85b3db.ngrok-free.app/api/rfq/GetRFQs", {
//                     headers: { "ngrok-skip-browser-warning": "true" },
//                 });
//                 const json = await res.json();
//                 if (json.Success) setRfqs(json.Data);
//             } catch (error) {
//                 console.error("Error fetching RFQs:", error);
//             }
//         };
//         fetchRFQs();
//     }, []);

//     // Fetch related RFQ comparison by selected ID
//     const handleSelectRfq = async (rfq) => {
//         setSelectedRfq(rfq);
//         setLoading(true);
//         try {
//             const res = await fetch(
//                 `https://82df5e85b3db.ngrok-free.app/api/BidAnalysis/AnalyzeRelatedRFQs/${rfq.Id}`,
//                 {
//                     headers: { "ngrok-skip-browser-warning": "true" },
//                 }
//             );
//             const json = await res.json();
//             if (json.success && json.data) {
//                 // Extract and clean data
//                 const items = json.data.map((d, i) => ({
//                     id: i + 1,
//                     vendor: d.RelatedRFQ.VendorName,
//                     rfqNumber: d.RelatedRFQ.RFQNumber,
//                     lines: d.RelatedRFQ.Lines.map((line) => ({
//                         description: line.ItemDescription,
//                         quantity: line.Quantity,
//                         price: line.EstimatedUnitPrice,
//                         total: line.EstimatedTotal,
//                     })),
//                 }));
//                 setComparisonData(items);
//             } else {
//                 setComparisonData([]);
//             }
//         } catch (error) {
//             console.error("Error fetching related RFQs:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="flex h-screen bg-gray-100">
//             {/* Sidebar */}
//             <div className="w-72 bg-white shadow-lg border-r overflow-y-auto">
//                 <div className="p-4 border-b">
//                     <h2 className="text-lg font-bold text-gray-700">RFQs</h2>
//                 </div>
//                 {rfqs.map((rfq) => (
//                     <div
//                         key={rfq.Id}
//                         onClick={() => handleSelectRfq(rfq)}
//                         className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selectedRfq?.Id === rfq.Id ? "bg-green-100" : ""
//                             }`}
//                     >
//                         <p className="font-medium text-gray-800">{rfq.VendorName}</p>
//                         <p className="text-sm text-gray-600">RFQ: {rfq.RFQNumber}</p>
//                         <p className="text-sm text-gray-500">
//                             Budget: <span className="font-semibold">Ksh {rfq.EstimatedBudget}</span>
//                         </p>
//                     </div>
//                 ))}
//             </div>

//             {/* Comparison Section */}
//             <div className="flex-1 p-6 overflow-y-auto">
//                 {!selectedRfq ? (
//                     <div className="text-center mt-20 text-gray-500">
//                         <p>Select an RFQ to view quote comparison</p>
//                     </div>
//                 ) : loading ? (
//                     <div className="text-center mt-20 text-gray-500 animate-pulse">
//                         Loading comparison data...
//                     </div>
//                 ) : comparisonData.length > 0 ? (
//                     <div>
//                         <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
//                             Quote Comparison for <span className="text-green-600">{selectedRfq.RFQNumber}</span>
//                         </h1>

//                         <div className="overflow-x-auto">
//                             <table className="min-w-max border-collapse border border-gray-300 mx-auto">
//                                 <thead>
//                                     <tr>
//                                         <th className="border p-2 bg-gray-100">Vendor</th>
//                                         {comparisonData.map((vendor) => (
//                                             <th key={vendor.id} className="border p-2 bg-gray-100">
//                                                 {vendor.vendor}
//                                             </th>
//                                         ))}
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {/* Show each line attribute comparison */}
//                                     <tr>
//                                         <td className="border p-2 font-medium">Item Description</td>
//                                         {comparisonData.map((v) => (
//                                             <td key={v.id + "desc"} className="border p-2">
//                                                 {v.lines.map((l, i) => (
//                                                     <div key={i}>{l.description}</div>
//                                                 ))}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                     <tr>
//                                         <td className="border p-2 font-medium">Quantity</td>
//                                         {comparisonData.map((v) => (
//                                             <td key={v.id + "qty"} className="border p-2 text-center">
//                                                 {v.lines.map((l, i) => (
//                                                     <div key={i}>{l.quantity}</div>
//                                                 ))}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                     <tr>
//                                         <td className="border p-2 font-medium">Unit Price</td>
//                                         {comparisonData.map((v) => (
//                                             <td key={v.id + "price"} className="border p-2 text-center">
//                                                 {v.lines.map((l, i) => (
//                                                     <div key={i}>Ksh {l.price}</div>
//                                                 ))}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                     <tr>
//                                         <td className="border p-2 font-medium">Total</td>
//                                         {comparisonData.map((v) => (
//                                             <td key={v.id + "total"} className="border p-2 text-center">
//                                                 {v.lines.map((l, i) => (
//                                                     <div key={i}>Ksh {l.total}</div>
//                                                 ))}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="text-center mt-20 text-gray-500">
//                         No related RFQs found for this ID.
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }











import React, { useEffect, useState } from "react";
import NotFoundImage from "/assets/scopefinding.png";

export default function RfqSidebarComparison() {
    const [rfqs, setRfqs] = useState([]);
    const [selectedRfq, setSelectedRfq] = useState(null);
    const [comparisonData, setComparisonData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch RFQs
    useEffect(() => {
        const fetchRFQs = async () => {
            try {
                const res = await fetch("https://82df5e85b3db.ngrok-free.app/api/rfq/GetRFQs", {
                    headers: { "ngrok-skip-browser-warning": "true" },
                });
                const json = await res.json();
                if (json.Success) setRfqs(json.Data);
            } catch (error) {
                console.error("Error fetching RFQs:", error);
            }
        };
        fetchRFQs();
    }, []);

    // Fetch related RFQ comparison by selected ID
    const handleSelectRfq = async (rfq) => {
        setSelectedRfq(rfq);
        setLoading(true);
        try {
            const res = await fetch(
                `https://82df5e85b3db.ngrok-free.app/api/BidAnalysis/AnalyzeRelatedRFQs/${rfq.Id}`,
                {
                    headers: { "ngrok-skip-browser-warning": "true" },
                }
            );
            const json = await res.json();
            if (json.success && json.data) {
                // Extract and clean data
                const items = json.data.map((d, i) => ({
                    id: i + 1,
                    vendor: d.RelatedRFQ.VendorName,
                    rfqNumber: d.RelatedRFQ.RFQNumber,
                    lines: d.RelatedRFQ.Lines.map((line) => ({
                        description: line.ItemDescription,
                        quantity: line.Quantity,
                        price: line.EstimatedUnitPrice,
                        total: line.EstimatedTotal,
                    })),
                }));
                setComparisonData(items);
            } else {
                setComparisonData([]);
            }
        } catch (error) {
            console.error("Error fetching related RFQs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-72 bg-gray-200 shadow-lg border-r overflow-y-auto">
                <div className="p-3 border-b bg-indigo-800  m-2 rounded-lg">
                    <h2 className="text-lg font-bold text-gray-100">RFQs</h2>
                </div>
                <div className="bg-gray-200 m-2 rounded-lg">
                    {rfqs.map((rfq) => (
                        <div
                            key={rfq.Id}
                            onClick={() => handleSelectRfq(rfq)}
                            className={`p-3 border-b cursor-pointer mb-2 bg-gray-50 rounded-lg hover:bg-indigo-800 hover:text-white ${selectedRfq?.Id === rfq.Id ? "bg-indigo-800" : ""
                                }`}
                        >
                            <p className={`font-medium ${selectedRfq?.Id === rfq.Id ? "text-gray-100" : ""}`}>{rfq.VendorName}</p>
                            {/* <p className="text-sm text-gray-600">RFQ: {rfq.RFQNumber}</p> */}
                            <p className={`text-sm ${selectedRfq?.Id === rfq.Id ? "text-gray-100" : ""}`}>
                                Budget: <span className="font-semibold">Ksh {rfq.EstimatedBudget}</span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Section */}
            <div className="flex-1 p-6 overflow-y-auto">
                {!selectedRfq ? (
                    <div className="text-center mt-20 text-gray-500">
                        <p>Select an RFQ to view quote comparison</p>
                    </div>
                ) : loading ? (
                    <div className="space-y-6 mt-10 animate-pulse">
                        {/* Simulated Vendor Cards */}
                        {Array.from({ length: 1 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                            >
                                {/* Header Skeleton */}
                                <div className="flex justify-between items-center p-5 bg-gray-50 border-b">
                                    <div className="space-y-2 w-1/2">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                </div>

                                {/* Body Skeleton Lines */}
                                <div className="p-5 space-y-3">
                                    {Array.from({ length: 4 }).map((__, j) => (
                                        <div
                                            key={j}
                                            className="grid grid-cols-12 gap-2 bg-gray-50 p-4 rounded"
                                        >
                                            {Array.from({ length: 12 }).map((___, k) => (
                                                <div key={k} className="h-3 bg-gray-200 rounded"></div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comparisonData.length > 0 ? (
                    <div>
                        <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Quote Comparison for <span className="text-indigo-200">{selectedRfq.RFQNumber}</span>
                            </h2>
                        </div>


                        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-sm">
                            {/* Header */}
                            <div className="flex flex-row border-b border-gray-300 pb-2 mb-2 bg-gray-700 rounded-lg p-2">
                                <div className="w-1/4 font-semibold text-gray-100">Vendor</div>
                                {comparisonData.map((vendor) => (
                                    <div key={vendor.id} className="flex-1 text-center font-semibold text-gray-100">
                                        {vendor.vendor}
                                    </div>
                                ))}
                            </div>

                            {/* Item Description */}
                            <div className="flex flex-row border-b border-gray-200 py-2">
                                <div className="w-1/4 font-medium text-gray-700">Item Description</div>
                                {comparisonData.map((v) => (
                                    <div key={v.id + 'desc'} className="flex-1 text-center">
                                        {v.lines.map((l, i) => (
                                            <div key={i} className="text-gray-600">{l.description}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Quantity */}
                            <div className="flex flex-row border-b border-gray-200 py-2">
                                <div className="w-1/4 font-medium text-gray-700">Quantity</div>
                                {comparisonData.map((v) => (
                                    <div key={v.id + 'qty'} className="flex-1 text-center">
                                        {v.lines.map((l, i) => (
                                            <div key={i} className="text-gray-600">{l.quantity}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Unit Price */}
                            <div className="flex flex-row border-b border-gray-200 py-2">
                                <div className="w-1/4 font-medium text-gray-700">Unit Price</div>
                                {comparisonData.map((v) => (
                                    <div key={v.id + 'price'} className="flex-1 text-center">
                                        {v.lines.map((l, i) => (
                                            <div key={i} className="text-gray-600">Ksh {l.price}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="flex flex-row py-2">
                                <div className="w-1/4 font-medium text-gray-700">Total</div>
                                {comparisonData.map((v) => (
                                    <div key={v.id + 'total'} className="flex-1 text-center">
                                        {v.lines.map((l, i) => (
                                            <div key={i} className="font-semibold text-green-600">Ksh {l.total}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
                        <p className="font-medium text-gray-400">No related RFQs found for this ID.</p>
                        <p className="text-sm text-gray-400 mt-2 text-center w-100 mx-auto">
                            It seems there are no related RFQs or bid analyses for this selection.
                            Try selecting a different RFQ from the sidebar or refresh the list.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

