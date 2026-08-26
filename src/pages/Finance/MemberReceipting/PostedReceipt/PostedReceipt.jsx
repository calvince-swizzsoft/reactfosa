
// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//     FaChevronDown,
//     FaChevronUp,
//     FaReceipt,
//     FaEllipsisV,
// } from "react-icons/fa";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import NotFoundImage from "/assets/scopefinding.png";
// import ViewDetailPostedReceipt from "./ViewDetailPostedReceipt";


// export default function PostedReceipt() {
//     const [receipts, setReceipts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [expandedReceipt, setExpandedReceipt] = useState(null);

//     const [openDrawer, setOpenDrawer] = useState(false);
//     const [selectedReceiptId, setSelectedReceiptId] = useState(null);



//     const fetchReceipts = async () => {
//         try {
//             const res = await fetch(
//                 `${import.meta.env.VITE_APP_FIN_URL}/api/customer-receipts`,
//                 {
//                     headers: { "ngrok-skip-browser-warning": "true" },
//                 }
//             );
//             const data = await res.json();
//             setReceipts(data.data || []);
//         } catch (err) {
//             console.error("Failed to fetch receipts", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchReceipts();
//     }, []);

//     return (
//         <div className="bg-white px-4 py-8 shadow-2xl rounded-lg">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
//                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                     <FaReceipt /> Posted Receipts
//                 </h2>
//             </div>

//             {/* Table Header */}
//             <div className="bg-gray-200 p-4 rounded-sm">
//                 <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
//                     <span className="col-span-2">Reference</span>
//                     <span className="col-span-2">Receipt Type</span>
//                     <span className="col-span-2">Branch</span>
//                     <span className="col-span-2">Value Date</span>
//                     <span className="col-span-2">Amount</span>
//                     <span className="col-span-2 text-right">Actions</span>
//                 </div>

//                 {/* Loader */}
//                 {loading ? (
//                     <div className="space-y-2 animate-pulse">
//                         {Array.from({ length: 4 }).map((_, i) => (
//                             <div
//                                 key={i}
//                                 className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
//                             >
//                                 {Array.from({ length: 12 }).map((__, j) => (
//                                     <div key={j} className="h-4 bg-gray-200 rounded" />
//                                 ))}
//                             </div>
//                         ))}
//                     </div>
//                 ) : receipts.length > 0 ? (
//                     <div className="space-y-2">
//                         {receipts.map((receipt) => (
//                             <div
//                                 key={receipt.Id}
//                                 className="bg-white rounded-lg shadow-lg border"
//                             >
//                                 {/* Main Row */}
//                                 <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
//                                     <span className="font-medium text-indigo-700 col-span-2 truncate">
//                                         {receipt.Reference}
//                                     </span>

//                                     <span className="col-span-2">
//                                         {receipt.TransactionCodeDescription}
//                                     </span>

//                                     <span className="col-span-2">
//                                         {receipt.BranchDescription}
//                                     </span>

//                                     <span className="col-span-2">
//                                         {new Date(receipt.ValueDate).toLocaleDateString()}
//                                     </span>

//                                     <span className="col-span-2 font-semibold text-green-700">
//                                         KES {receipt.TotalValue.toLocaleString()}
//                                     </span>

//                                     {/* Expand */}
//                                     <span className="col-span-1">
//                                         <Button
//                                             size="sm"
//                                             variant="outline"
//                                             className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
//                                             onClick={() => {
//                                                 setSelectedReceiptId(receipt.Id);
//                                                 setOpenDrawer(true);
//                                             }}
//                                         >
//                                             View Receipt
//                                         </Button>
//                                     </span>

//                                     {/* Actions */}
//                                     <span className="col-span-1 flex justify-end">


//                                         <DropdownMenu>

//                                             <DropdownMenuTrigger asChild>
//                                                 <Button
//                                                     variant="ghost"
//                                                     size="icon"
//                                                     className="h-8 w-8 p-0"
//                                                 >
//                                                     <FaEllipsisV className="h-4 w-4 text-gray-600" />
//                                                 </Button>
//                                             </DropdownMenuTrigger>
//                                             <DropdownMenuContent align="end" className="w-40">
//                                                 <DropdownMenuItem className="text-indigo-600">
//                                                     View Receipt
//                                                 </DropdownMenuItem>

