import { Server } from "socket.io";

let ioRef = null;

export function initSocket(server) {
  ioRef = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  ioRef.on("connection", (socket) => {
    socket.on("subscribe:transport", (transportId) => {
      socket.join(`transport:${transportId}`);
    });

    socket.on("subscribe:approval", () => {
      socket.join("approval:workflow");
    });

    socket.on("subscribe:status", () => {
      socket.join("status:global");
    });
  });

  return ioRef;
}

export function getIO() {
  return ioRef;
}

export function emitRealtime(event, payload) {
  if (!ioRef) return;
  ioRef.emit(event, payload);

  if (payload?.transportId) {
    ioRef.to(`transport:${payload.transportId}`).emit(event, payload);
  }

  if (event.startsWith("approval:")) {
    ioRef.to("approval:workflow").emit(event, payload);
  }

  ioRef.to("status:global").emit("status:update", payload);
}
