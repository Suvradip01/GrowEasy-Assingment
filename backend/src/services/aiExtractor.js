'use strict';

/**
 * AI extraction orchestrator.
 *
 * This file is intentionally thin — it only coordinates the two-stage pipeline:
 *   Stage 1: Discover field mapping   (mappingDiscovery.js)
 *   Stage 2: Extract records in batches (batchExtraction.js)
 *
 * All schemas, error handling, and Gemini client code live in the ai/ subdirectory.
 */

const config = require('../config');
const logger = require('../utils/logger');
const { processBatches } = require('../utils/batchProcessor');
const { discoverFieldMapping } = require('./ai/mappingDiscovery');
const { extractBatch } = require('./ai/batchExtraction');
const { getRetryDelayMs } = require('./ai/errorHelpers');

/** Strips internal _skipped / _skip_reason fields from a record */
const withoutInternalFields = (record) => {
  const { _skipped, _skip_reason, ...clean } = record;
  return clean;
};

/**
 * Full AI extraction pipeline.
 *
 * @param {string[]} headers - CSV column names
 * @param {object[]} rows    - All parsed CSV rows
 * @returns {{
 *   successRecords: object[],
 *   skippedRecords: object[],
 *   fieldMapping: Record<string,string>,
 *   mappingConfidence: number,
 *   extractionMode: string
 * }}
 */
const extractCrmRecords = async (headers, rows) => {
  if (!config.gemini.apiKey) {
    const err = new Error('GEMINI_API_KEY is required for AI extraction.');
    err.statusCode = 500;
    throw err;
  }

  // ── Stage 1: Field mapping (one API call regardless of row count) ──
  const fieldMapping = await discoverFieldMapping(headers, rows.slice(0, 5));

  // ── Stage 2: Batch extraction ──
  const { results: allExtracted, failures } = await processBatches({
    items: rows,
    batchSize: config.ai.batchSize,
    concurrency: config.ai.concurrency,
    retries: config.ai.retryAttempts,
    processor: (batch) => extractBatch(batch, fieldMapping),
    shouldAbort: (err) => err?.abortRemainingBatches === true,
    getRetryDelayMs,
  });

  // ── Partition into success vs skipped ──
  const successRecords = [];
  const skippedRecords = [];

  allExtracted.forEach((record) => {
    if (record._skipped) {
      skippedRecords.push({
        reason: record._skip_reason || 'No email or mobile number found',
        data: withoutInternalFields(record),
      });
    } else {
      successRecords.push(withoutInternalFields(record));
    }
  });

  // Records that failed all retries are also skipped
  failures.forEach(({ original, reason }) => {
    skippedRecords.push({ reason, data: original });
  });

  logger.info(`Extraction complete: ${successRecords.length} success, ${skippedRecords.length} skipped`);

  return {
    successRecords,
    skippedRecords,
    fieldMapping: fieldMapping.mapping,
    mappingConfidence: fieldMapping.confidence,
    extractionMode: 'ai_mapping_ai_batches',
  };
};

module.exports = { extractCrmRecords };
