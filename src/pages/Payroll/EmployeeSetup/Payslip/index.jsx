import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaChevronDown, FaChevronUp, FaFilePdf } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PayslipPreview from "./PayslipPreview";

export default function Payslips() {
    const [payslips, setPayslips] = useState([]);
    const [filteredPayslips, setFilteredPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    const [salaryCycles, setSalaryCycles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedCycle, setSelectedCycle] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");

    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    // pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // filters
    const [employeeName, setEmployeeName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");




    // Fetch all payslips
    const fetchPayslips = async () => {
        setLoading(true);

        const params = new URLSearchParams({
            page,
            pageSize,
            employeeName,
            branch: selectedBranch,
            startDate,
            endDate,
        });

        try {
            const res = await fetch(
                `https://0513fc5aefc0.ngrok-free.app/api/payslips/getbypagination?${params.toString()}`,
                { headers: { "ngrok-skip-browser-warning": "true" } }
            );

            const data = await res.json();

            setPayslips(data.items || data.data || []);
            setTotalPages(data.totalPages || 1);

            // extract branches once
            const brs = [...new Set((data.items || []).map(p => p.Branch))];
            setBranches(brs);

        } catch (err) {
            Swal.fire("Error", "Failed to load payslips", "error");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPayslips();
    }, [page, employeeName, selectedBranch, startDate, endDate]);




    // Filter payslips based on selected cycle & branch
    useEffect(() => {
        let temp = [...payslips];
        if (selectedCycle) temp = temp.filter((p) => p.SalaryCycleName === selectedCycle);
        if (selectedBranch) temp = temp.filter((p) => p.Branch === selectedBranch);
        setFilteredPayslips(temp);
    }, [selectedCycle, selectedBranch, payslips]);

    const downloadPDF = (payslip) => {
        const doc = new jsPDF("p", "pt", "a4");
        const green = "#0a6b3c";

        // Header
        doc.setFillColor(green);
        doc.rect(100, 40, 400, 40, "F");
        doc.setFontSize(16);
        doc.setTextColor("#fff");
        doc.text("PAYSLIP", 260, 65);

        // Employee Info
        doc.setTextColor(green);
        doc.setFontSize(14);
        doc.text("Employee:", 40, 120);
        doc.setTextColor("#000");
        doc.text(`${payslip.EmployeeName}`, 120, 120);
        doc.text(`Designation: ${payslip.Designation}`, 40, 140);
        doc.text(`Branch: ${payslip.Branch}`, 40, 160);
        doc.text(`Bank: ${payslip.BankName}`, 40, 180);
        doc.text(`Account: ${payslip.BankAccount}`, 40, 200);

        // Salary Details Table
        const tableData = [
            ["Basic Salary", payslip.BasicSalary.toLocaleString()],
            ["House Allowance", payslip.HouseAllowance.toLocaleString()],
            ["Transport Allowance", payslip.TransportAllowance.toLocaleString()],
            ["Other Allowances", payslip.OtherAllowances.toLocaleString()],
            ["Gross Pay", payslip.GrossPay.toLocaleString()],
            ["PAYE", payslip.PAYE.toLocaleString()],
            ["NSSF", payslip.NSSF.toLocaleString()],
            ["SHA", payslip.SHA.toLocaleString()],
            ["Housing Levy", payslip.HousingLevy.toLocaleString()],
            ["Other Deductions", payslip.OtherDeductions.toLocaleString()],
            ["Total Deductions", payslip.TotalDeductions.toLocaleString()],
            ["Net Pay", payslip.NetPay.toLocaleString()],
        ];

        autoTable(doc, {
            startY: 220,
            head: [["Description", "Amount (KES)"]],
            body: tableData,
            headStyles: { fillColor: green, textColor: "#fff" },
            columnStyles: { 1: { halign: "right" } },
        });

        doc.save(`Payslip_${payslip.EmployeeNumber}.pdf`);
    };

    return (
        <div className="bg-white py-8 rounded-lg mx-4">
            {/* Filter Section */}
            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Employee Name"
                    className="border p-2 rounded w-1/4"
                    value={employeeName}
                    onChange={(e) => {
                        setPage(1);
                        setEmployeeName(e.target.value);
                    }}
                />

                <select
                    className="border p-2 rounded w-1/4"
                    value={selectedBranch}
                    onChange={(e) => {
                        setPage(1);
                        setSelectedBranch(e.target.value);
                    }}
                >
                    <option value="">-- All Branches --</option>
                    {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>

                <input
                    type="date"
                    className="border p-2 rounded w-1/4"
                    value={startDate}
                    onChange={(e) => {
                        setPage(1);
                        setStartDate(e.target.value);
                    }}
                />

                <input
                    type="date"
                    className="border p-2 rounded w-1/4"
                    value={endDate}
                    onChange={(e) => {
                        setPage(1);
                        setEndDate(e.target.value);
                    }}
                />
            </div>


            <div className="bg-gray-200 p-4 rounded-sm">
                {/* Table Header */}
                <div className="grid grid-cols-9 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
                    <span className="col-span-1">Emp No</span>
                    <span className="col-span-2">Name</span>
                    <span className="col-span-1">Designation</span>
                    <span className="col-span-1">Branch</span>
                    <span className="col-span-1">Gross Pay</span>
                    <span className="col-span-3 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-8 gap-2 bg-gray-50 py-4 px-6 rounded">
                                {Array.from({ length: 8 }).map((__, j) => (
                                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : payslips.length > 0 ? (
                    <div className="space-y-2">
                        {payslips.map((payslip) => (
                            <div key={payslip.EmployeeNumber} className="bg-white rounded-lg shadow-lg border">
                                {/* Row */}
                                <div className="grid grid-cols-9 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                                    <span className="col-span-1 font-medium text-indigo-700">{payslip.EmployeeNumber}</span>
                                    <span className="col-span-2">{payslip.EmployeeName}</span>
                                    <span className="col-span-1">{payslip.Designation}</span>
                                    <span className="col-span-1">{payslip.Branch}</span>
                                    <span className="col-span-1 font-semibold">{payslip.GrossPay.toLocaleString()}</span>

                                    <div className="flex gap-2 col-span-3 justify-end">
                                        <Button
                                            className="bg-red-600 text-white hover:bg-red-700"
                                            onClick={() => downloadPDF(payslip)}
                                        >
                                            <FaFilePdf /> PDF
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white"
                                            onClick={() =>
                                                setExpandedRow(expandedRow === payslip.EmployeeNumber ? null : payslip.EmployeeNumber)
                                            }
                                        >
                                            {expandedRow === payslip.EmployeeNumber ? <><FaChevronUp /> Hide Details</> : <><FaChevronDown /> View Details</>}
                                        </Button>
                                    </div>

                                </div>

                                {/* Expanded Row */}
                                {expandedRow === payslip.EmployeeNumber && (
                                    <div className="bg-gray-100 px-6 py-4 border-t flex justify-center">
                                        <PayslipPreview
                                            employeeInfo={{
                                                name: payslip.EmployeeName,
                                                id: payslip.EmployeeNumber,
                                                designation: payslip.Designation,
                                                branch: payslip.Branch,
                                                salaryCycle: payslip.SalaryCycleName,
                                                bankAccount: payslip.BankAccount,
                                                createdat: payslip.PayDate, // use the correct field
                                            }}
                                            earnings={[
                                                { description: "Basic Salary", amount: payslip.BasicSalary },
                                                { description: "House Allowance", amount: payslip.HouseAllowance },
                                                { description: "Transport Allowance", amount: payslip.TransportAllowance },
                                                { description: "Other Allowances", amount: payslip.OtherAllowances },
                                                { description: "Gross Pay", amount: payslip.GrossPay },
                                            ]}
                                            deductions={[
                                                { description: "PAYE", amount: payslip.PAYE },
                                                { description: "NSSF", amount: payslip.NSSF },
                                                { description: "SHA", amount: payslip.SHA },
                                                { description: "Housing Levy", amount: payslip.HousingLevy },
                                                { description: "Other Deductions", amount: payslip.OtherDeductions },
                                                { description: "Total Deductions", amount: payslip.TotalDeductions },
                                            ]}
                                            totalEarnings={payslip.GrossPay}
                                            totalDeductions={payslip.TotalDeductions}
                                            netPay={payslip.NetPay}
                                        />
                                    </div>
                                )}

                            </div>
                        ))}
                        <div className="flex justify-between items-center mt-6">
                            <Button
                                disabled={page === 1}
                                onClick={() => setPage(prev => prev - 1)}
                            >
                                Previous
                            </Button>

                            <span className="font-medium">
                                Page {page} of {totalPages}
                            </span>

                            <Button
                                disabled={page === totalPages}
                                onClick={() => setPage(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>

                    </div>
                ) : (
                    <div className="text-gray-500 text-center mt-4">
                        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42 h-auto" />
                        <p className="font-medium text-gray-400">No Payslips found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}