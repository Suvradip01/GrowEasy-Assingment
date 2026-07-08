'use strict';

const {
  isQuotaError,
  isQuotaExhaustedError,
  getRetryDelayMs,
  createAiLimitError,
} = require('../../../../src/services/ai/errorHelpers');

describe('AI errorHelpers', () => {

  // ── isQuotaError ───────────────────────────────────────────────────────────

  describe('isQuotaError', () => {
    it('returns true when error message contains 429', () => {
      expect(isQuotaError(new Error('Request failed with status code 429'))).toBe(true);
    });

    it('returns true when error message contains "quota"', () => {
      expect(isQuotaError(new Error('RESOURCE_EXHAUSTED: quota exceeded'))).toBe(true);
    });

    it('returns true when error message contains "too many requests"', () => {
      expect(isQuotaError(new Error('Too many requests at this time'))).toBe(true);
    });

    it('returns true when error message contains "rate limit"', () => {
      expect(isQuotaError(new Error('rate limit reached'))).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(isQuotaError(new Error('Network error: connection refused'))).toBe(false);
    });

    it('returns false for null/undefined errors', () => {
      expect(isQuotaError(null)).toBe(false);
      expect(isQuotaError(undefined)).toBe(false);
    });
  });

  // ── isQuotaExhaustedError ──────────────────────────────────────────────────

  describe('isQuotaExhaustedError', () => {
    it('returns true for quota exceeded + billing detail errors', () => {
      const err = new Error('429 quota exceeded - billing details required');
      expect(isQuotaExhaustedError(err)).toBe(true);
    });

    it('returns false for rate limit only (not billing)', () => {
      const err = new Error('429 rate limit - retry in 30s');
      expect(isQuotaExhaustedError(err)).toBe(false);
    });
  });

  // ── getRetryDelayMs ───────────────────────────────────────────────────────

  describe('getRetryDelayMs', () => {
    it('extracts retry delay from "retryDelay" JSON field', () => {
      const err = new Error('{"retryDelay": "60s"}');
      expect(getRetryDelayMs(err)).toBe(60000);
    });

    it('extracts retry delay from "retry in Xs" message pattern', () => {
      const err = new Error('Rate limit hit, retry in 45s');
      expect(getRetryDelayMs(err)).toBe(45000);
    });

    it('returns null when no retry delay information present', () => {
      const err = new Error('Some unrelated error');
      expect(getRetryDelayMs(err)).toBeNull();
    });

    it('rounds up to ceiling milliseconds', () => {
      const err = new Error('{"retryDelay": "1.5s"}');
      expect(getRetryDelayMs(err)).toBe(2000);
    });
  });

  // ── createAiLimitError ────────────────────────────────────────────────────

  describe('createAiLimitError', () => {
    it('creates an error with AI_RATE_LIMITED code for transient rate limits', () => {
      const err = new Error('429 rate limit - retry in 30s');
      const aiError = createAiLimitError(err);

      expect(aiError.code).toBe('AI_RATE_LIMITED');
      expect(aiError.statusCode).toBe(429);
      expect(aiError.abortRemainingBatches).toBe(false);
    });

    it('creates an error with AI_QUOTA_EXHAUSTED code for billing exhaustion', () => {
      const err = new Error('429 quota exceeded - billing details required');
      const aiError = createAiLimitError(err);

      expect(aiError.code).toBe('AI_QUOTA_EXHAUSTED');
      expect(aiError.statusCode).toBe(429);
      expect(aiError.abortRemainingBatches).toBe(true);
    });

    it('sets retryAfterSeconds from error message', () => {
      const err = new Error('retry in 30s');
      const aiError = createAiLimitError(err);

      expect(aiError.retryAfterSeconds).toBe(30);
    });

    it('sets retryAfterSeconds to null when no delay info', () => {
      const err = new Error('rate limit');
      const aiError = createAiLimitError(err);

      expect(aiError.retryAfterSeconds).toBeNull();
    });

    it('stores original provider message', () => {
      const originalMsg = 'Gemini said: too many requests';
      const err = new Error(originalMsg);
      const aiError = createAiLimitError(err);

      expect(aiError.providerMessage).toBe(originalMsg);
    });
  });
});
