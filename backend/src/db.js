import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultSeedPath = path.resolve(__dirname, "../data/smartorgansystem.sqlite");
const sqlitePath = process.env.SQLITE_PATH || defaultSeedPath;

function ensureDatabaseFile() {
  const targetDir = path.dirname(sqlitePath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (!fs.existsSync(sqlitePath)) {
    if (fs.existsSync(defaultSeedPath)) {
      fs.copyFileSync(defaultSeedPath, sqlitePath);
      console.log(`[DB] Seeded SQLite database at ${sqlitePath}`);
    } else {
      // Create an empty file if seed is unavailable. App will fail fast on missing tables.
      fs.closeSync(fs.openSync(sqlitePath, "w"));
      console.warn(`[DB] Created empty SQLite file at ${sqlitePath}. Seed DB not found at ${defaultSeedPath}`);
    }
  }
}

ensureDatabaseFile();

const dbPromise = open({
  filename: sqlitePath,
  driver: sqlite3.Database,
});

function transformSql(rawSql) {
  let sql = rawSql;

  sql = sql.replace(/\bNOW\(\)/gi, "datetime('now')");
  sql = sql.replace(/\bCURDATE\(\)/gi, "date('now')");
  sql = sql.replace(
    /DATEDIFF\(\s*date\('now'\)\s*,\s*([^)]+)\)/gi,
    "CAST((julianday('now') - julianday($1)) AS INTEGER)"
  );

  return sql;
}

function normalizeParams(params = []) {
  return params.map((value) => {
    if (value instanceof Date) return value.toISOString();
    return value;
  });
}

async function query(sql, params = []) {
  const db = await dbPromise;
  const transformedSql = transformSql(sql);
  const lowered = transformedSql.trim().toLowerCase();
  const finalParams = normalizeParams(params);

  if (lowered.startsWith("select") || lowered.startsWith("pragma")) {
    const rows = await db.all(transformedSql, finalParams);
    return [rows];
  }

  const result = await db.run(transformedSql, finalParams);
  return [
    {
      insertId: result.lastID,
      affectedRows: result.changes,
    },
  ];
}

async function getConnection() {
  return {
    query,
    beginTransaction: async () => {
      const db = await dbPromise;
      await db.exec("BEGIN TRANSACTION");
    },
    commit: async () => {
      const db = await dbPromise;
      await db.exec("COMMIT");
    },
    rollback: async () => {
      const db = await dbPromise;
      await db.exec("ROLLBACK");
    },
    release: () => {},
  };
}

const pool = { query, getConnection };

export default pool;
