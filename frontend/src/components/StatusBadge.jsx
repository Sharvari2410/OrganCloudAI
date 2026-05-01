function StatusBadge({ status }) {
  const value = String(status || "Unknown");
  const normalized = value.toLowerCase();

  let classes = "bg-slate-100 text-slate-700";
  if (["available", "approved", "completed", "matched"].some((item) => normalized.includes(item))) {
    classes = "bg-emerald-100 text-emerald-700";
  } else if (["reserved", "pending", "scheduled", "high"].some((item) => normalized.includes(item))) {
    classes = "bg-amber-100 text-amber-700";
  } else if (["critical", "delayed", "rejected", "emergency"].some((item) => normalized.includes(item))) {
    classes = "bg-rose-100 text-rose-700";
  } else if (["in transit", "moving"].some((item) => normalized.includes(item))) {
    classes = "bg-sky-100 text-sky-700";
  }

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{value}</span>;
}

export default StatusBadge;
