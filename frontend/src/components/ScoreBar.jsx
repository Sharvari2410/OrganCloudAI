function ScoreBar({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const colorClass = safeScore >= 85 ? "bg-emerald-500" : safeScore >= 70 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
        <span>Compatibility Score</span>
        <span>{safeScore}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  );
}

export default ScoreBar;
