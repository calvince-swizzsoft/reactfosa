import { validateForm6Dates } from "./form6Model.js";

export function quarterEnd(year, quarter) {
  if (!Number.isInteger(Number(year)) || Number(year) < 1753 || Number(year) >= 9999 || ![1, 2, 3, 4].includes(Number(quarter))) return "";
  return `${year}-${["03-31", "06-30", "09-30", "12-31"][Number(quarter) - 1]}`;
}

export function latestCompletedQuarter(today = new Date()) {
  const end = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0);
  return { year: end.getFullYear(), quarter: Math.ceil((end.getMonth() + 1) / 3) };
}

export function validateForm5Dates(yearStart, asAt, reportPurpose) {
  const error = validateForm6Dates(yearStart, asAt);
  if (error) return error;
  if (!["Quarterly", "Interim"].includes(reportPurpose)) return "Choose a report purpose.";
  return reportPurpose === "Quarterly" && !/^\d{4}-(03-31|06-30|09-30|12-31)$/.test(asAt)
    ? "Quarterly returns require 31 March, 30 June, 30 September or 31 December. Choose Interim working copy for another date." : "";
}

export function financialYearStart(periods, asAt) {
  const starts = new Set(periods.filter(p => p.durationStartDate?.slice(0, 10) <= asAt && p.durationEndDate?.slice(0, 10) >= asAt)
    .map(p => p.durationStartDate.slice(0, 10)).filter(start => !validateForm6Dates(start, asAt)));
  return starts.size === 1 ? [...starts][0] : "";
}

export function reportingQuarters(periods, today = new Date()) {
  const years = new Set(Array.from({ length: 5 }, (_, i) => today.getFullYear() - i));
  for (const p of periods) {
    const start = Number(p.durationStartDate?.slice(0, 4)), end = Number(p.durationEndDate?.slice(0, 4));
    if (start >= 1753 && end < 9999 && end >= start && end - start <= 1) {
      years.add(start); years.add(end);
    }
  }
  return [...years].sort((a, b) => b - a).flatMap(year => [4, 3, 2, 1].map(quarter => ({
    date: quarterEnd(year, quarter),
    label: `Q${quarter} ${year} — ${["31 March", "30 June", "30 September", "31 December"][quarter - 1]}`,
  })));
}
