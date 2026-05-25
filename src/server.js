const app = require('./app');
const env = require('./config/env');
const {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected
} = require('./config/database');

const start = async () => {
  await connectDatabase({ required: env.DB_REQUIRED });

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Running at http://localhost:${env.PORT}`);
    // eslint-disable-next-line no-console
    console.log(
      `[server] DB mode: ${isDatabaseConnected() ? 'connected' : 'fallback (no-db)'}`
    );
  });

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('[server] Shutting down...');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
