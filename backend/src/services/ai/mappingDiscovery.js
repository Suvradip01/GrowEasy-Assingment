'use strict';

const logger = require('../../utils/logger');
const { getStructuredModel } = require('./geminiClient');
const { isQuotaError, createAiLimitError } = require('./errorHelpers');
const { GEMINI_FIELD_MAPPING_SCHEMA, FieldMappingSchema } = require('./schemas');

/**
 * Stage 1 — Schema Discovery.
 * Sends headers + a sample of rows to Gemini (one API call per upload)
 * to produce a mapping of CSV column names → CRM field names.
 *
 * @param {string[]} headers    - CSV column headers
 * @param {object[]} sampleRows - First 5 rows for context
 * @returns {{ mapping: Record<string,string>, confidence: number, source: string }}
 */
const discoverFieldMapping = async (headers, sampleRows) => {
  const model = getStructuredModel(GEMINI_FIELD_MAPPING_SCHEMA);

  const sampleText = sampleRows
    .slice(0, 5)
    .map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`)
    .join('\n');

  const prompt = `
You are a CRM data integration expert. Analyse these CSV headers and sample rows, 
then produce a JSON mapping of EACH CSV column to a GrowEasy CRM field.

CRM target fields (only map to these exact names):
created_at, name, email, country_code, mobile_without_country_code, company, 
city, state, country, lead_owner, crm_status, crm_note, data_source, 
possession_time, description

CSV Headers: ${JSON.stringify(headers)}

Sample data:
${sampleText}

Mapping rules:
1. Map every CSV column that reasonably corresponds to a CRM field.
2. If a CSV column doesn't match any CRM field, map it to "crm_note".
3. If multiple CSV columns could be phone numbers, map first to mobile_without_country_code, rest to crm_note.
4. If multiple CSV columns could be email, map first to email, rest to crm_note.
5. Columns for area code / country dialling code → country_code.
6. Columns for region/province/territory → state.
7. Return "confidence" as a float 0–1 indicating your overall mapping certainty.

Return ONLY the JSON object with "mapping" and "confidence".
`.trim();

  logger.debug('Stage 1: Sending field mapping request to Gemini');

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    if (isQuotaError(err)) throw createAiLimitError(err);
    throw err;
  }

  const rawJson = result.response.text();
  logger.debug(`Stage 1 raw response: ${rawJson}`);

  const parsed = JSON.parse(rawJson);
  const validated = FieldMappingSchema.parse(parsed);

  logger.info(
    `Field mapping discovered (confidence: ${validated.confidence}): ${JSON.stringify(validated.mapping)}`
  );

  return { ...validated, source: 'gemini' };
};

module.exports = { discoverFieldMapping };
