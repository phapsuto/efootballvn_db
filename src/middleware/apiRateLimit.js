const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const apiRateLimit = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Bạn gửi quá nhiều request. Vui lòng thử lại sau.'
  }
});

module.exports = apiRateLimit;
