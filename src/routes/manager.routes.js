const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getManagers } = require('../controllers/manager.controller');

const router = express.Router();

router.get('/', asyncHandler(getManagers));

module.exports = router;
