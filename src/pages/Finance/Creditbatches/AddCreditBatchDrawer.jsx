
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";

export default function AddCreditBatchDrawer({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const [creditTypes, setCreditTypes] = useState([]);
    const [creditTypeDisplay, setCreditTypeDisplay] = useState("");
    const [creditTypesLoading, setCreditTypesLoading] = useState(false);

    const [branches, setBranches] = useState([]);
    const [branchDisplay, setBranchDisplay] = useState("");
    const [branchesLoading, setBranchesLoading] = useState(false);

    // Add these state hooks
    const [postingPeriods, setPostingPeriods] = useState([]);
    const [postingPeriodDisplay, setPostingPeriodDisplay] = useState("");
    const [postingPeriodsLoading, setPostingPeriodsLoading] = useState(false);

    const CREDIT_BATCH_TYPES = [
        { label: "Payout", value: "56026" },
        { label: "CheckOff", value: "56027" },
        { label: "Cash Pickup", value: "56028" },
        { label: "Sundry Payments", value: "56029" },
    ];

    const [formData, setFormData] = useState({
        creditTypeId: "",
        branchId: "",
        type: "56027",
        postingPeriodId: "2F1DA0E0-B1DB-F011-B575-80CE62222714",
        reference: "",
        totalValue: 0,
        month: new Date().getMonth() + 1,
        valueDate: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (!open) return;

        // Fetch Credit Types
        const fetchCreditTypes = async () => {
            try {
                setCreditTypesLoading(true);
                const data = await apiJson(
                    `${import.meta.env.VITE_APP_FIN_URL}/api/values/credittypes`
                );
                setCreditTypes(data || []);
            } catch (error) {
                setCreditTypes([]);
                Swal.fire("Error", apiErrorMessage(error, "Unable to load credit types."), "error");
            } finally {
                setCreditTypesLoading(false);
            }
        };

        // Fetch Branches
        const fetchBranches = async () => {
            try {
                setBranchesLoading(true);
                const data = await apiJson(
                    `${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`
                );
                setBranches(data.Data || []);
            } catch (error) {
                setBranches([]);
                Swal.fire("Error", apiErrorMessage(error, "Unable to load branches."), "error");
            } finally {
                setBranchesLoading(false);
            }
        };


        const fetchPostingPeriods = async () => {
            try {
                setPostingPeriodsLoading(true);
                const data = await apiJson(
                    `${import.meta.env.VITE_APP_FIN_URL}/api/loaning/GetPostingPeriods`
                );
                setPostingPeriods(data || []);
            } catch (error) {
                setPostingPeriods([]);
                Swal.fire("Error", apiErrorMessage(error, "Unable to load posting periods."), "error");
            } finally {
                setPostingPeriodsLoading(false);
            }
        };

        fetchCreditTypes();
        fetchBranches();
        fetchPostingPeriods();
    }, [open]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await apiJson(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/creditbatch/add`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ...formData,
                        totalValue: Number(formData.totalValue),
                        month: Number(formData.month),
                    }),
                }
            );
            Swal.fire("Success", "Credit Batch created successfully", "success");
            onSuccess?.();
            onClose();
        } catch (err) {
            Swal.fire("Error", apiErrorMessage(err, "Unable to create the credit batch."), "error");
        } finally {
            setLoading(false);
        }
    };


    console.log(formData);

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
                        className="fixed top-5 right-3 w-[700px] bg-white shadow-xl z-50 rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                    >
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl mb-4">
                            <h2 className="font-bold text-lg text-white">Add Credit Batch</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-4 grid grid-cols-2 gap-5">

                            {/* Credit Type */}
                            <div className="relative">
                                <Label>Credit Type</Label>
                                <Input
                                    list="credit-types"
                                    placeholder={creditTypesLoading ? "Loading..." : "Select or search credit type"}
                                    value={creditTypeDisplay}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setCreditTypeDisplay(value);
                                        const match = creditTypes.find(
                                            (ct) => ct.Description.toLowerCase() === value.toLowerCase()
                                        );
                                        if (match) handleChange("creditTypeId", match.Id);
                                    }}
                                    required
                                />
                                <datalist id="credit-types">
                                    {creditTypes.map((ct) => (
                                        <option key={ct.Id} value={ct.Description} />
                                    ))}
                                </datalist>
                            </div>

                            {/* Branch */}
                            <div className="relative">
                                <Label>Branch</Label>
                                <Input
                                    list="branches"
                                    placeholder={branchesLoading ? "Loading..." : "Select or search branch"}
                                    value={branchDisplay}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setBranchDisplay(value);
                                        const match = branches.find(
                                            (b) => b.Description.toLowerCase() === value.toLowerCase()
                                        );
                                        if (match) handleChange("branchId", match.Id);
                                    }}
                                    required
                                />
                                <datalist id="branches">
                                    {branches.map((b) => (
                                        <option key={b.Id} value={b.Description} />
                                    ))}
                                </datalist>
                            </div>

                            {/* Type */}
                            <div>
                                <Label>Type</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                    value={formData.type}
                                    onChange={(e) => handleChange("type", e.target.value)}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {CREDIT_BATCH_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Posting Period */}
                            <div className="relative">
                                <Label>Posting Period</Label>
                                <Input
                                    list="posting-periods"
                                    placeholder={postingPeriodsLoading ? "Loading..." : "Select or search posting period"}
                                    value={postingPeriodDisplay}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPostingPeriodDisplay(value);
                                        const match = postingPeriods.find(
                                            (pp) => pp.Description.toLowerCase() === value.toLowerCase()
                                        );
                                        if (match) handleChange("postingPeriodId", match.Id);
                                    }}
                                    required
                                />
                                <datalist id="posting-periods">
                                    {postingPeriods.map((pp) => (
                                        <option key={pp.Id} value={pp.Description} />
                                    ))}
                                </datalist>
                            </div>


                            {/* Reference */}
                            <div>
                                <Label>Reference</Label>
                                <Input
                                    value={formData.reference}
                                    onChange={(e) => handleChange("reference", e.target.value)}
                                    required
                                />
                            </div>

                            {/* Total Value */}
                            {/* <div>
                                <Label>Total Value</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.totalValue}
                                    onChange={(e) => handleChange("totalValue", e.target.value)}
                                    required
                                />
                            </div> */}

                            {/* Month */}
                            <div>
                                <Label>Month</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formData.month}
                                    onChange={(e) => handleChange("month", e.target.value)}
                                    required
                                />
                            </div>

                            {/* Value Date */}
                            <div>
                                <Label>Value Date</Label>
                                <Input
                                    type="date"
                                    value={formData.valueDate}
                                    onChange={(e) => handleChange("valueDate", e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 col-span-2"
                            >
                                {loading ? "Saving..." : "Save Credit Batch"}
                            </Button>

                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
