import { normalizeList } from "@/lib/api";

export function normalizeBranchOptions(response) {
  return normalizeList(response)
    .map((branch) => ({
      id: branch?.Id ?? branch?.id ?? "",
      name:
        branch?.Description ??
        branch?.description ??
        branch?.BranchDescription ??
        branch?.branchDescription ??
        branch?.Name ??
        branch?.name ??
        "",
    }))
    .filter((branch) => branch.id && branch.name);
}
