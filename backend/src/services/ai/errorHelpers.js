'use strict';

/**
 * Detects whether an error from Gemini indicates a rate-limit (429).
 * @param {Error} err
 * @returns {boolean}
 */
const isQuotaError = (err) => {
  const text = `${err?.message || ''} ${JSON.stringify(err || {})}`;
  return text.includes('429') || /quota|too many requests|rate limit/i.test(text);
};

/**
 * Returns true when the quota is exhausted (daily/monthly billing limit),
 * as opposed to a transient per-minute rate limit.
 * @param {Error} err
 * @returns {boolean}
 */
const isQuotaExhaustedError = (err) => {
  const text = `${err?.message || ''} ${JSON.stringify(err || {})}`;
  return (
    isQuotaError(err) &&
    /billing details|free_tier_requests|perday|per day|requestsperday|quota exceeded/i.test(text)
  );
};

/**
 * Extracts the provider-recommended retry delay in milliseconds from an error.
 * Returns null if no retry delay can be determined.
 * @param {Error} err
 * @returns {number|null}
 */
const getRetryDelayMs = (err) => {
  const text = `${err?.message || ''} ${JSON.stringify(err || {})}`;
  const retryDelayMatch = text.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  const retryInMatch = text.match(/retry in (\d+(?:\.\d+)?)s/i);
  const seconds = Number(retryDelayMatch?.[1] || retryInMatch?.[1]);

  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds * 1000);
};

/**
 * Builds a structured AI limit error from a raw Gemini error.
 * Attaches statusCode, code, retryAfterSeconds, and abortRemainingBatches
 * so the error handler and batch processor can handle it intelligently.
 * @param {Error} err - Original error from Gemini SDK
 * @returns {Error}
 */
const createAiLimitError = (err) => {
  const retryDelayMs = getRetryDelayMs(err);
  const quotaExhausted = isQuotaExhaustedError(err);

  const message = quotaExhausted
    ? 'AI provider quota exhausted. Please try again later or use a Gemini API key with sufficient quota.'
    : 'AI provider rate limit reached. Please retry after a short delay.';

  const aiError = new Error(message);
  aiError.statusCode = 429;
  aiError.code = quotaExhausted ? 'AI_QUOTA_EXHAUSTED' : 'AI_RATE_LIMITED';
  aiError.retryAfterSeconds = retryDelayMs ? Math.ceil(retryDelayMs / 1000) : null;
  aiError.providerMessage = err?.message;
  aiError.abortRemainingBatches = quotaExhausted;

  return aiError;
};

module.exports = { isQuotaError, isQuotaExhaustedError, getRetryDelayMs, createAiLimitError };
