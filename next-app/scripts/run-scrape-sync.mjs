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
const DEFAULT_PLAYERS_OUTPUT = path.resolve(REPO_ROOT, 'scraped-output', 'players.latest.json');
const DEFAULT_IMPORT_REPORT = path.resolve(
  REPO_ROOT,
  'scraped-output',
  'status',
  'import-report.json'
);
const DEFAULT_SYNC_STATUS = path.resolve(
  REPO_ROOT,
  'scraped-output',
  'status',
  'scrape-sync-status.json'
);

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      output[key] = 'true';
      continue;
    }
    output[key] = value;
    index += 1;
  }
  return output;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  return fallback;
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

async function readSyncStatus(filePath) {
  return (
    (await readJson(filePath, null)) || {
      version: 1,
      updatedAt: null,
      lastRun: null,
      lastSuccess: null,
      scheduler: null
    }
  );
}

async function updateSyncStatus(filePath, patch) {
  const current = await readSyncStatus(filePath);
  const merged = {
    ...current,
    updatedAt: new Date().toISOString(),
    ...('scheduler' in patch ? { scheduler: patch.scheduler } : {})
  };

  if (patch.lastRun) {
    merged.lastRun = {
      ...current.lastRun,
      ...patch.lastRun
    };

    if (patch.lastRun.ok) {
      merged.lastRun.error = null;
    }
  }

  if (patch.lastRun?.ok) {
    merged.lastSuccess = {
      ...merged.lastRun
    };
  }

  await writeJson(filePath, merged);
  return merged;
}

function runNodeScript(scriptPath, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: options.cwd,
      env: options.env || process.env,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Script failed (${path.basename(scriptPath)}) with exit code ${code}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === 'true') {
    // eslint-disable-next-line no-console
    console.log(
      [
        'Usage:',
        '  node scripts/run-scrape-sync.mjs --maxPlayers 40',
        '',
        'Options:',
        '  --maxPlayers    Number of players to scrape (default: 40)',
        `  --playersOut    JSON output path (default: ${DEFAULT_PLAYERS_OUTPUT})`,
        `  --report        Import report path (default: ${DEFAULT_IMPORT_REPORT})`,
        `  --status        Sync status path (default: ${DEFAULT_SYNC_STATUS})`,
        '  --uri           MongoDB URI override',
        '  --db            MongoDB database override',
        '  --trigger       Trigger label for status/health (default: manual)'
      ].join('\n')
    );
    return;
  }

  const maxPlayers = Math.max(1, Math.round(toNumber(args.maxPlayers, 40)));
  const playersOut = path.resolve(
    REPO_ROOT,
    toStringValue(args.playersOut) || path.relative(REPO_ROOT, DEFAULT_PLAYERS_OUTPUT)
  );
  const reportPath = path.resolve(
    REPO_ROOT,
    toStringValue(args.report) || path.relative(REPO_ROOT, DEFAULT_IMPORT_REPORT)
  );
  const statusPath = path.resolve(
    REPO_ROOT,
    toStringValue(args.status) || path.relative(REPO_ROOT, DEFAULT_SYNC_STATUS)
  );
  const trigger = toStringValue(args.trigger, 'manual');

  const runMeta = {
    trigger,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    ok: false,
    running: true,
    playersOut,
    reportPath,
    maxPlayers,
    cadence: {
      timezone: process.env.SCRAPER_TIMEZONE || 'Asia/Ho_Chi_Minh',
      baseCron: process.env.SCRAPER_BASE_CRON || '12 * * * *',
      peakCron: process.env.SCRAPER_PEAK_CRON || '12,42 16-23 * * 1,4'
    },
    stealth: {
      userAgentRotation: true,
      randomDelayMs: {
        min: toNumber(process.env.SCRAPER_MIN_DELAY_MS, 5000),
        max: toNumber(process.env.SCRAPER_MAX_DELAY_MS, 12000)
      }
    }
  };

  await updateSyncStatus(statusPath, {
    lastRun: {
      ...runMeta,
      message: 'Sync đang chạy: scrape -> import'
    }
  });

  try {
    await runNodeScript(
      path.resolve(REPO_ROOT, 'src', 'scripts', 'run-scraper-once.js'),
      [String(maxPlayers), '--out', playersOut],
      { cwd: REPO_ROOT }
    );

    const importArgs = [
      '--players',
      path.relative(NEXT_APP_ROOT, playersOut),
      '--report',
      path.relative(NEXT_APP_ROOT, reportPath)
    ];
    if (args.uri || process.env.MONGODB_URI) {
      importArgs.push('--uri', args.uri || process.env.MONGODB_URI);
    }
    if (args.db || process.env.MONGODB_DB_NAME) {
      importArgs.push('--db', args.db || process.env.MONGODB_DB_NAME);
    }

    await runNodeScript(path.resolve(NEXT_APP_ROOT, 'scripts', 'import-scraped-data.mjs'), importArgs, {
      cwd: NEXT_APP_ROOT
    });

    const importReport = await readJson(reportPath, null);
    const scrapeStatus = await readJson(
      path.resolve(REPO_ROOT, 'scraped-output', 'status', 'scrape-status.json'),
      null
    );

    await updateSyncStatus(statusPath, {
      lastRun: {
        ...runMeta,
        finishedAt: new Date().toISOString(),
        ok: true,
        running: false,
        message: 'Sync hoàn tất',
        error: null,
        importTotals: importReport?.totals || null,
        scrapeSummary: scrapeStatus?.lastRun || null
      }
    });
  } catch (error) {
    await updateSyncStatus(statusPath, {
      lastRun: {
        ...runMeta,
        finishedAt: new Date().toISOString(),
        ok: false,
        running: false,
        message: 'Sync thất bại',
        error: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`[scrape-sync] ${error.message}`);
  process.exit(1);
});
