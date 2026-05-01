import express from "express";
import pool from "../db.js";
import { createCrudRouter } from "./crudRouterFactory.js";

const router = express.Router();

router.get("/overview", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.surgery_id, s.surgery_date, s.surgery_status,
              d.name AS doctor_name, mr.match_status,
              r.name AS recipient_name, dn.name AS donor_name
       FROM surgery s
       LEFT JOIN doctor d ON d.doctor_id = s.doctor_id
       LEFT JOIN match_record mr ON mr.match_id = s.match_id
       LEFT JOIN recipient r ON r.recipient_id = mr.recipient_id
       LEFT JOIN donor dn ON dn.donor_id = mr.donor_id
       ORDER BY s.surgery_date DESC, s.surgery_id DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch surgery overview", error: error.message });
  }
});

router.use("/", createCrudRouter("surgery"));

export default router;
