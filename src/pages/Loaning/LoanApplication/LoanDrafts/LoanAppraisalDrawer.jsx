import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function LoanAppraisalDrawer({
    open,
    onClose,
    loanCaseId,
    loan,
    onSuccess,
}) {

    const [loading, setLoading] = useState(false);


    const [form, setForm] = useState({
        loanAuditOption: "",

        AppraisalRemarks: "ok for appraisal",
        AppraisedAmount: 0,
        AppraisedAmountRemarks: "",
        AppraisedNetIncome: 0,
        AppraisedAbility: 0,
        AppraisedDate: new Date().toISOString().split("T")[0],

        LoanRegistrationMaximumEntitled: 0,
        LoanRegistrationNetIncome: 0,
        LoanRegistrationTotalAllowance: 0,
        LoanRegistrationTotalDeduction: 0,
        LoanRegistrationTotalIncome: 0,
        LoanRegistrationAbilityToPay: 0,
        LoanRegistrationAbilityToPayOverLoanTerm: 0,
        LoanRegistrationLoanPlusInterest: 0,

        TotalLoansBalance: 0,
        LoanProductInvestmentsBalance: 0,
        LoanProductTotalSharesInvestmentsBalance: 0,

        LoanAppraisalOptionDescription: "",
    });





    // const update = (key, value) => {
    //     setForm(prev => {
    //         const updated = { ...prev, [key]: Number(value) };

    //         // Recalculate Total Income if relevant fields change
    //         if (
    //             key === "LoanRegistrationNetIncome" ||
    //             key === "LoanRegistrationTotalAllowance" ||
    //             key === "LoanRegistrationTotalDeduction"
    //         ) {
    //             updated.LoanRegistrationTotalIncome =
    //                 (updated.LoanRegistrationNetIncome || 0) +
    //                 (updated.LoanRegistrationTotalAllowance || 0) -
    //                 (updated.LoanRegistrationTotalDeduction || 0);
    //         }

    //         return updated;
    //     });
    // };


    const update = (key, value) => {
        setForm(prev => {
            const updated = {
                ...prev,
                [key]:
                    key.startsWith("LoanRegistration") ||
                        key.startsWith("Appraised") && key !== "AppraisedDate"
                        ? Number(value)
                        : value
            };

            // Recalculate Total Income if relevant fields change
            if (
                key === "LoanRegistrationNetIncome" ||
                key === "LoanRegistrationTotalAllowance" ||
                key === "LoanRegistrationTotalDeduction"
            ) {
                updated.LoanRegistrationTotalIncome =
                    (updated.LoanRegistrationNetIncome || 0) +
                    (updated.LoanRegistrationTotalAllowance || 0) -
                    (updated.LoanRegistrationTotalDeduction || 0);

                // Sync appraisal fields
                updated.AppraisedAmount = updated.LoanRegistrationTotalIncome;
                updated.AppraisedNetIncome = updated.LoanRegistrationNetIncome;
            }

            return updated;
        });
    };







    const payload = {
        Id: loanCaseId,
        loanAuditOption: Number(form.loanAuditOption),

        AppraisalRemarks: form.AppraisalRemarks,
        AppraisedAmount: Number(form.AppraisedAmount),
        AppraisedAmountRemarks: form.AppraisedAmountRemarks || null,
        AppraisedNetIncome: Number(form.AppraisedNetIncome),
        AppraisedAbility: Number(form.AppraisedAbility),
        AppraisedDate: form.AppraisedDate ? new Date(form.AppraisedDate) : null,


        LoanRegistrationMaximumEntitled: Number(form.LoanRegistrationMaximumEntitled),
        LoanRegistrationNetIncome: Number(form.LoanRegistrationNetIncome),
        LoanRegistrationTotalAllowance: Number(form.LoanRegistrationTotalAllowance),
        LoanRegistrationTotalDeduction: Number(form.LoanRegistrationTotalDeduction),
        LoanRegistrationTotalIncome: Number(form.LoanRegistrationTotalIncome),
        LoanRegistrationAbilityToPay: Number(form.LoanRegistrationAbilityToPay),
        LoanRegistrationAbilityToPayOverLoanTerm: Number(form.LoanRegistrationAbilityToPayOverLoanTerm),
        LoanRegistrationLoanPlusInterest: Number(form.LoanRegistrationLoanPlusInterest),

        TotalLoansBalance: Number(form.TotalLoansBalance),
        LoanProductInvestmentsBalance: Number(form.LoanProductInvestmentsBalance),
        LoanProductTotalSharesInvestmentsBalance: Number(form.LoanProductTotalSharesInvestmentsBalance),

        LoanAppraisalOptionDescription: form.LoanAppraisalOptionDescription,
    };



    const isTwoThirdRuleBroken = () => {
        const basicIncome = Number(form.LoanRegistrationNetIncome || 0);
        const allowance = Number(form.LoanRegistrationTotalAllowance || 0);
        const totalDeduction = Number(form.LoanRegistrationTotalDeduction || 0);

        const grossIncome = basicIncome + allowance;
        const maxAllowedDeduction = (2 / 3) * grossIncome;

        return {
            broken: totalDeduction > maxAllowedDeduction,
            grossIncome,
            totalDeduction,
            maxAllowedDeduction,
        };
    };




    console.log(payload);
    const handleSubmit = async () => {
        if (!form.loanAuditOption) {
            Swal.fire("Validation", "Please select an appraise option", "warning");
            return;
        }


        // ===== 2/3 RULE CHECK =====
        const rule = isTwoThirdRuleBroken();

        if (rule.broken) {
            const confirm = await Swal.fire({
                title: "⚠️ 2/3 Rule Breach Detected",
                html: `
                    <p><strong>Gross Income (Basic + Allowance):</strong> 
                    KES ${rule.grossIncome.toLocaleString()}</p>

                    <p><strong>Total Deduction:</strong> 
                    KES ${rule.totalDeduction.toLocaleString()}</p>

                    <p><strong>Maximum Allowed Deduction (⅔ Rule):</strong> 
                    KES ${rule.maxAllowedDeduction.toLocaleString()}</p>

                    <hr/>
                    <p class="text-sm text-red-600">
                        Total deductions exceed 2/3 of gross income.
                        Are you sure you want to proceed?
                    </p>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Proceed Anyway",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#e11d48",
            });

            if (!confirm.isConfirmed) {
                return; // stop submission
            }
        }

        // ===== PROCEED WITH SUBMISSION =====



        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/loan/appraisal`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (data.Success) {
                Swal.fire("Success", data.Message, "success");
            } else {
                Swal.fire("Error", data.Message, "error");
            }

            console.log(data);

            if (res.ok) {
                Swal.fire("Success", "Loan sent for appraisal", "success");
                onSuccess?.();
                onClose();
            } else {
                Swal.fire("Error", "Failed to submit appraisal", "error");
            }
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };



    const handlePrintPDF = () => {
        const pdf = new jsPDF("p", "mm", "a4");

        // ===== HEADER =====
        pdf.setFontSize(16);
        pdf.text("Loan Appraisal Report", 14, 20);

        pdf.setFontSize(10);
        pdf.text(`Case Number: ${loan?.CaseNumber || loanCaseId}`, 14, 28);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28);

        // ===== LOAN DETAILS =====
        autoTable(pdf, {
            startY: 35,
            head: [["Field", "Value"]],
            body: [
                ["Customer", loan.CustomerFullName.replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, "").trim()],
                ["Loan Product", loan.LoanProductDescription],
                ["Loan Purpose", loan.LoanPurposeDescription],
                ["Amount Applied", `Ksh ${loan.AmountApplied}`],
                ["Received Date", new Date(loan.ReceivedDate).toLocaleDateString()],
                ["Status", loan.StatusDescription],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] }, // indigo
        });

        // ===== APPRAISAL DETAILS =====
        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY + 8,
            head: [["Appraisal Field", "Value"]],
            body: [
                ["Audit Option", form.loanAuditOption],
                ["Appraised Amount", `Ksh ${form.AppraisedAmount}`],
                ["Appraised Net Income", `Ksh ${form.AppraisedNetIncome}`],
                ["Appraised Ability", form.AppraisedAbility],
                ["Total Loans Balance", `Ksh ${form.TotalLoansBalance}`],
                ["Appraisal Remarks", form.AppraisalRemarks],
                ["Amount Remarks", form.AppraisedAmountRemarks || "-"],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
        });

        // ===== LOAN REGISTRATION FIGURES =====
        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY + 8,
            head: [["Loan Registration", "Value"]],
            body: [
                ["Maximum Entitled", form.LoanRegistrationMaximumEntitled],
                ["Net Income", form.LoanRegistrationNetIncome],
                ["Total Allowance", form.LoanRegistrationTotalAllowance],
                ["Total Deduction", form.LoanRegistrationTotalDeduction],
                ["Total Income", form.LoanRegistrationTotalIncome],
                ["Ability To Pay", form.LoanRegistrationAbilityToPay],
                ["Ability Over Loan Term", form.LoanRegistrationAbilityToPayOverLoanTerm],
                ["Loan + Interest", form.LoanRegistrationLoanPlusInterest],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
        });

        // ===== INVESTMENTS =====
        autoTable(pdf, {
            startY: pdf.lastAutoTable.finalY + 8,
            head: [["Investments", "Value"]],
            body: [
                ["Investments Balance", form.LoanProductInvestmentsBalance],
                ["Shares + Investments Balance", form.LoanProductTotalSharesInvestmentsBalance],
            ],
            theme: "grid",
            headStyles: { fillColor: [79, 70, 229] },
        });

        // ===== FOOTER =====
        const pageHeight = pdf.internal.pageSize.height;
        pdf.setFontSize(9);
        pdf.text(
            "Generated by Loan Management System",
            14,
            pageHeight - 10
        );

        pdf.save(`Loan_Appraisal_${loan?.CaseNumber || loanCaseId}.pdf`);
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
                        className="fixed top-3 right-3 w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">
                                Loan Appraisal
                            </h2>
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-6 overflow-y-auto h-[85vh] space-y-6">


                            {/* READ-ONLY LOAN DETAILS */}
                            {loan && (
                                <Card className="p-4 bg-gray-200 border space-y-3">
                                    <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl">
                                        Loan Details (Read Only)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                                        {/* <div>
                                            <Label>Loan Purpose</Label>
                                            <Input value={loan.LoanPurposeDescription} readOnly
                                                className="bg-gray-100 cursor-not-allowed" />
                                        </div> */}

                                        <div>
                                            <Label>Loan Product</Label>
                                            <Input value={loan.LoanProductDescription} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Customer</Label>
                                            <Input value={loan.CustomerIndividualFirstName + " " + loan.CustomerIndividualLastName} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Customer Email</Label>
                                            <Input value={loan.CustomerAddressEmail} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Phone</Label>
                                            <Input value={loan.CustomerAddressMobileLine} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Amount Applied</Label>
                                            <Input value={`Ksh ${loan.AmountApplied}`} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>

                                        <div>
                                            <Label>Received Date</Label>
                                            <Input
                                                value={new Date(loan.ReceivedDate).toLocaleDateString()}
                                                readOnly
                                                className="bg-gray-100 cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <Label>Status</Label>
                                            <Input value={loan.StatusDescription} readOnly className="bg-gray-100 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </Card>
                            )}











                            {/* LOAN REGISTRATION */}
                            <div className="bg-gray-200 rounded-md p-4">
                                <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl">Loan Registration Figures</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">

                                    <div>
                                        <Label>Basic Income</Label>
                                        <Input label="Net Income" type="number"
                                            value={form.LoanRegistrationNetIncome}
                                            onChange={e => update("LoanRegistrationNetIncome", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Total Allowance</Label>
                                        <Input label="Total Allowance" type="number"
                                            value={form.LoanRegistrationTotalAllowance}
                                            onChange={e => update("LoanRegistrationTotalAllowance", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Total Deduction</Label>
                                        <Input label="Total Deduction" type="number"
                                            value={form.LoanRegistrationTotalDeduction}
                                            onChange={e => update("LoanRegistrationTotalDeduction", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Total Income</Label>
                                        <Input
                                            label="Total Income"
                                            type="number"
                                            value={form.LoanRegistrationTotalIncome}
                                            readOnly
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>
                                    {/* <div>
                                        <Label>Maximum Entitle</Label>
                                        <Input label="Maximum Entitled" type="number"
                                            value={form.LoanRegistrationMaximumEntitled}
                                            onChange={e => update("LoanRegistrationMaximumEntitled", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Ability To Pay</Label>
                                        <Input label="Ability To Pay" type="number"
                                            value={form.LoanRegistrationAbilityToPay}
                                            onChange={e => update("LoanRegistrationAbilityToPay", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div> */}

                                    {/* <div>
                                        <Label>Ability Over Loan Term</Label>
                                        <Input label="Ability Over Loan Term" type="number"
                                            value={form.LoanRegistrationAbilityToPayOverLoanTerm}
                                            onChange={e => update("LoanRegistrationAbilityToPayOverLoanTerm", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label>Loan + Interest</Label>
                                        <Input label="Loan + Interest" type="number"
                                            value={form.LoanRegistrationLoanPlusInterest}
                                            onChange={e => update("LoanRegistrationLoanPlusInterest", e.target.value)}
                                            className="bg-white"
                                        />
                                    </div> */}
                                </div>
                            </div>




                            <Card className="p-4 space-y-6">
                                <h3 className="font-semibold text-white bg-indigo-700 p-3 rounded-xl">Appraisal Decision</h3>

                                {/* AUDIT OPTION */}
                                <div>
                                    <Label>Appraised Option</Label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={form.loanAuditOption}
                                        onChange={e => update("loanAuditOption", e.target.value)}
                                    >
                                        <option value="">Select option</option>
                                        <option value="1">Appraise</option>
                                        <option value="2">Reject</option>
                                        <option value="4">Defer</option>
                                    </select>
                                </div>

                                {/* APPRAISAL */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Appraised Amount</Label>
                                        <Input type="number" value={form.AppraisedAmount}
                                            onChange={e => update("AppraisedAmount", e.target.value)} />
                                    </div>

                                    <div>
                                        <Label>Appraised Basic Income</Label>
                                        <Input type="number" value={form.AppraisedNetIncome}
                                            onChange={e => update("AppraisedNetIncome", e.target.value)} />
                                    </div>

                                    <div>
                                        <Label>Appraised Ability</Label>
                                        <Input type="number" value={form.AppraisedAbility}
                                            onChange={e => update("AppraisedAbility", e.target.value)} />
                                    </div>

                                    {/* <div>
                                        <Label>Total Loans Balance</Label>
                                        <Input type="number" value={form.TotalLoansBalance}
                                            onChange={e => update("TotalLoansBalance", e.target.value)} />
                                    </div> */}
                                    <div>
                                        <Label>Appraisal Remarks</Label>
                                        <Input value={form.AppraisalRemarks}
                                            onChange={e => update("AppraisalRemarks", e.target.value)} />
                                    </div>
                                    {/* <div>
                                        <Label>Appraised Amount Remarks</Label>
                                        <Input value={form.AppraisedAmountRemarks}
                                            onChange={e => update("AppraisedAmountRemarks", e.target.value)} />
                                    </div> */}


                                    <div>
                                        <Label>Appraised Date</Label>
                                        <Input
                                            value={form.AppraisedDate}
                                            onChange={e => update("AppraisedDate", e.target.value)}
                                            type="date"
                                            className="bg-white"
                                        />
                                    </div>

                                </div>







                                {/* INVESTMENTS */}
                                <h3 className="font-semibold pt-4">Investments</h3>

                                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Investments Balance</Label>
                                        <Input label="Investments Balance" type="number"
                                            value={form.LoanProductInvestmentsBalance}
                                            onChange={e => update("LoanProductInvestmentsBalance", e.target.value)} />

                                    </div>
                                    <div>
                                        <Label>Shares + Investments Balance</Label>
                                        <Input label="Shares + Investments Balance" type="number"
                                            value={form.LoanProductTotalSharesInvestmentsBalance}
                                            onChange={e => update("LoanProductTotalSharesInvestmentsBalance", e.target.value)} />
                                    </div>
                                </div> */}


                                {/* <div>
                                    <Label>Appraisal Option Description</Label>
                                    <Input value={form.LoanAppraisalOptionDescription}
                                        onChange={e => update("LoanAppraisalOptionDescription", e.target.value)} />
                                </div> */}
                            </Card>


                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handlePrintPDF}
                                >
                                    Print PDF
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? "Submitting..." : "Submit Appraisal"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}







