// Transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs — not guessed.

export const ChartOfAccountType = {
  Asset: 1000,
  Liability: 2000,
  Equity: 3000,
  Income: 4000,
  Expense: 5000,
};

export const CHART_OF_ACCOUNT_TYPE_OPTIONS = [
  { value: ChartOfAccountType.Asset, label: "Asset" },
  { value: ChartOfAccountType.Liability, label: "Liability" },
  { value: ChartOfAccountType.Equity, label: "Equity/Capital" },
  { value: ChartOfAccountType.Income, label: "Income/Revenue" },
  { value: ChartOfAccountType.Expense, label: "Expense" },
];

export const ChartOfAccountCategory = {
  HeaderAccount: 4096,
  DetailAccount: 4097,
};

export const CHART_OF_ACCOUNT_CATEGORY_OPTIONS = [
  { value: ChartOfAccountCategory.HeaderAccount, label: "Header Account (Non-Postable)" },
  { value: ChartOfAccountCategory.DetailAccount, label: "Detail Account (Postable)" },
];
