const { AuthenticationFailure } = require('../services/auth.service');

const AUTH_COOKIE_NAME = 'handled_auth';
const AUTH_COOKIE_MAX_AGE = 15 * 60 * 1000;
const AUTH_FAILURE_MESSAGE = 'Invalid business code, email, or password.';

function validateLoginRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  if (typeof body.businessCode !== 'string' || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return null;
  }

  const businessCode = body.businessCode.trim().toUpperCase();
  const email = body.email.trim().toLowerCase();

  if (!/^[A-Z0-9]{1,20}$/.test(businessCode)) {
    return null;
  }

  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  if (body.password.length === 0 || Buffer.byteLength(body.password, 'utf8') > 72) {
    return null;
  }

  return { businessCode, email, password: body.password };
}

function createAuthController({ authService, isProduction }) {
  return {
    async login(req, res, next) {
      res.set('Cache-Control', 'no-store');

      const credentials = validateLoginRequest(req.body);

      if (!credentials) {
        return res.status(400).json({ error: 'Invalid login request.' });
      }

      try {
        const { token, user } = await authService.login(credentials);

        res.cookie(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          path: '/api',
          maxAge: AUTH_COOKIE_MAX_AGE
        });

        return res.status(200).json({ user });
      } catch (error) {
        if (error instanceof AuthenticationFailure) {
          return res.status(401).json({ error: AUTH_FAILURE_MESSAGE });
        }

        return next(error);
      }
    }
  };
}

module.exports = { createAuthController };