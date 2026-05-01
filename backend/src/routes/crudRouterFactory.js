import express from "express";
import pool from "../db.js";
import { entityConfig } from "../config/entities.js";
import { buildFilterClause, sanitizePagination, sanitizeSort } from "../utils/queryBuilder.js";
import { emitRealtime } from "../socket.js";

function pickPayload(payload, config) {
  const body = {};
  for (const column of config.columns) {
    if (Object.hasOwn(payload, column)) {
      body[column] = payload[column];
    }
  }
  return body;
}

function extractStatusFields(payload = {}) {
  const statusField = Object.entries(payload).find(([key]) => key.toLowerCase().includes("status"));
  if (!statusField) return null;
  return { field: statusField[0], value: statusField[1] };
}

export function createCrudRouter(entity) {
  const router = express.Router();
  const config = entityConfig[entity];

  router.get("/", async (req, res) => {
    try {
      const { q, sortBy, sortOrder, ...rawFilters } = req.query;
      const { limit, page, offset } = sanitizePagination(req.query);
      const { cleanSortBy, cleanSortOrder } = sanitizeSort(config, sortBy, sortOrder);

      const textColumns = config.columns.filter((column) =>
        ["name", "organ_type", "status", "approval_status", "surgery_status", "match_status", "city", "state", "required_organ", "blood_group"].includes(column)
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
        `SELECT * FROM \`${entity}\` ${whereClause}${qClause} ORDER BY \`${cleanSortBy}\` ${cleanSortOrder} LIMIT ? OFFSET ?`,
        [...queryValues, limit, offset]
      );

      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM \`${entity}\` ${whereClause}${qClause}`,
        queryValues
      );

      return res.json({
        items: rows,
        pagination: {
          page,
          limit,
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limit) || 1,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch ${entity}`, error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM \`${entity}\` WHERE \`${config.id}\` = ? LIMIT 1`,
        [req.params.id]
      );

      if (!rows.length) return res.status(404).json({ message: "Record not found" });
      return res.json(rows[0]);
    } catch (error) {
      return res.status(500).json({ message: `Failed to fetch ${entity}`, error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const payload = pickPayload(req.body, config);
      const keys = Object.keys(payload);
      if (!keys.length) return res.status(400).json({ message: "No valid fields in payload" });

      const [result] = await pool.query(
        `INSERT INTO \`${entity}\` (${keys.map((key) => `\`${key}\``).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
        Object.values(payload)
      );

      const status = extractStatusFields(payload);
      emitRealtime("entity:changed", { entity, action: "create", id: result.insertId, payload, status });

      return res.status(201).json({ id: result.insertId, ...payload });
    } catch (error) {
      return res.status(500).json({ message: `Failed to create ${entity}`, error: error.message });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const payload = pickPayload(req.body, config);
      const keys = Object.keys(payload);
      if (!keys.length) return res.status(400).json({ message: "No valid fields in payload" });

      const assignments = keys.map((key) => `\`${key}\` = ?`).join(", ");
      const [result] = await pool.query(
        `UPDATE \`${entity}\` SET ${assignments} WHERE \`${config.id}\` = ?`,
        [...Object.values(payload), req.params.id]
      );

      if (!result.affectedRows) return res.status(404).json({ message: "Record not found" });

      const status = extractStatusFields(payload);
      emitRealtime("entity:changed", { entity, action: "update", id: req.params.id, payload, status });

      return res.json({ id: req.params.id, ...payload });
    } catch (error) {
      return res.status(500).json({ message: `Failed to update ${entity}`, error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const [result] = await pool.query(
        `DELETE FROM \`${entity}\` WHERE \`${config.id}\` = ?`,
        [req.params.id]
      );

      if (!result.affectedRows) return res.status(404).json({ message: "Record not found" });

      emitRealtime("entity:changed", { entity, action: "delete", id: req.params.id });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: `Failed to delete ${entity}`, error: error.message });
    }
  });

  return router;
}
