const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { validateCCCD } = require('./middlewares/validator');
const { lookupLimiter } = require('./middlewares/rateLimiter');
const sheetService = require('./services/sheetService');

const app = express();

// Security and utility middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic Info API (supports both /api/info and /info for serverless)
app.get(['/api/info', '/info'], (req, res) => {
  res.json({
    ok: true,
    schoolName: config.SCHOOL_NAME,
    schoolDept: config.SCHOOL_DEPT,
    greeting: 'Xin chào, hãy nhập thông tin là số căn cước công dân'
  });
});

// Health check API (supports both /api/health and /health)
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const data = await sheetService.getSheetData();
    res.json({
      ok: true,
      status: 'healthy',
      totalRecords: data.rows.length,
      headers: data.headers
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      status: 'degraded',
      message: err.message
    });
  }
});

// Core Lookup API (Strict 12 digits, server-side only, rate limited)
// Matches /api/lookup, /lookup, or / to work seamlessly with both Express and Vercel serverless functions
app.post(['/api/lookup', '/lookup', '/'], lookupLimiter, validateCCCD, async (req, res) => {
  try {
    const result = await sheetService.lookupByCCCD(req.sanitizedCCCD);
    if (!result.ok) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 :
                         result.code === 'DUPLICATE_ID' ? 409 :
                         result.code === 'DATA_SOURCE_ERROR' ? 503 : 400;
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    logger.error('Unhandled lookup error:', err);
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Hệ thống tạm thời chưa truy cập được dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
    });
  }
});

// Fallback to index.html for SPA/clean routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server if not required in tests or serverless
if (require.main === module) {
  app.listen(config.PORT, () => {
    logger.info(`Máy chủ Chatbot THPT Phước Long đang chạy tại: http://localhost:${config.PORT}`);
    // Pre-warm the cache asynchronously
    sheetService.fetchSheetData().catch(err => {
      logger.warn('Khởi động: Chưa tải trước được dữ liệu sheet:', err.message);
    });
  });
}

module.exports = app;
