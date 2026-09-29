const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createAuthRepository } = require('../repositories/auth.repository');

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRES_IN = '15m';
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('invalid-login-password', 12);

class AuthenticationFailure extends Error {}

function createAuthService({
  authRepository = createAuthRepository(),
  jwtSecret = process.env.JWT_SECRET
} = {}) {
  if (typeof jwtSecret !== 'string' || Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 bytes.');
  }

  return {
    async login({ businessCode, email, password }) {
      const business = await authRepository.findBusinessByCode(businessCode);
      const user = business
        ? await authRepository.findUserByBusinessIdAndEmail(business.id, email)
        : null;

      let passwordMatches = false;

      try {
        passwordMatches = await bcrypt.compare(password, user?.password_hash || DUMMY_PASSWORD_HASH);
      } catch {
        passwordMatches = false;
      }

      if (!business || !user || !user.is_active || !passwordMatches) {
        throw new AuthenticationFailure('Invalid business code, email, or password.');
      }

      const token = jwt.sign(
        { businessId: business.id, role: user.role },
        jwtSecret,
        {
          algorithm: JWT_ALGORITHM,
          expiresIn: JWT_EXPIRES_IN,
          subject: String(user.id)
        }
      );

      return {
        token,
        user: {
          id: user.id,
          businessId: business.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    }
  };
}

module.exports = { AuthenticationFailure, createAuthService };