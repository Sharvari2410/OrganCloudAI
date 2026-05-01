import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BrainCircuit, Sparkles, TrendingUp } from "lucide-react";
import { fetchDashboard } from "../api/client";
import SectionCard from "../components/SectionCard";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { subscribeSocket } from "../realtime/socket";

const pieColors = ["#1f90ff", "#2ccf8a", "#f59e0b", "#ef4444", "#8b5cf6"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-semibold text-slate-500">{label || payload[0]?.name}</p>
      <p className="text-sm font-bold text-slate-900">{payload[0]?.value}</p>
    </div>
  );
}

function insightStyle(severity) {
  if (severity === "high") {
    return {
      icon: AlertTriangle,
      shell: "from-rose-100 via-rose-50 to-white border-rose-200",
      chip: "bg-rose-100 text-rose-700",
    };
  }
  if (severity === "medium") {
    return {
      icon: TrendingUp,
      shell: "from-amber-100 via-amber-50 to-white border-amber-200",
      chip: "bg-amber-100 text-amber-700",
    };
  }
  return {
    icon: Sparkles,
    shell: "from-emerald-100 via-emerald-50 to-white border-emerald-200",
    chip: "bg-emerald-100 text-emerald-700",
  };
}

function DashboardPage() {
  const [data, setData] = useState(null);

  const loadData = async () => {
    const response = await fetchDashboard();
    setData(response);
  };

  useEffect(() => {
    loadData();

    const unsubscribers = [
      subscribeSocket("entity:changed", loadData),
      subscribeSocket("match:created", loadData),
      subscribeSocket("transport:status", loadData),
      subscribeSocket("approval:updated", loadData),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const totalDemand = useMemo(
    () => (data?.charts?.organDemand || []).reduce((acc, item) => acc + Number(item.value || 0), 0),
    [data]
  );

  if (!data) {
    return <p className="text-sm text-slate-500">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Donors" value={data.metrics.donors} accent="from-brand-500 to-brand-700" />
        <StatCard label="Total Recipients" value={data.metrics.recipients} accent="from-emerald-500 to-emerald-700" />
        <StatCard label="Active Requests" value={data.metrics.activeRequests} accent="from-indigo-500 to-indigo-700" />
        <StatCard label="Organs Available" value={data.metrics.organsAvailable} accent="from-cyan-500 to-blue-600" />
        <StatCard label="Emergency Cases" value={data.metrics.emergencyCases} accent="from-rose-500 to-red-700" />
      </div>

      <SectionCard
        title="Predictive AI Insights"
        subtitle="Pattern-aware signals from demand, compatibility, and logistics"
        rightContent={
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
            <BrainCircuit className="h-4 w-4" />
            AI Simulation Active
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {data.predictiveInsights?.map((insight, idx) => {
            const ui = insightStyle(insight.severity);
            const Icon = ui.icon;
            return (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${ui.shell}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-lg bg-white/80 p-2 text-slate-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${ui.chip}`}>
                    {insight.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">{insight.title}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{insight.message}</p>
                <p className="mt-3 text-xs font-semibold text-slate-500">Signal: {insight.metric}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-5">
        <SectionCard title="Organ Demand" subtitle="Live distribution by requested organ">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
            <div className="h-72 rounded-2xl bg-gradient-to-b from-slate-50 to-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.organDemand}
                    dataKey="value"
                    nameKey="label"
                    outerRadius={102}
                    innerRadius={62}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {data.charts.organDemand.map((entry, idx) => (
                      <Cell key={entry.label} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                Total Requests: {totalDemand}
              </div>
              {data.charts.organDemand.map((entry, idx) => (
                <div key={entry.label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                    <span className="text-xs font-semibold text-slate-700">{entry.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Transplant Status" subtitle="Surgery execution trend">
          <div className="h-72 rounded-2xl bg-gradient-to-b from-slate-50 to-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.transplantStats}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f90ff" />
                    <stop offset="100%" stopColor="#155ca8" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="url(#barGradient)" maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Multi-Hospital Network" subtitle="Organ transfer links across hospitals">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.network.slice(0, 9).map((item) => (
            <div key={`${item.source}-${item.destination}`} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{item.sourceCity} {" -> "} {item.destinationCity}</p>
              <p className="text-xs text-slate-500">{item.source} to {item.destination}</p>
              <p className="mt-2 text-xs font-semibold text-brand-700">Transfers: {item.transfers}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Activity Feed" subtitle="Latest matches, surgeries, and transport updates">
        <div className="space-y-3">
          {data.recentActivity.map((item) => (
            <motion.div
              key={`${item.type}-${item.entity_id}-${item.activity_date}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold capitalize text-slate-800">
                  {item.type} #{item.entity_id}
                </p>
                <p className="text-xs text-slate-500">{item.details || new Date(item.activity_date).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={item.status} />
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
