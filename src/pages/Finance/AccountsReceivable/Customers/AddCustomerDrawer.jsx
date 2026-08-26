import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";

export default function AddCustomerDrawer({ open, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        Name: "",
        Address: "",
        MobilePhoneNumber: "",
        Town: "",
        City: "",
        Country: "",
        ContactPersonName: "",
        ContactPersonPhoneNo: "",
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiJson(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/AddARCustomer`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(formData),
                }
            );

            Swal.fire("Success", data.message, "success");
            setFormData({
                Name: "",
                Address: "",
                MobilePhoneNumber: "",
                Town: "",
                City: "",
                Country: "",
                ContactPersonName: "",
                ContactPersonPhoneNo: "",
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            Swal.fire("Error", apiErrorMessage(err, "Unable to add the customer."), "error");
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
                        className="fixed top-5 right-3 w-[450px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white">Add Customer</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-3 space-y-4 overflow-y-auto">
                            <div>
                                <Label>Customer Name</Label>
                                <Input
                                    value={formData.Name}
                                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Address</Label>
                                <Input
                                    value={formData.Address}
                                    onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Mobile Phone</Label>
                                <Input
                                    value={formData.MobilePhoneNumber}
                                    onChange={(e) => setFormData({ ...formData, MobilePhoneNumber: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label>Town</Label>
                                    <Input
                                        value={formData.Town}
                                        onChange={(e) => setFormData({ ...formData, Town: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label>City</Label>
                                    <Input
                                        value={formData.City}
                                        onChange={(e) => setFormData({ ...formData, City: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Country</Label>
                                <Input
                                    value={formData.Country}
                                    onChange={(e) => setFormData({ ...formData, Country: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Contact Person</Label>
                                <Input
                                    value={formData.ContactPersonName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, ContactPersonName: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label>Contact Phone</Label>
                                <Input
                                    value={formData.ContactPersonPhoneNo}
                                    onChange={(e) =>
                                        setFormData({ ...formData, ContactPersonPhoneNo: e.target.value })
                                    }
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                {loading ? "Saving..." : "Save Customer"}
                            </Button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
