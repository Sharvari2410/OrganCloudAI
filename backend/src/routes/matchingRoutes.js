import express from "express";
import pool from "../db.js";
import {
  distanceBetweenHospitals,
  resolveDonorHospital,
  resolveRecipientHospital,
} from "../services/geoService.js";
import { emitRealtime } from "../socket.js";

const router = express.Router();

const bloodCompatibility = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
};

function scoreMatch({ donorBlood, recipientBlood, organTypeMatch, donorAge, recipientAge, urgencyLevel, distanceKm }) {
  const bloodMatch = bloodCompatibility[recipientBlood]?.includes(donorBlood) ? 100 : 20;
  const organMatch = organTypeMatch ? 100 : 0;
  const ageGap = Math.abs(Number(donorAge) - Number(recipientAge));
  const ageScore = Math.max(10, 100 - ageGap * 2.2);
  const urgencyScore = Math.min(100, Number(urgencyLevel || 1) * 10);
  const distanceScore = Math.max(10, 100 - Math.min(100, distanceKm / 15));

  const compatibilityScore = Math.round(
    bloodMatch * 0.3 + organMatch * 0.2 + ageScore * 0.2 + urgencyScore * 0.15 + distanceScore * 0.15
  );

  const emergencyPriority = Number(urgencyLevel) >= 9 ? "Critical" : Number(urgencyLevel) >= 7 ? "High" : "Normal";

  return {
    bloodMatch: bloodMatch >= 100 ? 1 : 0,
    organMatch,
    ageFactor: Math.round(ageScore),
    urgencyWeight: urgencyScore,
    distanceKm: Math.round(distanceKm),
    compatibilityScore,
    emergencyPriority,
  };
}

async function fetchDemandModel() {
  const [rows] = await pool.query(
    `SELECT h.state, dr.organ_type, COUNT(*) AS total
     FROM donation_request dr
     JOIN recipient r ON r.recipient_id = dr.recipient_id
     JOIN hospital h ON h.hospital_id = ((r.recipient_id - 1) % (SELECT COUNT(*) FROM hospital)) + 1
     GROUP BY h.state, dr.organ_type
     ORDER BY total DESC`
  );
  return rows;
}

