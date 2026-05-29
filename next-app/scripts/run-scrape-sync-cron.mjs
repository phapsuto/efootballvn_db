#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLocalEnv } from './load-local-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEXT_APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(NEXT_APP_ROOT, '..');

await loadLocalEnv(NEXT_APP_ROOT);
const DEFAULT_STATUS_PATH = path.resolve(
  REPO_ROOT,
  'scraped-output',
  'status',
  'scrape-sync-status.json'
);
const TIMEZONE = process.env.SCRAPER_TIMEZONE || 'Asia/Ho_Chi_Minh';

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const BASE_MAX_PLAYERS = Math.max(1, toNumber(process.env.SCRAPER_MAX_PLAYERS_BASE, 40));
const PEAK_MAX_PLAYERS = Math.max(1, toNumber(process.env.SCRAPER_MAX_PLAYERS_PEAK, 80));

function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: map.weekday
  };
}

function isPeakWindow(parts) {
  return parts.weekday === 'Thu';
}

function matchesSchedule(parts) {
  return parts.hour === 17 && parts.minute === 15;
}

function getNextScheduledRun(fromDate = new Date()) {
  let cursor = new Date(fromDate.getTime() + 60_000);
  cursor.setSeconds(0, 0);

  for (let step = 0; step < 60 * 24 * 8; step += 1) {
    const parts = getZonedParts(cursor, TIMEZONE);
    if (matchesSchedule(parts)) {
      return {
        runAt: cursor,
        isPeak: isPeakWindow(parts)
      };
    }
    cursor = new Date(cursor.getTime() + 60_000);
  }

  throw new Error('Không tính được lịch scrape-sync kế tiếp trong 8 ngày tới.');
}

async function readJson(filePath, fallback = null) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

async function updateSchedulerStatus(filePath, patch) {
  const current =
    (await readJson(filePath, null)) || {
      version: 1,
      updatedAt: null,
      lastRun: null,
      lastSuccess: null,
      scheduler: null
    };

  const next = {
    ...current,
    updatedAt: new Date().toISOString(),
    scheduler: {
      ...current.scheduler,
      ...patch
    }
  };

  await writeJson(filePath, next);
  return next;
}

function runSyncScript(scriptName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.resolve(NEXT_APP_ROOT, 'scripts', scriptName), ...args],
      {
        cwd: NEXT_APP_ROOT,
        env: process.env,
        stdio: 'inherit'
      }
    );

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let stopping = false;

async function loop() {
  while (!stopping) {
    const nextSchedule = getNextScheduledRun(new Date());
    const delayMs = Math.max(1000, nextSchedule.runAt.getTime() - Date.now());
    const maxPlayers = nextSchedule.isPeak ? PEAK_MAX_PLAYERS : BASE_MAX_PLAYERS;

    await updateSchedulerStatus(DEFAULT_STATUS_PATH, {
      running: true,
      timezone: TIMEZONE,
      mode: 'cron',
      cadence: 'Daily at 17:15 (ICT) after eFootball updates',
      nextRunAt: nextSchedule.runAt.toISOString(),
      peakWindow: nextSchedule.isPeak,
      maxPlayers
    });

    // eslint-disable-next-line no-console
    console.log('[scrape-sync-cron] waiting for next run', {
      nextRunAt: nextSchedule.runAt.toISOString(),
      timezone: TIMEZONE,
      maxPlayers
    });

    await sleep(delayMs);

    if (stopping) {
      break;
    }

    try {
      // eslint-disable-next-line no-console
      console.log('[scrape-sync-cron] Starting player synchronization...');
      await runSyncScript('sync-efbase.mjs', [
        '--maxPlayers',
        String(maxPlayers),
        '--trigger',
        nextSchedule.isPeak ? 'cron:peak' : 'cron:base'
      ]);

      // eslint-disable-next-line no-console
      console.log('[scrape-sync-cron] Starting packs synchronization...');
      await runSyncScript('sync-efpacks.mjs', []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[scrape-sync-cron] sync run failed', error);
    }
  }
}

async function shutdown(signal) {
  if (stopping) {
    return;
  }
  stopping = true;
  await updateSchedulerStatus(DEFAULT_STATUS_PATH, {
    running: false,
    stoppedAt: new Date().toISOString(),
    stopSignal: signal
  });
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

loop().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('[scrape-sync-cron] fatal', error);
  await updateSchedulerStatus(DEFAULT_STATUS_PATH, {
    running: false,
    fatalError: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
