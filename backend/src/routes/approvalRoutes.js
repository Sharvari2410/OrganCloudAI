import express from "express";
import pool from "../db.js";
import { emitRealtime } from "../socket.js";
import { createCrudRouter } from "./crudRouterFactory.js";

const router = express.Router();

router.get("/workflow", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dr.request_id, dr.recipient_id, dr.status AS request_status,
              COALESCE(a.approval_status, 'Pending') AS approval_status,
              a.doctor_id, a.admin_id, a.approval_date
       FROM donation_request dr
       LEFT JOIN approval a ON a.request_id = dr.request_id
       ORDER BY dr.request_date DESC, dr.request_id DESC
       LIMIT 40`
    );

    const workflows = rows.map((row) => {
      const doctorDone = Boolean(row.doctor_id);
      const hospitalDone = Boolean(row.admin_id);
      const legalDone = ["Approved", "Legal Approved"].includes(row.approval_status);
      const currentStep = legalDone ? 2 : hospitalDone ? 2 : doctorDone ? 1 : 0;

      return {
        ...row,
        steps: {
          doctor: doctorDone,
          hospital: hospitalDone,
          legal: legalDone,
        },
        currentStep,
      };
    });

    return res.json(workflows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch approval workflows", error: error.message });
  }
});

router.patch("/workflow/:requestId/status", async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const { approval_status, doctor_id, admin_id } = req.body;

    const [[existing]] = await pool.query("SELECT * FROM approval WHERE request_id = ? LIMIT 1", [requestId]);

    if (!existing) {
      const [insertResult] = await pool.query(
        `INSERT INTO approval (request_id, doctor_id, admin_id, approval_status, approval_date)
         VALUES (?, ?, ?, ?, CURDATE())`,
        [requestId, doctor_id || null, admin_id || null, approval_status || "Pending"]
      );

      emitRealtime("approval:updated", {
        requestId,
        approvalId: insertResult.insertId,
        status: approval_status || "Pending",
      });

      return res.json({ requestId, approvalId: insertResult.insertId, status: approval_status || "Pending" });
    }

    await pool.query(
      `UPDATE approval
       SET doctor_id = COALESCE(?, doctor_id),
           admin_id = COALESCE(?, admin_id),
           approval_status = COALESCE(?, approval_status),
           approval_date = CURDATE()
       WHERE request_id = ?`,
      [doctor_id || null, admin_id || null, approval_status || null, requestId]
    );

    emitRealtime("approval:updated", {
      requestId,
      approvalId: existing.approval_id,
      status: approval_status || existing.approval_status,
    });

    return res.json({ requestId, approvalId: existing.approval_id, status: approval_status || existing.approval_status });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update approval workflow", error: error.message });
  }
});

router.use("/records", createCrudRouter("approval"));

export default router;
