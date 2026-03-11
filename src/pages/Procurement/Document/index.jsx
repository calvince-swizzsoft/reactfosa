

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//     FaFileAlt,
//     FaPlus,
//     FaChevronDown,
//     FaChevronUp,
//     FaTrash,
//     FaEllipsisV,
//     FaUser,
//     FaCalendarAlt,
//     FaCommentDots,
//     FaEye,
// } from "react-icons/fa";
// import { MdEditDocument } from "react-icons/md";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import Swal from "sweetalert2";
// import NotFoundImage from "/assets/scopefinding.png";
// import UploadDocument from "./UploadDocument";

// export default function DocumentAttach() {
//     const [documents, setDocuments] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [expandedDoc, setExpandedDoc] = useState(null);
//     const [addDrawerOpen, setAddDrawerOpen] = useState(false);

//     const fetchDocuments = () => {
//         setLoading(true);
//         fetch("https://08e31f211374.ngrok-free.app/api/Document/GetAll", {
//             headers: { "ngrok-skip-browser-warning": "true" },
//         })
//             .then((res) => res.json())
//             .then((data) => {
//                 setDocuments(data || []);
//                 setLoading(false);
//             })
//             .catch(() => setLoading(false));
//     };

//     useEffect(() => {
//         fetchDocuments();
//     }, []);

//     const handleDelete = async (id) => {
//         Swal.fire({
//             title: "Are you sure?",
//             text: "This action will permanently delete this document.",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonColor: "#dc2626",
//             cancelButtonColor: "#6b7280",
//             confirmButtonText: "Yes, delete it!",
//         }).then(async (result) => {
//             if (result.isConfirmed) {
//                 try {
//                     // Example DELETE request if API supports it
//                     const res = await fetch(
//                         `https://08e31f211374.ngrok-free.app/api/Document/Delete/${id}`,
//                         { method: "DELETE", headers: { "ngrok-skip-browser-warning": "true" } }
//                     );
//                     if (!res.ok) throw new Error("Failed to delete document");

//                     Swal.fire("Deleted!", "Document has been deleted.", "success");
//                     fetchDocuments();
//                 } catch (err) {
//                     console.error(err);
//                     Swal.fire("Error!", "Failed to delete document.", "error");
//                 }
//             }
//         });
//     };

//     return (
//         <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
//                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                     <FaFileAlt className="text-white" /> Documents
//                 </h2>
//                 <Button
//                     className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
//                     onClick={() => setAddDrawerOpen(true)}
//                 >
//                     <FaPlus /> Upload Document
//                 </Button>
//             </div>

//             {/* Table Header */}
//             <div className="bg-gray-200 p-4 rounded-sm">
//                 <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
//                     <span className="col-span-2">File Name</span>
//                     <span className="col-span-2">File Type</span>
//                     <span className="col-span-2">Uploaded By</span>
//                     <span className="col-span-2">Status</span>
//                     <span className="col-span-2">Date</span>
//                     <span className="col-span-2 text-right">Actions</span>
//                 </div>

//                 {/* Loading Skeleton */}
//                 {loading ? (
//                     <div className="space-y-2 animate-pulse">
//                         {Array.from({ length: 3 }).map((_, i) => (
//                             <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
//                                 {Array.from({ length: 12 }).map((__, j) => (
//                                     <div key={j} className="h-4 bg-gray-200 rounded"></div>
//                                 ))}
//                             </div>
//                         ))}
//                     </div>
//                 ) : documents.length > 0 ? (
//                     <div className="space-y-2">
//                         {documents.map((doc) => (
//                             <div key={doc.DocumentID} className="bg-white rounded-lg shadow-lg border">
//                                 {/* Main Row */}
//                                 <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
//                                     <span className="font-medium text-indigo-700 col-span-2 truncate">
//                                         {doc.FileName}
//                                     </span>
//                                     <span className="col-span-2 text-gray-700">{doc.FileType}</span>
//                                     <span className="col-span-2 flex items-center gap-2 text-gray-700">
//                                         <FaUser /> {doc.Uploadedby}
//                                     </span>
//                                     <span className="col-span-2">
//                                         <span
//                                             className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.Status?.toLowerCase().includes("active")
//                                                 ? "bg-green-200 text-green-700"
//                                                 : "bg-gray-300 text-gray-700"
//                                                 }`}
//                                         >
//                                             {doc.Status}
//                                         </span>
//                                     </span>
//                                     <span className="col-span-2 flex items-center gap-2 text-gray-600">
//                                         <FaCalendarAlt />
//                                         {new Date(doc.UploadedDate).toLocaleDateString()}
//                                     </span>

//                                     <div className="flex justify-end ">
//                                         <Button
//                                             size="sm"
//                                             variant="outline"
//                                             className="bg-gray-700 text-white hover:bg-gray-600"
//                                             onClick={() =>
//                                                 setExpandedDoc(
//                                                     expandedDoc === doc.DocumentID ? null : doc.DocumentID
//                                                 )
//                                             }
//                                         >
//                                             {expandedDoc === doc.DocumentID ? (

