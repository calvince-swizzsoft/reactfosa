
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    FaChevronDown,
    FaChevronUp,
    FaLayerGroup,
    FaEllipsisV,
} from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import AddCreditBatchDrawer from "./AddCreditBatchDrawer";
import CreditBatchEntriesDrawer from "./CreditBatchEntriesDrawer";


export default function Creditbatches() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [addDrawerOpen, setAddDrawerOpen] = useState(false);
    const [fileModalOpen, setFileModalOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState(null);


    const [entriesDrawerOpen, setEntriesDrawerOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);




    const updateBatchStatus = (batchId, newStatus, newStatusDescription) => {
        setBatches((prev) =>
            prev.map((b) =>
                b.Id === batchId
                    ? { ...b, Status: newStatus, StatusDescription: newStatusDescription }
                    : b
            )
        );
    };

    const fetchCreditBatches = () => {
        fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatches`,
            // {
            //     headers: { "ngrok-skip-browser-warning": "true" },
            // }
        )
            .then((res) => res.json())
            .then((data) => {
                setBatches(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchCreditBatches();
    }, []);


    const handleChooseFile = async (batchId, file) => {
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("file", file); // key must match backend expectation

            const res = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatch/${batchId}/import`,
                {
                    method: "POST",
                    // headers: {
                    //     "ngrok-skip-browser-warning": "true",
                    // },
                    body: formData,
                }
            );


            const data = await res.json().catch(() => ({}));
            console.log(data);
            if (data.MismatchCount >= 1) {
                Swal.fire("Error", "found more customer account matches by personal file", "error");
            } else {
                Swal.fire(
                    "Success",
                    `File "${file.name}" uploaded successfully`,
                    "success"
                );
            }

            if (!res.ok) {
                throw new Error(data?.message || "Failed to upload file");
            }


        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };



    const handlePostBatch = async (batchId) => {
        const result = await Swal.fire({
            title: "Post Credit Batch?",
            text: "This action will post the batch and cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Post",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#4f46e5",
        });

        if (!result.isConfirmed) return;


        try {
            Swal.fire({
                title: "Posting...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatch/${batchId}/post`,
                {
                    method: "POST",
                    // headers: {
                    //     "ngrok-skip-browser-warning": "true",
                    // },
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || "Failed to post batch");
            }

            console.log(data);
            Swal.fire("Success", "Credit batch posted successfully", "success");
            fetchCreditBatches(); // refresh status
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };




    console.log(batches);

    return (
        <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FaLayerGroup /> Credit Batches
                </h2>

                {/* Add drawer*/}

                <Button
                    onClick={() => setAddDrawerOpen(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2"
                >
                    + New Credit Batch
                </Button>

            </div>

            {/* Table Header */}
            <div className="bg-gray-200 p-4 rounded-sm">
                <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-2">Batch No</span>
                    <span className="col-span-2">Credit Type</span>
                    <span className="col-span-2">Posting Period</span>
                    <span className="col-span-2">Total Value</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {/* Loader */}
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded"
                            >
                                {Array.from({ length: 12 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : batches.length > 0 ? (
                    <div className="space-y-2">
                        {batches.map((batch) => (
                            <div
                                key={batch.Id}
                                className="bg-white rounded-lg shadow-lg border"
                            >
                                {/* Main Row */}
                                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="font-medium text-green-700 col-span-2">
                                        {batch.PaddedBatchNumber}
                                    </span>

                                    <span className="col-span-2">
                                        {batch.CreditTypeDescription}
                                    </span>

                                    <span className="col-span-2">
                                        {batch.PostingPeriodDescription}
                                    </span>

                                    <span className="col-span-2 text-indigo-600 font-semibold">
                                        {batch.TotalValue?.toLocaleString()}
                                    </span>

                                    <span
                                        className={`text-sm col-span-2 px-2 py-1 rounded-full text-center ${batch.Status === 1
                                            ? "bg-yellow-500 text-white"
                                            : "bg-green-600 text-white"
                                            }`}
                                    >
                                        {batch.StatusDescription}
                                    </span>

                                    {/* Expand */}
                                    <span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                            onClick={() =>
                                                setExpandedBatch(
                                                    expandedBatch === batch.Id ? null : batch.Id
                                                )
                                            }
                                        >
                                            {expandedBatch === batch.Id ? (
                                                <>
                                                    <FaChevronUp /> Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <FaChevronDown /> View Details
                                                </>
                                            )}
                                        </Button>
                                    </span>

                                    {/* Actions */}
                                    <span className="col-span-1 flex justify-end">
                                        {/* Actions */}
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-indigo-700 hover:bg-indigo-500 hover:text-white text-white w-full"
                                                        onClick={() => {
                                                            setSelectedBatchId(batch.Id);
                                                            setFileModalOpen(true);
                                                        }}
                                                    >
                                                        Upload File
                                                    </Button>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-indigo-600">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className=" text-white w-full bg-gray-700 hover:bg-gray-500 hover:text-white"
                                                        onClick={() => {
                                                            setSelectedBatchId(batch.Id);
                                                            setSelectedBatch(batch);
                                                            setEntriesDrawerOpen(true);
                                                        }}
                                                    >
                                                        View Entries
                                                    </Button>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-green-600 text-white w-full hover:bg-green-500 hover:text-white"
                                                        disabled={batch.Status !== 1} // only Pending
                                                        onClick={() => handlePostBatch(batch.Id)}
                                                    >
                                                        Post Batch
                                                    </Button>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </span>

                                </div>

                                {/* Expanded Details */}
                                {expandedBatch === batch.Id && (
                                    <div className="border-t bg-gray-50 p-4 grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <strong>Reference:</strong>
                                            <p>{batch.Reference}</p>
                                        </div>

                                        {/* <div>
                                            <strong>Value Date:</strong>
                                            <p>
                                                {new Date(batch.ValueDate).toLocaleDateString()}
                                            </p>
                                        </div> */}

                                        <div>
                                            <strong>Month:</strong>
                                            <p>{batch.MonthDescription}</p>
                                        </div>

                                        <div>
                                            <strong>Priority:</strong>
                                            <p>{batch.PriorityDescription}</p>
                                        </div>

                                        {/* <div>
                                            <strong>Created By:</strong>
                                            <p>{batch.CreatedBy}</p>
                                        </div> */}

                                        {/* <div>
                                            <strong>Created Date:</strong>
                                            <p>
                                                {new Date(batch.CreatedDate).toLocaleString()}
                                            </p>
                                        </div> */}
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
                            No Credit Batches Found.
                        </p>
                    </div>
                )}
            </div>
            <AddCreditBatchDrawer
                open={addDrawerOpen}
                onClose={() => setAddDrawerOpen(false)}
                onSuccess={fetchCreditBatches}
            />

            {fileModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 z-50">
                    <div className="bg-white rounded-2xl p-6 w-96 relative">
                        <div className="flex justify-between items-center bg-indigo-600 p-3 rounded-2xl text-white mb-3">
                            <h3 className="text-lg font-semibold">Upload File</h3>
                            <button
                                onClick={() => setFileModalOpen(false)}
                                className=" text-gray-100 hover:text-gray-200 mr-3"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 border-8 rounded-2xl flex justify-around items-center">


                            <input
                                type="file"
                                id={`fileInput-${selectedBatchId}`}
                                className="hidden"
                                onChange={(e) => {
                                    handleChooseFile(selectedBatchId, e.target.files[0]);
                                    setFileModalOpen(false); // Close modal after file selection
                                }}
                            />
                            <label
                                htmlFor={`fileInput-${selectedBatchId}`}
                                className="cursor-pointer px-4 py-2 border rounded text-sm text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white transition"
                            >
                                Choose File
                            </label>
                        </div>


                    </div>
                </div>
            )}
            <CreditBatchEntriesDrawer
                open={entriesDrawerOpen}
                creditBatchId={selectedBatchId}
                batch={selectedBatch}
                onClose={() => setEntriesDrawerOpen(false)}
                onBatchPosted={updateBatchStatus}
            />


        </div>
    );
}
