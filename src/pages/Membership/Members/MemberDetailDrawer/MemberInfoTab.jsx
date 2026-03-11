import React from "react";
import jsPDF from "jspdf";

export default function MemberInfoTab({ customer }) {

    const handlePrintPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();

        let y = 20;

        /* ================= HEADER ================= */
        doc.setFillColor(79, 70, 229); // indigo
        doc.rect(0, 0, pageWidth, 35, "F");

        doc.setTextColor(255);
        doc.setFontSize(18);
        doc.text("MEMBER PROFILE", 14, 22);

        doc.setFontSize(10);
        doc.text(
            `Generated on: ${new Date().toLocaleDateString()}`,
            pageWidth - 14,
            22,
            { align: "right" }
        );

        y = 45;
        doc.setTextColor(0);

        /* ================= HELPERS ================= */
        const drawSection = (title, fields) => {
            // Section title background
            doc.setFillColor(243, 244, 246); // light gray
            doc.rect(14, y, pageWidth - 28, 8, "F");

            doc.setFontSize(12);
            doc.setTextColor(55, 65, 81);
            doc.text(title.toUpperCase(), 16, y + 6);

            y += 12;

            doc.setFontSize(10);
            doc.setTextColor(0);

            let leftX = 16;
            let rightX = pageWidth / 2 + 4;
            let rowHeight = 6;

            fields.forEach((field, index) => {
                const x = index % 2 === 0 ? leftX : rightX;
                const currentY = y + Math.floor(index / 2) * rowHeight;

                doc.setFont(undefined, "bold");
                doc.text(`${field.label}:`, x, currentY);

                doc.setFont(undefined, "normal");
                doc.text(
                    `${field.value ?? "N/A"}`,
                    x + 35,
                    currentY,
                    { maxWidth: pageWidth / 2 - 45 }
                );
            });

            y += Math.ceil(fields.length / 2) * rowHeight + 6;

            // Page break
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
        };

        /* ================= SECTIONS ================= */
        drawSection("Personal Details", [
            { label: "Full Name", value: `${customer.IndividualFirstName} ${customer.IndividualLastName}` },
            { label: "Gender", value: customer.IndividualGenderDescription },
            { label: "Birth Date", value: customer.IndividualBirthDate && new Date(customer.IndividualBirthDate).toLocaleDateString() },
            { label: "Age", value: customer.Age },
        ]);

        drawSection("Identification", [
            { label: "ID Number", value: customer.IndividualIdentityCardNumber },
            { label: "Card Type", value: customer.IndividualIdentityCardTypeDescription },
            { label: "Record Status", value: customer.RecordStatusDescription },
        ]);

        drawSection("Employment Information", [
            { label: "Designation", value: customer.IndividualEmploymentDesignation },
            { label: "Terms of Service", value: customer.IndividualEmploymentTermsOfServiceDescription },
            { label: "Payroll No.", value: customer.IndividualPayrollNumbers },
        ]);

        drawSection("Contact & Address", [
            { label: "City", value: customer.AddressCity },
            { label: "Street", value: customer.AddressStreet },
            { label: "Email", value: customer.AddressEmail },
            { label: "Mobile", value: customer.AddressMobileLine },
        ]);

        /* ================= FOOTER ================= */
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth / 2,
                290,
                { align: "center" }
            );
        }

        doc.save(`Member_Profile_${customer.IndividualIdentityCardNumber}.pdf`);
    };


    if (!customer) return null;

    const Field = ({ label, value }) => (
        <p className="text-sm">
            <span className="font-medium">{label}: </span>
            {value ?? "N/A"}
        </p>
    );

    const Section = ({ title, children }) => (
        <div className="border rounded-xl bg-white shadow-sm mb-6 overflow-hidden">
            <div className="bg-gray-600 px-4 py-2 font-semibold text-white">
                {title}
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 text-gray-700">
                {children}
            </div>
        </div>
    );

    return (
        <>
            <div className="flex justify-end mb-4">
                {/* <button
                    onClick={handlePrintPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                    Export PDF
                </button> */}
            </div>

            <Section title="Personal Details">

                <Field label="Member No" value={customer.Reference2} />
                <Field label="Full Name" value={`${customer.IndividualFirstName} ${customer.IndividualLastName}`} />
                {/* <Field label="Gender" value={customer.IndividualGenderDescription} /> */}
                <Field label="Birth Date" value={customer.IndividualBirthDate && new Date(customer.IndividualBirthDate).toLocaleDateString()} />
                <Field label="Age" value={customer.Age} />

            </Section>

            <Section title="Identification">
                <Field label="ID Number" value={customer.IndividualIdentityCardNumber} />
                {/* <Field label="Card Type" value={customer.IndividualIdentityCardTypeDescription} /> */}
                <Field label="Type of Account" value={customer.TypeDescription} />
                <Field label="Personal Identification Number" value={customer.PersonalIdentificationNumber} />
                <Field label="File Number" value={customer.Reference3} />
                <Field label="Account No" value={customer.Reference1} />

            </Section>

            <Section title="Contact & Address">
                <Field label="Email" value={customer.AddressEmail} />
                <Field label="Mobile" value={customer.AddressMobileLine} />
            </Section>
        </>
    );
}
