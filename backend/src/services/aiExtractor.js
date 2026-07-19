'use strict';


const config = require('../config');
const logger = require('../utils/logger');
const { processBatches } = require('../utils/batchProcessor');
const { discoverFieldMapping } = require('./ai/mappingDiscovery');
const { extractBatch } = require('./ai/batchExtraction');
const { getRetryDelayMs } = require('./ai/errorHelpers');
const { mapUniqueStatuses, mapUniqueSources } = require('./ai/normalization');
const { normaliseRecord } = require('./crmMapper');
const { getRedisClient } = require('../config/redis');
const { emitProgress } = require('../utils/progressTracker');
const { CRM_STATUSES, DATA_SOURCES } = require('./ai/schemas');

const {
  EMAIL_REGEX,
  withoutInternalFields,
  extractUniqueValues,
  mapRowProgrammatically,
} = require('./ai/programmaticMapper');

// ─────────────────────────────────────────────────────────────────────
// Main Orchestrator
// ─────────────────────────────────────────────────────────────────────

// The main pipeline orchestrator. 
// Evaluates the file size and decides whether to run the Standard AI Mode (batching every row to AI)
// or the Production-Optimized Mode (using programmatic JS mapping to save 99% of API costs).
// It also checks Redis to see if we recently hit a billing quota limit.
const extractCrmRecords = async (headers, rows, clientId = null) => {
  if (!config.gemini.apiKey) {
    const err = new Error('GEMINI_API_KEY is required for AI extraction.');
    err.statusCode = 500;
    throw err;
  }

  // Expose a clean, standard UI label for progress events instead of leaking technical modes
  const modeDisplay = 'AI Processing';

  const emit = (progress, message, mode, details = null) =>
    emitProgress(clientId, { progress, message, mode, details });

  const rowCount = rows.length;

  // ── Dynamic pipeline routing selection ──
  // Check if Redis has cached a quota exhaustion flag to fallback immediately to Optimized JS mode
  const redis = getRedisClient();
  let quotaExhausted = false;
  try {
    const exhaustedFlag = await redis.get('quota:gemini:exhausted');
    if (exhaustedFlag) {
      quotaExhausted = true;
      logger.warn('[Extractor] Gemini API quota exhaustion flag detected in Redis. Falling back to Optimized mode.');
    }
  } catch (err) {
    // Redis error — non-fatal
  }

  // Fallback to Optimized Mode if row count exceeds threshold OR if daily/rate limits were hit recently
  const isStandardMode = rowCount <= config.ai.maxFullAiRows && !quotaExhausted;
  const modeLabel = isStandardMode ? 'standard' : 'optimized';

  logger.info(
    `[Extractor] ${rowCount} rows → Routing to ${isStandardMode ? 'Standard AI' : 'Production-Optimized'} Mode (threshold: ${config.ai.maxFullAiRows}, quotaExhausted: ${quotaExhausted})`
  );

  // ── Stage 1: AI Field Mapping (always — one call, Redis-cached) ──
  emit(5, 'Discovering column schema…', modeDisplay);
  const fieldMapping = await discoverFieldMapping(headers, rows.slice(0, 5));
  emit(20, `Schema discovered (confidence: ${Math.round(fieldMapping.confidence * 100)}%)`, modeDisplay);

  const needsReview = fieldMapping.confidence < 0.6;

  // ════════════════════════════════════════════════════════════════
  // PATH A — Standard AI Mode (rows ≤ threshold)
  // ════════════════════════════════════════════════════════════════
  if (isStandardMode) {
    logger.info(`[Extractor] Standard AI Mode: running ${Math.ceil(rowCount / config.ai.batchSize)} Gemini batch(es)`);
    emit(25, 'Starting AI batch extraction…', modeDisplay, `${rowCount} rows in batches of ${config.ai.batchSize}`);

    const totalBatches = Math.ceil(rowCount / config.ai.batchSize);

    let allExtracted = [];
    const failures = [];

    try {
      const batchResults = await processBatches({
        items: rows,
        batchSize: config.ai.batchSize,
        concurrency: config.ai.concurrency,
        retries: config.ai.retryAttempts,
        processor: (batch) => extractBatch(batch, fieldMapping),
        shouldAbort: (err) => err?.abortRemainingBatches === true,
        getRetryDelayMs,
        onRetryWait: (delayMs, attempt) => {
          emit(
            30, // Stay around processing phase, wait to jump
            `Optimizing processing queue (${Math.ceil(delayMs / 1000)}s)…`,
            modeDisplay,
            `Temporarily paused to ensure stable processing`
          );
        },
        onBatchComplete: (done, total) => {
          // Progress from 25 → 85 during batch processing
          const batchProgress = 25 + Math.round((done / total) * 60);
          emit(
            batchProgress,
            `AI extracting…`,
            modeDisplay,
            `Batch ${done} / ${total}`
          );
        },
      });
      allExtracted = batchResults.results;
      failures.push(...batchResults.failures);
    } catch (err) {
      // If we encounter a billing/quota limit error during execution, flag it in Redis for subsequent uploads
      if (err.code === 'AI_QUOTA_EXHAUSTED') {
        logger.warn('[Extractor] Setting quota exhaustion flag in Redis for fallback');
        await redis.set('quota:gemini:exhausted', 'true', 'EX', 3600).catch(() => {}); // 1 hour block
      }
      throw err;
    }

    emit(88, 'Validating & formatting records…', modeDisplay);

    const successRecords = [];
    const skippedRecords = [];
    const seenEmails = new Set();

    // ── JS final validation/filtering layer (ALWAYS run on all records) ──
    allExtracted.forEach((rawRecord) => {
      // Normalize values first (types, status/source enums, phone spaces)
      const normalized = normaliseRecord(rawRecord);

      // Verify contact validity constraints (must have valid email or mobile)
      const hasEmail = normalized.email && EMAIL_REGEX.test(normalized.email);
      const hasPhone = normalized.mobile_without_country_code && normalized.mobile_without_country_code.length >= 7;

      if (rawRecord._skipped || (!hasEmail && !hasPhone)) {
        skippedRecords.push({
          reason: rawRecord._skip_reason || 'No valid email or mobile number found',
          data: withoutInternalFields(normalized),
        });
      } else if (normalized.email && seenEmails.has(normalized.email)) {
        skippedRecords.push({
          reason: 'Duplicate email address',
          data: withoutInternalFields(normalized),
        });
      } else {
        if (normalized.email) seenEmails.add(normalized.email);
        successRecords.push(withoutInternalFields(normalized));
      }
    });

    failures.forEach(({ original, reason }) => {
      skippedRecords.push({ reason, data: original });
    });

    emit(95, 'Finalizing records…', modeDisplay, `${successRecords.length} valid records`);
    logger.info(
      `[Extractor] Standard AI complete: ${successRecords.length} success, ${skippedRecords.length} skipped`
    );

    return {
      successRecords,
      skippedRecords,
      fieldMapping: fieldMapping.mapping,
      mappingConfidence: fieldMapping.confidence,
      needsReview,
      extractionMode: 'ai_mapping_ai_batches',
      processingMode: 'standard',
    };
  }

  // ════════════════════════════════════════════════════════════════
  // PATH B — Production-Optimized Mode (rows > threshold OR quotaExhausted)
  // ════════════════════════════════════════════════════════════════
  logger.info(`[Extractor] Production-Optimized Mode: 2–3 AI calls + JS mapping for ${rowCount} rows`);
  emit(25, 'Extracting unique field values…', modeDisplay, `${rowCount} rows to process`);

  // Extract unique status & source values from the full CSV
  const uniqueStatuses = extractUniqueValues(rows, fieldMapping.mapping, 'crm_status');
  const uniqueSources = extractUniqueValues(rows, fieldMapping.mapping, 'data_source');

  logger.info(`[Extractor] Unique statuses: ${uniqueStatuses.length}, Unique sources: ${uniqueSources.length}`);

  // Normalize unique values via Gemini (1 call each, Redis-cached)
  let statusMap = {};
  let sourceMap = {};

  try {
    emit(35, 'AI normalizing status values…', modeDisplay, `${uniqueStatuses.length} unique status values`);
    statusMap = await mapUniqueStatuses(uniqueStatuses);

    emit(50, 'AI normalizing source values…', modeDisplay, `${uniqueSources.length} unique source values`);
    sourceMap = await mapUniqueSources(uniqueSources);
  } catch (err) {
    if (err.code === 'AI_QUOTA_EXHAUSTED') {
      logger.warn('[Extractor] Setting quota exhaustion flag in Redis for fallback');
      await redis.set('quota:gemini:exhausted', 'true', 'EX', 3600).catch(() => {});
    }
    throw err;
  }

  emit(60, 'Running programmatic extraction…', modeDisplay, `Mapping ${rowCount.toLocaleString()} rows with JS`);

  // ── JS programmatic extraction — process ALL rows in memory ──
  const successRecords = [];
  const skippedRecords = [];
  const seenEmails = new Set(); // Deduplication by email

  let processed = 0;
  const reportEvery = Math.max(1, Math.floor(rowCount / 10)); // Emit every 10%

  for (const row of rows) {
    const { record, skipped, skipReason } = mapRowProgrammatically(
      row,
      fieldMapping.mapping,
      statusMap,
      sourceMap
    );

    // ── JS final validation/filtering layer (ALWAYS run on all records) ──
    const normalized = normaliseRecord(record);
    const hasEmail = normalized.email && EMAIL_REGEX.test(normalized.email);
    const hasPhone = normalized.mobile_without_country_code && normalized.mobile_without_country_code.length >= 7;

    if (skipped || (!hasEmail && !hasPhone)) {
      skippedRecords.push({ reason: skipReason || 'No valid email or mobile number found', data: normalized });
    } else {
      // Deduplicate by email
      if (normalized.email && seenEmails.has(normalized.email)) {
        skippedRecords.push({ reason: 'Duplicate email address', data: normalized });
      } else {
        if (normalized.email) seenEmails.add(normalized.email);
        successRecords.push(normalized);
      }
    }

    processed++;
    if (processed % reportEvery === 0) {
      const pct = 60 + Math.round((processed / rowCount) * 30); // 60 → 90
      emit(pct, 'Mapping records…', modeDisplay, `${processed.toLocaleString()} / ${rowCount.toLocaleString()} rows`);
    }
  }

  emit(92, 'Validating & deduplicating…', modeDisplay, `${successRecords.length} valid records`);

  logger.info(
    `[Extractor] Production-Optimized complete: ${successRecords.length} success, ${skippedRecords.length} skipped`
  );

  return {
    successRecords,
    skippedRecords,
    fieldMapping: fieldMapping.mapping,
    mappingConfidence: fieldMapping.confidence,
    needsReview,
    extractionMode: 'ai_mapping_optimized_js',
    processingMode: 'optimized',
  };
};

module.exports = { extractCrmRecords };
