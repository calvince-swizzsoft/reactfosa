import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function LinkProductDrawer({ open, onClose, product }) {
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState("");
    const [productType, setProductType] = useState("1"); // 1 = Savings

    const [companies, setCompanies] = useState([]);


    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administration/companies`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );
                const data = await res.json();
                if (data.success) {
                    setCompanies(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch companies", err);
            }
        };
        fetchCompanies();
    }, []);




    if (!open || !product) return null;

    const handleSubmit = async () => {
        if (!companyId) {
            Swal.fire("Missing Field", "Please enter Company ID", "warning");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                companyId,
                productCode: Number(productType),
                targetProductId: product.Id,
                createdDate: new Date().toISOString(),
            };

            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administration/company-attached-products`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error("Failed to link product");

            Swal.fire("Success!", "Product linked to company", "success");
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
                        <div className="bg-gray-200 m-2 rounded-xl">
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">
                                    Link Product to Company
                                </h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="p-5 overflow-y-auto h-[36vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Company ID */}


                                    <div>
                                        <Label>Select Company</Label>
                                        <Select
                                            onValueChange={(value) => setCompanyId(value)}
                                            value={companyId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select company" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {companies.map((c) => (
                                                    <SelectItem key={c.Id} value={c.Id}>
                                                        {c.Description}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Product Type */}
                                    <div>
                                        <Label>Product Type</Label>
                                        <Select
                                            value={productType}
                                            onValueChange={(val) => setProductType(val)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select Product Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Savings</SelectItem>
                                                <SelectItem value="2">Loan</SelectItem>
                                                <SelectItem value="3">Investment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Target Product */}
                                    <div style={{ display: "none" }}>
                                        <Label>Target Product ID</Label>
                                        <Input value={product.Id} disabled className="bg-gray-200" />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end mt-8 space-x-2">
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? "Linking..." : "Submit"}
                                    </Button>
                                    <Button variant="outline" onClick={onClose}>
                                        Close
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