//                                                 <div className="flex text-white">
//                                                     <FaChevronUp className="mr-2 text-indigo-100" /> Hide Details
//                                                 </div>

//                                             ) : (

//                                                 <div className="flex text-white">
//                                                     <FaChevronDown className="mr-2 text-indigo-100" /> View Details
//                                                 </div>

//                                             )}
//                                         </Button>
//                                     </div>
//                                     {/* Actions */}
//                                     <div className="col-span-1 flex justify-end">
//                                         <DropdownMenu>
//                                             <DropdownMenuTrigger asChild>
//                                                 <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
//                                                     <FaEllipsisV className="h-4 w-4 text-gray-600" />
//                                                 </Button>
//                                             </DropdownMenuTrigger>
//                                             <DropdownMenuContent align="end" className="w-36">
//                                                 <DropdownMenuItem
//                                                     className="hover:text-blue-600 text-indigo-600"
//                                                     onClick={() =>
//                                                         Swal.fire("Open Document", "Feature coming soon.", "info")
//                                                     }
//                                                 >
//                                                     <FaEye className="mr-2" /> View
//                                                 </DropdownMenuItem>

//                                                 <DropdownMenuItem
//                                                     className="hover:text-red-600 text-indigo-600"
//                                                     onClick={() => handleDelete(doc.DocumentID)}
//                                                 >
//                                                     <FaTrash className="mr-2" /> Delete
//                                                 </DropdownMenuItem>
//                                             </DropdownMenuContent>
//                                         </DropdownMenu>
//                                     </div>
//                                 </div>

//                                 {/* Expanded Details */}
//                                 {expandedDoc === doc.DocumentID && (
//                                     <div className="border-t bg-gray-50 p-4 rounded-b-lg text-sm text-gray-700">
//                                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                                             <div className="flex items-center gap-2">
//                                                 <FaUser className="text-indigo-600" />{" "}
//                                                 <span className="font-semibold">Uploaded Role:</span>{" "}
//                                                 {doc.UploadedByRole}
//                                             </div>
//                                             <div className="flex items-center gap-2">
//                                                 <FaCommentDots className="text-indigo-600" />{" "}
//                                                 <span className="font-semibold">Remarks:</span> {doc.Remarks}
//                                             </div>
//                                             <div className="flex items-center gap-2">
//                                                 <MdEditDocument className="text-indigo-600" />{" "}
//                                                 <span className="font-semibold">Visibility:</span>{" "}
//                                                 {doc.VisibilityLevel}
//                                             </div>
//                                             {/* <div className="col-span-2 text-center bg-indigo-100 p-2 rounded-lg mt-2">
//                                                 <span className="font-semibold text-indigo-800">
//                                                     Uploaded For ID:
//                                                 </span>{" "}
//                                                 {doc.UploadedForID}
//                                             </div> */}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <div className="text-gray-500 text-center mt-4">
//                         <img
//                             src={NotFoundImage}
//                             alt="Not Found"
//                             className="mx-auto w-40 h-auto opacity-70"
//                         />
//                         <p className="font-medium text-gray-400 mt-2">No Documents Found.</p>
//                     </div>
//                 )}
//             </div>
//             <UploadDocument
//                 open={addDrawerOpen}
//                 onClose={() => setAddDrawerOpen(false)}
//                 onSuccess={fetchDocuments}
//             />
//         </div>
//     );
// }








import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaFileAlt,
    FaPlus,
    FaChevronDown,
    FaChevronUp,
    FaTrash,
    FaEllipsisV,
    FaUser,
    FaCalendarAlt,
    FaCommentDots,
    FaEye,
    FaDownload,
} from "react-icons/fa";
import { MdEditDocument } from "react-icons/md";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import UploadDocument from "./UploadDocument";
import { motion, AnimatePresence, color } from "framer-motion";

