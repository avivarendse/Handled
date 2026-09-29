const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const business = {
  name: 'Northstar Heating & Cooling',
  phone: '+1 206-555-0142',
  email: 'office@northstarhvac.test',
  address: '101 Pine Street, Seattle, WA 98101',
  businessCode: 'NORTHSTAR01'
};

const manager = {
  name: 'Morgan Lee',
  email: 'manager@northstarhvac.test',
  role: 'MANAGER'
};

async function seed() {
  const databaseName = process.env.DATABASE_NAME;
  const managerPassword = process.env.SEED_MANAGER_PASSWORD;

  if (!databaseName) {
    throw new Error('DATABASE_NAME must be set.');
  }

  if (!managerPassword) {
    throw new Error('SEED_MANAGER_PASSWORD must be set.');
  }

  if (Buffer.byteLength(managerPassword, 'utf8') > 72) {
    throw new Error('SEED_MANAGER_PASSWORD must be no more than 72 UTF-8 bytes.');
  }

  const passwordHash = await bcrypt.hash(managerPassword, 12);
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: databaseName
  });

  try {
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO businesses
        (name, phone, email, address, business_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [business.name, business.phone, business.email, business.address, business.businessCode]
    );

    const [businessRows] = await connection.execute(
      'SELECT id FROM businesses WHERE business_code = ?',
      [business.businessCode]
    );

    if (businessRows.length === 0) {
      throw new Error('Seed business could not be found after insert.');
    }

    await connection.execute(
      `INSERT INTO users
        (business_id, name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW())
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [businessRows[0].id, manager.name, manager.email, passwordHash, manager.role]
    );

    await connection.commit();
    console.log(`Development seed complete for ${business.businessCode} (${manager.email}).`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error(`Development seed failed: ${error.message}`);
  process.exitCode = 1;
});
