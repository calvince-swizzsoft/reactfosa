export function accountBranchLabel(accounts) {
  if (!Array.isArray(accounts)) throw new Error("Invalid account response");
  if (accounts.length === 0) return "No accounts";
  const names = [...new Set(accounts.map((account) => account.BranchDescription?.trim()).filter(Boolean))];
  if (names.length === 0) return "Unavailable";
  if (accounts.some((account) => !account.BranchDescription?.trim())) names.push("Unknown branch");
  return names.join(", ");
}

// Resolve only the visible page, with at most four account requests in flight.
export async function loadCustomerBranches(items, fetchAccounts, onResult, { signal, cache }) {
  const ids = [...new Set(items.map((item) => item.Id ?? item.id).filter(Boolean))];
  let next = 0;
  async function worker() {
    while (!signal.aborted && next < ids.length) {
      const id = ids[next++];
      try {
        const label = cache.has(id) ? cache.get(id) : accountBranchLabel(await fetchAccounts(id, signal));
        if (signal.aborted) return;
        if (label !== "Unavailable") cache.set(id, label);
        onResult(id, label);
      } catch {
        if (!signal.aborted) onResult(id, "Unavailable");
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, worker));
}
