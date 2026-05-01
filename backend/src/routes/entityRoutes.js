import express from "express";
import pool from "../db.js";
import { entityConfig } from "../config/entities.js";
import { buildFilterClause, sanitizePagination, sanitizeSort } from "../utils/queryBuilder.js";

const router = express.Router();

function pickPayload(payload, config) {
  const body = {};
  for (const column of config.columns) {
    if (Object.hasOwn(payload, column)) {
      body[column] = payload[column];
    }
  }
  return body;
}

router.get("/:entity", async (req, res) => {
  try {
    const config = entityConfig[req.params.entity];
    if (!config) return res.status(404).json({ message: "Unknown entity" });

    const { q, sortBy, sortOrder, ...rawFilters } = req.query;
    const { limit, page, offset } = sanitizePagination(req.query);
    const { cleanSortBy, cleanSortOrder } = sanitizeSort(config, sortBy, sortOrder);

    const textColumns = config.columns.filter((column) =>
      ["name", "organ_type", "status", "approval_status", "surgery_status", "match_status", "city", "state", "required_organ"].includes(column)
    );

    const { whereClause, values } = buildFilterClause(config, rawFilters);
    const qClause = q && textColumns.length
      ? `${whereClause ? " AND " : "WHERE "}${textColumns.map((column) => `\`${column}\` LIKE ?`).join(" OR ")}`
      : "";

    const queryValues = [...values];
    if (q && textColumns.length) {
      for (let i = 0; i < textColumns.length; i += 1) queryValues.push(`%${q}%`);
    }

    const [rows] = await pool.query(
      `SELECT * FROM \`${req.params.entity}\` ${whereClause}${qClause} ORDER BY \`${cleanSortBy}\` ${cleanSortOrder} LIMIT ? OFFSET ?`,
      [...queryValues, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM \`${req.params.entity}\` ${whereClause}${qClause}`,
      queryValues
    );

    res.json({
      items: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch records", error: error.message });
  }
});

router.get("/:entity/:id", async (req, res) => {
  try {
    const config = entityConfig[req.params.entity];
    if (!config) return res.status(404).json({ message: "Unknown entity" });

    const [rows] = await pool.query(
      `SELECT * FROM \`${req.params.entity}\` WHERE \`${config.id}\` = ? LIMIT 1`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: "Record not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch record", error: error.message });
  }
});

router.post("/:entity", async (req, res) => {
  try {
    const config = entityConfig[req.params.entity];
    if (!config) return res.status(404).json({ message: "Unknown entity" });

    const payload = pickPayload(req.body, config);
    const keys = Object.keys(payload);
    if (!keys.length) return res.status(400).json({ message: "No valid fields in payload" });

    const [result] = await pool.query(
      `INSERT INTO \`${req.params.entity}\` (${keys.map((key) => `\`${key}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
      Object.values(payload)
    );

    res.status(201).json({ id: result.insertId, ...payload });
  } catch (error) {
    res.status(500).json({ message: "Failed to create record", error: error.message });
  }
});

router.put("/:entity/:id", async (req, res) => {
  try {
    const config = entityConfig[req.params.entity];
    if (!config) return res.status(404).json({ message: "Unknown entity" });

    const payload = pickPayload(req.body, config);
    const keys = Object.keys(payload);
    if (!keys.length) return res.status(400).json({ message: "No valid fields in payload" });

    const assignments = keys.map((key) => `\`${key}\` = ?`).join(", ");
    const [result] = await pool.query(
      `UPDATE \`${req.params.entity}\` SET ${assignments} WHERE \`${config.id}\` = ?`,
      [...Object.values(payload), req.params.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Record not found" });
    res.json({ id: req.params.id, ...payload });
  } catch (error) {
    res.status(500).json({ message: "Failed to update record", error: error.message });
  }
});

router.delete("/:entity/:id", async (req, res) => {
  try {
    const config = entityConfig[req.params.entity];
    if (!config) return res.status(404).json({ message: "Unknown entity" });

    const [result] = await pool.query(
      `DELETE FROM \`${req.params.entity}\` WHERE \`${config.id}\` = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Record not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete record", error: error.message });
  }
});

export default router;