export default function DocumentAttach() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDoc, setExpandedDoc] = useState(null);
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const fetchDocuments = () => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/Document/GetAll`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((res) => res.json())
            .then((data) => {
                setDocuments(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This action will permanently delete this document.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(
                        `${import.meta.env.VITE_APP_PRO_URL}/api/Document/Delete/${id}`,
                        { method: "DELETE", headers: { "ngrok-skip-browser-warning": "true" } }
                    );
                    if (!res.ok) throw new Error("Failed to delete document");

                    Swal.fire("Deleted!", "Document has been deleted.", "success");
                    fetchDocuments();
                } catch (err) {
                    console.error(err);
                    Swal.fire("Error!", "Failed to delete document.", "error");
                }
            }
        });
    };

    const handleView = (doc) => {
        setSelectedDoc(doc);
        setViewerOpen(true);
    };

    const downloadFile = (doc) => {
        const byteCharacters = atob(doc.FileBase64);
        const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);

        const mimeType =
            doc.FileType?.toLowerCase().includes("pdf")
                ? "application/pdf"
                : doc.FileType?.toLowerCase().includes("excel")
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : doc.FileType?.toLowerCase().includes("image")
                        ? "image/png"
                        : "application/octet-stream";

        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = doc.FileName;
        a.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaFileAlt className="text-white" /> Documents
                </h2>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                    onClick={() => setAddDrawerOpen(true)}
                >
                    <FaPlus /> Upload Document
                </Button>
            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">File Name</span>
                    <span className="col-span-2">File Type</span>
                    <span className="col-span-2">Uploaded By</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-2">Date</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : documents.length > 0 ? (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div key={doc.DocumentID} className="bg-white rounded-lg shadow-lg border">
                                {/* Main Row */}
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-indigo-700 col-span-2 truncate">
                                        {doc.FileName}
                                    </span>
                                    <span className="col-span-2 text-gray-700">{doc.FileType}</span>
                                    <span className="col-span-2 flex items-center gap-2 text-gray-700">
                                        <FaUser /> {doc.Uploadedby}
                                    </span>
                                    <span className="col-span-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.Status?.toLowerCase().includes("active")
                                                ? "bg-green-200 text-green-700"
                                                : "bg-gray-300 text-gray-700"
                                                }`}
                                        >
                                            {doc.Status}
                                        </span>
                                    </span>
                                    <span className="col-span-2 flex items-center gap-2 text-gray-600">
                                        <FaCalendarAlt />
                                        {new Date(doc.UploadedDate).toLocaleDateString()}
                                    </span>

                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 text-white hover:bg-gray-600"
                                            onClick={() =>
                                                setExpandedDoc(
                                                    expandedDoc === doc.DocumentID ? null : doc.DocumentID
                                                )
                                            }
                                        >
                                            {expandedDoc === doc.DocumentID ? (
                                                <div className="flex text-white">
                                                    <FaChevronUp className="mr-2 text-indigo-100" /> Hide Details
                                                </div>
                                            ) : (
                                                <div className="flex text-white">
                                                    <FaChevronDown className="mr-2 text-indigo-100" /> View Details
                                                </div>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                    <FaEllipsisV className="h-4 w-4 text-gray-600" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36">
                                                <DropdownMenuItem
                                                    className="hover:text-blue-600 text-indigo-600"
                                                    onClick={() => handleView(doc)}
                                                >
                                                    <FaEye className="mr-2" /> View
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className="hover:text-red-600 text-indigo-600"
                                                    onClick={() => handleDelete(doc.DocumentID)}
                                                >
                                                    <FaTrash className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedDoc === doc.DocumentID && (
                                    <div className="border-t bg-gray-50 p-4 rounded-b-lg text-sm text-gray-700">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-indigo-600" />{" "}
                                                <span className="font-semibold">Uploaded Role:</span>{" "}
                                                {doc.UploadedByRole}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaCommentDots className="text-indigo-600" />{" "}
                                                <span className="font-semibold">Remarks:</span> {doc.Remarks}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MdEditDocument className="text-indigo-600" />{" "}
                                                <span className="font-semibold">Visibility:</span>{" "}
                                                {doc.VisibilityLevel}
                                            </div>
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
                            className="mx-auto w-40 h-auto opacity-70"
                        />
                        <p className="font-medium text-gray-400 mt-2">No Documents Found.</p>
                    </div>
                )}
            </div>

            {/* Upload Drawer */}
            <UploadDocument
                open={addDrawerOpen}
                onClose={() => setAddDrawerOpen(false)}
                onSuccess={fetchDocuments}
            />

            {/* View Drawer */}
            <AnimatePresence>
                {viewerOpen && selectedDoc && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewerOpen(false)}
                        />
                        <motion.div
                            className="fixed top-5 right-5 w-[600px] max-h-[95vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl p-4 overflow-hidden"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <div className="flex justify-between items-center bg-indigo-700 text-white px-4 py-3 rounded-2xl mb-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FaEye /> {selectedDoc.FileName}
                                </h3>
                                <Button variant="outline" size="sm" style={{ color: "#000" }} onClick={() => setViewerOpen(false)}>
                                    Close
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-xl">
                                {selectedDoc.FileType?.toLowerCase().includes("pdf") ? (
                                    <iframe
                                        src={`data:application/pdf;base64,${selectedDoc.FileBase64}`}
                                        title="PDF Viewer"
                                        className="w-full h-[75vh] rounded-lg border"
                                    />
                                ) : selectedDoc.FileType?.toLowerCase().includes("image") ? (
                                    <img
                                        src={`data:image/png;base64,${selectedDoc.FileBase64}`}
                                        alt="Document"
                                        className="w-full rounded-lg shadow-md"
                                    />
                                ) : selectedDoc.FileType?.toLowerCase().includes("excel") ? (
                                    <div className="text-center text-gray-700 p-6">
                                        <p className="mb-3">
                                            <FaFileAlt className="inline text-4xl text-green-600" />
                                        </p>
                                        <p className="font-medium">Excel preview not supported.</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 p-6">
                                        <p>No preview available for this file type.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t mt-3 flex justify-end">
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                                    onClick={() => downloadFile(selectedDoc)}
                                >
                                    <FaDownload /> Download
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
