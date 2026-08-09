// Shared checkbox picker for "select from an existing master-data list"
// UI — originally built for ChequeTypes' commissions/attached-products
// pickers, reused by Commissions' own "link existing Levy records" picker
// (docs/api/commission-api-spec.md §5.8 — that endpoint only ever reads
// each entry's `.Id`, same pattern).
export default function PickerList({ items, selectedIds, onToggle, getLabel, getSublabel, emptyText }) {
  return (
    <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y">
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 p-3">{emptyText}</p>
      ) : (
        items.map((item) => {
          const sublabel = getSublabel && getSublabel(item);
          return (
            <label key={item.Id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.has(item.Id)}
                onChange={() => onToggle(item.Id)}
                className="w-4 h-4 accent-indigo-600 shrink-0"
              />
              <span className="text-sm text-gray-700">
                {getLabel(item)}
                {sublabel && <span className="text-gray-400"> — {sublabel}</span>}
              </span>
            </label>
          );
        })
      )}
    </div>
  );
}