//                                             </DropdownMenuContent>
//                                         </DropdownMenu>
//                                     </span>
//                                 </div>
//                                 {/* Expanded Details */}
//                                 {expandedReceipt === receipt.Id && (
//                                     <div className="border-t bg-gray-50 p-4">
//                                         <ViewDetailPostedReceipt receiptId={receipt.Id} />
//                                     </div>
//                                 )}

//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="text-gray-500 text-center mt-6">
//                         <img
//                             src={NotFoundImage}
//                             alt="Not Found"
//                             className="mx-auto w-40 h-auto"
//                         />
//                         <p className="font-medium text-gray-400">
//                             No Posted Receipts Found.
//                         </p>
//                     </div>
//                 )}
//             </div>
//             <ViewDetailPostedReceipt
//                 open={openDrawer}
//                 onClose={setOpenDrawer}
//                 receiptId={selectedReceiptId}
//             />

//         </div>
//     );
// }









import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaChevronDown,
    FaChevronUp,
    FaReceipt,
    FaEllipsisV,
} from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotFoundImage from "/assets/scopefinding.png";
import ViewDetailPostedReceipt from "./ViewDetailPostedReceipt";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";

export default function PostedReceipt() {
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedReceipt, setExpandedReceipt] = useState(null);

    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedReceiptId, setSelectedReceiptId] = useState(null);

    // New: Search state
    const [searchTerm, setSearchTerm] = useState("");

    const fetchReceipts = async () => {
        try {
            const data = await apiJson(
                `${import.meta.env.VITE_APP_FIN_URL}/api/customer-receipts`,
                {
                    headers: { "ngrok-skip-browser-warning": "true" },
                }
            );
            setReceipts(data.data || []);
        } catch (err) {
            setReceipts([]);
            Swal.fire("Error", apiErrorMessage(err, "Unable to load posted receipts."), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    // Filtered receipts based on search
    const filteredReceipts = receipts.filter((r) =>
        r.Reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.TransactionCodeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.BranchDescription.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white px-4 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaReceipt /> Posted Receipts
                </h2>
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by reference, type, or branch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                />
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Reference</span>
                    <span className="col-span-2">Receipt Type</span>
                    <span className="col-span-2">Branch</span>
                    <span className="col-span-2">Value Date</span>
                    <span className="col-span-2">Amount</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loader */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
                            >
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : filteredReceipts.length > 0 ? (
                    <div className="space-y-2">
                        {filteredReceipts.map((receipt) => (
                            <div
                                key={receipt.Id}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                {/* Main Row */}
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-2 truncate">
                                        {receipt.Reference}
                                    </span>

                                    <span className="col-span-2">
                                        {receipt.TransactionCodeDescription}
                                    </span>

                                    <span className="col-span-2">
                                        {receipt.BranchDescription}
                                    </span>

                                    <span className="col-span-2">
                                        {new Date(receipt.ValueDate).toLocaleDateString()}
                                    </span>

                                    <span className="col-span-2 font-semibold text-green-700">
                                        KES {receipt.TotalValue.toLocaleString()}
                                    </span>

                                    {/* Expand */}
                                    <span className="col-span-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 hover:text-white text-white"
                                            onClick={() => {
                                                setSelectedReceiptId(receipt.Id);
                                                setOpenDrawer(true);
                                            }}
                                        >
                                            View Receipt
                                        </Button>
                                    </span>

                                    {/* Actions */}
                                    <span className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem className="text-indigo-600">
                                                    View Receipt
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </span>
                                </div>

                                {/* Expanded Details */}
                                {expandedReceipt === receipt.Id && (
                                    <div className="border-t bg-gray-50 p-4">
                                        <ViewDetailPostedReceipt receiptId={receipt.Id} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-6">
                        <img
                            src={NotFoundImage}
                            alt="Not Found"
                            className="mx-auto w-40 h-auto"
                        />
                        <p className="font-medium text-gray-400">
                            No Posted Receipts Found.
                        </p>
                    </div>
                )}
            </div>

            <ViewDetailPostedReceipt
                open={openDrawer}
                onClose={setOpenDrawer}
                receiptId={selectedReceiptId}
            />
        </div>
    );
}
