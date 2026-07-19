'use strict';

const crypto = require('crypto');
const { parseCsvBuffer } = require('../services/csvParser');
const { extractCrmRecords } = require('../services/aiExtractor');
const { getRedisClient } = require('../config/redis');
const { success } = require('../utils/responseHelper');
const { emitProgress } = require('../utils/progressTracker');
const logger = require('../utils/logger');

// Cache TTL: 1 hour (results for the same file)
const CACHE_TTL_SECONDS = 3600;
const PREVIEW_ROW_LIMIT = 200;

/**
 * POST /api/v1/import/preview
 * Handles the initial CSV upload step before AI processing.
 * Parses the CSV into JSON and returns a limited preview (up to 200 rows).
 * We limit the rows to ensure fast response times for the frontend preview table.
 */
const previewCsv = (req, res, next) => {
  try {
    const { headers, rows, totalRows } = parseCsvBuffer(req.file.buffer, PREVIEW_ROW_LIMIT);
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
 * The core business logic endpoint for the AI extraction pipeline.
 * 
 * Flow:
 * 1. Checks Redis cache using a SHA-256 hash of the CSV file to avoid redundant AI costs.
 * 2. Parses the CSV and sends batches to the AI via `extractCrmRecords`.
 * 3. Returns the structured CRM leads back to the frontend.
 * 
 * We use Server-Sent Events (SSE) via the `clientId` to push real-time progress updates
 * because the AI processing can take several seconds for large files.
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
    // ── Emit error over SSE so frontend shows rich error and stops loading ──
    if (clientId) {
      emitProgress(clientId, {
        progress: -1, // Signal: error
        message: err.message || 'An unexpected error occurred during processing.',
        mode: 'error',
        details: err.code || 'UNKNOWN_ERROR',
        retryAfterSeconds: err.retryAfterSeconds ?? null,
        errorCode: err.code ?? null,
      });
    }
    next(err);
  }
};

module.exports = { previewCsv, processCsv };
