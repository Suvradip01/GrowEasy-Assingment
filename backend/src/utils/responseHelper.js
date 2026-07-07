'use strict';

/**
 * Standardised API response shapes.
 * All routes must use these helpers to keep the contract consistent.
 */

const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const error = (res, message, statusCode = 500, details = null) => {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = { success, error };
