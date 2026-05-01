import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchDemoUsers } from "../api/client";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("admin@organ.ai");
  const [password, setPassword] = useState("admin123");
  const [demoUsers, setDemoUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDemoUsers().then(setDemoUsers).catch(() => setDemoUsers([]));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const target = location.state?.from || "/dashboard";
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-4xl rounded-3xl border border-white/70 p-6 shadow-card md:grid md:grid-cols-2 md:gap-6 md:p-8">
        <div className="mb-5 md:mb-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Organ Cloud AI</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Secure Role-Based Access</h1>
          <p className="mt-3 text-sm text-slate-600">Log in as Admin, Doctor, or Transport Team to access your workspace.</p>
          <div className="mt-5 space-y-2 text-xs">
            {demoUsers.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => {
                  setEmail(user.email);
                  setPassword(user.password);
                }}
                className="block w-full rounded-lg bg-white px-3 py-2 text-left font-semibold text-slate-700 hover:bg-brand-50"
              >
                {user.role.toUpperCase()}: {user.email} / {user.password}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="text-sm font-semibold text-slate-600">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="mt-3 block text-sm font-semibold text-slate-600">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
