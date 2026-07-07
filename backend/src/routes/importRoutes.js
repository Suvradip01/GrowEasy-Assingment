'use strict';

const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const validateCsv = require('../middlewares/validateCsv');
const createRateLimiter = require('../middlewares/rateLimiter');
const { previewCsv, processCsv } = require('../controllers/importController');

const router = express.Router();

// Rate limiter applied only to the AI processing endpoint (expensive operation)
const processRateLimiter = createRateLimiter();

/**
 * POST /api/v1/import/preview
 * Upload CSV → return raw rows + headers (no AI).
 * Higher rate limit (not AI-dependent).
 */
router.post(
  '/preview',
  upload.single('file'),
  validateCsv,
  previewCsv
);

/**
 * POST /api/v1/import/process
 * Upload CSV → AI extraction → return CRM records.
 * Rate limited to prevent AI cost abuse.
 */
router.post(
  '/process',
  processRateLimiter,
  upload.single('file'),
  validateCsv,
  processCsv
);

module.exports = router;
