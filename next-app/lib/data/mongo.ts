import 'server-only';

import { Db, MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __efvnMongoClientPromise: Promise<MongoClient> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI?.trim() || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME?.trim() || '';

let lastConnectErrorLogAt = 0;

function canLogConnectError() {
  const now = Date.now();
  if (now - lastConnectErrorLogAt < 60_000) {
    return false;
  }
  lastConnectErrorLogAt = now;
  return true;
}

export function isMongoConfigured() {
  return Boolean(MONGODB_URI);
}

async function getMongoClient() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!globalThis.__efvnMongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 15,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 3500
    });
    globalThis.__efvnMongoClientPromise = client.connect();
  }

  return globalThis.__efvnMongoClientPromise;
}

export async function getMongoDatabase(): Promise<Db | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    const client = await getMongoClient();
    return MONGODB_DB_NAME ? client.db(MONGODB_DB_NAME) : client.db();
  } catch (error) {
    if (canLogConnectError()) {
      const message = error instanceof Error ? error.message : 'Unknown MongoDB error';
      // eslint-disable-next-line no-console
      console.error(`[mongo] Connection failed, fallback to mock: ${message}`);
    }
    return null;
  }
}
