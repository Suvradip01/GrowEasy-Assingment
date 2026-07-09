'use strict';

/**
 * AI-assisted semantic normalization for CRM status and data_source values.
 *
 * Instead of running Gemini on every row (2000 calls for 50k rows), we:
 *   1. Extract UNIQUE status/source strings from the entire CSV (set of N unique values).
 *   2. Send ONE Gemini request per dimension (status, source) to map each unique value.
 *   3. Cache each mapping in Redis so subsequent uploads with the same values skip AI entirely.
 *   4. Apply the resulting lookup table programmatically across all rows in JS.
 *
 * Result: 2–3 Gemini requests total regardless of CSV size — massive quota savings.
 */

const crypto = require('crypto');
const { SchemaType } = require('@google/generative-ai');
const { z } = require('zod');
const logger = require('../../utils/logger');
const { getStructuredModel } = require('./geminiClient');
const { isQuotaError, createAiLimitError } = require('./errorHelpers');
const { getRedisClient } = require('../../config/redis');
const { CRM_STATUSES, DATA_SOURCES } = require('./schemas');

// ── Redis cache TTL: 24 hours (status/source mappings normalized values cached daily) ──
const NORM_CACHE_TTL = 24 * 3600;

// ─────────────────────────────────────────────────────────────────────
// Gemini schema for status normalization
// ─────────────────────────────────────────────────────────────────────
const GEMINI_STATUS_NORM_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    mappings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          raw: { type: SchemaType.STRING },
          normalized: { type: SchemaType.STRING, nullable: true },
        },
        required: ['raw', 'normalized'],
      },
    },
  },
  required: ['mappings'],
};

const StatusNormSchema = z.object({
  mappings: z.array(
    z.object({
      raw: z.string(),
      normalized: z.string().nullable(),
    })
  ),
});

// ─────────────────────────────────────────────────────────────────────
// Gemini schema for source normalization
// ─────────────────────────────────────────────────────────────────────
const GEMINI_SOURCE_NORM_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    mappings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          raw: { type: SchemaType.STRING },
          normalized: { type: SchemaType.STRING, nullable: true },
        },
        required: ['raw', 'normalized'],
      },
    },
  },
  required: ['mappings'],
};

// ─────────────────────────────────────────────────────────────────────
// Redis helpers
// ─────────────────────────────────────────────────────────────────────
const getCachedMapping = async (redis, key) => {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const setCachedMapping = async (redis, key, value) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', NORM_CACHE_TTL);
  } catch {
    // non-fatal
  }
};

/**
 * Maps an array of unique raw status strings to allowed CRM status values.
 * Uses Redis as a cache — only unmapped values are sent to Gemini.
 *
 * @param {string[]} uniqueStatuses - Unique raw status strings from the CSV
 * @returns {Record<string, string|null>} Lookup: raw → normalized CRM status (or null)
 */
const mapUniqueStatuses = async (uniqueStatuses) => {
  if (!uniqueStatuses || uniqueStatuses.length === 0) return {};

  const redis = getRedisClient();
  const result = {};
  const toAsk = [];

  // Check cache for each unique value
  for (const raw of uniqueStatuses) {
    const cacheKey = `mapping:status:${crypto.createHash('sha256').update(raw.toLowerCase().trim()).digest('hex')}`;
    const cached = await getCachedMapping(redis, cacheKey);
    if (cached !== null) {
      logger.debug(`[Norm] Status cache hit: "${raw}" → "${cached}"`);
      result[raw] = cached;
    } else {
      toAsk.push({ raw, cacheKey });
    }
  }

  if (toAsk.length === 0) {
    logger.info(`[Norm] All ${uniqueStatuses.length} status values resolved from cache`);
    return result;
  }

  logger.info(`[Norm] Sending ${toAsk.length} unique status values to Gemini for normalization`);

  const model = getStructuredModel(GEMINI_STATUS_NORM_SCHEMA);
  const prompt = `
You are a CRM data expert. Map each raw status string to the closest allowed CRM status value.

Allowed CRM status values (use EXACT strings):
${CRM_STATUSES.map((s) => `  - ${s}`).join('\n')}

Mapping guide:
- "Interested", "Callback", "Follow up", "Hot lead", "Warm lead"  → GOOD_LEAD_FOLLOW_UP
- "Not reachable", "No answer", "Busy", "Switch off", "Not picking" → DID_NOT_CONNECT
- "Not interested", "Invalid", "Wrong number", "Junk", "Dead lead" → BAD_LEAD
- "Sold", "Booked", "Converted", "Deal done", "Sale" → SALE_DONE
- If no confident match, return null.

Raw status values to normalize:
${JSON.stringify(toAsk.map((t) => t.raw))}

Return a JSON object with a "mappings" array, one entry per input value, preserving order.
Each entry: { "raw": "<original>", "normalized": "<CRM_STATUS or null>" }
`.trim();

  let geminiResult;
  try {
    geminiResult = await model.generateContent(prompt);
  } catch (err) {
    if (isQuotaError(err)) throw createAiLimitError(err);
    throw err;
  }

  const rawJson = geminiResult.response.text();
  const parsed = JSON.parse(rawJson);
  const validated = StatusNormSchema.parse(parsed);

  // Store results + cache each mapping
  for (const { raw: origRaw, normalized } of validated.mappings) {
    // Match back by position (Gemini preserves order)
    const entry = toAsk.find((t) => t.raw === origRaw) || toAsk[validated.mappings.indexOf({ raw: origRaw, normalized })];
    if (entry) {
      const val = CRM_STATUSES.includes(normalized) ? normalized : null;
      result[entry.raw] = val;
      await setCachedMapping(redis, entry.cacheKey, val);
      logger.debug(`[Norm] Status "${entry.raw}" → "${val}"`);
    }
  }

  // Fallback: map any remaining (position-based safe pass)
  validated.mappings.forEach(({ raw: origRaw, normalized }, idx) => {
    if (!(origRaw in result) && idx < toAsk.length) {
      const val = CRM_STATUSES.includes(normalized) ? normalized : null;
      result[toAsk[idx].raw] = val;
      setCachedMapping(redis, toAsk[idx].cacheKey, val).catch(() => {});
    }
  });

  logger.info(`[Norm] Status normalization complete: ${Object.keys(result).length} values mapped`);
  return result;
};

