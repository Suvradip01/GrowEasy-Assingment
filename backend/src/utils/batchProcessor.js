'use strict';

const logger = require('./logger');

/**
 * Runs an async task on items in batches with:
 *  - configurable concurrency (parallel batches)
 *  - retry with exponential backoff per batch
 *  - per-item success/failure tracking
 *  - real-time progress callbacks for SSE streaming
 *
 * @param {Array}    items          - Full array of items to process
 * @param {number}   batchSize      - Items per batch
 * @param {number}   concurrency    - Max parallel batches at once
 * @param {number}   retries        - Max retry attempts per batch
 * @param {Function} processor      - async (batch: Array) => Array of results
 * @param {Function} [shouldAbort]  - (err) => boolean — abort all remaining batches
 * @param {Function} [getRetryDelayMs] - (err) => number|null — provider-recommended delay
 * @param {Function} [onBatchComplete] - (completedBatches, totalBatches) => void — progress callback
 * @returns {{ results: Array, failures: Array }}
 */
const processBatches = async ({
  items,
  batchSize,
  concurrency,
  retries,
  processor,
  shouldAbort,
  getRetryDelayMs,
  onBatchComplete,
  onRetryWait,
}) => {
  // Chunk items into batches
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push({ index: Math.floor(i / batchSize), chunk: items.slice(i, i + batchSize) });
  }

  const totalBatches = batches.length;
  const results = [];
  const failures = [];
  let completedBatches = 0;

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += concurrency) {
    const concurrentBatches = batches.slice(i, i + concurrency);

    const batchPromises = concurrentBatches.map(({ index, chunk }) =>
      runWithRetry({
        batchIndex: index,
        chunk,
        processor,
        maxRetries: retries,
        getRetryDelayMs,
        onRetryWait,
      })
    );

    const batchOutcomes = await Promise.allSettled(batchPromises);
    const abortOutcome = batchOutcomes.find(
      (outcome) => outcome.status === 'rejected' && shouldAbort?.(outcome.reason)
    );

    if (abortOutcome) {
      throw abortOutcome.reason;
    }

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
      completedBatches++;
    });

    // ── Emit progress after each concurrency window ──
    if (onBatchComplete) {
      onBatchComplete(completedBatches, totalBatches);
    }
  }

  return { results, failures };
};

/**
 * Runs a single batch processor with exponential backoff retries.
 * Waits for the provider-recommended delay on rate-limit errors (429).
 */
const runWithRetry = async ({ batchIndex, chunk, processor, maxRetries, getRetryDelayMs, onRetryWait }) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Batch ${batchIndex}: attempt ${attempt}/${maxRetries}`);
      const result = await processor(chunk);
      return result;
    } catch (err) {
      lastError = err;
      
      // If this is a fatal error (like Quota Exhausted), abort immediately without retrying
      if (err.abortRemainingBatches) {
        throw err;
      }
      
      if (attempt < maxRetries) {
        // Use provider-recommended delay if available, otherwise exponential backoff
        const providerDelay = getRetryDelayMs?.(err);
        const delay = providerDelay ?? Math.pow(2, attempt - 1) * 500;
        logger.warn(
          `Batch ${batchIndex} attempt ${attempt} failed, retrying in ${delay}ms: ${err.message}`
        );
        if (onRetryWait) {
          onRetryWait(delay, attempt, maxRetries);
        }
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { processBatches };
