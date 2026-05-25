const cron = require('node-cron');
const EfhubScraper = require('../scraper/efhubScraper');
const env = require('../config/env');
const {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected
} = require('../config/database');
const { updateScrapeStatus } = require('../scraper/scrapeStatusStore');

const JOBS = [
  {
    name: 'base-hourly',
    expression: env.SCRAPER_BASE_CRON,
    maxPlayers: Math.max(1, env.SCRAPER_MAX_PLAYERS_BASE)
  },
  {
    name: 'peak-mon-thu-evening',
    expression: env.SCRAPER_PEAK_CRON,
    maxPlayers: Math.max(1, env.SCRAPER_MAX_PLAYERS_PEAK)
  }
];

let isRunning = false;

const runJob = async ({ name, maxPlayers }) => {
  if (isRunning) {
    // eslint-disable-next-line no-console
    console.log(`[cron] ${name}: previous run still active, skip this tick.`);
    await updateScrapeStatus({
      trigger: `cron:${name}`,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      ok: false,
      running: false,
      message: 'Skipped because previous run is still active'
    });
    return;
  }

  if (!isDatabaseConnected()) {
    // eslint-disable-next-line no-console
    console.error(`[cron] ${name}: MongoDB disconnected, skip this tick.`);
    await updateScrapeStatus({
      trigger: `cron:${name}`,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      ok: false,
      running: false,
      message: 'Skipped because MongoDB is disconnected'
    });
    return;
  }

  isRunning = true;
  const scraper = new EfhubScraper({ persistToDb: true });
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();

  // eslint-disable-next-line no-console
  console.log(
    `[cron] ${name}: started at ${startedAt} timezone=${env.SCRAPER_TIMEZONE}`
  );
  await updateScrapeStatus({
    trigger: `cron:${name}`,
    startedAt,
    finishedAt: null,
    ok: false,
    running: true,
    dbConnected: true,
    message: 'Cron scrape started'
  });

  try {
    await scraper.launch();
    const result = await scraper.scrapeAndUpsertPlayers({
      maxPlayers,
      persistToDb: true
    });

    // eslint-disable-next-line no-console
    console.log(`[cron] ${name}: finished`, {
      attempted: result.attempted,
      success: result.success,
      failed: result.failed,
      links: result.links.length
    });
    await updateScrapeStatus({
      trigger: `cron:${name}`,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: result.failed === 0,
      running: false,
      dbConnected: true,
      attempted: result.attempted,
      success: result.success,
      failed: result.failed,
      links: result.links.length
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[cron] ${name}: failed`, error);
    await updateScrapeStatus({
      trigger: `cron:${name}`,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      running: false,
      dbConnected: true,
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    await scraper.close().catch(() => null);
    isRunning = false;
  }
};

const startCron = async () => {
  const connected = await connectDatabase({ required: false });
  if (!connected) {
    throw new Error('MongoDB is required for cron scraping. Please start MongoDB and retry.');
  }

  JOBS.forEach((job) => {
    if (!cron.validate(job.expression)) {
      throw new Error(`Invalid cron expression for ${job.name}: "${job.expression}"`);
    }
  });

  JOBS.forEach((job) => {
    cron.schedule(
      job.expression,
      () => {
        void runJob(job);
      },
      {
        timezone: env.SCRAPER_TIMEZONE
      }
    );
  });

  // eslint-disable-next-line no-console
  console.log('[cron] eFHUB scrape scheduler started.', {
    timezone: env.SCRAPER_TIMEZONE,
    jobs: JOBS.map((job) => ({
      name: job.name,
      expression: job.expression,
      maxPlayers: job.maxPlayers
    }))
  });
};

startCron().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('[cron] Failed to start:', error);
  await disconnectDatabase();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
