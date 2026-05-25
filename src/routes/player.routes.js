const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getPlayers, getPlayerDetail } = require('../controllers/player.controller');

const router = express.Router();

router.get('/', asyncHandler(getPlayers));
router.get('/:id', asyncHandler(getPlayerDetail));

module.exports = router;
