const { getDatabasePool } = require('../db/pool');

function createAuthRepository(pool = getDatabasePool()) {
  return {
    async findBusinessByCode(businessCode) {
      const [rows] = await pool.execute(
        'SELECT id FROM businesses WHERE business_code = ? LIMIT 1',
        [businessCode]
      );

      return rows[0] || null;
    },

    async findUserByBusinessIdAndEmail(businessId, email) {
      const [rows] = await pool.execute(
        `SELECT id, business_id, name, email, password_hash, role, is_active
         FROM users
         WHERE business_id = ? AND email = ?
         LIMIT 1`,
        [businessId, email]
      );

      return rows[0] || null;
    }
  };
}

module.exports = { createAuthRepository };