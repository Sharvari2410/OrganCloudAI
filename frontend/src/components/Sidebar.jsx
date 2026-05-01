import { NavLink } from "react-router-dom";
import { navItems } from "../data/nav";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();
  const filtered = navItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <aside className="glass sticky top-0 z-20 h-screen border-b border-white/60 p-4 lg:border-b-0 lg:border-r lg:p-6">
      <div className="rounded-2xl bg-graphite p-5 text-white shadow-card">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Smart Care</p>
        <h1 className="mt-2 text-2xl font-semibold">Organ Cloud AI</h1>
        <p className="mt-2 text-sm text-slate-300">Donation and transplant intelligence</p>
      </div>

      <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
        {filtered.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-white/80 text-slate-700 hover:bg-brand-100 hover:text-brand-700"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
