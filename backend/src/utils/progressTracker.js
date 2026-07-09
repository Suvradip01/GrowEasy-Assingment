'use strict';

const { EventEmitter } = require('events');
const logger = require('./logger');

/**
 * Server-wide EventEmitter for real-time import progress.
 *
 * Architecture:
 *   - Each import job is identified by a unique clientId (UUID from the frontend).
 *   - The pipeline calls emitProgress() at each checkpoint.
 *   - The SSE handler for GET /progress/:clientId listens on this emitter and
 *     forwards events to the browser as text/event-stream data.
 *
 * Events emitted: `progress:<clientId>`
 * Payload: { progress: 0–100, message: string, mode: string|null, details: string|null }
 */
const progressEmitter = new EventEmitter();

// Prevent MaxListenersExceededWarning for large concurrent uploads
progressEmitter.setMaxListeners(200);

/**
 * Emit a progress update for a specific import job.
 *
 * @param {string} clientId - Unique job/client identifier
 * @param {{ progress: number, message: string, mode?: string, details?: string }} payload
 */
const emitProgress = (clientId, { progress, message, mode = null, details = null }) => {
  if (!clientId) return;
  logger.debug(`[SSE] clientId=${clientId} progress=${progress}% "${message}"`);
  progressEmitter.emit(`progress:${clientId}`, { progress, message, mode, details });
};

/**
 * Express handler for GET /api/v1/import/progress/:clientId
 *
 * Establishes a persistent SSE stream for the given clientId.
 * Sends a heartbeat every 25 s to keep the connection alive through proxies.
 * Automatically cleans up listeners on client disconnect.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const sseHandler = (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'clientId is required' });
  }

  // ── SSE headers ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx response buffering
  res.flushHeaders();

  // Send an initial "connected" event so the client knows the stream is live
  res.write(`data: ${JSON.stringify({ progress: 0, message: 'Connected', mode: null, details: null })}\n\n`);

  // ── Heartbeat to prevent proxy timeouts (every 25 s) ──
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25_000);

  // ── Forward progress events to this SSE stream ──
  const eventName = `progress:${clientId}`;
  const onProgress = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  progressEmitter.on(eventName, onProgress);

  logger.info(`[SSE] Stream opened for clientId=${clientId}`);

  // ── Cleanup on disconnect ──
  req.on('close', () => {
    clearInterval(heartbeat);
    progressEmitter.off(eventName, onProgress);
    logger.info(`[SSE] Stream closed for clientId=${clientId}`);
  });
};

module.exports = { emitProgress, sseHandler };
