// Normalizes a JournalDTO (Application.MainBoundedContext.DTO.AccountsModule/JournalDTO.cs)
// for client-side receipt rendering. There is no server-side print endpoint
// anymore (removed — see WORKFLOW.md §11); every posting endpoint in this
// area (deposit/withdrawal post, EOD close) returns the full journal in
// `data` and the client renders/prints from it.

export const normalizeJournal = (row) => ({
  id: row?.id ?? row?.Id ?? "",
  sequentialId: row?.sequentialId ?? row?.SequentialId ?? "",
  branchDescription: row?.branchDescription ?? row?.BranchDescription ?? "",
  branchCompanyDescription: row?.branchCompanyDescription ?? row?.BranchCompanyDescription ?? "",
  postingPeriodDescription: row?.postingPeriodDescription ?? row?.PostingPeriodDescription ?? "",
  totalValue: row?.totalValue ?? row?.TotalValue ?? 0,
  primaryDescription: row?.primaryDescription ?? row?.PrimaryDescription ?? "",
  secondaryDescription: row?.secondaryDescription ?? row?.SecondaryDescription ?? "",
  reference: row?.reference ?? row?.Reference ?? "",
  applicationUserName: row?.applicationUserName ?? row?.ApplicationUserName ?? "",
  transactionCodeDescription: row?.transactionCodeDescription ?? row?.TransactionCodeDescription ?? "",
  createdBy: row?.createdBy ?? row?.CreatedBy ?? "",
  createdDate: row?.createdDate ?? row?.CreatedDate ?? "",
});

export const formatMoney = (n) =>
  typeof n === "number" ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

export const formatReceiptDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};