router.get("/suggestions", async (req, res) => {
  try {
    const recipientId = Number(req.query.recipientId);
    if (!recipientId) {
      return res.status(400).json({ message: "recipientId query param is required" });
    }

    const [[recipient]] = await pool.query("SELECT * FROM recipient WHERE recipient_id = ?", [recipientId]);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const [hospitals] = await pool.query("SELECT hospital_id, name, city, state FROM hospital ORDER BY hospital_id ASC");
    const demandModel = await fetchDemandModel();
    const recipientHospital = resolveRecipientHospital(recipient, hospitals, demandModel);

    const [donorCandidates] = await pool.query(
      `SELECT d.donor_id, d.name AS donor_name, d.age AS donor_age, d.blood_group AS donor_blood_group, d.address,
              o.organ_id, o.organ_type, oa.status AS availability_status
       FROM donor d
       JOIN organ o ON o.donor_id = d.donor_id
       JOIN organ_availability oa ON oa.organ_id = o.organ_id
       WHERE oa.status = 'Available'`
    );

    const enriched = donorCandidates
      .map((candidate) => {
        const donorHospital = resolveDonorHospital(candidate, hospitals);
        const distanceKm = distanceBetweenHospitals(donorHospital, recipientHospital);

        const details = scoreMatch({
          donorBlood: candidate.donor_blood_group,
          recipientBlood: recipient.blood_group,
          donorAge: candidate.donor_age,
          recipientAge: recipient.age,
          urgencyLevel: recipient.urgency_level,
          organTypeMatch: candidate.organ_type === recipient.required_organ,
          distanceKm,
        });

        return {
          ...candidate,
          donor_hospital: donorHospital,
          recipient_hospital: recipientHospital,
          recipient_id: recipient.recipient_id,
          recipient_name: recipient.name,
          required_organ: recipient.required_organ,
          recipient_blood_group: recipient.blood_group,
          urgency_level: recipient.urgency_level,
          ...details,
        };
      })
      .filter((candidate) => candidate.organ_type === recipient.required_organ)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.json({ recipient, candidates: enriched.slice(0, 20) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate suggestions", error: error.message });
  }
});

router.post("/run", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { donorId, recipientId, organId } = req.body;
    if (!donorId || !recipientId || !organId) {
      return res.status(400).json({ message: "donorId, recipientId and organId are required" });
    }

    const [[donor]] = await connection.query("SELECT * FROM donor WHERE donor_id = ?", [donorId]);
    const [[recipient]] = await connection.query("SELECT * FROM recipient WHERE recipient_id = ?", [recipientId]);
    const [[organ]] = await connection.query("SELECT * FROM organ WHERE organ_id = ?", [organId]);

    if (!donor || !recipient || !organ) {
      return res.status(404).json({ message: "Donor, recipient or organ not found" });
    }

    const [hospitals] = await connection.query("SELECT hospital_id, name, city, state FROM hospital ORDER BY hospital_id ASC");
    const donorHospital = resolveDonorHospital(donor, hospitals);
    const recipientHospital = resolveRecipientHospital(recipient, hospitals);

    const details = scoreMatch({
      donorBlood: donor.blood_group,
      recipientBlood: recipient.blood_group,
      donorAge: donor.age,
      recipientAge: recipient.age,
      urgencyLevel: recipient.urgency_level,
      organTypeMatch: organ.organ_type === recipient.required_organ,
      distanceKm: distanceBetweenHospitals(donorHospital, recipientHospital),
    });

    await connection.beginTransaction();

    const [compatibilityResult] = await connection.query(
      `INSERT INTO organ_compatibility
      (donor_id, recipient_id, blood_match, tissue_match, age_factor, compatibility_score)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [donorId, recipientId, details.bloodMatch, 1, details.ageFactor, details.compatibilityScore]
    );

    const [matchResult] = await connection.query(
      `INSERT INTO match_record (donor_id, recipient_id, organ_id, compatibility_id, match_status)
       VALUES (?, ?, ?, ?, ?)`,
      [donorId, recipientId, organId, compatibilityResult.insertId, "Matched"]
    );

    await connection.query("UPDATE organ_availability SET status = 'Reserved' WHERE organ_id = ?", [organId]);
    await connection.query("UPDATE donation_request SET status = 'Approved' WHERE recipient_id = ?", [recipientId]);

    await connection.commit();

    emitRealtime("match:created", {
      matchId: matchResult.insertId,
      recipientId,
      donorId,
      organId,
      score: details.compatibilityScore,
      emergencyPriority: details.emergencyPriority,
      status: "Matched",
    });

    emitRealtime("status:update", {
      entity: "organ_availability",
      status: "Reserved",
      organId,
    });

    return res.status(201).json({
      match_id: matchResult.insertId,
      compatibility_id: compatibilityResult.insertId,
      score: details.compatibilityScore,
      emergencyPriority: details.emergencyPriority,
      distanceKm: details.distanceKm,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Failed to run matching", error: error.message });
  } finally {
    connection.release();
  }
});

router.get("/records", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT mr.match_id, mr.match_status, mr.organ_id,
              d.name AS donor_name, r.name AS recipient_name,
              oc.compatibility_score
       FROM match_record mr
       LEFT JOIN donor d ON d.donor_id = mr.donor_id
       LEFT JOIN recipient r ON r.recipient_id = mr.recipient_id
       LEFT JOIN organ_compatibility oc ON oc.compatibility_id = mr.compatibility_id
       ORDER BY mr.match_id DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch match records", error: error.message });
  }
});

router.get("/emergency-queue", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.recipient_id, r.name, r.required_organ, r.urgency_level,
              dr.request_date, DATEDIFF(CURDATE(), dr.request_date) AS waiting_days,
              CASE
                WHEN r.urgency_level >= 9 THEN 'Critical'
                WHEN r.urgency_level >= 7 THEN 'High'
                ELSE 'Normal'
              END AS emergency_priority
       FROM recipient r
       LEFT JOIN donation_request dr ON dr.recipient_id = r.recipient_id
       ORDER BY r.urgency_level DESC, waiting_days DESC, r.recipient_id ASC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load emergency queue", error: error.message });
  }
});

export default router;

