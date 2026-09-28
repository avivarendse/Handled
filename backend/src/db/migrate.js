const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

const migrationsDirectory = path.resolve(__dirname, '../../migrations');

function quoteIdentifier(identifier) {
  return `\`${identifier.replaceAll('`', '``')}\``;
}

async function migrate() {
  const databaseName = process.env.DATABASE_NAME;
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    multipleStatements: true
  });

  try {
    if (!databaseName) {
      throw new Error('DATABASE_NAME must be set.');
    }

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(databaseName)}`);
    await connection.query(`USE ${quoteIdentifier(databaseName)}`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration VARCHAR(255) NOT NULL,
        applied_at DATETIME NOT NULL,
        PRIMARY KEY (migration)
      ) ENGINE=InnoDB
    `);

    const migrations = (await fs.readdir(migrationsDirectory))
      .filter((filename) => filename.endsWith('.sql'))
      .sort();

    for (const migration of migrations) {
      const [appliedMigrations] = await connection.execute(
        'SELECT migration FROM schema_migrations WHERE migration = ?',
        [migration]
      );

      if (appliedMigrations.length > 0) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDirectory, migration), 'utf8');
      await connection.query(sql);
      await connection.execute(
        'INSERT INTO schema_migrations (migration, applied_at) VALUES (?, NOW())',
        [migration]
      );
      console.log(`Applied migration: ${migration}`);
    }
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(`Database migration failed: ${error.message}`);
  process.exitCode = 1;
});