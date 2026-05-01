import { useEffect, useState } from "react";
import { getSocket, subscribeSocket } from "../realtime/socket";

function LiveStatusPill() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    setConnected(socket.connected);

    const unsubscribers = [
      subscribeSocket("connect", () => setConnected(true)),
      subscribeSocket("disconnect", () => setConnected(false)),
      subscribeSocket("connect_error", () => setConnected(false)),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return (
    <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${connected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
      {connected ? "Live: Connected" : "Live: Disconnected"}
    </div>
  );
}

export default LiveStatusPill;
