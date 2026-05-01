import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;

if (process.env.DATABASE_URL) {
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smartorgansystem",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export default pool;