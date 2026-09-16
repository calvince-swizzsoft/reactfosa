export const implementedReports = [
  { reportCode: "FORM 5", title: "Investment Return", endpoint: "form5", version: "WORKBOOK-C1A7CED517A5" },
  { reportCode: "FORM 4", title: "Risk Classification of Assets and Provisioning", endpoint: "form4", version: "WORKBOOK-5E8DB04FC69D", derived: true },
  { reportCode: "FORM 3", title: "Statement of Deposit Return", endpoint: "form3", version: "WORKBOOK-25B1834496BC" },
  { reportCode: "FORM 2", title: "Liquidity Statement", endpoint: "form2", version: "WORKBOOK-B71442B70B5E" },
  { reportCode: "FORM 1", title: "Capital Adequacy", endpoint: "form1", version: "WORKBOOK-65571F0718AF" },
  { reportCode: "FORM 6", title: "Statement of Financial Position", endpoint: "form6", version: "WORKBOOK-CD81FC5DAAD8" },
  { reportCode: "FORM 7", title: "Statement of Comprehensive Income", endpoint: "form7", version: "WORKBOOK-A4D3F3D375EE" },
];

export function availableReportRows(versions, profile) {
  const rows = new Map(latestReportRows(versions).map(r => [`${r.profile}:${r.reportCode}`, r]));
  for (const report of implementedReports) {
    const saved = versions.filter(v => v.profile === 'DT' && v.reportCode === report.reportCode && v.version === report.version)
      .reduce((latest, v) => !latest || v.revision > latest.revision ? v : latest, null);
    rows.set(`DT:${report.reportCode}`, { ...report, profile: 'DT', revision: 0, ...saved, endpoint: report.endpoint });
  }
  return [...rows.values()].filter(row => !profile || row.profile === profile).sort((a, b) => a.reportCode.localeCompare(b.reportCode, undefined, { numeric: true }));
}

// The API returns newest-created revisions first. Keep one current revision
// per reporting category and report code, across the complete history.
export function latestReportRows(versions) {
  const rows = new Map();
  for (const v of versions) {
    const key = `${v.profile}:${v.reportCode}`;
    const existing = rows.get(key);
    if (!existing || (existing.version === v.version && v.revision > existing.revision)) rows.set(key, v);
  }
  return [...rows.values()].map(v => ({ ...v, endpoint: v.profile === 'DT' && v.version?.startsWith('WORKBOOK-') ? implementedReports.find(r => r.reportCode === v.reportCode)?.endpoint : undefined }))
    .sort((a, b) => a.reportCode.localeCompare(b.reportCode, undefined, { numeric: true }));
}

// Definitions are read from the dedicated latest-revision endpoints, never
// inferred from the first page of the revision-history list.
export function reportRows(profile, catalogue = [], definitions = {}) {
  const rows = new Map(catalogue.map(row => [row.reportCode, { reportCode: row.reportCode, title: row.title }]));
  if (profile === "DT") for (const report of implementedReports) {
    const state = definitions[report.endpoint];
    rows.set(report.reportCode, { ...report, revision: state?.definition?.revision || 0, error: state?.error,
      loaded: !!state?.definition, mappedAccounts: state?.definition?.lines?.reduce((n, line) => n + (line.accountIds?.length || 0), 0) || 0 });
  }
  return [...rows.values()].sort((a, b) => a.reportCode.localeCompare(b.reportCode, undefined, { numeric: true }));
}
