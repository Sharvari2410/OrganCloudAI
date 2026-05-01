import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import LiveToasts from "./LiveToasts";

function AppShell({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <LiveToasts />
      <Sidebar />
      <main className="px-4 pb-6 pt-4 sm:px-6 lg:px-10 lg:pt-8">
        <TopBar currentPath={location.pathname} />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;
