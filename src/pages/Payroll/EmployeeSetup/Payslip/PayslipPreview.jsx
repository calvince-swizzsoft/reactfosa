import React from "react";
import { Building2, Phone, Mail, Calendar } from "lucide-react";

export default function PayslipPreview({ employeeInfo, earnings, deductions, totalEarnings, totalDeductions, netPay }) {
    const formatCurrency = (amount) => {
        if (typeof amount !== "number") amount = Number(amount) || 0;
        return amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-green-800">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-indigo-800 rounded-lg flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-600">SWIZZSOFT SYSTEM</h1>
                        <p className="text-sm text-gray-600">Swift.Secure.Soft.Solution</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> +254 712345678
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> info@swizzsoft.com
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-sm text-gray-600">{employeeInfo.branch || "N/A"}, 58639</p>
                    <p className="text-xs text-gray-500 mt-1">Tax ID: 452429916</p>
                </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                PAYSLIP: {employeeInfo.salaryCycle}
            </h2>

            {/* Employee Info & Payment Details */}
            <div className="grid grid-cols-2 gap-8 mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">Employee Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Name:</span> <span className="font-semibold">{employeeInfo.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Employee ID:</span> <span className="font-semibold">{employeeInfo.id}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Position:</span> <span className="font-semibold">{employeeInfo.designation}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Designation:</span> <span className="font-semibold">{employeeInfo.designation || "N/A"}</span></div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">Payment Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Pay Period:</span> <span className="font-semibold">{employeeInfo.salaryCycle}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Pay Date:</span> <span className="font-semibold">{employeeInfo.createdat}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Payment Method:</span> <span className="font-semibold">Bank Transfer</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Bank Account:</span> <span className="font-semibold">{employeeInfo.bankAccount}</span></div>
                    </div>
                </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Earnings */}
                <div className="border border-gray-300 rounded shadow-sm">
                    <div className="bg-green-700 text-white p-3"><h3 className="font-semibold">Earnings</h3></div>
                    <table className="w-full">
                        <tbody>
                            {earnings.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="p-3 text-sm text-gray-700">{item.description}</td>
                                    <td className="p-3 text-right text-sm font-semibold text-gray-800">Ksh. {formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-green-50">
                            <tr className="border-t-2 border-green-700">
                                <td className="p-3 font-bold text-gray-800">Total Earnings</td>
                                <td className="p-3 text-right font-bold text-green-700">Ksh. {formatCurrency(totalEarnings)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Deductions */}
                <div className="border border-gray-300 rounded shadow-sm">
                    <div className="bg-red-700 text-white p-3"><h3 className="font-semibold">Deductions</h3></div>
                    <table className="w-full">
                        <tbody>
                            {deductions.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="p-3 text-sm text-gray-700">{item.description}</td>
                                    <td className="p-3 text-right text-sm font-semibold text-gray-800">Ksh. {formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-red-50">
                            <tr className="border-t-2 border-red-700">
                                <td className="p-3 font-bold text-gray-800">Total Deductions</td>
                                <td className="p-3 text-right font-bold text-red-700">Ksh. {formatCurrency(totalDeductions)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Net Pay */}
            <div className="bg-gradient-to-r from-green-800 to-green-600 text-white p-6 rounded-lg mb-6 flex justify-between items-center">
                <div>
                    <p className="text-sm opacity-90">Net Pay</p>
                    <p className="text-4xl font-bold mt-1">Ksh. {formatCurrency(netPay)}</p>
                </div>
                <Calendar className="w-16 h-16 opacity-50" />
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded text-xs text-gray-600">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>This is a computer-generated payslip and does not require a signature</li>
                    <li>Please verify all details and report any discrepancies to HR within 5 working days</li>
                    <li>Keep this payslip for your records and tax purposes</li>
                </ul>
            </div>
        </div>
    );
}
