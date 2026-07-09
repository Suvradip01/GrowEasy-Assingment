'use strict';

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { getRedisClient } = require('./src/config/redis');

/**
 * Initializes the HTTP server and its dependencies.
 * We attempt a non-blocking Redis connection first so the server can still start
 * even if the cache layer is down (fallback mode). It also attaches handlers
 * for graceful shutdown to ensure active requests finish before the process exits.
 */
const startServer = async () => {
  // Attempt Redis connection (non-blocking)
  try {
    const redis = getRedisClient();
    await redis.connect();
  } catch (err) {
    logger.warn(`Redis unavailable, continuing without cache: ${err.message}`);
  }

  const server = app.listen(config.server.port, () => {
    logger.info(`   GrowEasy CSV Importer API`);
    logger.info(`   Environment : ${config.server.nodeEnv}`);
    logger.info(`   Port        : ${config.server.port}`);
    logger.info(`   Health      : http://localhost:${config.server.port}/api/v1/health`);
  });

  // ── Graceful shutdown ──
  // Ensures the server stops accepting new connections and closes existing ones safely
  // when the process receives termination signals (e.g., from Docker or Kubernetes).
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await getRedisClient().quit();
        logger.info('Redis connection closed');
      } catch (_) {
        // Redis may already be down
      }

      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown stalls
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled rejections ──
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
};

startServer();
