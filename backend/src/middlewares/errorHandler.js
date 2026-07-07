'use strict';

const multer = require('multer');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global Express error handler.
 * Must be registered last (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`, {
    stack: config.server.isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Multer errors (file size, file type, etc.)
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `File too large. Maximum size is ${config.upload.maxFileSizeMb}MB.`,
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field. Use the field name "file".',
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }

  // File type validation errors thrown from multer fileFilter
  if (err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Default 500
  res.status(err.statusCode || 500).json({
    success: false,
    message: config.server.isDev ? err.message : 'An unexpected server error occurred.',
  });
};

module.exports = errorHandler;
