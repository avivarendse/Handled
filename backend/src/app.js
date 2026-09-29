const express = require('express');
const { createAuthRouter } = require('./routes/auth.routes');
const { createAuthService } = require('./services/auth.service');

function createApp({ authService = createAuthService(), isProduction = process.env.NODE_ENV === 'production' } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Handled API is running'
    });
  });

  app.use('/api/auth', createAuthRouter({ authService, isProduction }));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    return res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

module.exports = { createApp };