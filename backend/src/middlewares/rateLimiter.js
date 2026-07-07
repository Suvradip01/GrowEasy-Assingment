'use strict';

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Creates a Redis-backed rate limiter.
 * Falls back to in-memory limiter if Redis is unavailable.
 */
const createRateLimiter = () => {
  let store;

  try {
    const redisClient = getRedisClient();
    store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    });
    logger.debug('Rate limiter using Redis store');
  } catch (err) {
    logger.warn('Rate limiter falling back to in-memory store');
    store = undefined; // express-rate-limit defaults to memory store
  }

  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      message: `Too many requests. Limit: ${config.rateLimit.maxRequests} per ${config.rateLimit.windowMs / 1000}s. Please try again later.`,
    },
    handler: (req, res, _next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json(options.message);
    },
  });
};

module.exports = createRateLimiter;