/**
 * Maps an array of unique raw source/campaign strings to allowed CRM data_source values.
 * Uses Redis as a cache — only unmapped values are sent to Gemini.
 *
 * @param {string[]} uniqueSources - Unique raw source strings from the CSV
 * @returns {Record<string, string|null>} Lookup: raw → normalized data_source (or null)
 */
const mapUniqueSources = async (uniqueSources) => {
  if (!uniqueSources || uniqueSources.length === 0) return {};

  const redis = getRedisClient();
  const result = {};
  const toAsk = [];

  for (const raw of uniqueSources) {
    const cacheKey = `mapping:source:${crypto.createHash('sha256').update(raw.toLowerCase().trim()).digest('hex')}`;
    const cached = await getCachedMapping(redis, cacheKey);
    if (cached !== null) {
      logger.debug(`[Norm] Source cache hit: "${raw}" → "${cached}"`);
      result[raw] = cached;
    } else {
      toAsk.push({ raw, cacheKey });
    }
  }

  if (toAsk.length === 0) {
    logger.info(`[Norm] All ${uniqueSources.length} source values resolved from cache`);
    return result;
  }

  logger.info(`[Norm] Sending ${toAsk.length} unique source values to Gemini for normalization`);

  const model = getStructuredModel(GEMINI_SOURCE_NORM_SCHEMA);
  const prompt = `
You are a CRM data expert. Map each raw campaign/source string to the closest allowed CRM data_source value.

Allowed CRM data_source values (use EXACT strings):
${DATA_SOURCES.map((s) => `  - ${s}`).join('\n')}

Mapping guide:
- "Leads on Demand", "LOD", "Facebook Ads", "FB", "Facebook Campaign", "Digital", "Online" → leads_on_demand
- "Meridian Tower", "Meridian", "MT" → meridian_tower
- "Eden Park", "Eden", "EP" → eden_park
- "Varah Swamy", "Varah", "VS" → varah_swamy
- "Sarjapur Plots", "Sarjapur", "SP", "Plot" → sarjapur_plots
- If no confident match, return null.

Raw source values to normalize:
${JSON.stringify(toAsk.map((t) => t.raw))}

Return a JSON object with a "mappings" array, one entry per input value, preserving order.
Each entry: { "raw": "<original>", "normalized": "<data_source or null>" }
`.trim();

  let geminiResult;
  try {
    geminiResult = await model.generateContent(prompt);
  } catch (err) {
    if (isQuotaError(err)) throw createAiLimitError(err);
    throw err;
  }

  const rawJson = geminiResult.response.text();
  const parsed = JSON.parse(rawJson);
  const validated = StatusNormSchema.parse(parsed); // Same shape as status

  for (const { raw: origRaw, normalized } of validated.mappings) {
    const entry = toAsk.find((t) => t.raw === origRaw);
    if (entry) {
      const val = DATA_SOURCES.includes(normalized) ? normalized : null;
      result[entry.raw] = val;
      await setCachedMapping(redis, entry.cacheKey, val);
      logger.debug(`[Norm] Source "${entry.raw}" → "${val}"`);
    }
  }

  // Fallback position-based
  validated.mappings.forEach(({ raw: origRaw, normalized }, idx) => {
    if (!(origRaw in result) && idx < toAsk.length) {
      const val = DATA_SOURCES.includes(normalized) ? normalized : null;
      result[toAsk[idx].raw] = val;
      setCachedMapping(redis, toAsk[idx].cacheKey, val).catch(() => {});
    }
  });

  logger.info(`[Norm] Source normalization complete: ${Object.keys(result).length} values mapped`);
  return result;
};

module.exports = { mapUniqueStatuses, mapUniqueSources };
