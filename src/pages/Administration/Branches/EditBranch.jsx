import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";
import { showBranchValidationErrors, validateBranch } from "./branchFormValidation";

const FIN_BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;
const BRANCH_BASE = `${FIN_BASE}/api/administration/branches`;

const normalizeList = (d) => {
    const payload = d?.data ?? d?.Data ?? d;
    return Array.isArray(payload) ? payload : [];
};

export default function EditBranch({ open, onClose, data, refresh }) {
    const [loading, setLoading] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [form, setForm] = useState({});

    useEffect(() => {
        if (!open || !data) return;
        setForm({
            id: data.Id,
            companyId: data.CompanyId || "",
            description: data.Description || "",
            addressAddressLine1: data.AddressAddressLine1 || "",
            addressAddressLine2: data.AddressAddressLine2 || "",
            addressStreet: data.AddressStreet || "",
            addressPostalCode: data.AddressPostalCode || "",
            addressCity: data.AddressCity || "",
            addressEmail: data.AddressEmail || "",
            addressLandLine: data.AddressLandLine || "",
            addressMobileLine: data.AddressMobileLine || "",
        });

        setLoadingCompanies(true);
        // Was previously fetching the wrong path (/api/companies, a 404) —
        // fixed to the real endpoint, and to the unpaged /all variant since
        // GET / (paged) doesn't return a bare array to .map() over.
        apiJson(`${FIN_BASE}/api/administration/companies/all`, {}, { fallbackMessage: "Failed to load companies." })
            .then((d) => setCompanies(normalizeList(d)))
            .catch((error) => {
                setCompanies([]);
                Swal.fire("Error", apiErrorMessage(error, "Unable to load companies."), "error");
            })
            .finally(() => setLoadingCompanies(false));
    }, [open, data]);

    const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

    const handleUpdate = async () => {
        const validationErrors = validateBranch(form);
        if (validationErrors.length) {
            Swal.fire(showBranchValidationErrors(validationErrors));
            return;
        }

        setLoading(true);
        try {
            const respData = await apiJson(`${BRANCH_BASE}/${form.id}`, {
                method: "PUT",
                body: JSON.stringify(form),
            }, { fallbackMessage: "Failed to update branch." });

            Swal.fire("Success!", respData.message || "Branch updated successfully", "success");
            refresh();
            onClose();
        } catch (err) {
            Swal.fire("Error", apiErrorMessage(err, "Unable to update branch."), "error");
        } finally {
            setLoading(false);
        }
    };

    if (!data) return null;

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
                                <h2 className="font-bold text-xl text-white">Edit Branch</h2>
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
                                            value={form.companyId || ""}
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
                                        <Label>Code</Label>
                                        <Input value={data.PaddedCode || data.Code || ""} disabled className="bg-gray-100" />
                                    </div>

                                    <div className="col-span-2">
                                        <Label>Description</Label>
                                        <Input
                                            value={form.description || ""}
                                            onChange={(e) => update("description", e.target.value)}
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
                                                value={form[key] || ""}
                                                onChange={(e) => update(key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-gray-400 mt-4">
                                    Code is assigned by the server and read-only. To lock/unlock this branch, use the
                                    lock icon on the branch row instead — it's a separate action from saving this form.
                                </p>

                                <div className="flex justify-end mt-8">
                                    <Button onClick={handleUpdate} disabled={loading}>
                                        {loading ? "Updating..." : "Update Branch"}
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
