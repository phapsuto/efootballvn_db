const mongoose = require('mongoose');
const env = require('./env');

const DB_STATE = {
  connected: false,
  lastError: null
};

const connectDatabase = async ({ required = env.DB_REQUIRED } = {}) => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    DB_STATE.connected = true;
    DB_STATE.lastError = null;
    // eslint-disable-next-line no-console
    console.log(`[db] Connected: ${env.MONGODB_URI}`);
    return true;
  } catch (error) {
    DB_STATE.connected = false;
    DB_STATE.lastError = error;
    // eslint-disable-next-line no-console
    console.error(`[db] Connect failed: ${error.message}`);

    if (required) {
      throw error;
    }

    // eslint-disable-next-line no-console
    console.warn('[db] Continue in no-database mode (using mock/local fallback data).');
    return false;
  }
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    DB_STATE.connected = false;
    return;
  }

  await mongoose.disconnect();
  DB_STATE.connected = false;
  // eslint-disable-next-line no-console
  console.log('[db] Disconnected');
};

const isDatabaseConnected = () =>
  DB_STATE.connected && mongoose.connection.readyState === 1;

const getDatabaseState = () => ({
  connected: isDatabaseConnected(),
  readyState: mongoose.connection.readyState,
  required: env.DB_REQUIRED,
  lastError: DB_STATE.lastError ? DB_STATE.lastError.message : null
});

module.exports = {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseState
};
