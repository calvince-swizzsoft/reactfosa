import React, { useEffect, useState, useRef } from "react";
import logo from "../../../assets/rubanilogo.jpeg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


function IncomeStatement() {
    const [data, setData] = useState(null);
    const [postingPeriods, setPostingPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [endDate, setEndDate] = useState("2026-01-20");


    const printRef = useRef();


    useEffect(() => {
        fetch("http://88.99.215.90:8600/api/loaning/GetPostingPeriods", {
            headers: { "ngrok-skip-browser-warning": "true" }
        })
            .then(res => res.json())
            .then(periods => {
                const active = periods.filter(p => p.IsActive);
                setPostingPeriods(active);
                if (active.length) {
                    setSelectedPeriod(active[0].Id); // default selection
                }
            })
            .catch(console.error);
    }, []);

    // useEffect(() => {
    //     fetch(
    //         "http://88.99.215.90:8600/api/reporting/IncomeStatement?endDate=2026-01-20&postingPeriod=2F1DA0E0-B1DB-F011-B575-80CE62222714",
    //         { headers: { "ngrok-skip-browser-warning": "true" } }
    //     )
    //         .then(res => res.json())
    //         .then(setData)
    //         .catch(console.error);
    // }, []);

    useEffect(() => {
        if (!selectedPeriod || !endDate) return;

        setData(null); // loading state

        fetch(
            `http://88.99.215.90:8600/api/reporting/IncomeStatement?endDate=${endDate}&postingPeriod=${selectedPeriod}`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
        )
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [selectedPeriod, endDate]);

    console.log("Fetched Income Statement Data:", data);


    const handlePrint = () => {
        const content = printRef.current;
        const printWindow = window.open("", "", "width=900,height=650");
        printWindow.document.write(`
            <html>
                <head>
                    <title>Income Statement</title>
                    <style>
                        body { font-family: Times New Roman, serif; padding: 30px; }
                        h1, h2 { text-align: center; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { padding: 4px; font-size: 13px; }
                        th { border-bottom: 2px solid #000; text-align: left; }
                        .right { text-align: right; }
                        .bold { font-weight: bold; }
                        .section { border-top: 2px solid #000; border-bottom: 1px solid #000; font-weight: bold; }
                        .total { border-top: 1px solid #000; font-weight: bold; }
                        .net { border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; }
                        
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    if (!data) {
        return (
            <div className="p-6 text-center text-gray-600">
                Loading income statement...
            </div>
        );
    }

    if (!data.Sections || data.Sections.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                No income statement data found for the selected period.
            </div>
        );
    }

    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "pt", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const LEFT = 40;
        const RIGHT = 40;
        const TABLE_WIDTH = pageWidth - LEFT - RIGHT;


        const img = new Image();
        img.src = logo;

        img.onload = () => {
            let y = 30;

            // LOGO
            doc.addImage(img, "JPEG", (pageWidth - 130) / 2, y, 130, 60);
            y += 80;

            // TITLE
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text("RUBANI SACCO LIMITED", pageWidth / 2, y, { align: "center" });

            y += 18;
            doc.setFont("times", "normal");
            doc.setFontSize(11);
            doc.text(
                `INCOME STATEMENT FOR THE PERIOD ENDING ${new Date(endDate).toLocaleDateString()}`,
                pageWidth / 2,
                y,
                { align: "center" }
            );

            y += 25;

            // TABLE HEADER (like preview)
            autoTable(doc, {
                startY: y,
                head: [["AccNo", "AccName", "PERIODIC"]],
                body: [],
                tableWidth: TABLE_WIDTH,
                styles: {
                    font: "times",
                    fontSize: 10,
                    lineWidth: 0.8,
                    lineColor: [0, 0, 0]
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: "bold",
                    lineWidth: 1.5
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 260 },
                    2: { cellWidth: TABLE_WIDTH - 340, halign: "right" }
                },
                margin: { left: LEFT, right: RIGHT }
            });


            y = doc.lastAutoTable.finalY;

            // SECTIONS
            data.Sections.forEach(section => {

                // Section divider
                doc.setDrawColor(150);
                doc.line(LEFT, y + 6, pageWidth - RIGHT, y + 6);
                y += 14;

                // Section title
                doc.setFont("times", "bold");
                doc.setFontSize(10);
                doc.text(section.SectionName.toUpperCase(), LEFT + 2, y);
                y += 6;


                const rows = section.Entries.map(e => ({
                    accNo: e.AccNo,
                    accName: e.AccName,
                    balance: e.Balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2
                    }),
                    isTotal: e.AccNo.endsWith("000")
                }));

                autoTable(doc, {
                    startY: y,
                    body: rows.map(r => [r.accNo, r.accName, r.balance]),
                    theme: "plain",
                    tableWidth: TABLE_WIDTH,
                    styles: {
                        font: "times",
                        fontSize: 10,
                        cellPadding: 4
                    },
                    columnStyles: {
                        0: { cellWidth: 80 },
                        1: { cellWidth: 260 },
                        2: { cellWidth: TABLE_WIDTH - 340, halign: "right" }
                    },
                    didParseCell(data) {
                        const row = rows[data.row.index];
                        if (row?.isTotal) {
                            data.cell.styles.fontStyle = "bold";
                            data.cell.styles.lineWidth = { top: 1.5 };
                        }
                    },
                    margin: { left: LEFT, right: RIGHT }
                });


                y = doc.lastAutoTable.finalY;
            });

            // NET INCOME
            doc.setDrawColor(0);
            doc.line(LEFT, y, pageWidth - RIGHT, y);
            y += 14;

            autoTable(doc, {
                startY: y,
                body: [[
                    "",
                    data.NetIncome.AccName,
                    data.NetIncome.Balance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                ]],
                theme: "plain",
                tableWidth: TABLE_WIDTH,
                styles: {
                    font: "times",
                    fontSize: 11,
                    fontStyle: "bold"
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 260 },
                    2: { cellWidth: TABLE_WIDTH - 340, halign: "right" }
                },
                margin: { left: LEFT, right: RIGHT }
            });


            doc.save("IncomeStatement.pdf");
        };
    };






    return (
        <div className="p-6 bg-gray-200 min-h-screen">
            <div className="flex justify-between mb-4 items-center bg-gray-50 p-3 px-6 rounded-lg">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Posting Period */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Posting Period
                        </label>
                        <select
                            value={selectedPeriod}
                            onChange={e => setSelectedPeriod(e.target.value)}
                            className="border rounded px-3 py-2 w-72"
                        >
                            {postingPeriods.map(p => (
                                <option key={p.Id} value={p.Id}>
                                    {p.Description}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* End Date */}
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
                </div>
                {/* ACTION BUTTONS */}
                <div className="">
                    <button
                        onClick={handleDownloadPDF}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                        Download PDF
                    </button>

                </div>
            </div>





            {/* PDF PREVIEW */}
            <div
                ref={printRef}
                className="bg-white p-8 shadow-lg max-w-5xl mx-auto"
            >
                {/* HEADER */}
                <div className="flex flex-col items-center justify-center gap-4 mb-4">
                    <img
                        src={logo}
                        alt="Company Logo"
                        className="h-16 w-auto"
                    />
                    <div className="text-center">
                        <h1 className="text-lg font-bold">RUBANI SACCO LIMITED</h1>
                        <h2 className="text-sm">
                            INCOME STATEMENT FOR THE PERIOD ENDING{" "}
                            {new Date(endDate).toLocaleDateString()}
                        </h2>

                    </div>
                </div>

                <hr className="border-black mb-4" />

                {/* GRID TABLE */}
                <div className="w-full text-sm text-gray-800">
                    {/* HEADER */}
                    <div className="grid grid-cols-[20%_1fr_150px] border-b-2 border-black font-semibold py-2">
                        <div>AccNo</div>
                        <div>AccName</div>
                        <div className="text-right">PERIODIC</div>
                    </div>

                    {data.Sections.map(section => (
                        <React.Fragment key={section.SectionName}>
                            {/* SECTION DIVIDER */}
                            <div className="border-t border-gray-400 my-2"></div>

                            {/* SECTION HEADER */}
                            <div className="bg-gray-100 font-semibold uppercase px-1 py-2 border-b-4 border-gray-200">
                                {section.SectionName}
                            </div>

                            {/* ENTRIES */}
                            {section.Entries.map((e, idx) => (
                                <div
                                    key={idx}
                                    className={e.AccNo.endsWith("000")
                                        ? "grid grid-cols-[20%_1fr_150px] border-b-2 border-gray-600 py-1 last:border-none font-bold text-gray-800" :
                                        "grid grid-cols-[20%_1fr_150px] border-b border-gray-200 py-1 last:border-none"}
                                >
                                    <div>{e.AccNo}</div>

                                    <div
                                        className={
                                            e.AccNo === ""
                                                ? "font-semibold "
                                                : e.AccNo.endsWith("000")
                                                    ? "font-bold text-gray-800" : "pl-2"
                                        }
                                    >
                                        {e.AccName}
                                    </div>

                                    <div className="text-right tabular-nums">
                                        {e.Balance.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}

                    {/* NET INCOME DIVIDER */}
                    <div className="border-t-2 border-black mt-4"></div>

                    {/* NET PROFIT */}
                    <div className="grid grid-cols-[20%_1fr_150px] font-bold text-base py-2">
                        <div></div>
                        <div>{data.NetIncome.AccName}</div>
                        <div className="text-right tabular-nums">
                            {data.NetIncome.Balance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                            })}
                        </div>
                    </div>
                </div>

            </div>





        </div>
    );
}

export default IncomeStatement;
