import React, { useEffect, useState } from "react";
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

export default function AddProductDrawer({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [chartofAccount, setChartofAccount] = useState([]);
    const [chartSearch, setChartSearch] = useState("");


    const [form, setForm] = useState({
        code: "",
        description: "",
        priority: 1,
        chartOfAccountId: "",

        maximumAllowedDeposit: 0,
        maximumAllowedWithdrawal: 0,
        minimumBalance: 0,
        operatingBalance: 0,

        withdrawalNoticeAmount: 0,
        withdrawalNoticePeriod: 0,
        withdrawalInterval: 0,
        annualPercentageYield: 0,

        isLocked: false,
        isDefault: false,
        isMandatory: false,
        automateLedgerFeeCalculation: false,
        throttleOverTheCounterWithdrawals: false,

        createdDate: new Date().toISOString(),
        chargeBenefactor: 1,
        chargeType: 1,
    });

    const update = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    /* FETCH CHART OF ACCOUNTS */
    useEffect(() => {
        if (!open) return;

        const fetchChartOfAccounts = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/accounts/chartofaccounts`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );
                const json = await res.json();
                if (json.success) setChartofAccount(json.data);
            } catch (err) {
                console.error("Failed to fetch chart of accounts", err);
            }
        };

        fetchChartOfAccounts();
    }, [open]);

    /* SUBMIT */
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/accounts/savings-products`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(form),
                }
            );


            const data = await res.json();
            console.log(data);
            if (!res.ok) throw new Error("Failed to add product");

            Swal.fire("Success", "Savings product added successfully", "success");
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
                    {/* BACKDROP */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* DRAWER */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[500px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">
                                Add Savings Product
                            </h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* CONTENT */}
                        <div className="h-[70vh] overflow-y-auto p-3 bg-gray-50 rounded-2xl m-2">

                            {/* BASIC INFORMATION */}
                            <section className="mb-10">

                                <div className="grid grid-cols-1 gap-4 bg-gray-200 p-4 rounded-md">
                                    <div>
                                        <Label>Code</Label>
                                        <Input value={form.code} onChange={(e) => update("code", e.target.value)} className="bg-white" />
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Input value={form.description} onChange={(e) => update("description", e.target.value)} className="bg-white" />
                                    </div>


                                    <div>
                                        <Label>Chart of Account</Label>

                                        <Input
                                            list="chart-of-accounts"
                                            placeholder="Search chart of account..."
                                            className="bg-white"
                                            value={chartSearch}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setChartSearch(value);

                                                const selected = chartofAccount.find(
                                                    (acc) =>
                                                        `${acc.AccountCode} - ${acc.AccountName}` === value
                                                );

                                                if (selected) {
                                                    update("chartOfAccountId", selected.Id);
                                                }
                                            }}
                                        />

                                        <datalist id="chart-of-accounts">
                                            {chartofAccount.map((acc) => (
                                                <option
                                                    key={acc.Id}
                                                    value={`${acc.AccountCode} - ${acc.AccountName}`}
                                                />
                                            ))}
                                        </datalist>
                                    </div>


                                    <div>
                                        <Label>Annual Percentage Yield</Label>
                                        <Input type="number" value={form.annualPercentageYield} onChange={(e) => update("annualPercentageYield", Number(e.target.value))} className="bg-white" />
                                    </div>
                                </div>
                            </section>




                            {/* FLAGS */}
                            <section className="mb-10">


                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <label className="flex gap-2 items-center">
                                        <input type="checkbox" checked={form.isLocked} onChange={(e) => update("isLocked", e.target.checked)} className="bg-white" />
                                        Is Locked
                                    </label>

                                    <label className="flex gap-2 items-center">
                                        <input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} className="bg-white" />
                                        Is Default
                                    </label>

                                    <label className="flex gap-2 items-center">
                                        <input type="checkbox" checked={form.isMandatory} onChange={(e) => update("isMandatory", e.target.checked)} className="bg-white" />
                                        Is Mandatory
                                    </label>
                                </div>
                            </section>

                            {/* SUBMIT */}
                            <div className="flex justify-end">
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Save Product"}
                                </Button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
