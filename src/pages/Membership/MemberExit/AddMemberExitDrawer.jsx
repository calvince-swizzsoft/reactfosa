import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { useState } from "react";
import SelectCustomerModal from "./SelectCustomerModal";

import SelectBranchModal from "./SelectBranchModal";





const API_URL = "http://88.99.215.90:8600";

export default function AddMemberExitDrawer({
    open,
    onClose,
    refresh,
}) {
    const [loading, setLoading] = useState(false);
    const [selectCustomerOpen, setSelectCustomerOpen] = useState(false);
    const [selectBranchOpen, setSelectBranchOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);


    const [form, setForm] = useState({
        CustomerId: "",
        Customer: null,
        CustomerIndividualIdentityCardNumber: "",
        CustomerIndividualNationality: 1,
        CustomerSerialNumber: 34521,
        CustomerIndividualPayrollNumbers: "",
        CustomerIndividualFirstName: "",
        CustomerIndividualLastName: "",
        CustomerFullName: "",
        CustomerIndividualGender: 1,
        CustomerIndividualMaritalStatus: 2,
        CustomerAddressAddressLine1: "",
        CustomerAddressAddressLine2: "",
        CustomerAddressStreet: "",
        CustomerAddressPostalCode: "",
        CustomerAddressCity: "",
        CustomerAddressEmail: "",
        CustomerAddressLandLine: "",
        CustomerAddressMobileLine: "",
        CustomerStationDescription: "",
        CustomerStationZoneDescription: "",
        CustomerStationZoneDivisionDescription: "",
        CustomerStationZoneDivisionEmployerDescription: "",
        CustomerReference1: "ACC-001122",
        CustomerReference2: "MBR-778899",
        CustomerReference3: "PF-445566",
        BranchId: "",
        BranchCode: 101,
        BranchDescription: "",
        BranchCompanyTransferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement: true,
        Category: 1793,
        Status: 1,
        Remarks: "Member has submitted voluntary withdrawal request.",
        MaturityDate: new Date().toISOString().split('T')[0],
        IsLocked: false,
        CreatedBy: "systemg.api",
        CreatedDate: "",
    });


    const handleCustomerSelect = ({ Customer, Accounts }) => {
        setForm((prev) => ({
            ...prev,
            CustomerId: Customer.Id,
            CustomerIndividualFirstName: Customer.IndividualFirstName,
            CustomerIndividualLastName: Customer.IndividualLastName,
            CustomerFullName: `${Customer.IndividualFirstName} ${Customer.IndividualLastName}`,
            CustomerIndividualIdentityCardNumber:
                Customer.IndividualIdentityCardNumber,
            CustomerAddressMobileLine: Customer.AddressMobileLine,
            CustomerAddressEmail: Customer.AddressEmail,
            CustomerSerialNumber: Customer.SerialNumber,
            CustomerReference1: Customer.Reference1,
            CustomerReference2: Customer.Reference2,
            CustomerReference3: Customer.Reference3,
            IsLocked: Customer.IsLocked,
        }));

        setAccounts(Accounts || []);
    };


    const handleBranchSelect = (branch) => {
        setForm((prev) => ({
            ...prev,
            BranchId: branch.Id,
            BranchCode: branch.Code,
            BranchDescription: branch.Description,
            BranchCompanyTransferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement:
                branch.CompanyTransferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement,
        }));
    };

    const update = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const payload = {
                ...form,
                CustomerFullName: `${form.CustomerIndividualFirstName} ${form.CustomerIndividualLastName}`,
                CreatedBy: "system.ui",
                CreatedDate: new Date().toISOString(),
            };

            const res = await fetch(`${API_URL}/api/MemberExit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            console.log("Response:", data);
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create member exit");
            }

            Swal.fire("Success", "Member exit created successfully", "success");
            refresh?.();
            onClose();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };
    console.log("Form data:", form);

    console.log(accounts);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        onClick={loading ? undefined : onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        className="fixed top-3 right-3 w-[85vw] max-w-[900px] bg-white shadow-2xl z-50 rounded-2xl flex flex-col overflow-y-auto max-h-[90vh]"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 m-1 space-y-4">
                            {/* Header */}
                            <div className="flex justify-between bg-indigo-600 p-2 rounded-2xl text-white font-semibold">
                                <span className="ml-3">Member Exit</span>


                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="text-gray-600"
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border">


                                <div className="grid grid-cols-2 gap-4 text-sm ">
                                    <div className="flex justify-center items-end w-full">
                                        <Button
                                            variant="secondary"
                                            className="bg-gray-500 hover:bg-gray-500 text-gray-50 hover:text-gray-50 w-full border-2 border-gray-400"
                                            onClick={() => setSelectCustomerOpen(true)}
                                        >
                                            Select Customer
                                        </Button>
                                    </div>
                                    <div>
                                        <Label>First Name</Label>

                                        <Input
                                            value={form.CustomerIndividualFirstName}
                                            onChange={(e) =>
                                                update("CustomerIndividualFirstName", e.target.value)
                                            }
                                        />


                                    </div>

                                    <div>
                                        <Label>Last Name</Label>
                                        <Input
                                            value={form.CustomerIndividualLastName}
                                            onChange={(e) =>
                                                update("CustomerIndividualLastName", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>ID Number</Label>
                                        <Input
                                            value={form.CustomerIndividualIdentityCardNumber}
                                            onChange={(e) =>
                                                update(
                                                    "CustomerIndividualIdentityCardNumber",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    {/* <div>
                                        <Label hidden>Payroll No</Label>
                                        <Input
                                            value={form.CustomerIndividualPayrollNumbers}
                                            onChange={(e) =>
                                                update(
                                                    "CustomerIndividualPayrollNumbers",
                                                    e.target.value
                                                )
                                            }
                                            hidden
                                        />
                                    </div> */}

                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={form.CustomerAddressMobileLine}
                                            onChange={(e) =>
                                                update("CustomerAddressMobileLine", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={form.CustomerAddressEmail}
                                            onChange={(e) =>
                                                update("CustomerAddressEmail", e.target.value)
                                            }
                                        />
                                    </div>


                                    {accounts.length > 0 && (
                                        <div className="mt-4 bg-white border rounded-lg p-3 col-span-2">
                                            <h3 className="font-semibold mb-2 bg-indigo-500 p-3 rounded-xl text-gray-50">Customer Accounts</h3>

                                            <div className="space-y-2 bg-gray-300 p-3 rounded-lg">
                                                {accounts.map((acc) => (
                                                    <div
                                                        key={acc.Id}
                                                        className="border rounded p-2 text-sm flex justify-between items-center bg-gray-50"
                                                    >
                                                        <div>
                                                            <div className="font-medium">
                                                                {acc.CustomerAccountTypeTargetProductDescription}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {acc.FullAccountNumber}
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <div className="font-semibold">
                                                                {acc.AvailableBalance.toLocaleString()}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {acc.StatusDescription}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label>Maturity Date</Label>
                                        <Input
                                            type="date"
                                            value={form.MaturityDate?.split("T")[0] || ""}
                                            onChange={(e) =>
                                                update("MaturityDate", `${e.target.value}T00:00:00Z`)
                                            }
                                            required
                                        />


                                    </div>

                                    <div>
                                        <Label>Category</Label>
                                        <select
                                            value={form.Category}
                                            onChange={(e) => update("Category", parseInt(e.target.value))}
                                            className="w-full border rounded px-2 py-1"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value={1793}>Voluntary</option>
                                            <option value={1794}>Retiree</option>
                                            <option value={1792}>Deceased</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <Label>Remarks</Label>
                                        <Input
                                            value={form.Remarks}
                                            onChange={(e) =>
                                                update("Remarks", e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 col-span-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={form.IsLocked}
                                            onChange={(e) =>
                                                update("IsLocked", e.target.checked)
                                            }
                                        />
                                        <Label>Lock Record</Label>
                                    </div>
                                </div>


                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-center items-end w-full">
                                        <Button
                                            variant="secondary"
                                            className="bg-gray-500 hover:bg-gray-500 text-gray-50 hover:text-gray-50 w-full border-2 border-gray-400"
                                            onClick={() => setSelectBranchOpen(true)}
                                        >
                                            Select Branch
                                        </Button>
                                    </div>
                                    <div>
                                        <Label>Branch</Label>
                                        <div className="flex gap-2">
                                            <Input value={form.BranchDescription} readOnly />
                                        </div>
                                    </div>

                                    <div>
                                        <Label hidden>Branch Code</Label>
                                        <Input value={form.BranchCode} readOnly hidden />
                                    </div>
                                </div>


                            </div>
                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "loading..." : "Add Exit"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}


            <SelectBranchModal
                open={selectBranchOpen}
                onClose={() => setSelectBranchOpen(false)}
                onSelect={handleBranchSelect}
            />

            <SelectCustomerModal
                open={selectCustomerOpen}
                onClose={() => setSelectCustomerOpen(false)}
                onSelect={handleCustomerSelect}
            />

        </AnimatePresence>
    );
}
