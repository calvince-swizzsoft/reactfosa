import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function MemberNextOfKinTab({ nextOfKin = [] }) {
    const [search, setSearch] = useState("");

    /* ================= SEARCH FILTER ================= */
    const filteredNextOfKin = useMemo(() => {
        const term = search.toLowerCase();
        return nextOfKin.filter((nok) =>
            nok.FullName?.toLowerCase().includes(term) ||
            nok.RelationshipDescription?.toLowerCase().includes(term) ||
            nok.AddressMobileLine?.toLowerCase().includes(term)
        );
    }, [search, nextOfKin]);

    /* ================= PDF EXPORT ================= */
    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        doc.setFontSize(16);
        doc.text("Next of Kin List", 14, 15);

        doc.setFontSize(10);
        doc.text(
            `Generated on: ${new Date().toLocaleDateString()}`,
            14,
            22
        );

        autoTable(doc, {
            startY: 30,
            head: [["Name", "Relationship", "Phone", "Percentage"]],
            body: filteredNextOfKin.map((nok) => [
                nok.FullName,
                nok.RelationshipDescription,
                nok.AddressMobileLine || "N/A",
                `${nok.NominatedPercentage}%`,
            ]),
            theme: "striped",
            headStyles: {
                fillColor: [75, 85, 99], // gray-600
                textColor: 255,
            },
            styles: {
                fontSize: 10,
            },
        });

        doc.save("Next_of_Kin_List.pdf");
    };

    if (nextOfKin.length === 0) {
        return <p className="text-sm text-gray-500">No next of kin recorded</p>;
    }

    return (
        <div className="border rounded-lg bg-gray-200 p-4">
            {/* ================= TOP BAR ================= */}
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by name, relationship or phone"
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
                    <thead className="bg-gray-600 text-white">
                        <tr>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Relationship</th>
                            <th className="p-2 text-left">Phone</th>
                            <th className="p-2 text-left">Percentage</th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-50">
                        {filteredNextOfKin.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="4"
                                    className="p-4 text-center text-gray-500"
                                >
                                    No matching records
                                </td>
                            </tr>
                        ) : (
                            filteredNextOfKin.map((nok, i) => (
                                <tr key={i} className="border-t hover:bg-gray-100">
                                    <td className="p-2">{nok.FullName}</td>
                                    <td className="p-2">{nok.RelationshipDescription}</td>
                                    <td className="p-2">
                                        {nok.AddressMobileLine || "N/A"}
                                    </td>
                                    <td className="p-2">
                                        {nok.NominatedPercentage}%
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
