// Transcribed directly from Infrastructure.Crosscutting.Framework/Utils/Enumerations.cs.
export const ChargeType = { Percentage: 1, FixedAmount: 2 };
export const CHARGE_TYPE_LABEL = { [ChargeType.Percentage]: "Percentage", [ChargeType.FixedAmount]: "Fixed Amount" };

export const RoundingType = { NoRounding: 0, ToEven: 1, AwayFromZero: 2, Ceiling: 3, Floor: 4 };
export const ROUNDING_TYPE_LABEL = {
  [RoundingType.NoRounding]: "No Rounding",
  [RoundingType.ToEven]: "Midpoint To Even",
  [RoundingType.AwayFromZero]: "Midpoint Away From Zero",
  [RoundingType.Ceiling]: "Round Up",
  [RoundingType.Floor]: "Round Down",
};
