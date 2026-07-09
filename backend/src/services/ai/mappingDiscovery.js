'use strict';

const crypto = require('crypto');
const logger = require('../../utils/logger');
const { getStructuredModel } = require('./geminiClient');
const { isQuotaError, createAiLimitError } = require('./errorHelpers');
const { GEMINI_FIELD_MAPPING_SCHEMA, FieldMappingSchema } = require('./schemas');
const { getRedisClient } = require('../../config/redis');

// Cache TTL: 7 days (as suggested for dynamic environments)
const MAPPING_CACHE_TTL = 7 * 24 * 3600;

/**
 * Compute a stable cache key for a set of CSV headers.
 * We sort headers before hashing so column order doesn't create cache misses.
 * This also collapses semantically-duplicate header sets (e.g. same columns in different order).
 *
 * @param {string[]} headers
 * @returns {string} Redis key
 */
const headerCacheKey = (headers) => {
  const sorted = [...headers].map((h) => h.toLowerCase().trim()).sort();
  const hash = crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
  return `mapping:headers:${hash}`;
};

// Sends headers + a sample of rows to Gemini to discover the schema.
// Subsequent uploads with the same column schema hit the Redis cache — zero AI cost.
const discoverFieldMapping = async (headers, sampleRows) => {
  const redis = getRedisClient();
  const cacheKey = headerCacheKey(headers);

  // ── Check Redis cache ──
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      logger.info(`[Mapping] Cache hit for headers hash (${headers.length} columns). Skipping AI call.`);
      return { ...parsed, source: 'cache' };
    }
  } catch (cacheErr) {
    logger.warn(`[Mapping] Redis read failed (non-fatal): ${cacheErr.message}`);
  }

  // ── Call Gemini ──
  const model = getStructuredModel(GEMINI_FIELD_MAPPING_SCHEMA);

  const sampleText = sampleRows
    .slice(0, 5)
    .map((row, i) => `Row ${i + 1}: ${JSON.stringify(row)}`)
    .join('\n');

  const prompt = `
You are a CRM data integration expert. Analyse these CSV headers and sample rows, 
then produce a JSON list of column mappings from the CSV to GrowEasy CRM fields.

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
7. Treat semantically-duplicate columns (e.g. "Lead Name", "Name", "Customer Name") as the same field.
8. Return "confidence" as a float 0–1 indicating your overall mapping certainty.

Return ONLY the JSON object with "mappings" array (each item having "csv_column" and "crm_field") and "confidence".
`.trim();

  logger.debug('[Mapping] Stage 1: Sending field mapping request to Gemini');

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    if (isQuotaError(err)) throw createAiLimitError(err);
    throw err;
  }

  const rawJson = result.response.text();
  logger.debug(`[Mapping] Stage 1 raw response: ${rawJson}`);

  const parsed = JSON.parse(rawJson);
  const validated = FieldMappingSchema.parse(parsed);

  // Convert array of mappings to flat mapping object expected by downstream logic
  const mapping = {};
  validated.mappings.forEach((m) => {
    if (m.crm_field && m.csv_column) {
      mapping[m.csv_column] = m.crm_field;
    }
  });

  const output = {
    mapping,
    confidence: validated.confidence
  };

  logger.info(
    `[Mapping] Discovered (confidence: ${validated.confidence}): ${JSON.stringify(mapping)}`
  );

  // ── Cache the result in Redis ──
  try {
    await redis.set(cacheKey, JSON.stringify(output), 'EX', MAPPING_CACHE_TTL);
    logger.info(`[Mapping] Cached header mapping (key: mapping:headers:${cacheKey.slice(-8)}...)`);
  } catch (cacheErr) {
    logger.warn(`[Mapping] Redis write failed (non-fatal): ${cacheErr.message}`);
  }

  return { ...output, source: 'gemini' };
};

module.exports = { discoverFieldMapping };
