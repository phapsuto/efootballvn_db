const fs = require('fs/promises');
const path = require('path');

const { connectDatabase, disconnectDatabase } = require('../config/database');
const EfhubScraper = require('../scraper/efhubScraper');
const { updateScrapeStatus } = require('../scraper/scrapeStatusStore');

const args = process.argv.slice(2);

const maxPlayersArg = Number.parseInt(args[0], 10);
const maxPlayers = Number.isFinite(maxPlayersArg) && maxPlayersArg > 0 ? maxPlayersArg : 25;

const outFlagIndex = args.indexOf('--out');
const outPathArg = outFlagIndex >= 0 ? args[outFlagIndex + 1] : '';

const toOutputPath = () => {
  if (outPathArg && !outPathArg.startsWith('--')) {
    return path.resolve(process.cwd(), outPathArg);
  }

  const fileName = `players-scrape-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  return path.resolve(process.cwd(), 'scraped-output', fileName);
};

const writeJson = async (summary) => {
  const outputPath = toOutputPath();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary: {
          attempted: summary.attempted,
          success: summary.success,
          failed: summary.failed,
          links: summary.links
        },
        players: summary.players
      },
      null,
      2
    ),
    'utf8'
  );
  // eslint-disable-next-line no-console
  console.log(`[scraper] JSON output saved: ${outputPath}`);
};

const run = async () => {
  const startedAt = new Date().toISOString();
  await updateScrapeStatus({
    trigger: 'manual',
    startedAt,
    finishedAt: null,
    ok: false,
    running: true,
    message: 'Manual scrape started'
  });

  const dbConnected = await connectDatabase({ required: false });
  const scraper = new EfhubScraper({
    persistToDb: dbConnected
  });

  try {
    const summary = await scraper.scrapeAndUpsertPlayers({
      maxPlayers,
      persistToDb: dbConnected
    });

    if (!dbConnected || outFlagIndex >= 0) {
      await writeJson(summary);
    }

    if (!dbConnected) {
      // eslint-disable-next-line no-console
      console.warn(
        '[scraper] MongoDB unavailable. Ran in scrape-only mode and exported JSON output.'
      );
    }

    // eslint-disable-next-line no-console
    console.log('[scraper] Summary:', {
      attempted: summary.attempted,
      success: summary.success,
      failed: summary.failed
    });

    await updateScrapeStatus({
      trigger: 'manual',
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: summary.failed === 0,
      running: false,
      dbConnected,
      attempted: summary.attempted,
      success: summary.success,
      failed: summary.failed,
      links: summary.links.length,
      message: summary.failed === 0 ? 'Manual scrape completed' : 'Manual scrape completed with failures',
      error: null
    });
  } catch (error) {
    await updateScrapeStatus({
      trigger: 'manual',
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      running: false,
      dbConnected,
      message: 'Manual scrape failed',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    await scraper.close();
    if (dbConnected) {
      await disconnectDatabase();
    }
  }
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[scraper] Fatal:', error);
  process.exit(1);
});
