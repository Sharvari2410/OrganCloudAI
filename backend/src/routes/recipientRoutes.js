import express from "express";
import pool from "../db.js";
import { createCrudRouter } from "./crudRouterFactory.js";

const router = express.Router();

router.get("/priority-queue", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.recipient_id, r.name, r.required_organ, r.urgency_level, dr.request_date,
              DATEDIFF(CURDATE(), dr.request_date) AS waiting_days,
              CASE WHEN r.urgency_level >= 9 THEN 'Critical' WHEN r.urgency_level >= 7 THEN 'High' ELSE 'Normal' END AS emergency_priority
       FROM recipient r
       LEFT JOIN donation_request dr ON dr.recipient_id = r.recipient_id
       ORDER BY r.urgency_level DESC, waiting_days DESC, r.recipient_id ASC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to build priority queue", error: error.message });
  }
});

router.use("/", createCrudRouter("recipient"));

export default router;
