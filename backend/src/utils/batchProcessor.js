'use strict';

const logger = require('./logger');

/**
 * Runs an async task on items in batches with:
 *  - configurable concurrency (parallel batches)
 *  - retry with exponential backoff per batch
 *  - per-item success/failure tracking
 *
 * @param {Array}    items       - Full array of items to process
 * @param {number}   batchSize   - Items per batch
 * @param {number}   concurrency - Max parallel batches at once
 * @param {number}   retries     - Max retry attempts per batch
 * @param {Function} processor   - async (batch: Array) => Array of results
 * @returns {{ results: Array, failures: Array }}
 */
const processBatches = async ({
  items,
  batchSize,
  concurrency,
  retries,
  processor,
}) => {
  // Chunk items into batches
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push({ index: Math.floor(i / batchSize), chunk: items.slice(i, i + batchSize) });
  }

  const results = [];
  const failures = [];

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);

    const batchPromises = concurrentBatches.map(({ index, chunk }) =>
      runWithRetry({
        batchIndex: index,
        chunk,
        processor,
        maxRetries: retries,
      })
    );

    const batchOutcomes = await Promise.allSettled(batchPromises);

    batchOutcomes.forEach((outcome, idx) => {
      const { chunk } = concurrentBatches[idx];
      if (outcome.status === 'fulfilled') {
        results.push(...outcome.value);
      } else {
        logger.error(`Batch ${concurrentBatches[idx].index} permanently failed: ${outcome.reason?.message}`);
        // Mark each item in the failed batch as skipped
        chunk.forEach((item) => {
          failures.push({
            original: item,
            reason: outcome.reason?.message || 'Unknown AI extraction error',
          });
        });
      }
    });
  }

  return { results, failures };
};

/**
 * Runs a single batch processor with exponential backoff retries.
 */
const runWithRetry = async ({ batchIndex, chunk, processor, maxRetries }) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Batch ${batchIndex}: attempt ${attempt}/${maxRetries}`);
      const result = await processor(chunk);
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 500; // 500ms, 1000ms, 2000ms
        logger.warn(`Batch ${batchIndex} attempt ${attempt} failed, retrying in ${delay}ms: ${err.message}`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { processBatches };
