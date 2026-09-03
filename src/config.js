require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  SHEET_ID: process.env.SHEET_ID || '1wqGrMSQf17MZeq_PHyZv_ysCQ1eEG-Fo-6a1JSF5P3g',
  CACHE_TTL_MS: parseInt(process.env.CACHE_TTL_MS || '60000', 10), // 60 seconds
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 15, // max 15 requests per minute per IP
  SCHOOL_NAME: 'TRƯỜNG THPT PHƯỚC LONG',
  SCHOOL_DEPT: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ HỒ CHÍ MINH'
};
