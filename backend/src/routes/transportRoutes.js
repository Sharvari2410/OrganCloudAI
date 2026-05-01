import express from "express";
import pool from "../db.js";
import { emitRealtime } from "../socket.js";
import { createCrudRouter } from "./crudRouterFactory.js";

const router = express.Router();

router.use((req, res, next) => {
  const isTrackingPath = req.path.startsWith("/tracking") || req.path.includes("/live-update");
  if (req.user?.role === "transport" && req.method !== "GET" && !isTrackingPath) {
    return res.status(403).json({ message: "Transport role can only update live tracking" });
  }
  return next();
});

router.get("/network", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.transport_id, t.transport_status,
              hs.name AS source_hospital_name, hs.city AS source_city,
              hd.name AS destination_hospital_name, hd.city AS destination_city,
              o.organ_type
       FROM transport t
       LEFT JOIN hospital hs ON hs.hospital_id = t.source_hospital
       LEFT JOIN hospital hd ON hd.hospital_id = t.destination_hospital
       LEFT JOIN organ o ON o.organ_id = t.organ_id
       ORDER BY t.transport_id DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load hospital network", error: error.message });
  }
});

router.patch("/:transportId/live-update", async (req, res) => {
  try {
    const transportId = Number(req.params.transportId);
    const { transport_status, current_location, status } = req.body;

    if (transport_status) {
      await pool.query("UPDATE transport SET transport_status = ? WHERE transport_id = ?", [transport_status, transportId]);
    }

    if (current_location || status) {
      const [trackingResult] = await pool.query(
        `INSERT INTO location_tracking (transport_id, current_location, status, update_time)
         VALUES (?, ?, ?, NOW())`,
        [transportId, current_location || "Unknown", status || transport_status || "In Transit"]
      );

      emitRealtime("transport:timeline", {
        transportId,
        trackingId: trackingResult.insertId,
        current_location: current_location || "Unknown",
        status: status || transport_status || "In Transit",
      });
    }

    if (transport_status) {
      emitRealtime("transport:status", {
        transportId,
        status: transport_status,
      });
    }

    return res.json({ success: true, transportId });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update live transport status", error: error.message });
  }
});

router.get("/:transportId/journey", async (req, res) => {
  try {
    const transportId = Number(req.params.transportId);
    const [[transport]] = await pool.query(
      `SELECT t.transport_id, t.transport_status, t.organ_id,
              hs.name AS source_hospital_name,
              hd.name AS destination_hospital_name,
              tv.type AS vehicle_type,
              tt.team_name
       FROM transport t
       LEFT JOIN hospital hs ON hs.hospital_id = t.source_hospital
       LEFT JOIN hospital hd ON hd.hospital_id = t.destination_hospital
       LEFT JOIN transport_vehicle tv ON tv.vehicle_id = t.vehicle_id
       LEFT JOIN transport_team tt ON tt.team_id = t.team_id
       WHERE t.transport_id = ?`,
      [transportId]
    );

    if (!transport) return res.status(404).json({ message: "Transport record not found" });

    const [events] = await pool.query(
      `SELECT tracking_id, current_location, status, update_time
       FROM location_tracking
       WHERE transport_id = ?
       ORDER BY update_time ASC, tracking_id ASC`,
      [transportId]
    );

    const phases = [
      { label: "Collected", done: true },
      { label: "In Transit", done: ["In Transit", "Delivered"].includes(transport.transport_status) },
      { label: "Reached", done: transport.transport_status === "Delivered" },
      { label: "Surgery", done: false },
    ];

    return res.json({ transport, timeline: events, phases });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch journey", error: error.message });
  }
});

router.use("/jobs", createCrudRouter("transport"));
router.use("/tracking", createCrudRouter("location_tracking"));
router.use("/teams", createCrudRouter("transport_team"));
router.use("/vehicles", createCrudRouter("transport_vehicle"));

export default router;
