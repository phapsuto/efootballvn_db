const dotenv = require('dotenv');

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback) => {
  if (value === undefined) {
    return fallback;
  }
  return String(value).toLowerCase() === 'true';
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toInt(process.env.PORT, 3000),
  DB_REQUIRED: toBool(process.env.DB_REQUIRED, false),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/efootball_vn',

  EFHUB_BASE_URL: process.env.EFHUB_BASE_URL || 'https://efhub.com',
  EFHUB_PLAYER_LIST_URL:
    process.env.EFHUB_PLAYER_LIST_URL || 'https://efhub.com/players',
  SCRAPER_HEADLESS: toBool(process.env.SCRAPER_HEADLESS, true),
  SCRAPER_TIMEOUT_MS: toInt(process.env.SCRAPER_TIMEOUT_MS, 45_000),
  SCRAPER_MIN_DELAY_MS: toInt(process.env.SCRAPER_MIN_DELAY_MS, 5_000),
  SCRAPER_MAX_DELAY_MS: toInt(process.env.SCRAPER_MAX_DELAY_MS, 12_000),
  SCRAPER_TIMEZONE: process.env.SCRAPER_TIMEZONE || 'Asia/Ho_Chi_Minh',
  SCRAPER_BROWSER_TIMEZONE:
    process.env.SCRAPER_BROWSER_TIMEZONE ||
    process.env.SCRAPER_TIMEZONE ||
    'Asia/Ho_Chi_Minh',
  SCRAPER_BASE_CRON: process.env.SCRAPER_BASE_CRON || '12 * * * *',
  SCRAPER_PEAK_CRON: process.env.SCRAPER_PEAK_CRON || '12,42 16-23 * * 1,4',
  SCRAPER_MAX_PLAYERS_BASE: toInt(process.env.SCRAPER_MAX_PLAYERS_BASE, 40),
  SCRAPER_MAX_PLAYERS_PEAK: toInt(process.env.SCRAPER_MAX_PLAYERS_PEAK, 80),

  API_RATE_LIMIT_WINDOW_MS: toInt(process.env.API_RATE_LIMIT_WINDOW_MS, 60_000),
  API_RATE_LIMIT_MAX: toInt(process.env.API_RATE_LIMIT_MAX, 120)
};
