import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RELATIONSHIP_MAP = {
    0: "Spouse",
    1: "Son",
    2: "Daughter",
    3: "Father",
    4: "Mother",
    5: "Brother",
    6: "Sister",
    7: "Guardian",
    8: "Other",
};

const GENDER_MAP = {
    0: "Unknown",
    1: "Male",
    2: "Female",
};

function getFullName(nok) {
    return [nok.FirstName, nok.LastName].filter(Boolean).join(" ");
}

function getRelationship(nok) {
    return RELATIONSHIP_MAP[nok.Relationship] ?? `Unknown (${nok.Relationship})`;
}

function getGender(nok) {
    return GENDER_MAP[nok.Gender] ?? "Unknown";
}

export default function MemberNextOfKinTab({ nextOfKin, memberName }) {
    const [search, setSearch] = useState("");
    const nokList = nextOfKin ?? [];

    /* ================= SEARCH FILTER ================= */
    const filteredNextOfKin = useMemo(() => {
        const term = search.toLowerCase();
        return nokList.filter((nok) =>
            getFullName(nok).toLowerCase().includes(term) ||
            getRelationship(nok).toLowerCase().includes(term) ||
            nok.AddressMobileLine?.toLowerCase().includes(term) ||
            nok.IdentityCardNumber?.toLowerCase().includes(term)
        );
    }, [search, nokList]);

    /* ================= PDF EXPORT ================= */
    const handleDownloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");

        doc.setFontSize(16);
        doc.text("Next of Kin List", 14, 15);

        if (memberName) {
            doc.setFontSize(12);
            doc.text(memberName, 14, 23);
        }

        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, memberName ? 29 : 22);

        autoTable(doc, {
            startY: memberName ? 36 : 30,
            head: [["Name", "Gender", "Relationship", "ID Number", "Phone", "Percentage"]],
            body: filteredNextOfKin.map((nok) => [
                getFullName(nok),
                getGender(nok),
                getRelationship(nok),
                nok.IdentityCardNumber || "N/A",
                nok.AddressMobileLine || "N/A",
                `${nok.NominatedPercentage ?? 0}%`,
            ]),
            theme: "striped",
            headStyles: { fillColor: [75, 85, 99], textColor: 255 },
            styles: { fontSize: 9 },
        });

        doc.save("Next_of_Kin_List.pdf");
    };

    if (nokList.length === 0) {
        return <p className="text-sm text-gray-500">No next of kin recorded</p>;
    }

    return (
        <div className="border rounded-lg bg-gray-200 p-4">
            {/* ================= TOP BAR ================= */}
            <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by name, relationship, ID or phone"
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
                            <th className="p-2 text-left">Gender</th>
                            <th className="p-2 text-left">Relationship</th>
                            <th className="p-2 text-left">ID Number</th>
                            <th className="p-2 text-left">Phone</th>
                            <th className="p-2 text-left">Percentage</th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-50">
                        {filteredNextOfKin.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500">
                                    No matching records
                                </td>
                            </tr>
                        ) : (
                            filteredNextOfKin.map((nok) => (
                                <tr key={nok.Id} className="border-t hover:bg-gray-100">
                                    <td className="p-2 font-medium">{getFullName(nok)}</td>
                                    <td className="p-2">{getGender(nok)}</td>
                                    <td className="p-2">{getRelationship(nok)}</td>
                                    <td className="p-2">{nok.IdentityCardNumber || "N/A"}</td>
                                    <td className="p-2">{nok.AddressMobileLine || "N/A"}</td>
                                    <td className="p-2">{nok.NominatedPercentage ?? 0}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
