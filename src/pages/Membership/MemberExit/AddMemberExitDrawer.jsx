import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import SelectCustomerModal from "./SelectCustomerModal";
import SelectBranchModal from "./SelectBranchModal";

const API_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;

export default function AddMemberExitDrawer({ open, onClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [selectCustomerOpen, setSelectCustomerOpen] = useState(false);
    const [selectBranchOpen, setSelectBranchOpen] = useState(false);
    const [accounts, setAccounts] = useState([]);

    const [form, setForm] = useState({
        CustomerId: "",
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
        CustomerReference1: "",
        CustomerReference2: "",
        CustomerReference3: "",
        BranchId: "",
        BranchCode: 101,
        BranchDescription: "",
        BranchCompanyTransferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement: true,
        Category: 1793,
        Status: 1,
        Remarks: "Member has submitted voluntary withdrawal request.",
        MaturityDate: new Date().toISOString().split("T")[0],
        IsLocked: false,
        CreatedBy: "system.ui",
        CreatedDate: "",
    });

    // Fetch accounts whenever a customer is selected — same pattern as Receipting
    useEffect(() => {
        if (!form.CustomerId) {
            setAccounts([]);
            return;
        }
        fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/CustomerAccount/by-customer?customerId=${form.CustomerId}`
        )
            .then((res) => res.json())
            .then((data) => setAccounts(Array.isArray(data) ? data : []))
            .catch(() => setAccounts([]));
    }, [form.CustomerId]);

    // Flat member shape from /api/customers (same as Receipting)
    const handleCustomerSelect = (member) => {
        setForm((prev) => ({
            ...prev,
            CustomerId: member.Id,
            CustomerIndividualFirstName: member.IndividualFirstName,
            CustomerIndividualLastName: member.IndividualLastName,
            CustomerFullName: `${member.IndividualFirstName} ${member.IndividualLastName}`,
            CustomerIndividualIdentityCardNumber: member.IndividualIdentityCardNumber || "",
            CustomerAddressMobileLine: member.AddressMobileLine || "",
            CustomerAddressEmail: member.AddressEmail || "",
            CustomerSerialNumber: member.SerialNumber || 0,
            CustomerReference1: member.Reference1 || "",
            CustomerReference2: member.Reference2 || "",
            CustomerReference3: member.Reference3 || "",
            IsLocked: member.IsLocked || false,
        }));
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

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
            if (!res.ok) throw new Error(data?.message || "Failed to create member exit");

            Swal.fire("Success", "Member exit created successfully", "success");
            refresh?.();
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
                                <Button variant="outline" onClick={onClose} disabled={loading} className="text-gray-600">
                                    Close
                                </Button>
                            </div>

                            {/* Form */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow border">
                                <div className="grid grid-cols-2 gap-4 text-sm">

                                    {/* Member selector — same style as Receipting's "Received From" */}
                                    <div>
                                        <Label>Member</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-start bg-white"
                                            onClick={() => setSelectCustomerOpen(true)}
                                        >
                                            {form.CustomerFullName || "Click to select member"}
                                        </Button>
                                    </div>

                                    <div>
                                        <Label>Member No.</Label>
                                        <Input
                                            value={form.CustomerReference2}
                                            readOnly
                                            className="bg-gray-100"
                                            placeholder="Auto-filled on selection"
                                        />
                                    </div>

                                    <div>
                                        <Label>First Name</Label>
                                        <Input
                                            value={form.CustomerIndividualFirstName}
                                            onChange={(e) => update("CustomerIndividualFirstName", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Last Name</Label>
                                        <Input
                                            value={form.CustomerIndividualLastName}
                                            onChange={(e) => update("CustomerIndividualLastName", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>ID Number</Label>
                                        <Input
                                            value={form.CustomerIndividualIdentityCardNumber}
                                            onChange={(e) => update("CustomerIndividualIdentityCardNumber", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={form.CustomerAddressMobileLine}
                                            onChange={(e) => update("CustomerAddressMobileLine", e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={form.CustomerAddressEmail}
                                            onChange={(e) => update("CustomerAddressEmail", e.target.value)}
                                        />
                                    </div>

                                    {/* Accounts — fetched automatically on member selection */}
                                    {accounts.length > 0 && (
                                        <div className="mt-2 bg-white border rounded-lg p-3 col-span-2">
                                            <h3 className="font-semibold mb-2 bg-indigo-500 p-3 rounded-xl text-gray-50">
                                                Customer Accounts
                                            </h3>
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
                                                                {Number(acc.AvailableBalance || 0).toLocaleString()}
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
                                            onChange={(e) => update("MaturityDate", `${e.target.value}T00:00:00Z`)}
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
                                            onChange={(e) => update("Remarks", e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 col-span-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={form.IsLocked}
                                            onChange={(e) => update("IsLocked", e.target.checked)}
                                        />
                                        <Label>Lock Record</Label>
                                    </div>
                                </div>

                                {/* Branch selection */}
                                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
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
                                        <Input value={form.BranchDescription} readOnly />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading ? "Submitting..." : "Add Exit"}
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
