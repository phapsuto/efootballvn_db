import fs from 'node:fs/promises';
import path from 'node:path';

const STATUS_DIR = path.resolve(process.cwd(), '..', 'scraped-output', 'status');
const SCRAPE_STATUS_PATH = path.join(STATUS_DIR, 'scrape-status.json');
const IMPORT_REPORT_PATH = path.join(STATUS_DIR, 'import-report.json');
const SYNC_STATUS_PATH = path.join(STATUS_DIR, 'scrape-sync-status.json');

async function readJsonFile(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function summarizeScrapeStatus(value: unknown) {
  const payload = toObject(value);
  const lastRun = toObject(payload?.lastRun);
  const lastSuccess = toObject(payload?.lastSuccess);

  return {
    available: Boolean(payload),
    file: SCRAPE_STATUS_PATH,
    updatedAt: payload?.updatedAt ?? null,
    lastRun: lastRun
      ? {
          trigger: lastRun.trigger ?? null,
          startedAt: lastRun.startedAt ?? null,
          finishedAt: lastRun.finishedAt ?? null,
          ok: lastRun.ok ?? null,
          running: lastRun.running ?? null,
          attempted: lastRun.attempted ?? null,
          success: lastRun.success ?? null,
          failed: lastRun.failed ?? null,
          message: lastRun.message ?? null
        }
      : null,
    lastSuccess: lastSuccess
      ? {
          trigger: lastSuccess.trigger ?? null,
          finishedAt: lastSuccess.finishedAt ?? null,
          attempted: lastSuccess.attempted ?? null,
          success: lastSuccess.success ?? null,
          failed: lastSuccess.failed ?? null
        }
      : null
  };
}

function summarizeImportReport(value: unknown) {
  const payload = toObject(value);
  const totals = toObject(payload?.totals);
  const datasets = Array.isArray(payload?.datasets) ? payload?.datasets : [];

  return {
    available: Boolean(payload),
    file: IMPORT_REPORT_PATH,
    generatedAt: payload?.generatedAt ?? null,
    database: payload?.database ?? null,
    totals: totals
      ? {
          newCount: totals.newCount ?? 0,
          updatedCount: totals.updatedCount ?? 0,
          unchangedCount: totals.unchangedCount ?? 0,
          invalidCount: totals.invalidCount ?? 0,
          duplicateKeyCount: totals.duplicateKeyCount ?? 0,
          operations: totals.operations ?? 0
        }
      : null,
    datasets: datasets.map((entry) => {
      const dataset = toObject(entry);
      const input = toObject(dataset?.input);
      const detection = toObject(dataset?.detection);
      return {
        entity: dataset?.entity ?? null,
        collection: dataset?.collection ?? null,
        generatedAt: input?.generatedAt ?? null,
        sourceFile: input?.file ?? null,
        payloadShape: input?.payloadShape ?? null,
        extractedKey: input?.extractedKey ?? null,
        newCount: detection?.newCount ?? 0,
        updatedCount: detection?.updatedCount ?? 0,
        unchangedCount: detection?.unchangedCount ?? 0
      };
    })
  };
}

function summarizeSyncStatus(value: unknown) {
  const payload = toObject(value);
  const lastRun = toObject(payload?.lastRun);
  const scheduler = toObject(payload?.scheduler);

  return {
    available: Boolean(payload),
    file: SYNC_STATUS_PATH,
    updatedAt: payload?.updatedAt ?? null,
    lastRun: lastRun
      ? {
          trigger: lastRun.trigger ?? null,
          startedAt: lastRun.startedAt ?? null,
          finishedAt: lastRun.finishedAt ?? null,
          ok: lastRun.ok ?? null,
          running: lastRun.running ?? null,
          playersOut: lastRun.playersOut ?? null,
          reportPath: lastRun.reportPath ?? null,
          maxPlayers: lastRun.maxPlayers ?? null,
          message: lastRun.message ?? null,
          error: lastRun.error ?? null,
          importTotals: lastRun.importTotals ?? null
        }
      : null,
    scheduler: scheduler
      ? {
          running: scheduler.running ?? null,
          timezone: scheduler.timezone ?? null,
          cadence: scheduler.cadence ?? null,
          nextRunAt: scheduler.nextRunAt ?? null,
          peakWindow: scheduler.peakWindow ?? null,
          maxPlayers: scheduler.maxPlayers ?? null
        }
      : null
  };
}

export async function getSyncPipelineStatus() {
  const [scrape, importReport, sync] = await Promise.all([
    readJsonFile(SCRAPE_STATUS_PATH),
    readJsonFile(IMPORT_REPORT_PATH),
    readJsonFile(SYNC_STATUS_PATH)
  ]);

  return {
    statusDir: STATUS_DIR,
    scrape: summarizeScrapeStatus(scrape),
    import: summarizeImportReport(importReport),
    sync: summarizeSyncStatus(sync)
  };
}
