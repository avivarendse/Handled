const mysql = require('mysql2/promise');

let pool;

function getDatabasePool() {
  const databaseName = process.env.DATABASE_NAME;

  if (!databaseName) {
    throw new Error('DATABASE_NAME must be set.');
  }

  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: databaseName,
      waitForConnections: true,
      connectionLimit: 10
    });
  }

  return pool;
}

module.exports = { getDatabasePool };