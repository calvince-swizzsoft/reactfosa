
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { IoIosArrowDropleftCircle } from "react-icons/io";
import { FaChevronDown, FaChevronUp, FaTrashAlt } from "react-icons/fa";

export default function AddBidDrawer({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
    const [expandedVendor, setExpandedVendor] = useState(null);

    const [formData, setFormData] = useState({
        BidId: "",
        ProjectId: "",
        BidTitle: "",
        BidDate: "",
        Description: "",
        Status: "",
        CreatedBy: "",
        CreatedDate: new Date().toISOString(),
        EvaluationResult: "",
        AutoEvaluate: false,
        Vendors: [],
    });

    const handleChange = (field, value) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const handleVendorChange = (index, field, value) => {
        const updated = [...formData.Vendors];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, Vendors: updated });
    };

    const addVendor = () => {
        const newVendor = {
            VendorId: "",
            BidId: formData.BidId || 0,
            VendorName: "",
            ContactPerson: "",
            ContactEmail: "",
            ContactPhone: "",
            QuotationAmount: "",
            DeliveryPeriod: "",
            Remarks: "",
        };
        setFormData({ ...formData, Vendors: [...formData.Vendors, newVendor] });
    };

    const removeVendor = (index) => {
        const updated = formData.Vendors.filter((_, i) => i !== index);
        setFormData({ ...formData, Vendors: updated });
    };

    const toggleVendorAccordion = (index) => {
        setExpandedVendor(expandedVendor === index ? null : index);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_PRO_URL}/api/BidAnalysis/Bidings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!res.ok) throw new Error("Failed to add bid");

            Swal.fire("Success", "Bid created successfully!", "success");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to add bid.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* MAIN DRAWER — Add Bid */}
                    <motion.div
                        className="fixed top-5 right-5 w-[500px] max-h-[95vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white">Add New Bid</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        <div className="p-3 flex-1 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <Label>Project ID</Label>
                                    <Input
                                        value={formData.ProjectId}
                                        onChange={(e) => handleChange("ProjectId", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Bid Title</Label>
                                    <Input
                                        value={formData.BidTitle}
                                        onChange={(e) => handleChange("BidTitle", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Bid Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.BidDate.split("T")[0] || ""}
                                        onChange={(e) => handleChange("BidDate", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        value={formData.Description}
                                        onChange={(e) =>
                                            handleChange("Description", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Status</Label>
                                    <Input
                                        value={formData.Status}
                                        onChange={(e) => handleChange("Status", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Created By</Label>
                                    <Input
                                        value={formData.CreatedBy}
                                        onChange={(e) => handleChange("CreatedBy", e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="button"
                                    className="w-full bg-gray-700 hover:bg-gray-800 mt-3 flex justify-between"
                                    onClick={() => setVendorDrawerOpen(true)}
                                >
                                    <IoIosArrowDropleftCircle /> Add Vendors
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 mt-3"
                                >
                                    {loading ? "Submitting..." : "Create Bid"}
                                </Button>
                            </form>
                        </div>
                    </motion.div>

                    {/* SECOND DRAWER — Add Vendors */}
                    <AnimatePresence>
                        {vendorDrawerOpen && (
                            <motion.div
                                className="fixed top-5 right-[530px] w-[450px] max-h-[95vh] bg-white shadow-2xl z-45 flex flex-col rounded-2xl p-3 overflow-hidden"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                                    <h2 className="font-bold text-lg text-white">Add Vendors</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setVendorDrawerOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>

                                <div className="p-3 flex-1 overflow-y-auto">
                                    {formData.Vendors.map((vendor, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg mb-3 bg-gray-50 shadow-sm overflow-hidden"
                                        >
                                            {/* Header */}
                                            <div
                                                className="flex justify-between items-center p-3 bg-gray-200 cursor-pointer hover:bg-gray-300"
                                                onClick={() => toggleVendorAccordion(index)}
                                            >
                                                <h3 className="font-semibold text-indigo-700">
                                                    {vendor.VendorName || `Vendor ${index + 1}`}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeVendor(index);
                                                        }}
                                                    >
                                                        <FaTrashAlt className="text-red-500 hover:text-red-600" />
                                                    </button>
                                                    {expandedVendor === index ? (
                                                        <FaChevronUp className="text-gray-700" />
                                                    ) : (
                                                        <FaChevronDown className="text-gray-700" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expandable Body */}
                                            <AnimatePresence>
                                                {expandedVendor === index && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="p-3 space-y-2"
                                                    >
                                                        <Label>Vendor Name</Label>
                                                        <Input
                                                            value={vendor.VendorName}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "VendorName",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                        <Label>Contact Person</Label>
                                                        <Input
                                                            value={vendor.ContactPerson}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "ContactPerson",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                        <Label>Contact Email</Label>
                                                        <Input
                                                            type="email"
                                                            value={vendor.ContactEmail}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "ContactEmail",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                        <Label>Contact Phone</Label>
                                                        <Input
                                                            value={vendor.ContactPhone}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "ContactPhone",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                        <Label>Quotation Amount</Label>
                                                        <Input
                                                            type="number"
                                                            value={vendor.QuotationAmount}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "QuotationAmount",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                        <Label>Delivery Period</Label>
                                                        <Input
                                                            value={vendor.DeliveryPeriod}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "DeliveryPeriod",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />

                                                        <Label>Remarks</Label>
                                                        <Input
                                                            value={vendor.Remarks}
                                                            onChange={(e) =>
                                                                handleVendorChange(
                                                                    index,
                                                                    "Remarks",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700"
                                        onClick={addVendor}
                                    >
                                        Add Vendor
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
