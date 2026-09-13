import * as XLSX from "xlsx";

const amountFormat = '#,##0.00;[Red](#,##0.00);"-"';
const day = (value) => String(value || "").slice(0, 10);

export function buildBudgetActualsWorkbook(report) {
  const budget = report.Budget;
  const data = [
    ["BUDGET VS ACTUAL"],
    ["Budget", budget.Description, "Branch", budget.BranchDescription],
    ["Posting period", budget.PostingPeriodDescription, "As at", day(report.AsAt)],
    ["Period start", day(budget.PostingPeriodDurationStartDate), "Period end", day(budget.PostingPeriodDurationEndDate)],
    ["Basis", "Full-period budget; G/L actuals use journal value date; loans use recorded disbursement date."],
    ["Difference", "Budget minus actual. Income: target remaining. Expenses/loans: allocation remaining. Percent is blank for zero budgets."],
    [],
    ["Section", "Account / Product", "Budget", "Actual", "Difference", "% Used / Achieved", "Allocation"],
    ...report.Lines.map((line) => [line.Section, [line.Code, line.Description].filter(Boolean).join(" - "), line.Budget, line.Actual, line.Difference, line.Percentage ?? "", line.Unbudgeted ? "Unbudgeted" : "Budgeted"]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  const last = 8 + report.Lines.length;
  for (let row = 9; row <= last; row++) {
    sheet[`E${row}`].f = `C${row}-D${row}`;
    if (sheet[`C${row}`].v !== 0) sheet[`F${row}`].f = `D${row}/C${row}`;
    for (const col of ["C", "D", "E"]) sheet[`${col}${row}`].z = amountFormat;
    sheet[`F${row}`].z = "0.0%";
  }
  const totalStart = last + 3;
  XLSX.utils.sheet_add_aoa(sheet, [["SECTION TOTALS"], ...report.Totals.map((total) => [total.Section, "", total.Budget, total.Actual, total.Difference, total.Percentage ?? ""])], { origin: `A${totalStart}` });
  report.Totals.forEach((total, i) => {
    const row = totalStart + i + 1;
    for (const col of ["C", "D"]) {
      if (last >= 9) sheet[`${col}${row}`].f = `SUMIF(A9:A${last},A${row},${col}9:${col}${last})`;
      sheet[`${col}${row}`].z = amountFormat;
    }
    sheet[`E${row}`].f = `C${row}-D${row}`;
    sheet[`E${row}`].z = amountFormat;
    if (total.Budget !== 0) sheet[`F${row}`].f = `D${row}/C${row}`;
    sheet[`F${row}`].z = "0.0%";
  });
  sheet["!cols"] = [{ wch: 22 }, { wch: 48 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 23 }, { wch: 16 }];
  sheet["!autofilter"] = { ref: `A8:G${Math.max(8, last)}` };
  sheet["!merges"] = ["A1:G1", "B5:G5", "B6:G6"].map(XLSX.utils.decode_range);
  sheet["!rows"] = [{ hpt: 26 }, {}, {}, {}, { hpt: 30 }, { hpt: 30 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Budget vs Actual");
  return workbook;
}

export function downloadBudgetActuals(report) {
  XLSX.writeFile(buildBudgetActualsWorkbook(report), `Budget-vs-Actual-${day(report.AsAt)}.xlsx`);
}
