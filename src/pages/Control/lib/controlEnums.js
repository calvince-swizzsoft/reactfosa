// Shared enums for the Control (Procurement) area, transcribed directly from
// Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs in the backend
// repo — not guessed. DepreciationMethod is [Flags]-shaped (powers of 2) in
// the C# source, same as several enums in frontOfficeEnums.js, but per
// Asset Types.md an asset type has exactly one depreciation method chosen
// from a dropdown — never a bitwise combination.
export const DepreciationMethod = {
  SLN: 1, // Straight Line
  SYD: 2, // Sum-Of-Years' Digits
  DB: 4, // Fixed-Declining Balance
  DDB: 8, // Double-Declining Balance
  VDB: 16, // Variable Double-Declining Balance
};

export const DepreciationMethodOptions = [
  { value: DepreciationMethod.SLN, label: "Straight Line" },
  { value: DepreciationMethod.SYD, label: "Sum-Of-Years' Digits" },
  { value: DepreciationMethod.DB, label: "Fixed-Declining Balance" },
  { value: DepreciationMethod.DDB, label: "Double-Declining Balance" },
  { value: DepreciationMethod.VDB, label: "Variable Double-Declining Balance" },
];

export function depreciationMethodLabel(value) {
  return DepreciationMethodOptions.find((o) => o.value === value)?.label || "—";
}
