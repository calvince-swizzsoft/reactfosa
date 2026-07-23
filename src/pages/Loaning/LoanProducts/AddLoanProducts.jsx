import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Swal from "sweetalert2";




const LEDGER_API =
    `${import.meta.env.VITE_APP_LOANING_URL}/api/values/GetGeneralLeadgersBalances`;



export default function AddLoanProducts({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [loadingLedgers, setLoadingLedgers] = useState(false);



    useEffect(() => {
        const fetchLedgers = async () => {
            try {
                setLoadingLedgers(true);
                const res = await fetch(LEDGER_API, { headers: { "ngrok-skip-browser-warning": "true" } });
                const json = await res.json();

                if (json?.Success) {
                    // OPTIONAL: only allow POSTABLE accounts
                    const postable = json.Data.filter(
                        (l) => l.CategoryDescription === "Detail Account (Postable)"
                    );

                    setLedgers(postable);
                }
            } catch (err) {
                console.error("Failed to load ledgers", err);
            } finally {
                setLoadingLedgers(false);
            }
        };

        fetchLedgers();
    }, []);


    console.log(ledgers);

    const enumBindings = {
        LoanRegistrationLoanProductSection: { 0: "FOSA", 1: "BOSA" },
        LoanRegistrationLoanProductCategory: { 0: "Short-Term", 1: "Long-Term" },
        LoanInterestChargeMode: { 300: "Upfront", 301: "Periodic" },
        LoanInterestRecoveryMode: { 400: "Upfront", 401: "Periodic" },
        LoanInterestCalculationMode: {
            200: "Reducing Balance",
            201: "Straight Line",
            202: "Amortization (Straight Line)",
            203: "Amortization (Diminishing Balance)",
            204: "Fixed Interest",
        },
        LoanRegistrationPaymentFrequencyPerYear: {
            1: "Annual",
            2: "Semi-Annual",
            3: "Tri-Annual",
            4: "Quarterly",
            6: "Bi-Monthly",
            12: "Monthly",
            24: "Semi-Monthly",
            26: "Bi-Weekly",
            52: "Weekly",
            365: "Daily",
        },
        LoanRegistrationPaymentDueDate: { 0: "End of Period", 1: "Beginning of Period" },
        LoanRegistrationStandingOrderTrigger: { 0: "Payout", 1: "Check-Off", 2: "Schedule", 3: "Sweep", 4: "Microloan" },
        LoanRegistrationGuarantorSecurityMode: { 0: "Income", 1: "Investments" },
        LoanRegistrationPayoutRecoveryMode: { 700: "Per Standing Order", 701: "Outstanding Percentage" },
        LoanRegistrationAggregateCheckOffRecoveryMode: { 0: "Outstanding Balance", 1: "Per Standing Order" },
        LoanRegistrationRoundingType: { 0: "None", 1: "Nearest", 2: "Up", 3: "Down" },
    };

    const [form, setForm] = useState({
        Code: "",
        Description: "",
        ChartOfAccountId: "",
        InterestReceivedChartOfAccountId: "",
        InterestReceivableChartOfAccountId: "",
        InterestChargedChartOfAccountId: "",
        LoanRegistrationLoanProductSection: "",
        LoanRegistrationLoanProductCategory: "",
        LoanRegistrationMicrocredit: false,
        LoanInterestAnnualPercentageRate: 0,
        LoanRegistrationMinimumInterestAmount: 0,
        LoanInterestChargeMode: "",
        LoanInterestRecoveryMode: "",
        LoanInterestCalculationMode: "",
        LoanRegistrationMinimumAmount: 0,
        LoanRegistrationMaximumAmount: 0,
        LoanRegistrationTermInMonths: 0,
        LoanRegistrationMinimumMembershipPeriod: 0,
        LoanRegistrationConsecutiveIncome: 0,
        LoanRegistrationInvestmentsMultiplier: 0,
        LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement: false,
        LoanRegistrationPaymentFrequencyPerYear: "",
        LoanRegistrationPaymentDueDate: "",
        LoanRegistrationGracePeriod: 0,
        LoanRegistrationStandingOrderTrigger: "",
        LoanRegistrationCreateStandingOrderOnLoanAudit: false,
        LoanRegistrationMinimumGuarantors: 0,
        LoanRegistrationMaximumGuarantees: 0,
        LoanRegistrationGuarantorSecurityMode: "",
        LoanRegistrationMaximumSelfGuaranteeEligiblePercentage: 0,
        LoanRegistrationAllowSelfGuarantee: false,
        LoanRegistrationSecurityRequired: false,
        LoanRegistrationPayoutRecoveryMode: "",
        LoanRegistrationPayoutRecoveryPercentage: 0,
        LoanRegistrationAggregateCheckOffRecoveryMode: "",
        LoanRegistrationTrackArrears: false,
        LoanRegistrationChargeArrearsFee: false,
        LoanRegistrationThrottleScheduledArrearsRecovery: false,
        LoanRegistrationRoundingType: "",
        Priority: 0,
        LoanRegistrationBypassAudit: false,
        LoanRegistrationEnforceSystemAppraisalRecommendation: false,
        IsLocked: false,
    });

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/AddLoanproducts`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.Success) throw new Error(data.Message);
            Swal.fire("Success", "Loan product added successfully", "success");
            refresh();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const renderSelect = (label, field, options) => (
        <div>
            <Label>{label}</Label>
            <Select value={form[field]} onValueChange={val => update(field, val)}>
                <SelectTrigger>
                    <SelectValue placeholder={`Select ${label}`} />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(options).map(([val, lbl]) => (
                        <SelectItem key={val} value={val}>{lbl}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    const renderCheckbox = (label, field) => (
        <label className="flex items-center gap-2">
            <input type="checkbox" checked={form[field]} onChange={e => update(field, e.target.checked)} />
            {label}
        </label>
    );



    const renderInput = (label, field, type = "text", step) => (
        <div>
            <Label>{label}</Label>
            <Input
                type={type}
                step={step}
                value={form[field]}
                onChange={e => update(field, type === "number" ? Number(e.target.value) : e.target.value)}
            />
        </div>
    );



    const ChartAccountSelect = ({ label, value, onChange }) => (
        <div>
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue
                        placeholder={loadingLedgers ? "Loading accounts..." : "Select account"}
                    />
                </SelectTrigger>

                <SelectContent className="max-h-[300px]">
                    {ledgers.map((acc) => (
                        <SelectItem key={acc.Id} value={acc.Id}>
                            {acc.Name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    console.log(form);

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
                        className="fixed top-3 right-3 w-[85vw] max-w-[1100px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 bg-indigo-700 text-white flex justify-between items-center rounded-2xl m-2">
                            <h2 className="text-xl font-bold">Add Loan Product</h2>
                            <Button variant="outline" className="text-gray-800" onClick={onClose}>Close</Button>
                        </div>

                        {/* CONTENT */}
                        <div className="h-[82vh] overflow-y-auto p-6 space-y-6">

                            {/* PRODUCT IDENTITY */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-4 pb-4">
                                <div>
                                    <Label>Product Code</Label>
                                    <Input
                                        type="number"
                                        value={form.Code}
                                        onChange={e => update("Code", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Product Name</Label>
                                    <Input
                                        type="text"
                                        value={form.Description}
                                        onChange={e => update("Description", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Product Section</Label>
                                    <Select
                                        value={String(form.LoanRegistrationLoanProductSection)}
                                        onValueChange={(value) =>
                                            update("LoanRegistrationLoanProductSection", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Product Section" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="0">FOSA</SelectItem>
                                            <SelectItem value="1">BOSA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Product Category</Label>
                                    <Select
                                        value={String(form.LoanRegistrationLoanProductCategory)}
                                        onValueChange={(value) =>
                                            update("LoanRegistrationLoanProductCategory", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Product Category" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="0">Short-Term</SelectItem>
                                            <SelectItem value="1">Long-Term</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                {renderCheckbox("Microcredit Product", "LoanRegistrationMicrocredit")}
                            </section>


                            {/* INTEREST & PRICING */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-4 pb-4">
                                <div>
                                    <Label>Annual Interest Rate (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.LoanInterestAnnualPercentageRate}
                                        onChange={e =>
                                            update("LoanInterestAnnualPercentageRate", Number(e.target.value))
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Minimum Interest Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.LoanRegistrationMinimumInterestAmount}
                                        onChange={e =>
                                            update("LoanRegistrationMinimumInterestAmount", Number(e.target.value))
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Interest Charge Mode</Label>
                                    <Select
                                        value={String(form.LoanInterestChargeMode)}
                                        onValueChange={(value) =>
                                            update("LoanInterestChargeMode", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Interest Charge Mode" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="300">Upfront</SelectItem>
                                            <SelectItem value="301">Periodic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <Label>Interest Recovery Mode</Label>
                                    <Select
                                        value={String(form.LoanInterestRecoveryMode)}
                                        onValueChange={(value) =>
                                            update("LoanInterestRecoveryMode", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Interest Recovery Mode" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="400">Upfront</SelectItem>
                                            <SelectItem value="401">Periodic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <Label>Interest Calculation Mode</Label>
                                    <Select
                                        value={String(form.LoanInterestCalculationMode)}
                                        onValueChange={(value) =>
                                            update("LoanInterestCalculationMode", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Interest Calculation Mode" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="200">Reducing Balance</SelectItem>
                                            <SelectItem value="201">Straight Line</SelectItem>
                                            <SelectItem value="202">Amortization (Straight Line)</SelectItem>
                                            <SelectItem value="203">Amortization (Diminishing Balance)</SelectItem>
                                            <SelectItem value="204">Fixed Interest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </section>


                            {/* LIMITS */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-4 pb-4">
                                <div>
                                    <Label>Minimum Loan Amount</Label>
                                    <Input type="number" step="0.01" value={form.LoanRegistrationMinimumAmount} onChange={e => update("LoanRegistrationMinimumAmount", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Maximum Loan Amount</Label>
                                    <Input type="number" step="0.01" value={form.LoanRegistrationMaximumAmount} onChange={e => update("LoanRegistrationMaximumAmount", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Loan Term (Months)</Label>
                                    <Input type="number" value={form.LoanRegistrationTermInMonths} onChange={e => update("LoanRegistrationTermInMonths", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Minimum Membership Period (Months)</Label>
                                    <Input type="number" value={form.LoanRegistrationMinimumMembershipPeriod} onChange={e => update("LoanRegistrationMinimumMembershipPeriod", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Consecutive Income Periods</Label>
                                    <Input type="number" value={form.LoanRegistrationConsecutiveIncome} onChange={e => update("LoanRegistrationConsecutiveIncome", Number(e.target.value))} />
                                </div>
                                <div>
                                    <Label>Investment Multiplier</Label>
                                    <Input type="number" step="0.01" value={form.LoanRegistrationInvestmentsMultiplier} onChange={e => update("LoanRegistrationInvestmentsMultiplier", Number(e.target.value))} />
                                </div>
                                {renderCheckbox("Exclude Outstanding Loans from Entitlement", "LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement")}
                            </section>

                            {/* REPAYMENT */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-4 pb-4">
                                <div>
                                    <Label>Payment Frequency</Label>
                                    <Select
                                        value={String(form.LoanRegistrationPaymentFrequencyPerYear)}
                                        onValueChange={(value) =>
                                            update("LoanRegistrationPaymentFrequencyPerYear", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Payment Frequency" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="1">Annual</SelectItem>
                                            <SelectItem value="2">Semi-Annual</SelectItem>
                                            <SelectItem value="3">Tri-Annual</SelectItem>
                                            <SelectItem value="4">Quarterly</SelectItem>
                                            <SelectItem value="6">Bi-Monthly</SelectItem>
                                            <SelectItem value="12">Monthly</SelectItem>
                                            <SelectItem value="24">Semi-Monthly</SelectItem>
                                            <SelectItem value="26">Bi-Weekly</SelectItem>
                                            <SelectItem value="52">Weekly</SelectItem>
                                            <SelectItem value="365">Daily</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <Label>Payment Due Date</Label>
                                    <Select
                                        value={String(form.LoanRegistrationPaymentDueDate)}
                                        onValueChange={(value) =>
                                            update("LoanRegistrationPaymentDueDate", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Due Date Rule" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="0">End of Period</SelectItem>
                                            <SelectItem value="1">Beginning of Period</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <Label>Grace Period (Days)</Label>
                                    <Input
                                        type="number"
                                        value={form.LoanRegistrationGracePeriod}
                                        onChange={e =>
                                            update("LoanRegistrationGracePeriod", Number(e.target.value))
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Standing Order Trigger</Label>
                                    <Select
                                        value={String(form.LoanRegistrationStandingOrderTrigger)}
                                        onValueChange={(value) =>
                                            update("LoanRegistrationStandingOrderTrigger", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Standing Order Trigger" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="0">Payout</SelectItem>
                                            <SelectItem value="1">Check-Off</SelectItem>
                                            <SelectItem value="2">Schedule</SelectItem>
                                            <SelectItem value="3">Sweep</SelectItem>
                                            <SelectItem value="4">Microloan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                {renderCheckbox(
                                    "Create Standing Order on Loan Audit",
                                    "LoanRegistrationCreateStandingOrderOnLoanAudit"
                                )}
                            </section>


                            {/* Add a new section for Chart of Accounts*/}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b pb-4">
                                <ChartAccountSelect
                                    label="Main Chart of Account"
                                    value={form.ChartOfAccountId}
                                    onChange={(val) => update("ChartOfAccountId", val)}
                                />

                                <ChartAccountSelect
                                    label="Interest Received Account"
                                    value={form.InterestReceivedChartOfAccountId}
                                    onChange={(val) => update("InterestReceivedChartOfAccountId", val)}
                                />

                                <ChartAccountSelect
                                    label="Interest Receivable Account"
                                    value={form.InterestReceivableChartOfAccountId}
                                    onChange={(val) => update("InterestReceivableChartOfAccountId", val)}
                                />

                                <ChartAccountSelect
                                    label="Interest Charged Account"
                                    value={form.InterestChargedChartOfAccountId}
                                    onChange={(val) => update("InterestChargedChartOfAccountId", val)}
                                />
                            </section>


                            {/* SECURITY */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-4 pb-4">
                                <div>
                                    <Label>Minimum Guarantors</Label>
                                    <Input
                                        type="number"
                                        value={form.LoanRegistrationMinimumGuarantors}
                                        onChange={e =>
                                            update("LoanRegistrationMinimumGuarantors", Number(e.target.value))
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Maximum Guarantees</Label>
                                    <Input
                                        type="number"
                                        value={form.LoanRegistrationMaximumGuarantees}
                                        onChange={e =>
                                            update("LoanRegistrationMaximumGuarantees", Number(e.target.value))
                                        }
                                    />
                                </div>

                                <div>
                                    <Label>Guarantor Security Mode</Label>
                                    <Select
                                        value={String(form.LoanRegistrationGuarantorSecurityMode)}
                                        onValueChange={(value) =>
                                            update("LoanRegistrationGuarantorSecurityMode", Number(value))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Guarantor Security Mode" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="0">Income</SelectItem>
                                            <SelectItem value="1">Investments</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <Label>Max Self Guarantee (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage}
                                        onChange={e =>
                                            update(
                                                "LoanRegistrationMaximumSelfGuaranteeEligiblePercentage",
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </div>

                                {renderCheckbox("Allow Self-Guarantee", "LoanRegistrationAllowSelfGuarantee")}
                                {renderCheckbox("Security Required", "LoanRegistrationSecurityRequired")}
                            </section>


                            {/* RECOVERY */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4  border-b-4 pb-4">
                                {renderSelect("Payout Recovery Mode", "LoanRegistrationPayoutRecoveryMode", enumBindings.LoanRegistrationPayoutRecoveryMode)}
                                <div>
                                    <Label>Payout Recovery Percentage</Label>
                                    <Input type="number" step="0.01" value={form.LoanRegistrationPayoutRecoveryPercentage} onChange={e => update("LoanRegistrationPayoutRecoveryPercentage", Number(e.target.value))} />
                                </div>
                                {renderSelect("Aggregate Check-Off Mode", "LoanRegistrationAggregateCheckOffRecoveryMode", enumBindings.LoanRegistrationAggregateCheckOffRecoveryMode)}
                                {renderCheckbox("Track Arrears", "LoanRegistrationTrackArrears")}
                                {renderCheckbox("Charge Arrears Fee", "LoanRegistrationChargeArrearsFee")}
                                {renderCheckbox("Throttle Arrears Recovery", "LoanRegistrationThrottleScheduledArrearsRecovery")}
                            </section>

                            {/* GOVERNANCE */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {renderSelect("Rounding Type", "LoanRegistrationRoundingType", enumBindings.LoanRegistrationRoundingType)}
                                <div>
                                    <Label>Recovery Priority</Label>
                                    <Select
                                        value={String(form.Priority)}
                                        onValueChange={(value) => update("Priority", Number(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Recovery Priority" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="0">High</SelectItem>
                                            <SelectItem value="1">Medium</SelectItem>
                                            <SelectItem value="2">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {renderCheckbox("Bypass Audit", "LoanRegistrationBypassAudit")}
                                {renderCheckbox("Enforce System Appraisal Recommendation", "LoanRegistrationEnforceSystemAppraisalRecommendation")}
                                {renderCheckbox("Lock Product", "IsLocked")}
                            </section>

                            {/* SUBMIT */}
                            <div className="flex justify-end">
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Save Loan Product"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}


