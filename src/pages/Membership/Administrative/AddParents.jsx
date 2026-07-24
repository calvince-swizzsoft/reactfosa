import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function AddParents({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        description: "",
        remarks: "",
        createdDate: new Date().toISOString().slice(0, 16),
    });

    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const handleSubmit = async () => {
        if (!form.description) {
            Swal.fire("Error", "Description is required", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administration/administrative-divisions`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        parentId: null,
                        description: form.description,
                        depth: 0,
                        type: 1,
                        remarks: form.remarks,
                        isLocked: false,
                        createdBy: "Admin",
                        createdDate: new Date(form.createdDate).toISOString(),
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to add parent division");

            Swal.fire("Success!", "Parent division added successfully", "success");
            refresh();
            onClose();
            setForm({ description: "", remarks: "", createdDate: new Date().toISOString().slice(0, 16) });
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-3 w-[80vw] max-w-[500px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">Add Parent Division</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* Form */}
                        <div className="p-5 overflow-y-auto h-[48vh] bg-gray-50 rounded-xl m-3">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label>Description</Label>
                                    <Input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => update("description", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Remarks</Label>
                                    <Input
                                        type="text"
                                        value={form.remarks}
                                        onChange={(e) => update("remarks", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Created Date</Label>
                                    <Input
                                        type="datetime-local"
                                        value={form.createdDate}
                                        onChange={(e) => update("createdDate", e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end mt-8">
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Submit"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
