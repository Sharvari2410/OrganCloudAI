import express from "express";
import pool from "../db.js";
import { buildPredictiveInsights } from "../services/predictiveInsightsService.js";

const router = express.Router();

router.get("/summary", async (_req, res) => {
  try {
    const [[donors]] = await pool.query("SELECT COUNT(*) AS total FROM donor");
    const [[recipients]] = await pool.query("SELECT COUNT(*) AS total FROM recipient");
    const [[activeRequests]] = await pool.query("SELECT COUNT(*) AS total FROM donation_request WHERE status IN ('Pending', 'Emergency')");
    const [[organsAvailableRow]] = await pool.query("SELECT COUNT(*) AS total FROM organ_availability WHERE status = 'Available'");
    const [[emergencyCases]] = await pool.query("SELECT COUNT(*) AS total FROM recipient WHERE urgency_level >= 9");
    const [[delayedTransports]] = await pool.query("SELECT COUNT(*) AS total FROM transport WHERE transport_status = 'Delayed'");

    const [organDemand] = await pool.query(
      `SELECT required_organ AS label, COUNT(*) AS value
       FROM recipient
       GROUP BY required_organ
       ORDER BY value DESC`
    );

    const [transplantStats] = await pool.query(
      `SELECT surgery_status AS label, COUNT(*) AS value
       FROM surgery
       GROUP BY surgery_status`
    );

    const [recentActivity] = await pool.query(
      `SELECT 'match' AS type, mr.match_id AS entity_id, mr.match_status AS status, NOW() AS activity_date,
              CONCAT(d.name, ' -> ', r.name) AS details
       FROM match_record mr
       LEFT JOIN donor d ON d.donor_id = mr.donor_id
       LEFT JOIN recipient r ON r.recipient_id = mr.recipient_id
       UNION ALL
       SELECT 'surgery' AS type, s.surgery_id AS entity_id, s.surgery_status AS status, s.surgery_date AS activity_date,
              d.name AS details
       FROM surgery s
       LEFT JOIN doctor d ON d.doctor_id = s.doctor_id
       UNION ALL
       SELECT 'transport' AS type, t.transport_id AS entity_id, t.transport_status AS status, NOW() AS activity_date,
              CONCAT(hs.city, ' -> ', hd.city) AS details
       FROM transport t
       LEFT JOIN hospital hs ON hs.hospital_id = t.source_hospital
       LEFT JOIN hospital hd ON hd.hospital_id = t.destination_hospital
       ORDER BY activity_date DESC
       LIMIT 12`
    );

    const [demandByState] = await pool.query(
      `SELECT h.state, dr.organ_type, COUNT(*) AS total
       FROM donation_request dr
       JOIN recipient r ON r.recipient_id = dr.recipient_id
       JOIN hospital h ON h.hospital_id = ((r.recipient_id - 1) % (SELECT COUNT(*) FROM hospital)) + 1
       GROUP BY h.state, dr.organ_type
       ORDER BY total DESC`
    );

    const [[avgScore]] = await pool.query("SELECT ROUND(AVG(compatibility_score), 0) AS avg_score FROM organ_compatibility");

    const [network] = await pool.query(
      `SELECT hs.name AS source, hs.city AS sourceCity,
              hd.name AS destination, hd.city AS destinationCity,
              COUNT(*) AS transfers
       FROM transport t
       LEFT JOIN hospital hs ON hs.hospital_id = t.source_hospital
       LEFT JOIN hospital hd ON hd.hospital_id = t.destination_hospital
       GROUP BY hs.name, hs.city, hd.name, hd.city
       ORDER BY transfers DESC`
    );

    const predictiveInsights = buildPredictiveInsights({
      demandByState,
      organDemand,
      organsAvailable: organsAvailableRow.total,
      activeRequests: activeRequests.total,
      averageScore: avgScore.avg_score || 0,
      delayedTransports: delayedTransports.total,
    });

    res.json({
      metrics: {
        donors: donors.total,
        recipients: recipients.total,
        activeRequests: activeRequests.total,
        organsAvailable: organsAvailableRow.total,
        emergencyCases: emergencyCases.total,
      },
      charts: {
        organDemand,
        transplantStats,
      },
      recentActivity,
      aiInsights: predictiveInsights.map((item) => item.message),
      predictiveInsights,
      network,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load dashboard", error: error.message });
  }
});

export default router;

