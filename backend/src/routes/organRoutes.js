import express from "express";
import pool from "../db.js";
import { createCrudRouter } from "./crudRouterFactory.js";

const router = express.Router();

router.get("/with-status", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.organ_id, o.organ_type, o.donor_id, d.name AS donor_name,
              oa.status, oa.available_from
       FROM organ o
       JOIN donor d ON d.donor_id = o.donor_id
       LEFT JOIN organ_availability oa ON oa.organ_id = o.organ_id
       ORDER BY o.organ_id DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch organ status", error: error.message });
  }
});

router.use("/", createCrudRouter("organ"));

export default router;
