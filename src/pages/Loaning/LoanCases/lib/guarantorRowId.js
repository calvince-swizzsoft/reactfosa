let nextRowId = 0;

// UI-only keys, never sent as guarantor IDs. Works on HTTP without Web Crypto.
export function createGuarantorRowId() {
  return `guarantor-row-${++nextRowId}`;
}
