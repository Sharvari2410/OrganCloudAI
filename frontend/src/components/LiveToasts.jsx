import { useEffect, useState } from "react";
import { subscribeSocket } from "../realtime/socket";

let nextToastId = 1;

function toneClass(tone) {
  if (tone === "success") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (tone === "warn") return "bg-amber-100 text-amber-700 border-amber-200";
  if (tone === "danger") return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

function LiveToasts() {
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, tone = "info") => {
    const id = nextToastId;
    nextToastId += 1;

    setToasts((prev) => [{ id, message, tone }, ...prev].slice(0, 5));

    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  };

  useEffect(() => {
    const unsubscribers = [
      subscribeSocket("match:created", (payload) => {
        pushToast(`Match #${payload?.matchId || "-"} created (${payload?.score || 0}%)`, "success");
      }),
      subscribeSocket("transport:status", (payload) => {
        pushToast(`Transport #${payload?.transportId || "-"} is ${payload?.status || "updated"}`, "info");
      }),
      subscribeSocket("transport:timeline", (payload) => {
        pushToast(`Transport #${payload?.transportId || "-"}: ${payload?.current_location || "Location updated"}`, "info");
      }),
      subscribeSocket("approval:updated", (payload) => {
        pushToast(`Approval updated for request #${payload?.requestId || "-"}: ${payload?.status || "Pending"}`, "warn");
      }),
      subscribeSocket("status:update", (payload) => {
        if (payload?.status?.toLowerCase?.().includes("critical")) {
          pushToast(`Critical status update: ${payload.status}`, "danger");
        }
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[320px] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-card ${toneClass(toast.tone)}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default LiveToasts;
