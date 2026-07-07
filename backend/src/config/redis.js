'use strict';

const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Returns a singleton Redis client.
 * On connection failure the app degrades gracefully (Redis is not critical for core flow).
 */
const getRedisClient = () => {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => {
    logger.warn(`Redis error (non-fatal): ${err.message}`);
  });

  return redisClient;
};

module.exports = { getRedisClient };
