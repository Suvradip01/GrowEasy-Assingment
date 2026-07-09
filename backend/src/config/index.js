'use strict';

require('dotenv').config();

/**
 * Centralised configuration — every env variable lives here.
 * No process.env calls outside this file.
 */
const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
    get maxFileSizeBytes() {
      return this.maxFileSizeMb * 1024 * 1024;
    },
    allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    allowedExtensions: ['.csv'],
  },

  ai: {
    batchSize: parseInt(process.env.AI_BATCH_SIZE, 10) || 25,
    concurrency: parseInt(process.env.AI_CONCURRENCY, 10) || 3,
    retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS, 10) || 3,
    /**
     * Row threshold for selecting the extraction pipeline:
     *   rows <= maxFullAiRows  → Standard AI Mode   (AI batch extraction per-row)
     *   rows >  maxFullAiRows  → Production-Optimized Mode (AI-assisted mapping + JS extraction)
     * Configurable via MAX_FULL_AI_ROWS env variable.
     */
    maxFullAiRows: parseInt(process.env.MAX_FULL_AI_ROWS, 10) || 500,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 10,
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },
};

module.exports = config;
