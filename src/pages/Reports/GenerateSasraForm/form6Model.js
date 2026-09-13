export function validateForm6Dates(yearStart, asAt) {
  const parse = text => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text || "")) return null;
    const date = new Date(`${text}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? date : null;
  };
  const start = parse(yearStart), end = parse(asAt);
  if (!start || !end || start.getUTCFullYear() < 1753 || start.getUTCFullYear() >= 9999 || end.getUTCFullYear() >= 9999)
    return "Enter valid dates on or after 1753 and before 9999.";
  const nextYear = start.getUTCFullYear() + 1, month = start.getUTCMonth();
  const day = Math.min(start.getUTCDate(), new Date(Date.UTC(nextYear, month + 1, 0)).getUTCDate());
  const limit = new Date(Date.UTC(nextYear, month, day));
  return end < start || end >= limit ? "Choose an as-at date within the financial year beginning on the selected start date." : "";
}
