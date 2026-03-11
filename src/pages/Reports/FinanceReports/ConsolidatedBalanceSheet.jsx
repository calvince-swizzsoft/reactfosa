import React, { useEffect, useState } from "react";
import logo from "../../../assets/rubanilogo.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ConsolidatedBalanceSheet() {
    const [data, setData] = useState(null);
    const [endDate, setEndDate] = useState("2026-01-20");


    useEffect(() => {
        setData(null); // loading state

        fetch(
            `http://88.99.215.90:8600/api/reporting/ConsolidatedBalanceSheet?endDate=${endDate}`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
        )
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [endDate]);


    // useEffect(() => {
    //     fetch(
    //         "http://88.99.215.90:8600/api/reporting/ConsolidatedBalanceSheet?endDate=2026-01-20",
    //         { headers: { "ngrok-skip-browser-warning": "true" } }
    //     )
    //         .then((res) => res.json())
    //         .then(setData)
    //         .catch(console.error);
    // }, []);

    if (!data) return <p>Loading...</p>;

    // Group data by AccountTypeCode
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.AccountTypeCode]) acc[item.AccountTypeCode] = [];
        acc[item.AccountTypeCode].push(item);
        return acc;
    }, {});

    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        const img = new Image();
        img.src = logo;
        img.onload = () => {
            const imgWidth = 130;
            const imgHeight = 60;
            doc.addImage(img, "JPEG", (pageWidth - imgWidth) / 2, y, imgWidth, imgHeight);

            y += imgHeight + 15;

            // Header title
            doc.setFontSize(16);
            doc.setFont("times", "bold");
            doc.text("RUBANI SACCO LIMITED", pageWidth / 2, y, { align: "center" });

            y += 20;

            doc.setFontSize(12);
            doc.setFont("times", "normal");
            doc.text(
                `CONSOLIDATED BALANCE SHEET AS OF ${new Date(endDate).toLocaleDateString()}`,
                pageWidth / 2,
                y,
                { align: "center" }
            );


            y += 30;

            // Loop through account types
            Object.keys(groupedData).forEach((type) => {
                doc.setFont("times", "bold");
                doc.setFontSize(12);
                doc.text(type.toUpperCase(), 40, y);
                y += 10;

                const tableData = groupedData[type].map((item) => [
                    item.AccountCode,
                    item.AccountName,
                    item.Debit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    item.Credit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [["Account Code", "Account Name", "Debit", "Credit"]],
                    body: tableData,
                    theme: "grid",
                    headStyles: { fillColor: [11, 168, 230] },
                    styles: { font: "times", fontSize: 10 },
                    margin: { left: 40, right: 40 },
                });

                y = doc.lastAutoTable.finalY + 15;
            });

            doc.save("ConsolidatedBalanceSheet.pdf");
        };
    };

    return (
        <div className="p-6 bg-gray-200 min-h-screen">


            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 px-6 rounded-lg">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>

                <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    Download PDF
                </button>
            </div>


            <div className="bg-white p-8 shadow-lg max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col items-center justify-center gap-4 mb-4">
                    <img src={logo} alt="Company Logo" className="h-16 w-auto" />
                    <div className="text-center">
                        <h1 className="text-lg font-bold">RUBANI SACCO LIMITED</h1>
                        <h2 className="text-sm">
                            CONSOLIDATED BALANCE SHEET AS OF{" "}
                            {new Date(endDate).toLocaleDateString()}
                        </h2>

                    </div>

                </div>

                <hr className="border-black mb-4" />

                {/* TABLE PREVIEW */}
                {Object.keys(groupedData).map((type) => (
                    <div key={type} className="mb-6">
                        <h3 className="font-bold text-base mb-2">{type.toUpperCase()}</h3>

                        <div className="grid grid-cols-[20%_1fr_150px_150px] border-b-2 border-black font-semibold py-2">
                            <div>Account Code</div>
                            <div>Account Name</div>
                            <div className="text-right">Debit</div>
                            <div className="text-right">Credit</div>
                        </div>

                        {groupedData[type].map((item) => (
                            <div
                                key={item.AccountCode}
                                className="grid grid-cols-[20%_1fr_150px_150px] border-b border-gray-200 py-1 last:border-none"
                            >
                                <div>{item.AccountCode}</div>
                                <div>{item.AccountName}</div>
                                <div className="text-right tabular-nums">
                                    {item.Debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-right tabular-nums">
                                    {item.Credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ConsolidatedBalanceSheet;
