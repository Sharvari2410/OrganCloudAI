import { createServer } from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import pool from "./db.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";
import transportRoutes from "./routes/transportRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import recipientRoutes from "./routes/recipientRoutes.js";
import organRoutes from "./routes/organRoutes.js";
import surgeryRoutes from "./routes/surgeryRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import entityRoutes from "./routes/entityRoutes.js";
import { listEntities } from "./config/entities.js";
import { authenticate, authorize } from "./middlewares/auth.js";
import { initSocket } from "./socket.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../..", "frontend", "dist");

const app = express();
const server = createServer(app);
initSocket(server);

const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDistPath));

app.get("/", (_req, res) => {
  res.json({
    app: "AI-Enhanced Smart Organ Donation & Transplant Management System",
    status: "online",
    docs: [
      "/api/health",
      "/api/auth/login",
      "/api/dashboard/summary",
      "/api/matches/suggestions?recipientId=1",
      "/api/transport/1/journey",
    ],
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", entities: listEntities });
  } catch (error) {
    res.status(500).json({ status: "error", db: "disconnected", error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/donors", authenticate, authorize("admin", "doctor"), donorRoutes);
app.use("/api/recipients", authenticate, authorize("admin", "doctor"), recipientRoutes);
app.use("/api/organs", authenticate, authorize("admin", "doctor"), organRoutes);
app.use("/api/matches", authenticate, authorize("admin", "doctor"), matchingRoutes);
app.use("/api/transport", authenticate, authorize("admin", "doctor", "transport"), transportRoutes);
app.use("/api/surgery", authenticate, authorize("admin", "doctor"), surgeryRoutes);
app.use("/api/approval", authenticate, authorize("admin", "doctor"), approvalRoutes);
app.use("/api/entities", authenticate, authorize("admin", "doctor"), entityRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: "Unhandled server error", error: err.message });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  return res.sendFile(path.join(frontendDistPath, "index.html"));
});

server.listen(port, () => {
  console.log(`Smart Organ backend running on http://localhost:${port}`);
});
