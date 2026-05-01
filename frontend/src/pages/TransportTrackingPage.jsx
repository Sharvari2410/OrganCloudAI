import { useEffect, useState } from "react";
import { fetchTransportJobs, fetchTransportJourney, fetchTransportNetwork } from "../api/client";
import ModuleCrudWorkbench from "../components/ModuleCrudWorkbench";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import TransportTimeline from "../components/TransportTimeline";
import { useAuth } from "../context/AuthContext";
import { transportSections } from "../data/moduleConfigs";
import { emitSocket, subscribeSocket } from "../realtime/socket";

function TransportTrackingPage() {
  const { user } = useAuth();
  const [transportRows, setTransportRows] = useState([]);
  const [selectedTransportId, setSelectedTransportId] = useState("");
  const [journeyData, setJourneyData] = useState(null);
  const [network, setNetwork] = useState([]);

  const loadJobs = async () => {
    const res = await fetchTransportJobs({ limit: 100 });
    setTransportRows(res.items || []);
    if (!selectedTransportId && res.items?.length) {
      setSelectedTransportId(String(res.items[0].transport_id));
    }
  };

  const loadNetwork = async () => {
    const rows = await fetchTransportNetwork();
    setNetwork(rows);
  };

  const loadJourney = async (transportId) => {
    if (!transportId) return;
    const data = await fetchTransportJourney(transportId);
    setJourneyData(data);
  };

  useEffect(() => {
    loadJobs();
    loadNetwork();

    const unsubscribers = [
      subscribeSocket("entity:changed", (payload) => {
        if (["transport", "location_tracking", "transport_team", "transport_vehicle"].includes(payload?.entity)) {
          loadJobs();
          loadNetwork();
          if (selectedTransportId) loadJourney(selectedTransportId);
        }
      }),
      subscribeSocket("transport:status", (payload) => {
        loadJobs();
        loadNetwork();
        if (String(payload?.transportId || "") === String(selectedTransportId)) {
          loadJourney(selectedTransportId);
        }
      }),
      subscribeSocket("transport:timeline", (payload) => {
        if (String(payload?.transportId || "") === String(selectedTransportId)) {
          loadJourney(selectedTransportId);
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [selectedTransportId]);

  useEffect(() => {
    if (!selectedTransportId) return;
    emitSocket("subscribe:transport", Number(selectedTransportId));
    loadJourney(selectedTransportId);
  }, [selectedTransportId]);

  return (
    <div className="space-y-6">
      <SectionCard title="Live Organ Journey Tracker" subtitle="Collected -> In Transit -> Reached -> Surgery">
        <div className="grid gap-3 md:grid-cols-[260px_1fr]">
          <div>
            <label className="text-sm font-semibold text-slate-600">Transport ID</label>
            <select
              value={selectedTransportId}
              onChange={(event) => setSelectedTransportId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {transportRows.map((row) => (
                <option key={row.transport_id} value={row.transport_id}>
                  #{row.transport_id} - {row.transport_status}
                </option>
              ))}
            </select>
          </div>
          {journeyData ? (
            <div className="rounded-xl bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">
                  {journeyData.transport.source_hospital_name} {" -> "} {journeyData.transport.destination_hospital_name}
                </p>
                <StatusBadge status={journeyData.transport.transport_status} />
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Team {journeyData.transport.team_name} | Vehicle {journeyData.transport.vehicle_type}
              </p>
              <div className="mb-4 grid gap-2 sm:grid-cols-4">
                {journeyData.phases.map((phase) => (
                  <div key={phase.label} className={`rounded-lg p-2 text-xs font-semibold ${phase.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {phase.done ? "?" : "?"} {phase.label}
                  </div>
                ))}
              </div>
              <TransportTimeline events={journeyData.timeline} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a transport to view timeline.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Multi-Hospital Network View" subtitle="Transfer routes across partner hospitals">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {network.slice(0, 9).map((row) => (
            <div key={row.transport_id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{row.source_city} {" -> "} {row.destination_city}</p>
              <p className="text-xs text-slate-500">{row.source_hospital_name} to {row.destination_hospital_name}</p>
              <div className="mt-2"><StatusBadge status={row.transport_status} /></div>
            </div>
          ))}
        </div>
      </SectionCard>

      {user?.role === "admin" ? <ModuleCrudWorkbench sections={transportSections} /> : null}
    </div>
  );
}

export default TransportTrackingPage;
