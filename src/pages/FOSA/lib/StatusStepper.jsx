// Small horizontal step indicator for a linear record lifecycle (e.g.
// Account Closure's Registered -> Approved -> Audited -> Settled). Nothing
// like this existed anywhere in the app before Phase 2 (confirmed by
// exploration — components/ui/progress.jsx is a plain linear bar, not a
// stepper) — built from scratch, not adapted from an existing component.
//
// `steps` is an ordered array of labels; `currentIndex` is the index of
// the furthest-reached step (-1 if none reached yet). `deferred`, when
// true, renders the current step as amber/paused instead of green/done —
// the lifecycle didn't fail, it's just parked.
export default function StatusStepper({ steps, currentIndex, deferred = false }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((label, i) => {
        const isDone = i < currentIndex || (i === currentIndex && !deferred);
        const isCurrent = i === currentIndex;
        const circleCls = isCurrent && deferred
          ? "bg-amber-100 text-amber-700 border-2 border-amber-400"
          : isDone
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-400 border border-gray-300";
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${circleCls}`}>
                {i + 1}
              </div>
              <span className={`text-[10px] font-semibold text-center ${isCurrent ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < currentIndex ? "bg-indigo-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
