import { useAuth } from "../context/AuthContext";
import LiveStatusPill from "./LiveStatusPill";

const pageLabels = {
  "/dashboard": "Command Dashboard",
  "/donor": "Donor Registry",
  "/recipient": "Recipient Waitlist",
  "/organ-management": "Organ Management",
  "/matching": "Smart Matching",
  "/transport-tracking": "Transport Tracking",
  "/surgery": "Surgery Ops",
  "/approval-workflow": "Approval Workflow",
};

function TopBar({ currentPath }) {
  const { user, logout } = useAuth();

  return (
    <header className="glass flex flex-col gap-3 rounded-2xl border border-white/70 px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI-Enhanced Smart Organ Platform</p>
        <h2 className="text-2xl font-semibold text-slate-900">{pageLabels[currentPath] || "Operations"}</h2>
      </div>
      <div className="flex items-center gap-2">
        <LiveStatusPill />
        <div className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          {user?.name} ({user?.role})
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default TopBar;
