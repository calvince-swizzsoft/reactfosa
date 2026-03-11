import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import CustomerSelectModal from "./CustomerSelectModal";
import LoanProductSelectModal from "./LoanProductSelectModal";
import GuarantorSelectModal from "./GuarantorSelectModal";
import ParentLoanSelectModal from "./ParentLoanSelectModal";






export default function AddLoanApplicationDrawer({ open, onClose }) {
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [loanProducts, setLoanProducts] = useState([]);
    const [loanProductSearch, setLoanProductSearch] = useState("");
    const [loanSectors, setLoanSectors] = useState([]);
    const [loanSubSectors, setLoanSubSectors] = useState([]);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [boosted, setBoosted] = useState(false);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [loanProductModalOpen, setLoanProductModalOpen] = useState(false);

    const [guarantorModalIndex, setGuarantorModalIndex] = useState(null);
    const [parentLoanModalOpen, setParentLoanModalOpen] = useState(false);

    const [selectedParentLoan, setSelectedParentLoan] = useState(null);







    const [form, setForm] = useState({
        // CUSTOMER
        CustomerId: "",
        CustomerPersonalIdentificationNumber: "",
        CustomerIndividualIdentityCardNumber: "",
        CustomerIndividualPayrollNumbers: "",
        CustomerFullName: "",
        CustomerAddressMobileLine: "",
        CustomerAddressEmail: "",

        // LOAN PRODUCT (AUTO-FILLED)
        LoanProductId: "",
        LoanProductDescription: "",
        LoanRegistrationTermInMonths: 0,
        LoanInterestAnnualPercentageRate: 0,
        LoanInterestChargeModeDescription: "",
        LoanInterestCalculationModeDescription: "",
        LoanRegistrationLoanProductCategoryDescription: "",
        LoanRegistrationMaximumAmount: 0,
        LoanRegistrationMinimumInterestAmount: 0,
        LoanRegistrationInvestmentsMultiplier: 0,
        LoanRegistrationStandingOrderTriggerDescription: "",
        LoanRegistrationMinimumGuarantors: 0,
        LoanRegistrationMaximumGuarantees: 0,
        LoanRegistrationAllowSelfGuarantee: false,

        // USER INPUT
        LoanPurposeDescription: "",
        Remarks: "",
        AmountApplied: 0,
        Reference: "",
        IsBatched: false,
        receivedDate: new Date().toISOString().split("T")[0],

        // SALARY
        LoanRegistrationNetIncome: 0,
        LoanRegistrationTotalAllowance: 0,
        LoanRegistrationTotalDeduction: 0,
        LoanRegistrationTotalIncome: 0,

        //Sector
        SectorCode: "",
        SubSectorCode: "",

        parentId: "",

    });


    const [guarantors, setGuarantors] = useState([
        {
            CustomerId: "",
            AmountGuaranteed: 0,
            PersonalIdentificationNumber: "",
            IndividualIdentityCardNumber: "",
            IndividualPayrollNumbers: "",
            AddressEmail: "",
            AddressMobileLine: "",
            FullName: "",
            Remarks: "",
        },
    ]);


    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loansetups/GetLoanproducts`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then(res => res.json())
            .then(data => {
                if (data.Success) {
                    setLoanProducts(data.Data || []);
                }
            })
            .catch(() => {
                Swal.fire("Error", "Failed to load loan products", "error");
            });
    }, []);



    useEffect(() => {
        fetch("http://88.99.215.90:8600/api/Loansetups/GetAllloanSector", {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then(res => res.json())
            .then(data => setLoanSectors(data || []))
            .catch(() => {
                Swal.fire("Error", "Failed to load loan sectors", "error");
            });
    }, []);




    useEffect(() => {
        fetch("http://88.99.215.90:8600/api/Loansetups/GetAllLoanSubSector", {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then(res => res.json())
            .then(data => setLoanSubSectors(data || []))
            .catch(() => {
                Swal.fire("Error", "Failed to load loan sub sectors", "error");
            });
    }, []);






    const filteredSubSectors = loanSubSectors.filter(
        s =>
            s.IsActive &&
            form.SectorCode &&
            s.SubSectorCode.startsWith(form.SectorCode)
    );




    /* ================= FETCH CUSTOMERS ================= */

    useEffect(() => {
        fetch("http://88.99.215.90:8600/api/values/GetMembersWithDetails", {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then(res => res.json())
            .then(data => {
                if (data.Success) {
                    setCustomers(data.Data.Members || []);
                }
            })
            .catch(() => {
                Swal.fire("Error", "Failed to load members", "error");
            });
    }, []);

    const update = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };




    /* ================= CUSTOMER SELECT ================= */
    const totalAvailableBalance = selectedAccounts
        .filter(a => a.CustomerAccountTypeProductCode === 1) // Savings only
        .reduce((sum, a) => sum + (Number(a.AvailableBalance) || 0), 0);


    // // Member Deposits (Savings only)
    // const memberDeposits = selectedAccounts
    //     .filter(a => a.CustomerAccountTypeProductCode === 1) // Savings
    //     .reduce((sum, a) => sum + (Number(a.AvailableBalance) || 0), 0);

    const memberDeposits = useMemo(() => {
        return selectedAccounts
            .filter(acc =>
                acc.FullAccountNumber.slice(-3) === "001" &&
                acc.AvailableBalance > 0
            )
            .reduce((sum, acc) => sum + Number(acc.AvailableBalance || 0), 0);
    }, [selectedAccounts]);


    // Total Savings = Member Deposits * 4
    const totalSavings = memberDeposits * 4;



    const handleCustomerSelect = (value) => {
        setSearchValue(value);

        const selectedMember = customers.find(m =>
            `${m.Customer.IndividualFirstName} | ${m.Customer.IndividualIdentityCardNumber} | ${m.Customer.Reference3}` === value
        );

        if (!selectedMember) return;

        const c = selectedMember.Customer;

        setSelectedAccounts(selectedMember.Accounts || []);

        setForm({
            // CUSTOMER
            CustomerId: c.Id,
            CustomerFullName: `${c.IndividualFirstName} ${c.IndividualLastName}` || "",
            CustomerIndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
            CustomerIndividualPayrollNumbers: c.Reference3 || "",
            CustomerPersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
            CustomerAddressMobileLine: c.AddressMobileLine || "",
            CustomerAddressEmail: c.AddressEmail || "",
            Reference: "",

            // LOAN PRODUCT (AUTO-FILLED)
            LoanProductId: "",
            LoanProductDescription: "",
            LoanRegistrationTermInMonths: 0,
            LoanInterestAnnualPercentageRate: 0,
            LoanInterestChargeModeDescription: "",
            LoanInterestCalculationModeDescription: "",
            LoanRegistrationLoanProductCategoryDescription: "",
            LoanRegistrationMaximumAmount: 0,
            LoanRegistrationMinimumInterestAmount: 0,
            LoanRegistrationInvestmentsMultiplier: 0,
            LoanRegistrationStandingOrderTriggerDescription: "",
            LoanRegistrationMinimumGuarantors: 0,
            LoanRegistrationMaximumGuarantees: 0,
            LoanRegistrationAllowSelfGuarantee: false,

            // USER INPUT
            LoanPurposeDescription: "",
            Remarks: "",
            AmountApplied: 0,
            receivedDate: "",

            // SALARY
            LoanRegistrationNetIncome: 0,
            LoanRegistrationTotalAllowance: 0,
            LoanRegistrationTotalDeduction: 0,
            LoanRegistrationTotalIncome: 0,

            //SECTOR
            SectorCode: "",
            SubSectorCode: ""
        });
    };



    const handleLoanProductSelect = (value) => {
        setLoanProductSearch(value);

        const selected = loanProducts.find(p =>
            `${p.PaddedCode} | ${p.Description}` === value
        );

        if (!selected) return;

        setForm(prev => ({
            ...prev,

            LoanProductId: selected.Id,
            LoanProductDescription: selected.Description,
            LoanRegistrationTermInMonths: selected.LoanRegistrationTermInMonths,
            LoanInterestAnnualPercentageRate: selected.LoanInterestAnnualPercentageRate,
            LoanInterestChargeModeDescription: selected.LoanInterestChargeModeDescription,
            LoanInterestCalculationModeDescription: selected.LoanInterestCalculationModeDescription,
            LoanRegistrationLoanProductCategoryDescription:
                selected.LoanRegistrationLoanProductCategoryDescription,
            LoanRegistrationMaximumAmount: selected.LoanRegistrationMaximumAmount,
            LoanRegistrationMinimumInterestAmount: selected.LoanRegistrationMinimumInterestAmount,
            LoanRegistrationInvestmentsMultiplier: selected.LoanRegistrationInvestmentsMultiplier,
            LoanRegistrationStandingOrderTriggerDescription:
                selected.LoanRegistrationStandingOrderTriggerDescription,
            LoanRegistrationMinimumGuarantors:
                selected.LoanRegistrationMinimumGuarantors,
            LoanRegistrationMaximumGuarantees:
                selected.LoanRegistrationMaximumGuarantees,
            LoanRegistrationAllowSelfGuarantee:
                selected.LoanRegistrationAllowSelfGuarantee,
        }));


        // ensure minimum guarantors exist
        const min = selected.LoanRegistrationMinimumGuarantors || 0;

        setGuarantors(
            Array.from({ length: min }, () => ({
                CustomerId: "",
                searchValue: "",
                AmountGuaranteed: 0,
                PersonalIdentificationNumber: "",
                IndividualIdentityCardNumber: "",
                IndividualPayrollNumbers: "",
                AddressEmail: "",
                AddressMobileLine: "",
                FullName: "",
                Remarks: "",
            }))
        );

    };



    const updateGuarantor = (index, key, value) => {
        const copy = [...guarantors];
        copy[index][key] = value;
        setGuarantors(copy);
    };

    const addGuarantor = () => {
        setGuarantors(prev => [
            ...prev,
            {
                searchValue: "",
                AmountGuaranteed: 0,
                PersonalIdentificationNumber: "",
                IndividualIdentityCardNumber: "",
                IndividualPayrollNumbers: "",
                AddressEmail: "",
                AddressMobileLine: "",
                FullName: "",
                Remarks: "",
            },
        ]);
    };


    const removeGuarantor = (index) => {
        const min = form.LoanRegistrationMinimumGuarantors || 0;

        if (guarantors.length <= min) {
            Swal.fire(
                "Not Allowed",
                `Minimum ${min} guarantor(s) required for this loan`,
                "warning"
            );
            return;
        }

        setGuarantors(prev => prev.filter((_, i) => i !== index));

    };


    const handleGuarantorSelect = (index, value) => {

        const selected = customers.find(c =>
            `${c.Customer.IndividualFirstName} | ${c.Customer.IndividualIdentityCardNumber} | ${c.Customer.Reference3}` === value
        );


        if (!selected) {
            updateGuarantor(index, "searchValue", value);
            return;
        }

        const copy = [...guarantors];
        const c = selected.Customer;

        copy[index] = {
            ...copy[index],
            searchValue: value,
            FullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
            IndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
            IndividualPayrollNumbers: c.Reference3 || "",
            PersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
            AddressMobileLine: c.AddressMobileLine || "",
            AddressEmail: c.AddressEmail || "",
            CustomerId: c.Id,
        };


        setGuarantors(copy);
    };


    // if (selected.IdentificationNumber === form.CustomerIndividualIdentityCardNumber) {
    //     Swal.fire("Warning", "Applicant cannot be a guarantor", "warning");
    //     return;
    // }




    const payload = {
        ...form,
        Guarantors: guarantors,
    };

    console.log(payload);
    const handleSubmit = async () => {

        //minimum guarantors validation
        if (guarantors.length < form.LoanRegistrationMinimumGuarantors) {
            Swal.fire(
                "Validation Error",
                `This loan requires at least ${form.LoanRegistrationMinimumGuarantors} guarantor(s)`,
                "error"
            );
            return;
        }

        //total guaranteed amount validation
        const totalGuaranteed = guarantors.reduce(
            (sum, g) => sum + (Number(g.AmountGuaranteed) || 0),
            0
        );

        //total guaranteed amount should not exceed amount applied
        if (totalGuaranteed > Number(form.AmountApplied)) {
            Swal.fire(
                "Validation Error",
                "Total guaranteed amount cannot exceed the amount applied",
                "error"
            );
            return;
        }


        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/LoanApplication`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify(payload),
                }
            );



            const data = await response.json();



            console.log(data);
            if (data.success || data.Success) {
                Swal.fire(data.message, data.Data, "success");
                // Swal.fire({
                //     icon: "success",
                //     title: data.message,
                //     text: data.Data,
                // });

            } else {
                Swal.fire(data.message, data.Data, "error");
            }

            // if (!response.ok || !data.Id) {
            //     throw new Error("Failed to submit loan application");
            // }



            //Swal.fire("Success", "Loan application submitted successfully", "success");
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        const net = Number(form.LoanRegistrationNetIncome) || 0;
        const allowance = Number(form.LoanRegistrationTotalAllowance) || 0;
        const deduction = Number(form.LoanRegistrationTotalDeduction) || 0;

        const totalIncome = net + allowance - deduction;

        setForm(prev => ({
            ...prev,
            LoanRegistrationTotalIncome: totalIncome,
        }));
    }, [
        form.LoanRegistrationNetIncome,
        form.LoanRegistrationTotalAllowance,
        form.LoanRegistrationTotalDeduction,
    ]);


    const totalGuaranteedAmount = useMemo(() => {
        return guarantors.reduce(
            (sum, g) => sum + (Number(g.AmountGuaranteed) || 0),
            0
        );
    }, [guarantors]);



    // Qualifying Amount (Savings × 4 + Boosted Reference if any)
    const qualifyingAmount = useMemo(() => {
        const base = totalSavings;
        const boostedAmount = Number(form.Reference) || 0;
        return base + boostedAmount;
    }, [totalSavings, form.Reference]);


    // Total Loan Book Balance (Loans only)
    const totalBookBalance = useMemo(() => {
        return selectedAccounts
            .filter(acc => acc.CustomerAccountTypeProductCodeDescription === "Loan")
            .reduce((sum, acc) => sum + (Number(acc.BookBalance) || 0), 0);
    }, [selectedAccounts]);

    // Remaining Eligible Amount
    const remainingEligibleAmount = useMemo(() => {
        return Math.max(qualifyingAmount - totalBookBalance, 0);
    }, [totalBookBalance, qualifyingAmount]);




    console.log(selectedAccounts);



    console.log("Form Data:", form);
    console.log("Guarantors:", guarantors)
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
                        className="fixed top-3 right-3 w-[90vw] max-w-[1100px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    >
                        {/* HEADER */}
                        <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                            <h2 className="font-bold text-xl text-white">
                                Loan Application
                            </h2>
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-6 overflow-y-auto h-[88vh]">

                            <div className="bg-gray-200 rounded-lg p-3">
                                {/* CUSTOMER DETAILS */}
                                <Card className="p-4 mb-6">
                                    <h3 className="font-semibold mb-4">Applicant Details</h3>

                                    {/* SEARCHABLE DATALIST */}
                                    <div className="mb-4">
                                        <Label>Select Customer</Label>

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Select customer"
                                                value={form.CustomerFullName}
                                                readOnly
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => setCustomerModalOpen(true)}
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input label="Full Name" placeholder="Full Name" value={form.CustomerFullName} readOnly />
                                        <Input label="ID Number" placeholder="ID Number" value={form.CustomerIndividualIdentityCardNumber} readOnly />
                                        <Input label="Payroll Number" placeholder="Payroll Number" value={form.CustomerIndividualPayrollNumbers} readOnly />
                                        <Input label="KRA PIN" placeholder="KRA PIN" value={form.CustomerPersonalIdentificationNumber} readOnly />
                                        <Input label="Mobile" placeholder="Mobile" value={form.CustomerAddressMobileLine} readOnly />
                                        <Input label="Email" placeholder="Email" value={form.CustomerAddressEmail} readOnly />
                                    </div>
                                </Card>

                                {/* ACCOUNTS SUMMARY */}
                                <Card className="p-4 mb-6">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-5 py-3 mb-4">
                                        <h3 className="font-semibold">Member Accounts & Balances</h3>
                                        <div>
                                            Total Savings <span className="bg-indigo-500 px-4 py-2 rounded-md ">{(memberDeposits + Number(form.Reference)).toLocaleString()}</span>
                                        </div>

                                    </div>


                                    {selectedAccounts.length === 0 && (
                                        <p className="text-sm text-gray-50">No accounts found.</p>
                                    )}

                                    <div className="max-h-64 overflow-y-auto bg-gray-200 p-4 rounded-lg">
                                        {selectedAccounts.map(acc => (
                                            <div
                                                key={acc.Id}
                                                className="border rounded-lg p-3 mb-2 flex justify-between items-center bg-gray-50"
                                            >
                                                <div>
                                                    {/* <p className="font-medium">
                                                        {acc.FullAccountNumber}
                                                    </p> */}
                                                    <p className="text-xs text-gray-500">
                                                        {acc.CustomerAccountTypeTargetProductDescription}
                                                        {" · "}
                                                        {acc.CustomerAccountTypeProductCodeDescription}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    {acc.CustomerAccountTypeProductCodeDescription === "Loan" && (
                                                        <p className="text-sm text-red-700">
                                                            Book: <b>{acc.BookBalance.toLocaleString()}</b>
                                                        </p>)}

                                                    {acc.CustomerAccountTypeProductCodeDescription === "Savings" && (
                                                        <p className="text-sm text-green-700">
                                                            Available: <b>{acc.AvailableBalance.toLocaleString()}</b>
                                                        </p>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>


                                {/* LOAN DETAILS */}
                                <Card className="p-4 mb-6">

                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-2 py-2 mb-4">

                                        {/* <h2 className="font-semibold">Loan Details</h2> */}
                                        {/* <div className="flex justify-between items-center gap-4">
                                            <div className="bg-indigo-700 p-3 rounded-lg"> Qualifying Amount  <span className="bg-indigo-500 px-4 py-2 rounded-md ">{totalSavings.toLocaleString()}</span> </div>
                                            {Number(form.Reference) > 0 && <div className="bg-gray-700 p-3 rounded-lg"><span>New Loan Limit <span className="bg-indigo-500 px-4 py-2 rounded-md ">   {((memberDeposits + Number(form.Reference)) * 4).toLocaleString()}</span></span></div>}
                                        </div> */}
                                        <h1 className="font-semibold px-4">Loan Details</h1>
                                        <div className="flex gap-4 justify-between items-center bg-indigo-600 text-white rounded-md px-1 py-1 mb-1">
                                            <div className="flex gap-4">
                                                <div className="bg-indigo-700 p-3 rounded-lg flex items-center justify-center text-sm">
                                                    Qualifying Amount
                                                    <span className="bg-indigo-500 px-4 py-2 rounded-md ml-2">
                                                        {qualifyingAmount.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="bg-red-700 p-3 rounded-lg flex items-center justify-center text-sm">
                                                    Total Loan Book
                                                    <span className="bg-red-500 px-4 py-2 rounded-md ml-2">
                                                        {totalBookBalance.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="bg-green-700 p-3 rounded-lg flex items-center justify-center text-sm">
                                                    Remaining Eligibility
                                                    <span className="bg-green-500 px-4 py-2 rounded-md ml-2">
                                                        {remainingEligibleAmount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                        <div className="md:col-span-4">
                                            <Label>Select Loan Product</Label>

                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Select loan product"
                                                    value={form.LoanProductDescription}
                                                    readOnly
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => setLoanProductModalOpen(true)}
                                                >
                                                    Select
                                                </Button>
                                            </div>
                                        </div>


                                        <div>
                                            <Label>Loan Product</Label>
                                            <Input
                                                value={form.LoanProductDescription}
                                                onChange={e => update("LoanProductDescription", e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>Purpose</Label>
                                            <Input
                                                value={form.LoanPurposeDescription}
                                                onChange={e => update("LoanPurposeDescription", e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>Amount Applied</Label>
                                            <Input
                                                type="number"
                                                value={form.AmountApplied}
                                                onChange={e => update("AmountApplied", Number(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <Label>Loan Term (Months)</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationTermInMonths}
                                                onChange={e =>
                                                    update("LoanRegistrationTermInMonths", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Interest Rate (%)</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanInterestAnnualPercentageRate}
                                                onChange={e =>
                                                    update("LoanInterestAnnualPercentageRate", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Interest Charge Mode</Label>
                                            <Input
                                                value={form.LoanInterestChargeModeDescription}
                                                onChange={e =>
                                                    update("LoanInterestChargeModeDescription", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Interest Calculation</Label>
                                            <Input
                                                value={form.LoanInterestCalculationModeDescription}
                                                onChange={e =>
                                                    update("LoanInterestCalculationModeDescription", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Loan Category</Label>
                                            <Input
                                                value={form.LoanRegistrationLoanProductCategoryDescription}
                                                onChange={e =>
                                                    update("LoanRegistrationLoanProductCategoryDescription", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Maximum Amount</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationMaximumAmount}
                                                onChange={e =>
                                                    update("LoanRegistrationMaximumAmount", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Minimum Interest Amount</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationMinimumInterestAmount}
                                                onChange={e =>
                                                    update("LoanRegistrationMinimumInterestAmount", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Investments Multiplier</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationInvestmentsMultiplier}
                                                onChange={e =>
                                                    update("LoanRegistrationInvestmentsMultiplier", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Standing Order Trigger</Label>
                                            <Input
                                                value={form.LoanRegistrationStandingOrderTriggerDescription}
                                                onChange={e =>
                                                    update("LoanRegistrationStandingOrderTriggerDescription", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Min Guarantors</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationMinimumGuarantors}
                                                onChange={e =>
                                                    update("LoanRegistrationMinimumGuarantors", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Max Guarantees</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationMaximumGuarantees}
                                                onChange={e =>
                                                    update("LoanRegistrationMaximumGuarantees", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Allow Self Guarantee</Label>
                                            <Input
                                                value={form.LoanRegistrationAllowSelfGuarantee ? "Yes" : "No"}
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <Label>Received Date</Label>
                                            <Input
                                                type="date"
                                                value={form.receivedDate}
                                                onChange={(e) => update("receivedDate", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 p-2">
                                            <input
                                                type="checkbox"
                                                checked={boosted}
                                                onChange={(e) => {
                                                    const isBoosted = e.target.checked;

                                                    setBoosted(isBoosted);
                                                    setForm(prev => ({
                                                        ...prev,
                                                        IsBatched: !isBoosted,
                                                        Remarks: isBoosted
                                                            ? prev.Remarks
                                                                ? `${prev.Remarks} - boosted`
                                                                : "boosted"
                                                            : prev.Remarks.replace(/\s?-?\s?boosted/i, "").trim(),
                                                    }));
                                                }}
                                            />

                                            <Label>Is Boosted Loan?</Label> <br />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {boosted && (
                                                <div>
                                                    <Label>Reference Amount</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter boosted amount"
                                                        value={form.Reference}
                                                        onChange={(e) => update("Reference", e.target.value)}
                                                    />
                                                </div>
                                            )}


                                            {
                                                boosted && (
                                                    <div>
                                                        <Label>Remarks</Label>
                                                        <Input
                                                            className="w-full"
                                                            value={form.Remarks}
                                                            readOnly={boosted}
                                                            onChange={e => update("Remarks", e.target.value)}
                                                        />

                                                    </div>
                                                )}


                                            <div>
                                                <Label>Loan to Offset</Label>

                                                <div className="flex gap-2">
                                                    <Input
                                                        value={selectedParentLoan?.LoanProductDescription || ""}
                                                        placeholder="Select Loan to Offset"
                                                        readOnly
                                                    />

                                                    <Button
                                                        type="button"
                                                        onClick={() => setParentLoanModalOpen(true)}
                                                    >
                                                        Select
                                                    </Button>
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                </Card>



                                {/* Loan Sector */}
                                <Card className="p-4 mb-6">
                                    <h3 className="font-semibold mb-4">Loan Sector</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* SECTOR */}
                                        <div>
                                            <Label>Loan Sector</Label>
                                            <select
                                                className="w-full border rounded-md p-2"
                                                value={form.SectorCode}
                                                onChange={(e) => {
                                                    update("SectorCode", e.target.value);
                                                    update("SubSectorCode", ""); // reset subsector
                                                }}
                                            >
                                                <option value="">Select Sector</option>
                                                {loanSectors.map(sector => (
                                                    <option key={sector.Id} value={sector.SectorCode}>
                                                        {sector.SectorCode} - {sector.SectorName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* SUB SECTOR */}
                                        <div>
                                            <Label>Loan Sub Sector</Label>
                                            <select
                                                className="w-full border rounded-md p-2"
                                                value={form.SubSectorCode}
                                                onChange={(e) => update("SubSectorCode", e.target.value)}
                                                disabled={!form.SectorCode}
                                            >
                                                <option value="">Select Sub Sector</option>

                                                {filteredSubSectors.map(sub => (
                                                    <option key={sub.Id} value={sub.SubSectorCode}>
                                                        {sub.SubSectorCode} - {sub.SubSectorName}
                                                    </option>
                                                ))}
                                            </select>

                                        </div>

                                    </div>
                                </Card>





                                {/* SALARY DETAILS
                                <Card className="p-4 mb-6">
                                    <h3 className="font-semibold mb-4">Salary Details</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label>Net Income</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationNetIncome}
                                                onChange={e =>
                                                    update("LoanRegistrationNetIncome", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Total Allowance</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationTotalAllowance}
                                                onChange={e =>
                                                    update("LoanRegistrationTotalAllowance", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Total Deduction</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationTotalDeduction}
                                                onChange={e =>
                                                    update("LoanRegistrationTotalDeduction", Number(e.target.value))
                                                }
                                            />
                                        </div>

                                        <div>
                                            <Label>Total Income</Label>
                                            <Input
                                                type="number"
                                                value={form.LoanRegistrationTotalIncome}
                                                readOnly
                                                className="bg-gray-100 cursor-not-allowed font-semibold"
                                            />
                                        </div>

                                    </div>
                                </Card> */}












                                {/* GUARANTORS */}
                                <Card className="p-4">
                                    <div className="flex justify-between items-center bg-indigo-600 text-white rounded-md px-5 py-3 mb-4">
                                        <h3 className="font-semibold">Guarantors</h3>
                                        <div className="text-sm text-gray-50">
                                            Guaranteed: <b>{totalGuaranteedAmount.toLocaleString()}</b> /{" "}
                                            {Number(form.AmountApplied).toLocaleString()}
                                        </div>
                                    </div>


                                    {guarantors.map((g, index) => (

                                        <div key={index} className="border rounded-lg p-4 mb-4">



                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-medium">
                                                    Guarantor {index + 1}
                                                </h4>

                                                {guarantors.length > form.LoanRegistrationMinimumGuarantors && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-600 text-white"
                                                        onClick={() => removeGuarantor(index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                                {/* SEARCH GUARANTOR */}
                                                <div className="md:col-span-3">
                                                    <Label>Select Guarantor</Label>

                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Select guarantor"
                                                            value={g.FullName}
                                                            readOnly
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => setGuarantorModalIndex(index)}
                                                        >
                                                            Select
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Full Name</Label>
                                                    <Input
                                                        placeholder="Full Name"
                                                        value={g.FullName}
                                                        readOnly
                                                    />
                                                </div>
                                                <div>
                                                    <Label>ID Numbe</Label>
                                                    <Input
                                                        placeholder="ID Number"
                                                        value={g.IndividualIdentityCardNumber}
                                                        readOnly
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Payroll Number</Label>
                                                    <Input
                                                        placeholder="Payroll Number"
                                                        value={g.IndividualPayrollNumbers}
                                                        readOnly
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Mobile</Label>
                                                    <Input
                                                        placeholder="Mobile"
                                                        value={g.AddressMobileLine}
                                                        readOnly
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Email</Label>
                                                    <Input
                                                        placeholder="Email"
                                                        value={g.AddressEmail}
                                                        readOnly
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Amount</Label>
                                                    <Input
                                                        placeholder="Amount Guaranteed"
                                                        type="number"
                                                        value={g.AmountGuaranteed}
                                                        onChange={(e) => {
                                                            const value = Number(e.target.value) || 0;

                                                            const otherGuarantorsTotal = guarantors.reduce(
                                                                (sum, g, i) =>
                                                                    i === index ? sum : sum + (Number(g.AmountGuaranteed) || 0),
                                                                0
                                                            );

                                                            if (otherGuarantorsTotal + value > Number(form.AmountApplied)) {
                                                                Swal.fire(
                                                                    "Amount Exceeded",
                                                                    "Total guaranteed amount cannot exceed Amount Applied",
                                                                    "warning"
                                                                );
                                                                return;
                                                            }

                                                            updateGuarantor(index, "AmountGuaranteed", value);
                                                        }}

                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button variant="outline" onClick={addGuarantor}>
                                        + Add Guarantor
                                    </Button>
                                </Card>
                            </div>






                            {/* ACTIONS */}
                            <div className="flex justify-end mt-8">
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Submit Loan Application"}
                                </Button>
                            </div>


                        </div>
                    </motion.div>
                </>
            )}
            <CustomerSelectModal
                open={customerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                customers={customers}
                onSelect={(member) => {
                    const c = member.Customer;

                    setSelectedAccounts(member.Accounts || []);

                    setForm(prev => ({
                        ...prev,
                        CustomerId: c.Id,
                        CustomerFullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
                        CustomerIndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
                        CustomerIndividualPayrollNumbers: c.Reference3 || "",
                        CustomerPersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
                        CustomerAddressMobileLine: c.AddressMobileLine || "",
                        CustomerAddressEmail: c.AddressEmail || "",
                        Reference: "",
                    }));

                    setSelectedParentLoan(null);
                    update("parentId", "");
                }}
            />


            <LoanProductSelectModal
                open={loanProductModalOpen}
                onClose={() => setLoanProductModalOpen(false)}
                loanProducts={loanProducts}
                onSelect={(selected) => {

                    setForm(prev => ({
                        ...prev,

                        LoanProductId: selected.Id,
                        LoanProductDescription: selected.Description,
                        LoanRegistrationTermInMonths: selected.LoanRegistrationTermInMonths,
                        LoanInterestAnnualPercentageRate: selected.LoanInterestAnnualPercentageRate,
                        LoanInterestChargeModeDescription: selected.LoanInterestChargeModeDescription,
                        LoanInterestCalculationModeDescription: selected.LoanInterestCalculationModeDescription,
                        LoanRegistrationLoanProductCategoryDescription:
                            selected.LoanRegistrationLoanProductCategoryDescription,
                        LoanRegistrationMaximumAmount: selected.LoanRegistrationMaximumAmount,
                        LoanRegistrationMinimumInterestAmount: selected.LoanRegistrationMinimumInterestAmount,
                        LoanRegistrationInvestmentsMultiplier: selected.LoanRegistrationInvestmentsMultiplier,
                        LoanRegistrationStandingOrderTriggerDescription:
                            selected.LoanRegistrationStandingOrderTriggerDescription,
                        LoanRegistrationMinimumGuarantors:
                            selected.LoanRegistrationMinimumGuarantors,
                        LoanRegistrationMaximumGuarantees:
                            selected.LoanRegistrationMaximumGuarantees,
                        LoanRegistrationAllowSelfGuarantee:
                            selected.LoanRegistrationAllowSelfGuarantee,
                    }));

                    // Ensure minimum guarantors
                    const min = selected.LoanRegistrationMinimumGuarantors || 0;

                    setGuarantors(
                        Array.from({ length: min }, () => ({
                            CustomerId: "",
                            searchValue: "",
                            AmountGuaranteed: 0,
                            PersonalIdentificationNumber: "",
                            IndividualIdentityCardNumber: "",
                            IndividualPayrollNumbers: "",
                            AddressEmail: "",
                            AddressMobileLine: "",
                            FullName: "",
                            Remarks: "",
                        }))
                    );
                }}
            />


            <GuarantorSelectModal
                open={guarantorModalIndex !== null}
                onClose={() => setGuarantorModalIndex(null)}
                customers={customers}
                applicantId={form.CustomerId}
                allowSelfGuarantee={form.LoanRegistrationAllowSelfGuarantee}
                selectedGuarantorIds={guarantors
                    .map(g => g.CustomerId)
                    .filter(Boolean)}
                onSelect={(member) => {
                    const c = member.Customer;

                    setGuarantors(prev => {
                        const copy = [...prev];

                        copy[guarantorModalIndex] = {
                            ...copy[guarantorModalIndex],
                            CustomerId: c.Id,
                            FullName: `${c.IndividualFirstName} ${c.IndividualLastName}`,
                            IndividualIdentityCardNumber: c.IndividualIdentityCardNumber || "",
                            IndividualPayrollNumbers: c.Reference3 || "",
                            PersonalIdentificationNumber: c.PersonalIdentificationNumber || "",
                            AddressMobileLine: c.AddressMobileLine || "",
                            AddressEmail: c.AddressEmail || "",
                        };

                        return copy;
                    });
                }}
            />

            <ParentLoanSelectModal
                open={parentLoanModalOpen}
                onClose={() => setParentLoanModalOpen(false)}
                customers={customers}   // ✅ pass customers
                selectedCustomerId={form.CustomerId}
                onSelect={(loan) => {
                    setSelectedParentLoan(loan);   // 👈 for display
                    setForm(prev => ({
                        ...prev,
                        parentId: loan.Id,   // ✅ only ID stored
                        Remarks: prev.Remarks
                    }));
                    setParentLoanModalOpen(false);
                }}
            />

        </AnimatePresence>
    );
}







