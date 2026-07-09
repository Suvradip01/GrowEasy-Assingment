'use strict';

const fs = require('fs');
const path = require('path');
const { parseCsvBuffer } = require('c:/Users/ghosh/OneDrive/Desktop/Project/backend/src/services/csvParser');
const { discoverFieldMapping } = require('c:/Users/ghosh/OneDrive/Desktop/Project/backend/src/services/ai/mappingDiscovery');
const { extractCrmRecords } = require('c:/Users/ghosh/OneDrive/Desktop/Project/backend/src/services/aiExtractor');

const runDebug = async () => {
  const samplePath = 'c:/Users/ghosh/OneDrive/Desktop/Project/backend/tests/helpers/fixtures/sample.csv';
  console.log('Reading sample file from:', samplePath);

  if (!fs.existsSync(samplePath)) {
    console.error('Fixture sample.csv not found!');
    return;
  }

  const buffer = fs.readFileSync(samplePath);
  const { headers, rows } = parseCsvBuffer(buffer);

  console.log('Headers parsed:', headers);
  console.log('First row parsed:', rows[0]);

  try {
    const mappingResult = await discoverFieldMapping(headers, rows.slice(0, 5));
    console.log('Discovered Field Mapping:', mappingResult);

    const headerMap = mappingResult.mapping;
    console.log('Mapping applied:');
    for (const [csvCol, crmField] of Object.entries(headerMap)) {
      console.log(`  - "${csvCol}" (${rowValue(rows[0], csvCol)}) -> "${crmField}"`);
    }

    // Run extractor on a few rows
    const result = await extractCrmRecords(headers, rows.slice(0, 10), 'debug-client');
    console.log('Extraction success length:', result.successRecords.length);
    console.log('Extraction skipped length:', result.skippedRecords.length);
    if (result.skippedRecords.length > 0) {
      console.log('First skipped record:', result.skippedRecords[0]);
    }
  } catch (err) {
    console.error('Error during extraction:', err);
  }
};

const rowValue = (row, col) => {
  return row[col] !== undefined ? `"${row[col]}"` : 'undefined';
};

runDebug();
