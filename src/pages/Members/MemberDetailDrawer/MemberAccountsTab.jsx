import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function MemberAccountsTab({ accounts, memberName }) {
    const [search, setSearch] = useState("");
    const accountList = accounts ?? [];

    const [showDateModal, setShowDateModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    /* ================= SEARCH FILTER ================= */
    const filteredAccounts = useMemo(() => {
        const term = search.toLowerCase();
        return accountList.filter((acc) =>
            acc.ProductDescription?.toLowerCase().includes(term) ||
            acc.ProductType?.toLowerCase().includes(term)
        );
    }, [search, accountList]);

    /* ================= PDF EXPORT ================= */
    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        doc.setFontSize(16);
        doc.text("Member Accounts", 14, 15);

        if (memberName) {
            doc.setFontSize(12);
            doc.text(memberName, 14, 23);
        }

        doc.setFontSize(10);
        doc.text(
            `Generated on: ${new Date().toLocaleDateString()}`,
            14,
            memberName ? 29 : 22
        );

        autoTable(doc, {
            startY: memberName ? 36 : 30,
            head: [["Product", "Type", "Balance"]],
            body: filteredAccounts.map((acc) => [
                acc.ProductDescription,
                acc.ProductType,
                Number(acc.AccountBalance).toLocaleString(),
            ]),
            theme: "striped",
            headStyles: {
                fillColor: [55, 65, 81], // gray-700
                textColor: 255,
            },
            styles: {
                fontSize: 10,
            },
            columnStyles: {
                2: { halign: "right" }, // balance right aligned
            },
        });

        doc.save("Member_Accounts.pdf");
    };

    if (accountList.length === 0) {
        return <p className="text-sm text-gray-500">No accounts available</p>;
    }

    const downloadRowPDF = async () => {
        if (!selectedAccountId || !startDate || !endDate) {
            alert("Please select start and end dates");
            return;
        }

        try {
            const url =
                `${import.meta.env.VITE_APP_MEMBERSHIP_URL}` +
                `/api/values/GetCustomerShareStatement/${selectedAccountId}` +
                `?startDate=${startDate}` +
                `&endDate=${endDate}` +
                `&downloadPdf=true`;

            const res = await fetch(url, {
                headers: { "ngrok-skip-browser-warning": "true" },
            });

            if (!res.ok) throw new Error("Failed to download PDF");

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `Statement_${selectedAccountId}.pdf`;
            document.body.appendChild(link);
            link.click();

            link.remove();
            URL.revokeObjectURL(blobUrl);

            // close modal after success
            setShowDateModal(false);
            setStartDate("");
            setEndDate("");
        } catch (err) {
            console.error(err);
            alert("Unable to download PDF");
        }
    };

    console.log("Rendering MemberAccountsTab with accounts:", accounts);
    return (
        <div className="border rounded-lg bg-gray-200 p-4">
            {/* ================= TOP BAR ================= */}
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by account no or product" // Updated placeholder
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:max-w-xs px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />

                <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                    Download PDF
                </button>
            </div>

            {/* ================= TABLE ================= */}
            <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-700 text-white">
                        <tr>
                            <th className="p-2 text-left">Product</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-right">Balance</th>
                            <th className="p-2 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-50">
                        {filteredAccounts.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="4" // Updated colSpan from 4 to 3 (removed status column)
                                    className="p-4 text-center text-gray-500"
                                >
                                    No matching records
                                </td>
                            </tr>
                        ) : (
                            filteredAccounts.map((acc, i) => (
                                <tr key={i} className="border-t hover:bg-gray-100">
                                    <td className="p-2">{acc.ProductDescription}</td>
                                    <td className="p-2">{acc.ProductType}</td>
                                    <td className="p-2 text-right">
                                        {Number(acc.AccountBalance).toLocaleString()}
                                    </td>
                                    <td className="p-2 text-center space-x-2">
                                        {acc.ProductType === "Savings" && (
                                            <button
                                                onClick={() => {
                                                    setSelectedAccountId(acc.Id);
                                                    setShowDateModal(true);
                                                }}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-white text-xs"
                                            >
                                                Account Statement PDF
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {showDateModal && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-20 flex items-center justify-end pr-10 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5">
                        <h3 className="text-lg font-semibold mb-4">
                            Select Statement Period
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-600">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-600">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="px-4 py-2 text-sm rounded-md border"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={downloadRowPDF}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}