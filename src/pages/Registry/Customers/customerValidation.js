export const KRA_PIN_PATTERN = /^[A-Z]\d{9}[A-Z]$/;

export const ID_TYPES = [
  [1, "National ID"],
  [2, "Passport"],
  [3, "Alien ID"],
  [4, "Birth Certificate"],
];

export function normalizeKraPin(value) {
  return String(value ?? "").replace(/\s+/g, "").toUpperCase().slice(0, 11);
}

export function validateKraPin(value) {
  const pin = normalizeKraPin(value);
  return !pin || KRA_PIN_PATTERN.test(pin)
    ? ""
    : "KRA PIN must use the format A123456789B.";
}

export function normalizeIdentityNumber(value, identityType) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return Number(identityType) === 1 ? normalized.replace(/\s+/g, "") : normalized;
}

export function validateIdentityNumber(value, identityType) {
  const number = normalizeIdentityNumber(value, identityType);
  if (!number) return "Identity number is required.";

  switch (Number(identityType)) {
    case 1:
      return /^\d{5,10}$/.test(number) ? "" : "National ID must contain 5 to 10 digits only.";
    case 2:
      return /^[A-Z0-9]{5,20}$/.test(number) ? "" : "Passport number must contain 5 to 20 letters or digits, without spaces.";
    case 3:
      return /^[A-Z0-9/-]{5,20}$/.test(number) ? "" : "Alien ID must contain 5 to 20 letters, digits, / or -.";
    case 4:
      return /^[A-Z0-9/-]{3,30}$/.test(number) ? "" : "Birth certificate number must contain 3 to 30 letters, digits, / or -.";
    default:
      return /^[A-Z0-9/-]{3,30}$/.test(number) ? "" : "Identity number contains unsupported characters.";
  }
}
