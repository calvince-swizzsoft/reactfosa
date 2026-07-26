import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function EditEmployer({ open, onClose, data, refresh }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        id: "",
        description: "",
        addressAddressLine1: "",
        addressAddressLine2: "",
        addressStreet: "",
        addressPostalCode: "",
        addressCity: "",
        addressEmail: "",
        addressLandLine: "",
        addressMobileLine: "",
        retirementAge: 60,
        enforceRetirementAge: true,
        isLocked: false,
    });

    // Pre-fill form when data changes
    useEffect(() => {
        if (data) {
            setForm({
                id: data.Id,
                description: data.Description || "",
                addressAddressLine1: data.AddressAddressLine1 || "",
                addressAddressLine2: data.AddressAddressLine2 || "",
                addressStreet: data.AddressStreet || "",
                addressPostalCode: data.AddressPostalCode || "",
                addressCity: data.AddressCity || "",
                addressEmail: data.AddressEmail || "",
                addressLandLine: data.AddressLandLine || "",
                addressMobileLine: data.AddressMobileLine || "",
                retirementAge: data.RetirementAge || 60,
                enforceRetirementAge: data.EnforceRetirementAge || false,
                isLocked: data.IsLocked || false,
            });
        }
    }, [data]);

    const update = (key, value) => {
        setForm({ ...form, [key]: value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/humanresource/employers/${form.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                }
            );

            if (!response.ok) throw new Error("Failed to update employer");

            Swal.fire("Success!", "Employer updated successfully", "success");
            refresh();
            onClose();
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
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed top-3 right-3 w-[80vw] max-w-[700px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">Edit Employer</h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            <div className="p-5 overflow-y-auto h-[75vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        ["description", "Description"],
                                        ["addressAddressLine1", "Address Line 1"],
                                        ["addressAddressLine2", "Address Line 2"],
                                        ["addressStreet", "Street"],
                                        ["addressPostalCode", "Postal Code"],
                                        ["addressCity", "City"],
                                        ["addressEmail", "Email"],
                                        ["addressLandLine", "Landline"],
                                        ["addressMobileLine", "Mobile Line"],
                                        ["retirementAge", "Retirement Age"],
                                    ].map(([key, label]) => (
                                        <div key={key}>
                                            <Label>{label}</Label>
                                            <Input
                                                type={key === "retirementAge" ? "number" : "text"}
                                                value={form[key]}
                                                onChange={(e) =>
                                                    update(
                                                        key,
                                                        key === "retirementAge"
                                                            ? Number(e.target.value)
                                                            : e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}

                                    <div className="flex flex-col gap-2 mt-4 col-span-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={form.enforceRetirementAge}
                                                onChange={(e) =>
                                                    update("enforceRetirementAge", e.target.checked)
                                                }
                                            />
                                            <span>Enforce Retirement Age?</span>
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={form.isLocked}
                                                onChange={(e) => update("isLocked", e.target.checked)}
                                            />
                                            <span>Is Locked?</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? "Updating..." : "Update"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
