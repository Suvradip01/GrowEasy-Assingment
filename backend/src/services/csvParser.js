'use strict';

const Papa = require('papaparse');
const logger = require('../utils/logger');

/**
 * Parses a CSV buffer into headers and row objects.
 *
 * @param {Buffer} fileBuffer - Raw file buffer from multer
 * @param {number} [previewLimit=0] - If > 0, stops parsing after N rows and approximates totalRows
 * @returns {{ headers: string[], rows: object[], totalRows: number }}
 */
const parseCsvBuffer = (fileBuffer, previewLimit = 0) => {
  const csvString = fileBuffer.toString('utf8');

  // Fast newline counting for approximate totalRows in preview mode
  let totalRows = 0;
  if (previewLimit > 0) {
    for (let i = 0; i < fileBuffer.length; i++) {
      if (fileBuffer[i] === 10) totalRows++; // 10 is '\n'
    }
    // Remove header row from count
    if (totalRows > 0) totalRows--;
  }

  const options = {
    header: true,          // Use first row as keys
    skipEmptyLines: true,  // Ignore blank rows
    dynamicTyping: false,  // Keep everything as strings — AI will handle typing
    transformHeader: (header) => header.trim(), // Trim whitespace from column names
    transform: (value) => (value ? value.trim() : value), // Trim cell values
  };

  if (previewLimit > 0) {
    options.preview = previewLimit;
  }

  const result = Papa.parse(csvString, options);

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

  const finalTotalRows = previewLimit > 0 ? totalRows : rows.length;

  logger.info(`CSV parsed: ${rows.length} rows, ${headers.length} columns (Limit: ${previewLimit > 0 ? previewLimit : 'None'})`);
  logger.debug(`Headers detected: ${headers.join(', ')}`);

  return {
    headers,
    rows,
    totalRows: finalTotalRows,
  };
};

module.exports = { parseCsvBuffer };
