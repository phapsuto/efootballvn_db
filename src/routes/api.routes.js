const express = require('express');
const playerRoutes = require('./player.routes');
const managerRoutes = require('./manager.routes');
const { getDatabaseState } = require('../config/database');
const { getScrapeStatus } = require('../scraper/scrapeStatusStore');

const router = express.Router();

router.get('/health', async (req, res) => {
  const scrape = await getScrapeStatus();
  res.json({
    status: 'ok',
    service: 'efootball-vn-api',
    checkedAt: new Date().toISOString(),
    database: getDatabaseState(),
    scraper: scrape
  });
});

router.use('/players', playerRoutes);
router.use('/managers', managerRoutes);

module.exports = router;
