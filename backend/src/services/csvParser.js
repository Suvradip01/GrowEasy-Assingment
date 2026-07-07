'use strict';

const Papa = require('papaparse');
const logger = require('../utils/logger');

/**
 * Parses a CSV buffer into headers and row objects.
 *
 * @param {Buffer} fileBuffer - Raw file buffer from multer
 * @returns {{ headers: string[], rows: object[], totalRows: number }}
 */
const parseCsvBuffer = (fileBuffer) => {
  const csvString = fileBuffer.toString('utf8');

  const result = Papa.parse(csvString, {
    header: true,          // Use first row as keys
    skipEmptyLines: true,  // Ignore blank rows
    dynamicTyping: false,  // Keep everything as strings — AI will handle typing
    transformHeader: (header) => header.trim(), // Trim whitespace from column names
    transform: (value) => (value ? value.trim() : value), // Trim cell values
  });

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter((e) => e.type === 'Delimiter');
    if (criticalErrors.length > 0) {
      throw new Error(`CSV parse error: ${criticalErrors[0].message}`);
    }
    // Non-critical errors (empty rows etc.) — log and continue
    logger.warn(`CSV parse warnings: ${JSON.stringify(result.errors)}`);
  }

  const headers = result.meta.fields || [];
  const rows = result.data;

  logger.info(`CSV parsed: ${rows.length} rows, ${headers.length} columns`);
  logger.debug(`Headers detected: ${headers.join(', ')}`);

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
};

module.exports = { parseCsvBuffer };
