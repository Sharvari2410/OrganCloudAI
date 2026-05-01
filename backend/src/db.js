import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConnectionOptions =
  process.env.DATABASE_URL || process.env.MYSQL_URL
    ? process.env.DATABASE_URL || process.env.MYSQL_URL
    : {
        host:
          process.env.MYSQLHOST ||
          process.env.MYSQL_HOST ||
          process.env.DB_HOST ||
          process.env.DATABASE_HOST,
        port: Number(
          process.env.MYSQLPORT ||
          process.env.MYSQL_PORT ||
          process.env.DB_PORT ||
          process.env.DATABASE_PORT ||
          3306
        ),
        user:
          process.env.MYSQLUSER ||
          process.env.MYSQL_USER ||
          process.env.DB_USER ||
          process.env.DATABASE_USER ||
          "root",
        password:
          process.env.MYSQLPASSWORD ||
          process.env.MYSQL_PASSWORD ||
          process.env.DB_PASSWORD ||
          process.env.DATABASE_PASSWORD,
        database:
          process.env.MYSQLDATABASE ||
          process.env.MYSQL_DATABASE ||
          process.env.DB_NAME ||
          process.env.DATABASE_NAME ||
          process.env.DB_DATABASE ||
          process.env.DATABASE ||
          "railway",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      };

const pool = mysql.createPool(dbConnectionOptions);

export default pool;