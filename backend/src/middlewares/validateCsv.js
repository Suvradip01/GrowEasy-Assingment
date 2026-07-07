'use strict';

const { error } = require('../utils/responseHelper');

/**
 * Validates that a CSV file was uploaded and contains at minimum
 * a header row + one data row.
 */
const validateCsv = (req, res, next) => {
  if (!req.file) {
    return error(res, 'No file uploaded. Please attach a CSV file.', 400);
  }

  const content = req.file.buffer.toString('utf8').trim();

  if (!content) {
    return error(res, 'Uploaded file is empty.', 400);
  }

  const lines = content.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return error(res, 'CSV must have at least a header row and one data row.', 400);
  }

  next();
};

module.exports = validateCsv;
