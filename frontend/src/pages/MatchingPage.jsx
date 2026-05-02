import { useEffect, useMemo, useState } from "react";
import {
  fetchEmergencyQueue,
  fetchEntityList,
  fetchMatchSuggestions,
  runMatching,
} from "../api/client";
import ApprovalStepper from "../components/ApprovalStepper";
import ModuleCrudWorkbench from "../components/ModuleCrudWorkbench";
import ScoreBar from "../components/ScoreBar";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import { matchingSections } from "../data/moduleConfigs";
import { subscribeSocket } from "../realtime/socket";

function MatchingPage() {
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [emergencyQueue, setEmergencyQueue] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState("");

  const loadSuggestions = async (recipientId) => {
    if (!recipientId) return [];
    setLoadingSuggestions(true);
    try {
      const res = await fetchMatchSuggestions(recipientId);
      const candidates = res.candidates || [];
      setSuggestions(candidates);
      setSuggestionMessage(
        candidates.length
          ? ""
          : "No available organ currently matches this recipient. Try another recipient or mark a compatible organ as Available."
      );
      return candidates;
    } catch (_err) {
      setSuggestions([]);
      setSuggestionMessage("Unable to load match suggestions right now.");
      return [];
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const pickFirstRecipientWithCandidates = async (items) => {
    for (const recipient of items) {
      const candidates = await loadSuggestions(recipient.recipient_id);
      if (candidates.length) {
        setSelectedRecipient(String(recipient.recipient_id));
        return true;
      }
    }
    if (items[0]) {
      setSelectedRecipient(String(items[0].recipient_id));
      await loadSuggestions(items[0].recipient_id);
    }
    return false;
  };

  const loadEmergencyQueue = async () => {
    const rows = await fetchEmergencyQueue();
    setEmergencyQueue(rows);
  };

  useEffect(() => {
    fetchEntityList("recipient", { limit: 100, sortBy: "urgency_level", sortOrder: "DESC" }).then(async (res) => {
      const items = res.items || [];
      setRecipients(items);
      if (items.length) {
        await pickFirstRecipientWithCandidates(items);
      }
    });
    loadEmergencyQueue();

    const unsubscribers = [
      subscribeSocket("match:created", loadEmergencyQueue),
      subscribeSocket("status:update", loadEmergencyQueue),
      subscribeSocket("entity:changed", (payload) => {
        if (["recipient", "donation_request", "organ_availability"].includes(payload?.entity)) {
          loadEmergencyQueue();
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    if (!selectedRecipient) return;
    loadSuggestions(selectedRecipient);
  }, [selectedRecipient]);

  useEffect(() => {
    const refreshSuggestions = (payload) => {
      if (!selectedRecipient) return;
      if (!payload || !payload.recipientId || String(payload.recipientId) === String(selectedRecipient)) {
        loadSuggestions(selectedRecipient);
      }
    };

    const unsubscribers = [
      subscribeSocket("match:created", refreshSuggestions),
      subscribeSocket("status:update", refreshSuggestions),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [selectedRecipient]);

  const topSuggestion = useMemo(() => suggestions[0], [suggestions]);

  const executeMatch = async () => {
    if (!topSuggestion) return;
    await runMatching({
      donorId: topSuggestion.donor_id,
      recipientId: topSuggestion.recipient_id,
      organId: topSuggestion.organ_id,
    });
    await loadSuggestions(selectedRecipient);
    await loadEmergencyQueue();
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Smart Match Score Engine" subtitle="Blood, organ type, age gap, urgency, and hospital distance">
        <div className="grid gap-3 md:grid-cols-[260px_1fr]">
          <div>
            <label className="text-sm font-semibold text-slate-600">Recipient</label>
            <select
              value={selectedRecipient}
              onChange={(event) => setSelectedRecipient(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {recipients.map((recipient) => (
                <option key={recipient.recipient_id} value={recipient.recipient_id}>
                  {recipient.name} - Urgency {recipient.urgency_level}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <ApprovalStepper steps={["Request", "Medical Review", "Admin Approval", "Match Finalized"]} current={2} />
            <button
              type="button"
              onClick={executeMatch}
              disabled={!topSuggestion}
              className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              Approve Top Match
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Match Candidates" subtitle="Animated score bars and real-time risk indicators">
        <div className="space-y-3">
          {loadingSuggestions ? <p className="text-sm text-slate-500">Loading match candidates...</p> : null}
          {suggestions.map((candidate) => (
            <article key={`${candidate.donor_id}-${candidate.organ_id}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    Donor {candidate.donor_name} ({candidate.donor_blood_group})
                  </p>
                  <p className="text-xs text-slate-500">
                    {candidate.donor_hospital?.city} {" -> "} {candidate.recipient_hospital?.city} | Distance {candidate.distanceKm} km
                  </p>
                </div>
                <StatusBadge status={candidate.emergencyPriority} />
              </div>
              <div className="mt-3">
                <ScoreBar score={candidate.compatibilityScore} />
              </div>
            </article>
          ))}
          {!suggestions.length && !loadingSuggestions ? (
            <p className="text-sm text-amber-700">{suggestionMessage || "No match candidates available."}</p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Top Priority Patients" subtitle="Sorted by urgency and waiting time">
        <div className="grid gap-2 md:grid-cols-3">
          {emergencyQueue.slice(0, 9).map((item) => (
            <div key={item.recipient_id} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">{item.required_organ} | Waiting {item.waiting_days || 0} days</p>
              <div className="mt-2">
                <StatusBadge status={item.emergency_priority} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <ModuleCrudWorkbench sections={matchingSections} />
    </div>
  );
}

export default MatchingPage;
