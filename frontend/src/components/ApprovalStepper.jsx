function ApprovalStepper({ steps = [], current = 0 }) {
  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((step, idx) => {
        const state = idx < current ? "done" : idx === current ? "active" : "pending";
        const style =
          state === "done"
            ? "bg-emerald-500 text-white"
            : state === "active"
            ? "bg-brand-600 text-white"
            : "bg-slate-200 text-slate-600";

        return (
          <div key={step} className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${style}`}>
              {idx + 1}
            </span>
            <span className="text-sm font-semibold text-slate-700">{step}</span>
          </div>
        );
      })}
    </div>
  );
}

export default ApprovalStepper;
