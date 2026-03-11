import React, { useRef, useState, useEffect } from "react";
import {
  Building2,
  Phone,
  Mail,
  Calendar,
  Share2,
  Printer,
  Download,
  Filter,
} from "lucide-react";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";

export default function AnnualTaxReport() {
  const reportRef = useRef(null);
  const [reportData, setReportData] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const fetchTaxReport = async () => {
    setLoading(true);
    try {
      const response = await payrollsetupApiConfig.get("/annual-tax-reports/all");
      const body = response.data;

      if (body.success && Array.isArray(body.data) && body.data.length > 0) {
        setAllReports(body.data);
        setReportData(body.data[0]);
        setSelectedEmployee(body.data[0].EmployeeNumber);
      }
    } catch (err) {
      console.error("Error fetching tax report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxReport();
  }, []);

  const handleEmployeeChange = (empNumber) => {
    const report = allReports.find(r => r.EmployeeNumber === empNumber);
    if (report) {
      setSelectedEmployee(empNumber);
      setReportData(report);
    }
  };

  const getReportHTML = () => {
    if (!reportData) return "";

    // Calculate monthly values (divide annual by 12)
    const monthlyBasic = reportData.BasicSalary / 12;
    const monthlyBenefits = reportData.BenefitsNonCash / 12;
    const monthlyQuarters = reportData.ValueofQuarters / 12;
    const monthlyGross = reportData.TotalGrossPay / 12;
    const monthlyNSSF = reportData.NSSFContribution / 12;
    const monthlyAHL = reportData.HousingLevy / 12;
    const monthlySHIF = reportData.SHIFContribution / 12;
    const monthlyPRMF = reportData.PRMFContribution / 12;
    const monthlyOwnerInterest = reportData.OwnerOccupiedInterest / 12;
    const monthlyDeductions = reportData.TotalAllowableDeductions / 12;
    const monthlyChargeable = reportData.ChargeablePay / 12;
    const monthlyTaxCharged = reportData.TaxCharged / 12;
    const monthlyPersonalRelief = reportData.PersonalRelief / 12;
    const monthlyInsuranceRelief = Math.abs(reportData.InsuranceRelief) / 12;
    const monthlyPAYE = reportData.PAYEDeducted / 12;

    // Calculate E1 (30% of Basic Salary)
    const e1Monthly = monthlyBasic * 0.3;
    const e1Annual = reportData.BasicSalary * 0.3;

    const monthlyRows = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].map(month => `
        <tr>
          <td style="text-align:left;font-weight:600;padding:6px;">${month}</td>
          <td>${monthlyBasic.toFixed(2)}</td>
          <td>${monthlyBenefits.toFixed(2)}</td>
          <td>${monthlyQuarters.toFixed(2)}</td>
          <td style="font-weight:600;">${monthlyGross.toFixed(2)}</td>
          <td>${e1Monthly.toFixed(2)}</td>
          <td>${monthlyNSSF.toFixed(2)}</td>
          <td>30,000.00</td>
          <td>${monthlyAHL.toFixed(2)}</td>
          <td>${monthlySHIF.toFixed(2)}</td>
          <td>${monthlyPRMF.toFixed(2)}</td>
          <td>${monthlyOwnerInterest.toFixed(2)}</td>
          <td style="font-weight:600;">${monthlyDeductions.toFixed(2)}</td>
          <td style="font-weight:600;">${monthlyChargeable.toFixed(2)}</td>
          <td>${monthlyTaxCharged.toFixed(2)}</td>
          <td>${monthlyPersonalRelief.toFixed(2)}</td>
          <td>${monthlyInsuranceRelief.toFixed(2)}</td>
          <td style="font-weight:600;">${monthlyPAYE.toFixed(2)}</td>
        </tr>
      `).join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>P9A Tax Deduction Card ${reportData.TaxYear}</title>
        <style>
          @page { size: A4 landscape; margin: 0.5in; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            padding: 20px;
            background: white;
          }
          .container { max-width: 100%; }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
          .header p { font-size: 10px; margin-top: 2px; }
          .form-title { 
            font-size: 10px; 
            font-weight: bold; 
            text-align: center; 
            margin: 10px 0; 
            text-decoration: underline;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 15px;
            font-size: 10px;
          }
          .info-row {
            display: flex;
            gap: 8px;
            margin-bottom: 6px;
          }
          .info-row span:first-child { 
            font-weight: 600; 
            white-space: nowrap;
            min-width: 180px;
          }
          .info-row span:last-child {
            border-bottom: 1px dotted #333;
            flex: 1;
            padding-left: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px 4px;
            text-align: center;
          }
          th {
            background-color: #e8e8e8;
            font-weight: 700;
            line-height: 1.3;
            font-size: 7.5px;
          }
          tbody tr:last-child {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .footer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 15px;
            font-size: 9px;
          }
          .footer-section p {
            margin-bottom: 8px;
            font-weight: 600;
          }
          .notes {
            font-size: 7.5px;
            line-height: 1.5;
            margin-top: 15px;
          }
          .notes p { margin-bottom: 3px; }
          .notes .ml-4 { margin-left: 20px; }
          .notes ul { margin-left: 20px; }
          .notes li { margin-bottom: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KENYA REVENUE AUTHORITY</h1>
            <p>ISO 9001:2015 CERTIFIED</p>
          </div>

          <p style="font-size:9px;font-weight:bold;margin-bottom:6px;">APPENDIX 2A</p>
          <p class="form-title">KENYA REVENUE AUTHORITY DOMESTIC TAXES DEPARTMENT / TAX DEDUCTION CARD YEAR ${reportData.TaxYear}</p>

          <div class="info-section">
            <div>
              <div class="info-row">
                <span>Employer's Name:</span>
                <span>${reportData.EmployerName}</span>
              </div>
              <div class="info-row">
                <span>Employee's Main Name:</span>
                <span>${reportData.EmployeeMainName}</span>
              </div>
              <div class="info-row">
                <span>Employee's Other Names:</span>
                <span>${reportData.EmployeeOtherNames}</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span>Employer's PIN:</span>
                <span>${reportData.EmployerKRAPIN}</span>
              </div>
              <div class="info-row">
                <span>Employee's PIN:</span>
                <span>${reportData.EmployeeKRAPIN}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="3" style="width:70px;">MONTH</th>
                <th colspan="3">BASIC SALARY & OTHER CASH EMOLUMENTS</th>
                <th rowspan="3" style="width:65px;">Total Gross Pay<br/><br/>Kshs.<br/>(D)</th>
                <th colspan="3">Defined Contribution Retirement Scheme</th>
                <th rowspan="3" style="width:60px;">Affordable Housing Levy (AHL)<br/><br/>Kshs.<br/>(F)</th>
                <th rowspan="3" style="width:60px;">Social Health Insurance Fund (SHIF)<br/><br/>Kshs.<br/>(G)</th>
                <th rowspan="3" style="width:60px;">Post Retirement Medical Fund (PRMF)<br/><br/>Kshs.<br/>(H)</th>
                <th rowspan="3" style="width:60px;">Owner-Occupied Interest<br/><br/>Kshs.<br/>(I)</th>
                <th rowspan="3" style="width:65px;">Total Deductions<br/>(Lower of E+F+G+H+I)<br/>Kshs.<br/>(J)</th>
                <th rowspan="3" style="width:65px;">Chargeable Pay<br/>(D-J)<br/>Kshs.<br/>(K)</th>
                <th rowspan="3" style="width:60px;">Tax Charged<br/><br/>Kshs.<br/>(L)</th>
                <th rowspan="3" style="width:60px;">Personal Relief<br/><br/>Kshs.<br/>(M)</th>
                <th rowspan="3" style="width:60px;">Insurance Relief<br/><br/>Kshs.<br/>(N)</th>
                <th rowspan="3" style="width:60px;">PAYE Tax<br/>(L-M-N)<br/>Kshs.<br/>(O)</th>
              </tr>
              <tr>
                <th>Basic Salary<br/><br/>Kshs.<br/>(A)</th>
                <th>Benefits-NonCash<br/><br/>Kshs.<br/>(B)</th>
                <th>Value of Quarters<br/><br/>Kshs.<br/>(C)</th>
                <th colspan="3">(E)</th>
              </tr>
              <tr>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>E1<br/>30% of A</th>
                <th>E2<br/>Actual</th>
                <th>E3<br/>Fixed<br/>30,000 p.m</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRows}
              <tr style="background:#f5f5f5;font-weight:bold;">
                <td style="text-align:left;padding:6px;">TOTAL</td>
                <td>${reportData.BasicSalary.toFixed(2)}</td>
                <td>${reportData.BenefitsNonCash.toFixed(2)}</td>
                <td>${reportData.ValueofQuarters.toFixed(2)}</td>
                <td>${reportData.TotalGrossPay.toFixed(2)}</td>
                <td>${e1Annual.toFixed(2)}</td>
                <td>${reportData.NSSFContribution.toFixed(2)}</td>
                <td>360,000.00</td>
                <td>${reportData.HousingLevy.toFixed(2)}</td>
                <td>${reportData.SHIFContribution.toFixed(2)}</td>
                <td>${reportData.PRMFContribution.toFixed(2)}</td>
                <td>${reportData.OwnerOccupiedInterest.toFixed(2)}</td>
                <td>${reportData.TotalAllowableDeductions.toFixed(2)}</td>
                <td>${reportData.ChargeablePay.toFixed(2)}</td>
                <td>${reportData.TaxCharged.toFixed(2)}</td>
                <td>${reportData.PersonalRelief.toFixed(2)}</td>
                <td>${Math.abs(reportData.InsuranceRelief).toFixed(2)}</td>
                <td>${reportData.PAYEDeducted.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-section">
            <div>
              <p>To be completed by Employer at end of year:</p>
              <div class="info-row">
                <span>TOTAL CHARGEABLE PAY (COL. K) Kshs.</span>
                <span>${reportData.ChargeablePay.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span>TOTAL TAX (COL. O) Kshs.</span>
                <span>${reportData.PAYEDeducted.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <p style="font-weight:600;">Declaration by Employee:</p>
              <p style="font-size:8px;margin-bottom:8px;">I declare that the information given above is true, correct and complete. If during the year my circumstances change, I will advise you accordingly.</p>
              <div class="info-row">
                <span>Signature:</span>
                <span></span>
              </div>
              <div class="info-row">
                <span>Date:</span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "", "width=1200,height=800");
    const htmlContent = getReportHTML();
    if (!printWindow) return;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const handleExportWord = () => {
    const htmlContent = getReportHTML();
    const blob = new Blob(["\ufeff" + htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `P9A_${reportData.EmployeeNumber}_${reportData.TaxYear}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    
    let csv = "\ufeff";
    csv += `P9A TAX DEDUCTION CARD - ${reportData.TaxYear}\n\n`;
    csv += `Employer Name:,${reportData.EmployerName}\n`;
    csv += `Employer PIN:,${reportData.EmployerKRAPIN}\n`;
    csv += `Employee Name:,${reportData.EmployeeMainName} ${reportData.EmployeeOtherNames}\n`;
    csv += `Employee PIN:,${reportData.EmployeeKRAPIN}\n`;
    csv += `Employee Number:,${reportData.EmployeeNumber}\n\n`;
    
    csv += "MONTH,Basic Salary (A),Benefits NonCash (B),Value of Quarters (C),Total Gross (D),E1 (30% of A),E2 (NSSF),E3 (Fixed),AHL (F),SHIF (G),PRMF (H),Owner Interest (I),Total Deductions (J),Chargeable Pay (K),Tax Charged (L),Personal Relief (M),Insurance Relief (N),PAYE (O)\n";
    
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    months.forEach(month => {
      const monthlyBasic = reportData.BasicSalary / 12;
      const monthlyBenefits = reportData.BenefitsNonCash / 12;
      const monthlyQuarters = reportData.ValueofQuarters / 12;
      const monthlyGross = reportData.TotalGrossPay / 12;
      const e1Monthly = monthlyBasic * 0.3;
      const monthlyNSSF = reportData.NSSFContribution / 12;
      const monthlyAHL = reportData.HousingLevy / 12;
      const monthlySHIF = reportData.SHIFContribution / 12;
      const monthlyPRMF = reportData.PRMFContribution / 12;
      const monthlyOwner = reportData.OwnerOccupiedInterest / 12;
      const monthlyDeductions = reportData.TotalAllowableDeductions / 12;
      const monthlyChargeable = reportData.ChargeablePay / 12;
      const monthlyTax = reportData.TaxCharged / 12;
      const monthlyRelief = reportData.PersonalRelief / 12;
      const monthlyInsurance = Math.abs(reportData.InsuranceRelief) / 12;
      const monthlyPAYE = reportData.PAYEDeducted / 12;
      
      csv += `${month},${monthlyBasic.toFixed(2)},${monthlyBenefits.toFixed(2)},${monthlyQuarters.toFixed(2)},${monthlyGross.toFixed(2)},${e1Monthly.toFixed(2)},${monthlyNSSF.toFixed(2)},30000.00,${monthlyAHL.toFixed(2)},${monthlySHIF.toFixed(2)},${monthlyPRMF.toFixed(2)},${monthlyOwner.toFixed(2)},${monthlyDeductions.toFixed(2)},${monthlyChargeable.toFixed(2)},${monthlyTax.toFixed(2)},${monthlyRelief.toFixed(2)},${monthlyInsurance.toFixed(2)},${monthlyPAYE.toFixed(2)}\n`;
    });
    
    csv += `TOTAL,${reportData.BasicSalary.toFixed(2)},${reportData.BenefitsNonCash.toFixed(2)},${reportData.ValueofQuarters.toFixed(2)},${reportData.TotalGrossPay.toFixed(2)},${(reportData.BasicSalary * 0.3).toFixed(2)},${reportData.NSSFContribution.toFixed(2)},360000.00,${reportData.HousingLevy.toFixed(2)},${reportData.SHIFContribution.toFixed(2)},${reportData.PRMFContribution.toFixed(2)},${reportData.OwnerOccupiedInterest.toFixed(2)},${reportData.TotalAllowableDeductions.toFixed(2)},${reportData.ChargeablePay.toFixed(2)},${reportData.TaxCharged.toFixed(2)},${reportData.PersonalRelief.toFixed(2)},${Math.abs(reportData.InsuranceRelief).toFixed(2)},${reportData.PAYEDeducted.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `P9A_${reportData.EmployeeNumber}_${reportData.TaxYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=1200,height=800");
    const htmlContent = getReportHTML();
    if (!printWindow) return;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tax reports...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-gray-500 mb-4">No tax report data available</p>
          <button 
            onClick={fetchTaxReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-container { 
            box-shadow: none !important; 
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex justify-between items-center px-6 py-4 bg-white shadow-md sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-gray-800">P9A Tax Deduction Card</h1>
          <p className="text-sm text-gray-600">{reportData.EmployeeMainName} - {reportData.TaxYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Filter"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Export as PDF"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">PDF</span>
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Export as Word"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Word</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Export as Excel"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm">Print</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="no-print bg-white shadow-md px-6 py-4 border-b">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-gray-700 mb-3">Select Employee</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {allReports.map((report) => (
                <button
                  key={report.EmployeeNumber}
                  onClick={() => handleEmployeeChange(report.EmployeeNumber)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    selectedEmployee === report.EmployeeNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <p className="font-semibold text-sm">{report.EmployeeMainName}</p>
                  <p className="text-xs opacity-75">ID: {report.EmployeeNumber}</p>
                  <p className="text-xs opacity-75">PIN: {report.EmployeeKRAPIN}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview */}
      <div className="flex justify-center px-4 py-8">
        <div
          ref={reportRef}
          className="print-container w-full max-w-7xl bg-white shadow-2xl rounded-lg p-10 border border-gray-200"
        >
          {/* KRA Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-black">
            <h1 className="text-2xl font-bold text-gray-900">KENYA REVENUE AUTHORITY</h1>
            <p className="text-sm text-gray-700 mt-1">ISO 9001:2015 CERTIFIED</p>
          </div>

          <p className="text-sm font-bold mb-2">APPENDIX 2A</p>
          <p className="text-center text-sm font-bold mb-6 underline">
            KENYA REVENUE AUTHORITY DOMESTIC TAXES DEPARTMENT / TAX DEDUCTION CARD YEAR {reportData.TaxYear}
          </p>

          {/* Employer & Employee Info */}
          <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[180px]">Employer's Name:</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.EmployerName}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[180px]">Employee's Main Name:</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.EmployeeMainName}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[180px]">Employee's Other Names:</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.EmployeeOtherNames}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[150px]">Employer's PIN:</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.EmployerKRAPIN}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[150px]">Employee's PIN:</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.EmployeeKRAPIN}
                </span>
              </div>
            </div>
          </div>

          {/* P9A Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-[8px]">
              <thead>
                <tr>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    MONTH
                  </th>
                  <th colSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    BASIC SALARY & OTHER CASH EMOLUMENTS
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Total Gross Pay<br/><br/>Kshs.<br/>(D)
                  </th>
                  <th colSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Defined Contribution Retirement Scheme
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Affordable Housing Levy (AHL)<br/><br/>Kshs.<br/>(F)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Social Health Insurance Fund (SHIF)<br/><br/>Kshs.<br/>(G)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Post Retirement Medical Fund (PRMF)<br/><br/>Kshs.<br/>(H)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Owner-Occupied Interest<br/><br/>Kshs.<br/>(I)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Total Deductions<br/>(Lower of E+F+G+H+I)<br/>Kshs.<br/>(J)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Chargeable Pay<br/>(D-J)<br/>Kshs.<br/>(K)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Tax Charged<br/><br/>Kshs.<br/>(L)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Personal Relief<br/><br/>Kshs.<br/>(M)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    Insurance Relief<br/><br/>Kshs.<br/>(N)
                  </th>
                  <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    PAYE Tax<br/>(L-M-N)<br/>Kshs.<br/>(O)
                  </th>
                </tr>
                <tr>
                  <th className="border border-black p-2 bg-gray-100 font-bold">
                    Basic Salary<br/><br/>Kshs.<br/>(A)
                  </th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">
                    Benefits-NonCash<br/><br/>Kshs.<br/>(B)
                  </th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">
                    Value of Quarters<br/><br/>Kshs.<br/>(C)
                  </th>
                  <th colSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
                    (E)
                  </th>
                </tr>
                <tr>
                  <th className="border border-black p-2 bg-gray-100 font-bold">A</th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">B</th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">C</th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">
                    E1<br/>30% of A
                  </th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">
                    E2<br/>Actual
                  </th>
                  <th className="border border-black p-2 bg-gray-100 font-bold">
                    E3<br/>Fixed<br/>30,000 p.m
                  </th>
                </tr>
              </thead>
              <tbody>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => {
                  const monthlyBasic = reportData.BasicSalary / 12;
                  const monthlyBenefits = reportData.BenefitsNonCash / 12;
                  const monthlyQuarters = reportData.ValueofQuarters / 12;
                  const monthlyGross = reportData.TotalGrossPay / 12;
                  const e1Monthly = monthlyBasic * 0.3;
                  const monthlyNSSF = reportData.NSSFContribution / 12;
                  const monthlyAHL = reportData.HousingLevy / 12;
                  const monthlySHIF = reportData.SHIFContribution / 12;
                  const monthlyPRMF = reportData.PRMFContribution / 12;
                  const monthlyOwner = reportData.OwnerOccupiedInterest / 12;
                  const monthlyDeductions = reportData.TotalAllowableDeductions / 12;
                  const monthlyChargeable = reportData.ChargeablePay / 12;
                  const monthlyTax = reportData.TaxCharged / 12;
                  const monthlyRelief = reportData.PersonalRelief / 12;
                  const monthlyInsurance = Math.abs(reportData.InsuranceRelief) / 12;
                  const monthlyPAYE = reportData.PAYEDeducted / 12;

                  return (
                    <tr key={month}>
                      <td className="border border-black p-2 text-left font-semibold">{month}</td>
                      <td className="border border-black p-2 text-center">{monthlyBasic.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyBenefits.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyQuarters.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center font-semibold">{monthlyGross.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{e1Monthly.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyNSSF.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">30,000.00</td>
                      <td className="border border-black p-2 text-center">{monthlyAHL.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlySHIF.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyPRMF.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyOwner.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center font-semibold">{monthlyDeductions.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center font-semibold">{monthlyChargeable.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyTax.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyRelief.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center">{monthlyInsurance.toFixed(2)}</td>
                      <td className="border border-black p-2 text-center font-semibold">{monthlyPAYE.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-black p-2 text-left">TOTAL</td>
                  <td className="border border-black p-2 text-center">{reportData.BasicSalary.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.BenefitsNonCash.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.ValueofQuarters.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.TotalGrossPay.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{(reportData.BasicSalary * 0.3).toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.NSSFContribution.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">360,000.00</td>
                  <td className="border border-black p-2 text-center">{reportData.HousingLevy.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.SHIFContribution.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.PRMFContribution.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.OwnerOccupiedInterest.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.TotalAllowableDeductions.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.ChargeablePay.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.TaxCharged.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.PersonalRelief.toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{Math.abs(reportData.InsuranceRelief).toFixed(2)}</td>
                  <td className="border border-black p-2 text-center">{reportData.PAYEDeducted.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
            <div>
              <p className="font-semibold mb-3">To be completed by Employer at end of year:</p>
              <div className="flex gap-2 mb-2">
                <span className="font-semibold min-w-[250px]">TOTAL CHARGEABLE PAY (COL. K) Kshs.</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.ChargeablePay.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[250px]">TOTAL TAX (COL. O) Kshs.</span>
                <span className="border-b border-dotted border-gray-600 flex-1 px-2">
                  {reportData.PAYEDeducted.toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-3">Declaration by Employee:</p>
              <p className="text-xs mb-3 text-gray-700">
                I declare that the information given above is true, correct and complete. 
                If during the year my circumstances change, I will advise you accordingly.
              </p>
              <div className="flex gap-2 mb-2">
                <span className="font-semibold min-w-[100px]">Signature:</span>
                <span className="border-b border-dotted border-gray-600 flex-1"></span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[100px]">Date:</span>
                <span className="border-b border-dotted border-gray-600 flex-1"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// import React, { useRef, useState, useEffect } from "react";
// import {
//   Building2,
//   Phone,
//   Mail,
//   Calendar,
//   Share2,
//   Printer,
//   Download,
//   Filter,
// } from "lucide-react";
// import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";

// export default function AnnualTaxReport() {
//   const reportRef = useRef(null);
//   const [reportData, setReportData] = useState(null);
//   const [allReports, setAllReports] = useState([]);
//   const [selectedEmployee, setSelectedEmployee] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showFilter, setShowFilter] = useState(false);
//   const [filterEmployeeNumber, setFilterEmployeeNumber] = useState("");
//   const [filterYear, setFilterYear] = useState("");
//   const [filterError, setFilterError] = useState("");

//   const fetchTaxReport = async (employeeNumber = null, year = null) => {
//     setLoading(true);
//     setFilterError("");
//     try {
//       let endpoint = "/annual-tax-reports/all";
      
//       // If both filters provided, use specific endpoint
//       if (employeeNumber && year) {
//         endpoint = `/annual-tax-reports?employeeNumber=${employeeNumber}&year=${year}`;
//       }
      
//       const response = await payrollsetupApiConfig.get(endpoint);
//       const body = response.data;

//       if (body.success && Array.isArray(body.data) && body.data.length > 0) {
//         setAllReports(body.data);
//         setReportData(body.data[0]);
//         setSelectedEmployee(body.data[0].EmployeeNumber);
//       } else {
//         setFilterError("No tax report found for the specified criteria");
//         setReportData(null);
//       }
//     } catch (err) {
//       console.error("Error fetching tax report:", err);
//       setFilterError("Error fetching tax report. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTaxReport();
//   }, []);

//   const handleFilterSubmit = () => {
//     // Validate inputs
//     if (!filterEmployeeNumber || !filterYear) {
//       setFilterError("Please enter both employee number and year");
//       return;
//     }

//     const year = parseInt(filterYear);
//     const currentYear = new Date().getFullYear();
    
//     // Tax report for a year is available in the following year
//     // e.g., 2024 tax report available in 2025, 2025 tax report available in 2026
//     const maxAvailableYear = currentYear - 1;
    
//     if (year > maxAvailableYear) {
//       setFilterError(`Tax report for ${year} will be available in ${year + 1}`);
//       return;
//     }
    
//     if (year < 2000) {
//       setFilterError("Please enter a valid year (2000 or later)");
//       return;
//     }

//     fetchTaxReport(filterEmployeeNumber, year);
//     setShowFilter(false);
//   };

//   const handleClearFilter = () => {
//     setFilterEmployeeNumber("");
//     setFilterYear("");
//     setFilterError("");
//     fetchTaxReport();
//   };

//   const getReportHTML = () => {
//     if (!reportData) return "";

//     // Calculate monthly values (divide annual by 12)
//     const monthlyBasic = reportData.BasicSalary / 12;
//     const monthlyBenefits = reportData.BenefitsNonCash / 12;
//     const monthlyQuarters = reportData.ValueofQuarters / 12;
//     const monthlyGross = reportData.TotalGrossPay / 12;
//     const monthlyNSSF = reportData.NSSFContribution / 12;
//     const monthlyAHL = reportData.HousingLevy / 12;
//     const monthlySHIF = reportData.SHIFContribution / 12;
//     const monthlyPRMF = reportData.PRMFContribution / 12;
//     const monthlyOwnerInterest = reportData.OwnerOccupiedInterest / 12;
//     const monthlyDeductions = reportData.TotalAllowableDeductions / 12;
//     const monthlyChargeable = reportData.ChargeablePay / 12;
//     const monthlyTaxCharged = reportData.TaxCharged / 12;
//     const monthlyPersonalRelief = reportData.PersonalRelief / 12;
//     const monthlyInsuranceRelief = Math.abs(reportData.InsuranceRelief) / 12;
//     const monthlyPAYE = reportData.PAYEDeducted / 12;

//     // Calculate E1 (30% of Basic Salary)
//     const e1Monthly = monthlyBasic * 0.3;
//     const e1Annual = reportData.BasicSalary * 0.3;

//     const monthlyRows = [
//       "January", "February", "March", "April", "May", "June",
//       "July", "August", "September", "October", "November", "December"
//     ].map(month => `
//         <tr>
//           <td style="text-align:left;font-weight:600;padding:6px;">${month}</td>
//           <td>${monthlyBasic.toFixed(2)}</td>
//           <td>${monthlyBenefits.toFixed(2)}</td>
//           <td>${monthlyQuarters.toFixed(2)}</td>
//           <td style="font-weight:600;">${monthlyGross.toFixed(2)}</td>
//           <td>${e1Monthly.toFixed(2)}</td>
//           <td>${monthlyNSSF.toFixed(2)}</td>
//           <td>30,000.00</td>
//           <td>${monthlyAHL.toFixed(2)}</td>
//           <td>${monthlySHIF.toFixed(2)}</td>
//           <td>${monthlyPRMF.toFixed(2)}</td>
//           <td>${monthlyOwnerInterest.toFixed(2)}</td>
//           <td style="font-weight:600;">${monthlyDeductions.toFixed(2)}</td>
//           <td style="font-weight:600;">${monthlyChargeable.toFixed(2)}</td>
//           <td>${monthlyTaxCharged.toFixed(2)}</td>
//           <td>${monthlyPersonalRelief.toFixed(2)}</td>
//           <td>${monthlyInsuranceRelief.toFixed(2)}</td>
//           <td style="font-weight:600;">${monthlyPAYE.toFixed(2)}</td>
//         </tr>
//       `).join("");

//     return `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <title>P9A Tax Deduction Card ${reportData.TaxYear}</title>
//         <style>
//           @page { size: A4 landscape; margin: 0.5in; }
//           * { box-sizing: border-box; margin: 0; padding: 0; }
//           body {
//             font-family: Arial, sans-serif;
//             font-size: 9px;
//             padding: 20px;
//             background: white;
//           }
//           .container { max-width: 100%; }
//           .header { text-align: center; margin-bottom: 15px; }
//           .header h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
//           .header p { font-size: 10px; margin-top: 2px; }
//           .form-title { 
//             font-size: 10px; 
//             font-weight: bold; 
//             text-align: center; 
//             margin: 10px 0; 
//             text-decoration: underline;
//           }
//           .info-section {
//             display: grid;
//             grid-template-columns: 1fr 1fr;
//             gap: 30px;
//             margin-bottom: 15px;
//             font-size: 10px;
//           }
//           .info-row {
//             display: flex;
//             gap: 8px;
//             margin-bottom: 6px;
//           }
//           .info-row span:first-child { 
//             font-weight: 600; 
//             white-space: nowrap;
//             min-width: 180px;
//           }
//           .info-row span:last-child {
//             border-bottom: 1px dotted #333;
//             flex: 1;
//             padding-left: 8px;
//           }
//           table {
//             width: 100%;
//             border-collapse: collapse;
//             font-size: 8px;
//             margin-bottom: 15px;
//           }
//           th, td {
//             border: 1px solid #000;
//             padding: 5px 4px;
//             text-align: center;
//           }
//           th {
//             background-color: #e8e8e8;
//             font-weight: 700;
//             line-height: 1.3;
//             font-size: 7.5px;
//           }
//           tbody tr:last-child {
//             background-color: #f5f5f5;
//             font-weight: bold;
//           }
//           .footer-section {
//             display: grid;
//             grid-template-columns: 1fr 1fr;
//             gap: 30px;
//             margin-top: 15px;
//             font-size: 9px;
//           }
//           .footer-section p {
//             margin-bottom: 8px;
//             font-weight: 600;
//           }
//           .notes {
//             font-size: 7.5px;
//             line-height: 1.5;
//             margin-top: 15px;
//           }
//           .notes p { margin-bottom: 3px; }
//           .notes .ml-4 { margin-left: 20px; }
//           .notes ul { margin-left: 20px; }
//           .notes li { margin-bottom: 2px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>KENYA REVENUE AUTHORITY</h1>
//             <p>ISO 9001:2015 CERTIFIED</p>
//           </div>

//           <p style="font-size:9px;font-weight:bold;margin-bottom:6px;">APPENDIX 2A</p>
//           <p class="form-title">KENYA REVENUE AUTHORITY DOMESTIC TAXES DEPARTMENT / TAX DEDUCTION CARD YEAR ${reportData.TaxYear}</p>

//           <div class="info-section">
//             <div>
//               <div class="info-row">
//                 <span>Employer's Name:</span>
//                 <span>${reportData.EmployerName}</span>
//               </div>
//               <div class="info-row">
//                 <span>Employee's Main Name:</span>
//                 <span>${reportData.EmployeeMainName}</span>
//               </div>
//               <div class="info-row">
//                 <span>Employee's Other Names:</span>
//                 <span>${reportData.EmployeeOtherNames}</span>
//               </div>
//             </div>
//             <div>
//               <div class="info-row">
//                 <span>Employer's PIN:</span>
//                 <span>${reportData.EmployerKRAPIN}</span>
//               </div>
//               <div class="info-row">
//                 <span>Employee's PIN:</span>
//                 <span>${reportData.EmployeeKRAPIN}</span>
//               </div>
//             </div>
//           </div>

//           <table>
//             <thead>
//               <tr>
//                 <th rowspan="3" style="width:70px;">MONTH</th>
//                 <th colspan="3">BASIC SALARY & OTHER CASH EMOLUMENTS</th>
//                 <th rowspan="3" style="width:65px;">Total Gross Pay<br/><br/>Kshs.<br/>(D)</th>
//                 <th colspan="3">Defined Contribution Retirement Scheme</th>
//                 <th rowspan="3" style="width:60px;">Affordable Housing Levy (AHL)<br/><br/>Kshs.<br/>(F)</th>
//                 <th rowspan="3" style="width:60px;">Social Health Insurance Fund (SHIF)<br/><br/>Kshs.<br/>(G)</th>
//                 <th rowspan="3" style="width:60px;">Post Retirement Medical Fund (PRMF)<br/><br/>Kshs.<br/>(H)</th>
//                 <th rowspan="3" style="width:60px;">Owner-Occupied Interest<br/><br/>Kshs.<br/>(I)</th>
//                 <th rowspan="3" style="width:65px;">Total Deductions<br/>(Lower of E+F+G+H+I)<br/>Kshs.<br/>(J)</th>
//                 <th rowspan="3" style="width:65px;">Chargeable Pay<br/>(D-J)<br/>Kshs.<br/>(K)</th>
//                 <th rowspan="3" style="width:60px;">Tax Charged<br/><br/>Kshs.<br/>(L)</th>
//                 <th rowspan="3" style="width:60px;">Personal Relief<br/><br/>Kshs.<br/>(M)</th>
//                 <th rowspan="3" style="width:60px;">Insurance Relief<br/><br/>Kshs.<br/>(N)</th>
//                 <th rowspan="3" style="width:60px;">PAYE Tax<br/>(L-M-N)<br/>Kshs.<br/>(O)</th>
//               </tr>
//               <tr>
//                 <th>Basic Salary<br/><br/>Kshs.<br/>(A)</th>
//                 <th>Benefits-NonCash<br/><br/>Kshs.<br/>(B)</th>
//                 <th>Value of Quarters<br/><br/>Kshs.<br/>(C)</th>
//                 <th colspan="3">(E)</th>
//               </tr>
//               <tr>
//                 <th>A</th>
//                 <th>B</th>
//                 <th>C</th>
//                 <th>E1<br/>30% of A</th>
//                 <th>E2<br/>Actual</th>
//                 <th>E3<br/>Fixed<br/>30,000 p.m</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${monthlyRows}
//               <tr style="background:#f5f5f5;font-weight:bold;">
//                 <td style="text-align:left;padding:6px;">TOTAL</td>
//                 <td>${reportData.BasicSalary.toFixed(2)}</td>
//                 <td>${reportData.BenefitsNonCash.toFixed(2)}</td>
//                 <td>${reportData.ValueofQuarters.toFixed(2)}</td>
//                 <td>${reportData.TotalGrossPay.toFixed(2)}</td>
//                 <td>${e1Annual.toFixed(2)}</td>
//                 <td>${reportData.NSSFContribution.toFixed(2)}</td>
//                 <td>360,000.00</td>
//                 <td>${reportData.HousingLevy.toFixed(2)}</td>
//                 <td>${reportData.SHIFContribution.toFixed(2)}</td>
//                 <td>${reportData.PRMFContribution.toFixed(2)}</td>
//                 <td>${reportData.OwnerOccupiedInterest.toFixed(2)}</td>
//                 <td>${reportData.TotalAllowableDeductions.toFixed(2)}</td>
//                 <td>${reportData.ChargeablePay.toFixed(2)}</td>
//                 <td>${reportData.TaxCharged.toFixed(2)}</td>
//                 <td>${reportData.PersonalRelief.toFixed(2)}</td>
//                 <td>${Math.abs(reportData.InsuranceRelief).toFixed(2)}</td>
//                 <td>${reportData.PAYEDeducted.toFixed(2)}</td>
//               </tr>
//             </tbody>
//           </table>

//           <div class="footer-section">
//             <div>
//               <p>To be completed by Employer at end of year:</p>
//               <div class="info-row">
//                 <span>TOTAL CHARGEABLE PAY (COL. K) Kshs.</span>
//                 <span>${reportData.ChargeablePay.toFixed(2)}</span>
//               </div>
//               <div class="info-row">
//                 <span>TOTAL TAX (COL. O) Kshs.</span>
//                 <span>${reportData.PAYEDeducted.toFixed(2)}</span>
//               </div>
//             </div>
//             <div>
//               <p style="font-weight:600;">Declaration by Employee:</p>
//               <p style="font-size:8px;margin-bottom:8px;">I declare that the information given above is true, correct and complete. If during the year my circumstances change, I will advise you accordingly.</p>
//               <div class="info-row">
//                 <span>Signature:</span>
//                 <span></span>
//               </div>
//               <div class="info-row">
//                 <span>Date:</span>
//                 <span></span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   };

//   const handleExportPDF = () => {
//     const printWindow = window.open("", "", "width=1200,height=800");
//     const htmlContent = getReportHTML();
//     if (!printWindow) return;
//     printWindow.document.write(htmlContent);
//     printWindow.document.close();
//     setTimeout(() => {
//       printWindow.focus();
//       printWindow.print();
//     }, 500);
//   };

//   const handleExportWord = () => {
//     const htmlContent = getReportHTML();
//     const blob = new Blob(["\ufeff" + htmlContent], {
//       type: "application/msword",
//     });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `P9A_${reportData.EmployeeNumber}_${reportData.TaxYear}.doc`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//   };

//   const handleExportExcel = () => {
//     if (!reportData) return;
    
//     let csv = "\ufeff";
//     csv += `P9A TAX DEDUCTION CARD - ${reportData.TaxYear}\n\n`;
//     csv += `Employer Name:,${reportData.EmployerName}\n`;
//     csv += `Employer PIN:,${reportData.EmployerKRAPIN}\n`;
//     csv += `Employee Name:,${reportData.EmployeeMainName} ${reportData.EmployeeOtherNames}\n`;
//     csv += `Employee PIN:,${reportData.EmployeeKRAPIN}\n`;
//     csv += `Employee Number:,${reportData.EmployeeNumber}\n\n`;
    
//     csv += "MONTH,Basic Salary (A),Benefits NonCash (B),Value of Quarters (C),Total Gross (D),E1 (30% of A),E2 (NSSF),E3 (Fixed),AHL (F),SHIF (G),PRMF (H),Owner Interest (I),Total Deductions (J),Chargeable Pay (K),Tax Charged (L),Personal Relief (M),Insurance Relief (N),PAYE (O)\n";
    
//     const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
//     months.forEach(month => {
//       const monthlyBasic = reportData.BasicSalary / 12;
//       const monthlyBenefits = reportData.BenefitsNonCash / 12;
//       const monthlyQuarters = reportData.ValueofQuarters / 12;
//       const monthlyGross = reportData.TotalGrossPay / 12;
//       const e1Monthly = monthlyBasic * 0.3;
//       const monthlyNSSF = reportData.NSSFContribution / 12;
//       const monthlyAHL = reportData.HousingLevy / 12;
//       const monthlySHIF = reportData.SHIFContribution / 12;
//       const monthlyPRMF = reportData.PRMFContribution / 12;
//       const monthlyOwner = reportData.OwnerOccupiedInterest / 12;
//       const monthlyDeductions = reportData.TotalAllowableDeductions / 12;
//       const monthlyChargeable = reportData.ChargeablePay / 12;
//       const monthlyTax = reportData.TaxCharged / 12;
//       const monthlyRelief = reportData.PersonalRelief / 12;
//       const monthlyInsurance = Math.abs(reportData.InsuranceRelief) / 12;
//       const monthlyPAYE = reportData.PAYEDeducted / 12;
      
//       csv += `${month},${monthlyBasic.toFixed(2)},${monthlyBenefits.toFixed(2)},${monthlyQuarters.toFixed(2)},${monthlyGross.toFixed(2)},${e1Monthly.toFixed(2)},${monthlyNSSF.toFixed(2)},30000.00,${monthlyAHL.toFixed(2)},${monthlySHIF.toFixed(2)},${monthlyPRMF.toFixed(2)},${monthlyOwner.toFixed(2)},${monthlyDeductions.toFixed(2)},${monthlyChargeable.toFixed(2)},${monthlyTax.toFixed(2)},${monthlyRelief.toFixed(2)},${monthlyInsurance.toFixed(2)},${monthlyPAYE.toFixed(2)}\n`;
//     });
    
//     csv += `TOTAL,${reportData.BasicSalary.toFixed(2)},${reportData.BenefitsNonCash.toFixed(2)},${reportData.ValueofQuarters.toFixed(2)},${reportData.TotalGrossPay.toFixed(2)},${(reportData.BasicSalary * 0.3).toFixed(2)},${reportData.NSSFContribution.toFixed(2)},360000.00,${reportData.HousingLevy.toFixed(2)},${reportData.SHIFContribution.toFixed(2)},${reportData.PRMFContribution.toFixed(2)},${reportData.OwnerOccupiedInterest.toFixed(2)},${reportData.TotalAllowableDeductions.toFixed(2)},${reportData.ChargeablePay.toFixed(2)},${reportData.TaxCharged.toFixed(2)},${reportData.PersonalRelief.toFixed(2)},${Math.abs(reportData.InsuranceRelief).toFixed(2)},${reportData.PAYEDeducted.toFixed(2)}\n`;

//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `P9A_${reportData.EmployeeNumber}_${reportData.TaxYear}.csv`;
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     URL.revokeObjectURL(url);
//   };

//   const handlePrint = () => {
//     const printWindow = window.open("", "", "width=1200,height=800");
//     const htmlContent = getReportHTML();
//     if (!printWindow) return;
//     printWindow.document.write(htmlContent);
//     printWindow.document.close();
//     setTimeout(() => {
//       printWindow.focus();
//       printWindow.print();
//     }, 500);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading tax reports...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!reportData) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="bg-white p-8 rounded-lg shadow-lg text-center">
//           <p className="text-gray-500 mb-4">No tax report data available</p>
//           <button 
//             onClick={() => fetchTaxReport()}
//             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <style>{`
//         @media print {
//           body { margin: 0; padding: 0; background: white !important; }
//           .no-print { display: none !important; }
//           .print-container { 
//             box-shadow: none !important; 
//             border: none !important;
//             max-width: 100% !important;
//             margin: 0 !important;
//             padding: 20px !important;
//           }
//         }
//       `}</style>

//       {/* Toolbar */}
//       <div className="no-print flex justify-between items-center px-6 py-4 bg-white shadow-md sticky top-0 z-50">
//         <div>
//           <h1 className="text-xl font-bold text-gray-800">P9A Tax Deduction Card</h1>
//           <p className="text-sm text-gray-600">{reportData.EmployeeMainName} - {reportData.TaxYear}</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => setShowFilter(!showFilter)}
//             className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
//             title="Filter"
//           >
//             <Filter className="w-4 h-4" />
//             <span className="text-sm">Filter</span>
//           </button>
//           <button
//             onClick={handleExportPDF}
//             className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
//             title="Export as PDF"
//           >
//             <Download className="w-4 h-4" />
//             <span className="text-sm">PDF</span>
//           </button>
//           <button
//             onClick={handleExportWord}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             title="Export as Word"
//           >
//             <Download className="w-4 h-4" />
//             <span className="text-sm">Word</span>
//           </button>
//           <button
//             onClick={handleExportExcel}
//             className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//             title="Export as Excel"
//           >
//             <Download className="w-4 h-4" />
//             <span className="text-sm">Excel</span>
//           </button>
//           <button
//             onClick={handlePrint}
//             className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
//             title="Print"
//           >
//             <Printer className="w-4 h-4" />
//             <span className="text-sm">Print</span>
//           </button>
//         </div>
//       </div>

//       {/* Filter Panel */}
//       {showFilter && (
//         <div className="no-print bg-white shadow-md px-6 py-4 border-b">
//           <div className="max-w-2xl mx-auto">
//             <h3 className="font-semibold text-gray-700 mb-4">Filter Tax Report</h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Employee Number
//                 </label>
//                 <input
//                   type="text"
//                   value={filterEmployeeNumber}
//                   onChange={(e) => setFilterEmployeeNumber(e.target.value)}
//                   placeholder="Enter employee number"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Tax Year
//                 </label>
//                 <input
//                   type="number"
//                   value={filterYear}
//                   onChange={(e) => setFilterYear(e.target.value)}
//                   placeholder="e.g., 2024"
//                   min="2000"
//                   max={new Date().getFullYear() - 1}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Maximum available: {new Date().getFullYear() - 1}
//                 </p>
//               </div>
//             </div>

//             {filterError && (
//               <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <p className="text-sm text-red-600">{filterError}</p>
//               </div>
//             )}

//             <div className="flex gap-3">
//               <button
//                 onClick={handleFilterSubmit}
//                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//               >
//                 Apply Filter
//               </button>
//               <button
//                 onClick={handleClearFilter}
//                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//               >
//                 Clear
//               </button>
//               <button
//                 onClick={() => setShowFilter(false)}
//                 className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Document Preview */}
//       <div className="flex justify-center px-4 py-8">
//         <div
//           ref={reportRef}
//           className="print-container w-full max-w-7xl bg-white shadow-2xl rounded-lg p-10 border border-gray-200"
//         >
//           {/* KRA Header */}
//           <div className="text-center mb-6 pb-4 border-b-2 border-black">
//             <h1 className="text-2xl font-bold text-gray-900">KENYA REVENUE AUTHORITY</h1>
//             <p className="text-sm text-gray-700 mt-1">ISO 9001:2015 CERTIFIED</p>
//           </div>

//           <p className="text-sm font-bold mb-2">APPENDIX 2A</p>
//           <p className="text-center text-sm font-bold mb-6 underline">
//             KENYA REVENUE AUTHORITY DOMESTIC TAXES DEPARTMENT / TAX DEDUCTION CARD YEAR {reportData.TaxYear}
//           </p>

//           {/* Employer & Employee Info */}
//           <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
//             <div className="space-y-3">
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[180px]">Employer's Name:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.EmployerName}
//                 </span>
//               </div>
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[180px]">Employee's Main Name:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.EmployeeMainName}
//                 </span>
//               </div>
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[180px]">Employee's Other Names:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.EmployeeOtherNames}
//                 </span>
//               </div>
//             </div>
//             <div className="space-y-3">
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[150px]">Employer's PIN:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.EmployerKRAPIN}
//                 </span>
//               </div>
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[150px]">Employee's PIN:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.EmployeeKRAPIN}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* P9A Table */}
//           <div className="overflow-x-auto mb-6">
//             <table className="w-full border-collapse text-[8px]">
//               <thead>
//                 <tr>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     MONTH
//                   </th>
//                   <th colSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     BASIC SALARY & OTHER CASH EMOLUMENTS
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Total Gross Pay<br/><br/>Kshs.<br/>(D)
//                   </th>
//                   <th colSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Defined Contribution Retirement Scheme
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Affordable Housing Levy (AHL)<br/><br/>Kshs.<br/>(F)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Social Health Insurance Fund (SHIF)<br/><br/>Kshs.<br/>(G)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Post Retirement Medical Fund (PRMF)<br/><br/>Kshs.<br/>(H)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Owner-Occupied Interest<br/><br/>Kshs.<br/>(I)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Total Deductions<br/>(Lower of E+F+G+H+I)<br/>Kshs.<br/>(J)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Chargeable Pay<br/>(D-J)<br/>Kshs.<br/>(K)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Tax Charged<br/><br/>Kshs.<br/>(L)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Personal Relief<br/><br/>Kshs.<br/>(M)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     Insurance Relief<br/><br/>Kshs.<br/>(N)
//                   </th>
//                   <th rowSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     PAYE Tax<br/>(L-M-N)<br/>Kshs.<br/>(O)
//                   </th>
//                 </tr>
//                 <tr>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">
//                     Basic Salary<br/><br/>Kshs.<br/>(A)
//                   </th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">
//                     Benefits-NonCash<br/><br/>Kshs.<br/>(B)
//                   </th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">
//                     Value of Quarters<br/><br/>Kshs.<br/>(C)
//                   </th>
//                   <th colSpan={3} className="border border-black p-2 bg-gray-100 font-bold">
//                     (E)
//                   </th>
//                 </tr>
//                 <tr>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">A</th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">B</th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">C</th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">
//                     E1<br/>30% of A
//                   </th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">
//                     E2<br/>Actual
//                   </th>
//                   <th className="border border-black p-2 bg-gray-100 font-bold">
//                     E3<br/>Fixed<br/>30,000 p.m
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => {
//                   const monthlyBasic = reportData.BasicSalary / 12;
//                   const monthlyBenefits = reportData.BenefitsNonCash / 12;
//                   const monthlyQuarters = reportData.ValueofQuarters / 12;
//                   const monthlyGross = reportData.TotalGrossPay / 12;
//                   const e1Monthly = monthlyBasic * 0.3;
//                   const monthlyNSSF = reportData.NSSFContribution / 12;
//                   const monthlyAHL = reportData.HousingLevy / 12;
//                   const monthlySHIF = reportData.SHIFContribution / 12;
//                   const monthlyPRMF = reportData.PRMFContribution / 12;
//                   const monthlyOwner = reportData.OwnerOccupiedInterest / 12;
//                   const monthlyDeductions = reportData.TotalAllowableDeductions / 12;
//                   const monthlyChargeable = reportData.ChargeablePay / 12;
//                   const monthlyTax = reportData.TaxCharged / 12;
//                   const monthlyRelief = reportData.PersonalRelief / 12;
//                   const monthlyInsurance = Math.abs(reportData.InsuranceRelief) / 12;
//                   const monthlyPAYE = reportData.PAYEDeducted / 12;

//                   return (
//                     <tr key={month}>
//                       <td className="border border-black p-2 text-left font-semibold">{month}</td>
//                       <td className="border border-black p-2 text-center">{monthlyBasic.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyBenefits.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyQuarters.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center font-semibold">{monthlyGross.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{e1Monthly.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyNSSF.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">30,000.00</td>
//                       <td className="border border-black p-2 text-center">{monthlyAHL.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlySHIF.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyPRMF.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyOwner.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center font-semibold">{monthlyDeductions.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center font-semibold">{monthlyChargeable.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyTax.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyRelief.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center">{monthlyInsurance.toFixed(2)}</td>
//                       <td className="border border-black p-2 text-center font-semibold">{monthlyPAYE.toFixed(2)}</td>
//                     </tr>
//                   );
//                 })}
//                 <tr className="bg-gray-100 font-bold">
//                   <td className="border border-black p-2 text-left">TOTAL</td>
//                   <td className="border border-black p-2 text-center">{reportData.BasicSalary.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.BenefitsNonCash.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.ValueofQuarters.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.TotalGrossPay.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{(reportData.BasicSalary * 0.3).toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.NSSFContribution.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">360,000.00</td>
//                   <td className="border border-black p-2 text-center">{reportData.HousingLevy.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.SHIFContribution.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.PRMFContribution.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.OwnerOccupiedInterest.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.TotalAllowableDeductions.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.ChargeablePay.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.TaxCharged.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.PersonalRelief.toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{Math.abs(reportData.InsuranceRelief).toFixed(2)}</td>
//                   <td className="border border-black p-2 text-center">{reportData.PAYEDeducted.toFixed(2)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           {/* Footer Section */}
//           <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
//             <div>
//               <p className="font-semibold mb-3">To be completed by Employer at end of year:</p>
//               <div className="flex gap-2 mb-2">
//                 <span className="font-semibold min-w-[250px]">TOTAL CHARGEABLE PAY (COL. K) Kshs.</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.ChargeablePay.toFixed(2)}
//                 </span>
//               </div>
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[250px]">TOTAL TAX (COL. O) Kshs.</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1 px-2">
//                   {reportData.PAYEDeducted.toFixed(2)}
//                 </span>
//               </div>
//             </div>
//             <div>
//               <p className="font-semibold mb-3">Declaration by Employee:</p>
//               <p className="text-xs mb-3 text-gray-700">
//                 I declare that the information given above is true, correct and complete. 
//                 If during the year my circumstances change, I will advise you accordingly.
//               </p>
//               <div className="flex gap-2 mb-2">
//                 <span className="font-semibold min-w-[100px]">Signature:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1"></span>
//               </div>
//               <div className="flex gap-2">
//                 <span className="font-semibold min-w-[100px]">Date:</span>
//                 <span className="border-b border-dotted border-gray-600 flex-1"></span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }