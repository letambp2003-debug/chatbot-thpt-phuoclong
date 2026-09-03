const rateLimit = require('express-rate-limit');
const config = require('../config');

const lookupLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 1 minute
  max: config.RATE_LIMIT_MAX_REQUESTS, // 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Bạn đã thực hiện quá nhiều lượt tra cứu trong thời gian ngắn. Vui lòng chờ 1 phút rồi thử lại.'
  }
});

module.exports = {
  lookupLimiter
};
