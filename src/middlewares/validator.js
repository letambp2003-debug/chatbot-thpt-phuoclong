const logger = require('../utils/logger');

const CCCD_REGEX = /^\d{12}$/;

function validateCCCD(req, res, next) {
  const { cccd } = req.body || {};

  if (!cccd || typeof cccd !== 'string') {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_FORMAT',
      message: 'Vui lòng nhập đúng 12 chữ số căn cước công dân.'
    });
  }

  // Trim whitespace
  const sanitized = cccd.trim();

  // Strict check: exactly 12 digits
  if (!CCCD_REGEX.test(sanitized)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_FORMAT',
      message: 'Vui lòng nhập đúng 12 chữ số căn cước công dân.'
    });
  }

  req.sanitizedCCCD = sanitized;
  next();
}

module.exports = {
  CCCD_REGEX,
  validateCCCD
};
