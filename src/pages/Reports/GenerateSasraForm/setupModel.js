export const profiles = { DT: "Deposit-taking SACCO", NWDT: "Specified non-deposit-taking SACCO", NotApplicable: "Not applicable" };
export const emptyLine = () => ({ code: "", description: "", source: "GlBalance", sheet: "", cell: "", sign: 1, accountIds: [], accountNames: {} });
export const emptyVersion = (profile = "") => ({ profile, reportCode: "", title: "", version: "", revision: 0, sourceUrl: "", workbookSha256: "", effectiveFrom: "", lines: [] });
export function validateDefinition(d) {
  if (!["DT", "NWDT"].includes(d.profile)) return "Save a DT or NW-DT institution profile first.";
  for (const [key, title, max] of [["reportCode", "Report code", 40], ["title", "Report title", 256], ["version", "Version", 40]]) {
    if (!d[key]?.trim() || d[key].trim().length > max) return `${title} is required (up to ${max} characters).`;
  }
  if (d.sourceUrl?.trim()) {
    if (d.sourceUrl.length > 1000) return "Source URL cannot exceed 1000 characters.";
    try { const u = new URL(d.sourceUrl); if (u.protocol !== "https:" || !(u.hostname === "sasra.go.ke" || u.hostname.endsWith(".sasra.go.ke"))) return "Use an HTTPS source URL on sasra.go.ke."; }
    catch { return "Enter a valid source URL."; }
  }
  if (d.workbookSha256 && !/^[a-f\d]{64}$/i.test(d.workbookSha256)) return "The SHA-256 checksum must contain 64 hexadecimal characters.";
  if (d.effectiveFrom && (!/^\d{4}-\d{2}-\d{2}$/.test(d.effectiveFrom) || d.effectiveFrom < "1753-01-01" || Number.isNaN(Date.parse(d.effectiveFrom)))) return "Enter an effective date on or after 1753-01-01.";
  if (!d.lines.length || d.lines.length > 500) return "Add between 1 and 500 report lines.";
  const codes = new Set(), cells = new Set(), accounts = new Set();
  for (const [i, l] of d.lines.entries()) {
    const at = `Line ${i + 1}: `;
    if (!l.code.trim() || l.code.trim().length > 40 || !l.description.trim() || l.description.trim().length > 256) return at + "enter a code (up to 40 characters) and description (up to 256).";
    const code = l.code.trim().toLowerCase();
    if (codes.has(code)) return at + "line code is duplicated."; codes.add(code);
    if (![1, -1].includes(l.sign)) return at + "choose a valid sign rule.";
    if (!["Header", "GlBalance", "GlMovement"].includes(l.source)) return at + "choose a valid source.";
    if (l.accountIds.length > 500) return at + "choose at most 500 accounts.";
    if (l.source === "Header") { if (l.accountIds.length || l.cell || l.sheet) return at + "headers cannot have mappings or output cells."; continue; }
    if (!l.sheet.trim() || l.sheet.trim().length > 31 || /[\[\]:*?/\\]/.test(l.sheet)) return at + "enter a valid worksheet name.";
    const match = /^([A-Z]{1,3})([1-9]\d{0,6})$/.exec(l.cell.trim().toUpperCase());
    if (!match || [...match[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) > 16384 || Number(match[2]) > 1048576) return at + "enter a valid Excel cell such as D10.";
    const cell = `${l.sheet.trim()}!${l.cell.trim()}`.toLowerCase();
    if (cells.has(cell)) return at + "output cell is already used."; cells.add(cell);
    for (const id of l.accountIds) { const key = id.toLowerCase(); if (accounts.has(key)) return at + "account is mapped more than once."; accounts.add(key); }
  }
  if (accounts.size > 2000) return "A definition may contain up to 2000 account mappings.";
  return "";
}
