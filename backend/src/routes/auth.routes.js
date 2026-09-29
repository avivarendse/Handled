const express = require('express');
const { createAuthController } = require('../controllers/auth.controller');

function createAuthRouter({ authService, isProduction }) {
  const router = express.Router();
  const authController = createAuthController({ authService, isProduction });

  router.post('/login', authController.login);

  return router;
}

module.exports = { createAuthRouter };