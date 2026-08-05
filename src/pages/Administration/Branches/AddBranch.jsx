import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;
const BRANCH_BASE = `${FIN_BASE}/api/administration/branches`;

const emptyForm = {
    companyId: "",
    description: "",
    addressAddressLine1: "",
    addressAddressLine2: "",
    addressStreet: "",
    addressPostalCode: "",
    addressCity: "",
    addressEmail: "",
    addressLandLine: "",
    addressMobileLine: "",
};

const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    return Array.isArray(payload) ? payload : [];
};

export default function AddBranch({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [form, setForm] = useState(emptyForm);

    const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

    useEffect(() => {
        if (!open) return;
        setForm(emptyForm);
        setLoadingCompanies(true);
        // /all — the unpaged, bare-array endpoint — is the right call for a
        // dropdown per company-api-spec.md §4.2; GET / (paged) returns
        // PageCollectionInfo, not an array.
        apiFetch(`${FIN_BASE}/api/administration/companies/all`)
            .then((r) => r.json())
            .then((d) => setCompanies(normalizeList(d)))
            .catch(() => setCompanies([]))
            .finally(() => setLoadingCompanies(false));
    }, [open]);

    const handleSubmit = async () => {
        if (!form.description) {
            Swal.fire("Missing Field", "Description is required.", "warning");
            return;
        }
        if (!form.companyId) {
            Swal.fire("Missing Field", "A branch with no company is meaningless — select one.", "warning");
            return;
        }
        setLoading(true);
        try {
            const response = await apiFetch(BRANCH_BASE, {
                method: "POST",
                body: JSON.stringify(form),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.success === false) throw new Error(data.message || "Failed to add branch");

            Swal.fire("Success!", data.message || "Branch added successfully", "success");
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
                        className="fixed top-3 right-3 w-[80vw] max-w-[950px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        <div className="bg-gray-200 m-2 rounded-xl">
                            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                                <h2 className="font-bold text-xl text-white">Add New Branch</h2>
                                <Button variant="outline" size="sm" onClick={onClose}>
                                    Close
                                </Button>
                            </div>

                            <div className="p-5 overflow-y-auto h-[75vh] bg-gray-50 rounded-xl m-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Company</Label>
                                        <select
                                            className="w-full border rounded p-2"
                                            value={form.companyId}
                                            onChange={(e) => update("companyId", e.target.value)}
                                            disabled={loadingCompanies}
                                        >
                                            <option value="">{loadingCompanies ? "Loading..." : "Select Company"}</option>
                                            {companies.map((c) => (
                                                <option key={c.Id} value={c.Id}>{c.Description}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Input
                                            value={form.description}
                                            onChange={(e) => update("description", e.target.value)}
                                            required
                                        />
                                    </div>

                                    {[
                                        ["addressAddressLine1", "Address Line 1"],
                                        ["addressAddressLine2", "Address Line 2"],
                                        ["addressStreet", "Street"],
                                        ["addressPostalCode", "Postal Code"],
                                        ["addressCity", "City"],
                                        ["addressEmail", "Email"],
                                        ["addressLandLine", "Landline"],
                                        ["addressMobileLine", "Mobile Line"],
                                    ].map(([key, label]) => (
                                        <div key={key}>
                                            <Label>{label}</Label>
                                            <Input
                                                value={form[key]}
                                                onChange={(e) => update(key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-gray-400 mt-4">
                                    The branch code is assigned automatically once created.
                                </p>

                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleSubmit} disabled={loading}>
                                        {loading ? "Submitting..." : "Submit"}
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
