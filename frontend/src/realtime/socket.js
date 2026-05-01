import { io } from "socket.io-client";

let socketRef = null;

function resolveSocketUrl() {
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const base = apiBase.replace(/\/api\/?$/, "");
  return base || window.location.origin;
}

export function getSocket() {
  if (!socketRef) {
    socketRef = io(resolveSocketUrl(), {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socketRef;
}

export function subscribeSocket(event, handler) {
  const socket = getSocket();
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function emitSocket(event, payload) {
  const socket = getSocket();
  socket.emit(event, payload);
}
