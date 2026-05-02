import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

function mapType(type) {
  const t = type.toLowerCase();
  if (t.includes("int") || t.includes("tinyint") || t.includes("bigint")) return "INTEGER";
  if (t.includes("decimal") || t.includes("float") || t.includes("double")) return "REAL";
  if (t.includes("blob") || t.includes("binary")) return "BLOB";
  return "TEXT";
}

async function main() {
  const sqlitePath = path.resolve(process.cwd(), "backend/data/smartorgansystem.sqlite");
  if (fs.existsSync(sqlitePath)) fs.unlinkSync(sqlitePath);

  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smartorgansystem",
  });

  const sqliteDb = await open({
    filename: sqlitePath,
    driver: sqlite3.Database,
  });

  await sqliteDb.exec("PRAGMA foreign_keys = OFF;");

  const [tableRows] = await mysqlConn.query("SHOW TABLES");
  const tableKey = Object.keys(tableRows[0])[0];
  const tables = tableRows.map((row) => row[tableKey]);

  for (const table of tables) {
    const [columns] = await mysqlConn.query(`SHOW COLUMNS FROM \`${table}\``);

    const pkColumns = columns.filter((c) => c.Key === "PRI");
    const hasSinglePk = pkColumns.length === 1;
    const singlePk = hasSinglePk ? pkColumns[0] : null;

    const columnDefs = columns.map((col) => {
      const isPk = col.Key === "PRI";
      const isAuto = String(col.Extra || "").toLowerCase().includes("auto_increment");

      if (hasSinglePk && isPk && isAuto) {
        return `\`${col.Field}\` INTEGER PRIMARY KEY AUTOINCREMENT`;
      }

      const sqlType = mapType(col.Type);
      const nullable = col.Null === "NO" ? " NOT NULL" : "";
      const defaultVal = col.Default === null
        ? ""
        : sqlType === "TEXT"
        ? ` DEFAULT '${String(col.Default).replace(/'/g, "''")}'`
        : ` DEFAULT ${col.Default}`;

      return `\`${col.Field}\` ${sqlType}${nullable}${defaultVal}`;
    });

    if (!(hasSinglePk && String(singlePk.Extra || "").toLowerCase().includes("auto_increment")) && pkColumns.length) {
      columnDefs.push(`PRIMARY KEY (${pkColumns.map((c) => `\`${c.Field}\``).join(", ")})`);
    }

    const createSql = `CREATE TABLE \`${table}\` (${columnDefs.join(", ")});`;
    await sqliteDb.exec(createSql);

    const [rows] = await mysqlConn.query(`SELECT * FROM \`${table}\``);
    if (rows.length) {
      const keys = Object.keys(rows[0]);
      const placeholders = keys.map(() => "?").join(", ");
      const insertSql = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${placeholders})`;

      await sqliteDb.exec("BEGIN TRANSACTION;");
      for (const row of rows) {
        await sqliteDb.run(insertSql, keys.map((k) => row[k]));
      }
      await sqliteDb.exec("COMMIT;");
    }
  }

  await sqliteDb.exec("PRAGMA foreign_keys = ON;");
  await sqliteDb.close();
  await mysqlConn.end();

  console.log(`SQLite database created at ${sqlitePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
