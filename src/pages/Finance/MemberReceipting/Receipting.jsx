import { useEffect, useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Plus,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import MemberSelectModal from "./MemberSelectModal";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import logo from "../../../assets/rubanilogo.jpeg";




const EMPTY_LINE = {
    customerAccountId: "",
    customerId: "",
    accountName: "",
    description: "",
    amount: "",
    availableBalance: 0,
};



const money = (n) =>
    Number(n || 0).toLocaleString(undefined, {
        style: "currency",
        currency: "KSH",
    });


const numberToWords = (num) => {
    const a = [
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
        if (n < 1000000) return inWords(Math.floor(n / 1000)) + " Thousand " + inWords(n % 1000);
        return "";
    };

    return inWords(num).trim();
};


export default function Receipting() {
    const [date] = useState(() => new Date().toISOString().slice(0, 10));
    const [reference, setReference] = useState("");
    const [memberName, setMemberName] = useState("");
    const [customerNo, setCustomerNo] = useState("");

    const [branchId, setBranchId] = useState("");
    const [bankId, setBankId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);

    const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState("");

    const [loading, setLoading] = useState(false);

    const [banks, setBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState("");

    const [customerAccount, setCustomerAccount] = useState([]);

    const [memberModalOpen, setMemberModalOpen] = useState(false);

    const [AvailableBalance, setAvailableBalance] = useState(0);

    const [postedDate, setPostedDate] = useState(() => new Date().toISOString().slice(0, 10));



    const totalAmount = useMemo(
        () => lines.reduce((s, l) => s + Number(l.amount || 0), 0),
        [lines]
    );

    const addLine = () => setLines((p) => [...p, { ...EMPTY_LINE }]);
    const removeLine = (i) => setLines((p) => p.filter((_, idx) => idx !== i));
    const updateLine = (i, patch) =>
        setLines((p) => p.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((r) => r.json())
            .then((d) => d.Success && setAccounts(d.Data.map((a) => ({ id: a.Id, name: a.AccountName }))));

        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/branches`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((r) => r.json())
            .then((d) => d.Success && setBranches(d.Data));
    }, []);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/customers`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((r) => r.json())
            .then((d) => d.success && setMembers(d.data));
    }, []);


    // Fetch banks with linkages
    useEffect(() => {
        fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/getBankWithLinkages`, {
            headers: { "ngrok-skip-browser-warning": "true" },
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.Success) setBanks(d.Data);
            });
    }, []);


    useEffect(() => {
        if (!selectedMemberId) {
            setCustomerAccount([]);
            return;
        }

        fetch(
            `${import.meta.env.VITE_APP_FIN_URL}/api/values/CustomerAccount/by-customer?customerId=${selectedMemberId}`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
        )
            .then(res => res.json())
            .then(data => {
                setCustomerAccount(Array.isArray(data) ? data : []);
            })
            .catch(() => setCustomerAccount([]));
    }, [selectedMemberId]);


    //active or inactive account
    const activeCustomerAccounts = useMemo(
        () => customerAccount.filter(a => a.StatusDescription !== "Inactive"),
        [customerAccount]
    );


    // Handler when bank is selected
    const onBankSelect = (bankId) => {
        const bank = banks.find((b) => b.Id === bankId);
        if (!bank) return;

        setBankId(bank.BankId);       // set BankId
        setBranchId(bank.BranchId);   // set BranchId
        setSelectedBankId(bank.Id);   // store selected bank for UI
    };

    const onMemberSelect = (memberId) => {
        setSelectedMemberId(memberId);

        const member = members.find(m => m.Id === memberId);
        if (!member) return;

        setMemberName(`${member.IndividualFirstName} ${member.IndividualLastName}`);
        setCustomerNo(member.Reference2 || "");

    };


    const postReceipt = async () => {
        setLoading(true);

        if (!branchId || !bankId) {
            alert("Branch and Bank Account are required");
            setLoading(false);
            return;
        }

        if (!lines.length || lines.some(l => !l.amount || !l.customerAccountId || !l.customerId)) {
            alert("Each receipt line must have an account, customer and amount");
            setLoading(false);
            return;
        }

        const payload = {
            branchId,
            bankAccountId: bankId,
            postingPeriodId: "2F1DA0E0-B1DB-F011-B575-80CE62222714",
            primaryDescription: "Customer cash deposits batch",
            reference: reference || "BATCH-DEP-AUTO",
            postedDate: postedDate,

            receipts: lines.map((l) => ({
                totalValue: Number(l.amount),
                customerAccount: {
                    id: l.customerAccountId,
                },
                customerDTO: {
                    id: l.customerId,
                },
            })),
        };

        console.log("POST PAYLOAD:", payload);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_APP_FIN_URL}/api/values/CustomerReceipt`,
                //"https://4ff2713c989f.ngrok-free.app/api/values/CustomerReceipt",
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

            // if (!res.ok) {
            //     console.error(data);
            //     alert(data.message || "Failed to post receipt");
            //     return;
            // }
            console.log(data);

            if (data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Receipt Posted Successfully",
                    text: "Would you like to print the receipt?",
                    showCancelButton: true,
                    confirmButtonText: "Print Receipt",
                    cancelButtonText: "Close",
                    confirmButtonColor: "#4f46e5",
                }).then((result) => {
                    if (result.isConfirmed) {
                        generateReceiptPDF();
                    }

                    // reset AFTER user action
                    setLines([{ ...EMPTY_LINE }]);
                    setReference("");
                    setSelectedMemberId("");
                });

                // reset
                setLines([{ ...EMPTY_LINE }]);
                setReference("");
                setSelectedMemberId("");
            } else {

                Swal.fire("Error", data.message, "error");
            }



        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };





    console.log(customerAccount);



    const generateReceiptPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        const left = 15;
        const right = 195;
        let y = 15;

        /* ===== LOGO / HEADER ===== */


        // Logo dimensions
        const logoWidth = 35;
        const logoHeight = 15;

        // Center X position for logo
        const pageCenterX = 105;
        const logoX = pageCenterX - logoWidth / 2;

        // Add logo (TOP CENTER)
        doc.addImage(
            logo,
            "PNG",
            logoX,
            y,
            logoWidth,
            logoHeight
        );


        // Move cursor below logo
        y += logoHeight + 6;

        // Header text (CENTERED)
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("RUBANI SACCO", pageCenterX, y, { align: "center" });

        y += 6;
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        doc.text("Giving wings to your savings", pageCenterX, y, { align: "center" });

        y += 8;
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text("CASH RECEIPT", pageCenterX, y, { align: "center" });

        // Divider line
        doc.line(left, y + 2, right, y + 2);
        y += 10;


        /* ===== LEFT DETAILS ===== */
        doc.setFontSize(9);
        doc.setFont("times", "normal");

        //doc.text(`Receipt No:`, left, y);
        doc.text(`Member No: ${customerNo}`, left, y + 6);
        doc.text(`Staff No: ${customerNo}`, left, y + 12);
        doc.text(`Name: ${memberName}`, left, y + 18);

        /* ===== RIGHT DETAILS ===== */
        doc.text(`Deposited/Receipt Date: ${date}`, 110, y);
        doc.text(`Posted Date: ${date}`, 110, y + 6);
        doc.text(`Payment Mode: ${paymentMethod}`, 110, y + 12);
        doc.text(`Ref No: ${customerNo || "-"}`, 110, y + 18);

        y += 30;

        /* ===== AMOUNT ===== */
        doc.setFont("times", "bold");
        doc.text("Amount:", 110, y);
        doc.text(`Ksh: ${totalAmount.toLocaleString()}.00`, 150, y);

        y += 8;

        /* ===== AMOUNT IN WORDS ===== */
        doc.setFont("times", "normal");
        doc.text(
            `Amount In Words: (Ksh ${numberToWords(totalAmount)} and xx / 100 Cents Only)`,
            left,
            y
        );

        y += 10;
        doc.line(left, y, right, y);

        y += 6;

        /* ===== PAYMENT BREAKDOWN ===== */
        doc.setFont("times", "bold");
        doc.text("Being Payment of:", left, y);
        doc.text("Amount", 150, y);

        y += 6;
        doc.setFont("times", "normal");

        lines.forEach((l) => {
            doc.text(l.accountName || "DEPOSITS", left, y);
            doc.text(Number(l.amount).toLocaleString(), 150, y);
            y += 6;
        });

        doc.line(left, y, right, y);

        y += 6;
        doc.setFont("times", "bold");
        doc.text("Total", left, y);
        doc.text(totalAmount.toLocaleString(), 150, y);

        y += 18;

        /* ===== FOOTER ===== */
        doc.setFont("times", "normal");
        doc.text("Prepared By: mtey", left, y);
        doc.text("Signed: ____________________", 90, y);

        y += 10;
        doc.text("Stamp: ____________________", 90, y);

        y += 12;
        doc.setFontSize(8);
        doc.text(`"Giving wings to your savings!"`, 105, y, { align: "center" });

        doc.save(`Cash-Receipt-${customerNo}-${date}.pdf`);
    };


    return (
        <div className="bg-gray-300 p-6">
            <div className="mx-auto max-w-4xl bg-white shadow-2xl border rounded-md">
                {/* HEADER */}
                <div className="border-b p-6 flex justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">RECEIPT</h1>
                        <p className="text-sm text-gray-600">Member Payment Receipt</p>
                    </div>
                    <div className="text-sm">
                        <div>Date: {date}</div>
                        {/* <div>Receipt #: {reference || "—"}</div> */}
                    </div>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-200 rounded-lg p-3">


                        <div>
                            <Label>Received From</Label>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start bg-white"
                                onClick={() => setMemberModalOpen(true)}
                            >
                                {memberName || "Select member"}
                            </Button>
                        </div>


                        <div>
                            <Label>Member No</Label>
                            <Input value={customerNo} disabled className="bg-white" />
                        </div>
                        <div>
                            <Label>Bank</Label>
                            <Select value={selectedBankId} onValueChange={onBankSelect}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map((b) => (
                                        <SelectItem key={b.Id} value={b.Id}>
                                            {b.BankName} | {b.BankBranchName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>



                        <div>
                            <Label>Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b) => (
                                        <SelectItem key={b.Id} value={b.Id}>
                                            {b.Description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="BANK">Bank</SelectItem>
                                    <SelectItem value="MOBILE">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Posted Date</Label>
                            <Input
                                type="date"
                                value={postedDate}
                                onChange={(e) => setPostedDate(e.target.value)}
                                className="bg-white"
                            />
                        </div>

                    </div>

                    {/* LINE ITEMS */}
                    <div className="border rounded-sm">
                        {/* TABLE HEADER */}
                        <div className="grid grid-cols-13 bg-gray-600 text-white border-b text-xs font-semibold uppercase rounded-t-sm">
                            <div className="col-span-3 p-2 border-r">Account</div>
                            <div className="col-span-2 p-2 border-r">Acc Balance</div>
                            <div className="col-span-3 p-2 border-r">Description</div>
                            <div className="col-span-3 p-2">Amount</div>
                            <div className="col-span-1 p-2 text-right"></div>

                        </div>
                        {lines.map((l, i) => (
                            <div key={i} className="grid grid-cols-13 border-b bg-gray-200">
                                <div className="col-span-3 p-2">
                                    <Select
                                        value={
                                            l.customerAccountId
                                                ? `${l.customerAccountId}|${l.customerId}|${l.accountName}`
                                                : ""
                                        }
                                        onValueChange={(v) => {
                                            const [customerAccountId, customerId, accountName] = v.split("|");

                                            const selectedAccount = customerAccount.find(
                                                (a) => a.Id === customerAccountId
                                            );

                                            let balance = 0;

                                            if (selectedAccount) {
                                                if (selectedAccount.CustomerAccountTypeProductCodeDescription === "Savings") {
                                                    balance = selectedAccount.AvailableBalance;
                                                } else if (selectedAccount.CustomerAccountTypeProductCodeDescription === "Loan") {
                                                    balance = selectedAccount.BookBalance;
                                                }
                                            }

                                            updateLine(i, {
                                                customerAccountId,
                                                customerId,
                                                accountName,
                                                availableBalance: balance,
                                            });
                                        }}

                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeCustomerAccounts.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                    No active accounts available for this member
                                                </div>
                                            ) : (
                                                activeCustomerAccounts.map((a) => (
                                                    <SelectItem
                                                        key={a.Id}
                                                        value={`${a.Id}|${a.CustomerId}|${a.CustomerAccountTypeTargetProductDescription}`}
                                                    >
                                                        {a.CustomerAccountTypeTargetProductDescription}
                                                    </SelectItem>
                                                ))
                                            )}

                                        </SelectContent>

                                    </Select>
                                </div>
                                <div className="col-span-2 justify-end flex items-center">
                                    <div className="bg-gray-50 w-full px-2 py-1 rounded-md shadow">
                                        {money(l.availableBalance)}
                                    </div>
                                </div>
                                <div className="col-span-3 p-2">
                                    <Input
                                        placeholder="Description"
                                        className="bg-white"
                                        value={l.description}
                                        onChange={(e) => updateLine(i, { description: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-3 p-2">
                                    <Input
                                        type="number"
                                        className="bg-white"
                                        placeholder="amount"
                                        value={l.amount}
                                        onChange={(e) => updateLine(i, { amount: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2 p-2">
                                    {lines.length > 1 && (
                                        <Button size="icon" variant="ghost" onClick={() => removeLine(i)}>
                                            <Trash2 />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="p-2 text-right font-semibold">
                            Total: {money(totalAmount)}
                        </div>
                    </div>

                    <Button variant="outline" onClick={addLine} className="bg-gray-600 hover:bg-gray-600 text-white hover:text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add line
                    </Button>



                    <div className="flex justify-between items-center border-t pt-4">
                        <Badge variant="secondary">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Ready to post
                        </Badge>

                        <div className="flex gap-3">
                            {/* <Button
                                variant="outline"
                                onClick={generateReceiptPDF}
                                className="border-indigo-700 text-indigo-700 hover:bg-indigo-50"
                            >
                                Print PDF
                            </Button> */}

                            <Button onClick={postReceipt} className="bg-indigo-700">
                                {loading ? "Posting..." : "Post Receipt"}
                            </Button>
                        </div>
                    </div>

                </div>

                <MemberSelectModal
                    open={memberModalOpen}
                    onClose={setMemberModalOpen}
                    members={members}
                    onSelect={onMemberSelect}
                />

            </div>
        </div>
    );
}
