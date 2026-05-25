const fs = require('fs/promises');
const path = require('path');

const STATUS_FILE_PATH = path.resolve(
  process.cwd(),
  'scraped-output',
  'status',
  'scrape-status.json'
);

const emptyStatus = () => ({
  version: 1,
  updatedAt: null,
  lastRun: null,
  lastSuccess: null
});

const readStatus = async () => {
  try {
    const content = await fs.readFile(STATUS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      return emptyStatus();
    }
    return {
      ...emptyStatus(),
      ...parsed
    };
  } catch (error) {
    return emptyStatus();
  }
};

const writeStatus = async (status) => {
  await fs.mkdir(path.dirname(STATUS_FILE_PATH), { recursive: true });
  await fs.writeFile(STATUS_FILE_PATH, JSON.stringify(status, null, 2), 'utf8');
};

const updateScrapeStatus = async (event) => {
  const current = await readStatus();
  const now = new Date().toISOString();
  const merged = {
    ...current,
    updatedAt: now,
    lastRun: {
      ...current.lastRun,
      ...event
    }
  };

  if (event?.ok) {
    merged.lastSuccess = {
      ...merged.lastRun
    };
  }

  await writeStatus(merged);
  return merged;
};

const getScrapeStatus = async () => readStatus();

module.exports = {
  STATUS_FILE_PATH,
  getScrapeStatus,
  updateScrapeStatus
};
