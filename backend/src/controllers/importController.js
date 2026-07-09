'use strict';

const crypto = require('crypto');
const { parseCsvBuffer } = require('../services/csvParser');
const { extractCrmRecords } = require('../services/aiExtractor');
const { normaliseRecords } = require('../services/crmMapper');
const { getRedisClient } = require('../config/redis');
const { success } = require('../utils/responseHelper');
const { emitProgress } = require('../utils/progressTracker');
const logger = require('../utils/logger');

// Cache TTL: 1 hour (results for the same file)
const CACHE_TTL_SECONDS = 3600;
const PREVIEW_ROW_LIMIT = 200;

/**
 * POST /api/v1/import/preview
 * Parses CSV and returns raw rows + headers. No AI involved.
 */
const previewCsv = (req, res, next) => {
  try {
    const { headers, rows, totalRows } = parseCsvBuffer(req.file.buffer);
    const previewRows = rows.slice(0, PREVIEW_ROW_LIMIT);

    return success(res, {
      headers,
      rows: previewRows,
      totalRows,
      previewRowCount: previewRows.length,
      previewRowLimit: PREVIEW_ROW_LIMIT,
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
 *
 * Accepts clientId via:
 *   - Query parameter:  ?clientId=<uuid>
 *   - Request header:   X-Client-Id: <uuid>
 * This clientId is used to stream real-time SSE progress events.
 */
const processCsv = async (req, res, next) => {
  // ── Extract clientId for SSE progress ──
  const clientId = req.query.clientId || req.headers['x-client-id'] || null;

  if (clientId) {
    logger.info(`[Controller] Processing with SSE clientId=${clientId}`);
  }

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

        // Emit a quick "done" progress event for cached results
        if (clientId) {
          emitProgress(clientId, {
            progress: 100,
            message: 'Loaded from cache',
            mode: 'AI Processing',
            details: `${cachedResult.summary?.totalImported ?? '?'} records`,
          });
        }
        return success(res, { ...cachedResult, fromCache: true });
      }
    } catch (redisErr) {
      // Redis unavailable — proceed without cache
      logger.warn(`Redis cache read failed: ${redisErr.message}`);
    }

    // ── Step 1: Parse CSV ──
    if (clientId) {
      emitProgress(clientId, { progress: 2, message: 'Parsing CSV…', mode: null, details: null });
    }
    const { headers, rows, totalRows } = parseCsvBuffer(req.file.buffer);

    // ── Step 2: AI Extraction (passes clientId for SSE progress) ──
    const { successRecords, skippedRecords, fieldMapping, mappingConfidence, needsReview, extractionMode, processingMode } =
      await extractCrmRecords(headers, rows, clientId);

    // ── Step 3: Normalise ──
    // All records are normalized and validated inside aiExtractor now for robust safety.
    const normalisedRecords = successRecords;

    const result = {
      summary: {
        totalRows,
        totalImported: normalisedRecords.length,
        totalSkipped: skippedRecords.length,
        fieldMapping,
        mappingConfidence,
        needsReview,
        extractionMode,
        processingMode,
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

    // ── Final progress event ──
    if (clientId) {
      emitProgress(clientId, {
        progress: 98,
        message: 'Saving results…',
        mode: 'AI Processing',
        details: `${normalisedRecords.length} records extracted`,
      });
    }

    return success(res, result);
  } catch (err) {
    // ── Emit quota/rate-limit error over SSE so frontend shows rich error ──
    if (clientId && (err.code === 'AI_RATE_LIMITED' || err.code === 'AI_QUOTA_EXHAUSTED')) {
      emitProgress(clientId, {
        progress: -1, // Signal: error
        message: err.message,
        mode: 'error',
        details: err.code,
      });
    }
    next(err);
  }
};

module.exports = { previewCsv, processCsv };
