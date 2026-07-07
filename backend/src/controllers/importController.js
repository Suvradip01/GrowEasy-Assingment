'use strict';

const crypto = require('crypto');
const { parseCsvBuffer } = require('../services/csvParser');
const { extractCrmRecords } = require('../services/aiExtractor');
const { normaliseRecords } = require('../services/crmMapper');
const { getRedisClient } = require('../config/redis');
const { success, error } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// Cache TTL: 1 hour (results for the same file)
const CACHE_TTL_SECONDS = 3600;

/**
 * POST /api/v1/import/preview
 * Parses CSV and returns raw rows + headers. No AI involved.
 */
const previewCsv = (req, res, next) => {
  try {
    const { headers, rows, totalRows } = parseCsvBuffer(req.file.buffer);

    return success(res, {
      headers,
      rows,
      totalRows,
      fileName: req.file.originalname,
      fileSizeBytes: req.file.size,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/import/process
 * Full pipeline: CSV parse → AI extraction → normalise → return CRM records.
 * Results are cached in Redis by file content hash to avoid re-processing.
 */
const processCsv = async (req, res, next) => {
  try {
    // ── Compute file hash for caching ──
    const fileHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    const cacheKey = `import:result:${fileHash}`;
    const redis = getRedisClient();

    // ── Check Redis cache ──
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info(`Cache hit for file hash ${fileHash.slice(0, 8)}...`);
        const cachedResult = JSON.parse(cached);
        return success(res, { ...cachedResult, fromCache: true });
      }
    } catch (redisErr) {
      // Redis unavailable — proceed without cache
      logger.warn(`Redis cache read failed: ${redisErr.message}`);
    }

    // ── Step 1: Parse CSV ──
    const { headers, rows, totalRows } = parseCsvBuffer(req.file.buffer);

    // ── Step 2: AI Extraction ──
    const { successRecords, skippedRecords, fieldMapping, mappingConfidence } =
      await extractCrmRecords(headers, rows);

    // ── Step 3: Normalise ──
    const normalisedRecords = normaliseRecords(successRecords);

    const result = {
      summary: {
        totalRows,
        totalImported: normalisedRecords.length,
        totalSkipped: skippedRecords.length,
        fieldMapping,
        mappingConfidence,
        fileName: req.file.originalname,
      },
      records: normalisedRecords,
      skipped: skippedRecords,
      fromCache: false,
    };

    // ── Cache result ──
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
      logger.info(`Result cached for file hash ${fileHash.slice(0, 8)}...`);
    } catch (redisErr) {
      logger.warn(`Redis cache write failed: ${redisErr.message}`);
    }

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { previewCsv, processCsv };
