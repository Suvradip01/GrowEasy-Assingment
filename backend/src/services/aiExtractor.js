'use strict';

const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { z } = require('zod');
const config = require('../config');
const logger = require('../utils/logger');
const { processBatches } = require('../utils/batchProcessor');

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Zod Schemas — the ground-truth contract for what we expect
// ─────────────────────────────────────────────────────────────────────────────

const CRM_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const DATA_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

/**
 * Zod schema for a single extracted CRM record.
 * All fields are optional except the validation gate (email or mobile).
 */
const CrmRecordSchema = z.object({
  created_at: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  country_code: z.string().optional().nullable(),
  mobile_without_country_code: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lead_owner: z.string().optional().nullable(),
  crm_status: z.enum(CRM_STATUSES).optional().nullable(),
  crm_note: z.string().optional().nullable(),
  data_source: z.enum(DATA_SOURCES).optional().nullable(),
  possession_time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  _skipped: z.boolean().optional(),
  _skip_reason: z.string().optional().nullable(),
});

/** Schema for the Stage 1 field-mapping response */
const FieldMappingSchema = z.object({
  mapping: z.record(z.string(), z.string()),
  confidence: z.number().min(0).max(1),
});

/** Schema for Stage 2 batch extraction response */
const BatchExtractionSchema = z.object({
  records: z.array(CrmRecordSchema),
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Gemini JSON Schemas (responseSchema)
// These mirror the Zod schemas above but in Gemini's SchemaType format.
// Gemini will be *constrained* to output JSON matching this shape exactly.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_CRM_RECORD_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    created_at: { type: SchemaType.STRING, nullable: true },
    name: { type: SchemaType.STRING, nullable: true },
    email: { type: SchemaType.STRING, nullable: true },
    country_code: { type: SchemaType.STRING, nullable: true },
    mobile_without_country_code: { type: SchemaType.STRING, nullable: true },
    company: { type: SchemaType.STRING, nullable: true },
    city: { type: SchemaType.STRING, nullable: true },
    state: { type: SchemaType.STRING, nullable: true },
    country: { type: SchemaType.STRING, nullable: true },
    lead_owner: { type: SchemaType.STRING, nullable: true },
    crm_status: {
      type: SchemaType.STRING,
      enum: CRM_STATUSES,
      nullable: true,
    },
    crm_note: { type: SchemaType.STRING, nullable: true },
    data_source: {
      type: SchemaType.STRING,
      enum: DATA_SOURCES,
      nullable: true,
    },
    possession_time: { type: SchemaType.STRING, nullable: true },
    description: { type: SchemaType.STRING, nullable: true },
    _skipped: { type: SchemaType.BOOLEAN, nullable: true },
    _skip_reason: { type: SchemaType.STRING, nullable: true },
  },
};

const GEMINI_FIELD_MAPPING_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    mapping: {
      type: SchemaType.OBJECT,
      description: 'Map of CSV column name → CRM field name',
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Overall mapping confidence score 0–1',
    },
  },
  required: ['mapping', 'confidence'],
};

const GEMINI_BATCH_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    records: {
      type: SchemaType.ARRAY,
      items: GEMINI_CRM_RECORD_SCHEMA,
    },
  },
  required: ['records'],
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Gemini client initialisation
// ─────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Creates a Gemini model instance configured for structured JSON output.
 * @param {object} responseSchema - Gemini SchemaType schema
 */
const getStructuredModel = (responseSchema) => {
  return genAI.getGenerativeModel({
    model: config.gemini.model,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1,       // Low temperature for consistent structured output
      topP: 0.8,
      maxOutputTokens: 8192,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Stage 1 — Schema Discovery (field mapping)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends headers + sample rows to Gemini to discover the field mapping.
 * Called ONCE per upload, not per record.
 *
 * @param {string[]} headers    - CSV column names
 * @param {object[]} sampleRows - First 3–5 rows for context
 * @returns {{ mapping: Record<string, string>, confidence: number }}
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

  const result = await model.generateContent(prompt);
  const rawJson = result.response.text();

  logger.debug(`Stage 1 raw response: ${rawJson}`);

  // Gemini guarantees valid JSON because of responseMimeType + responseSchema.
  // Zod adds a second layer of type-safety validation.
  const parsed = JSON.parse(rawJson);
  const validated = FieldMappingSchema.parse(parsed);

  logger.info(`Field mapping discovered (confidence: ${validated.confidence}): ${JSON.stringify(validated.mapping)}`);

  return validated;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Stage 2 — Batch Record Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts CRM records from a batch of raw rows using the field mapping.
 * Gemini handles ambiguous fields, status inference, and note aggregation.
 *
 * @param {object[]} rows        - Batch of raw CSV row objects
 * @param {object}   fieldMapping - { mapping: Record<string,string> } from Stage 1
 * @returns {object[]} Extracted and Zod-validated CRM record objects
 */
const extractBatch = async (rows, fieldMapping) => {
  const model = getStructuredModel(GEMINI_BATCH_SCHEMA);

  const prompt = `
You are a CRM data extraction expert. Convert these raw CSV records into GrowEasy CRM records.

Field mapping from CSV columns to CRM fields:
${JSON.stringify(fieldMapping.mapping, null, 2)}

Raw records to process:
${JSON.stringify(rows, null, 2)}

STRICT extraction rules:
1. Apply the field mapping above. Use your intelligence for any unmapped columns.

2. crm_status MUST be one of these exact values (or null):
   - GOOD_LEAD_FOLLOW_UP
   - DID_NOT_CONNECT  
   - BAD_LEAD
   - SALE_DONE
   Infer from notes/remarks/status columns. If unclear, use GOOD_LEAD_FOLLOW_UP.

3. data_source MUST be one of these exact values (or null if no match):
   - leads_on_demand
   - meridian_tower
   - eden_park
   - varah_swamy
   - sarjapur_plots
   Match source/campaign/channel columns. Leave null if no confident match.

4. created_at must be a parseable date string (ISO 8601 preferred, e.g. "2026-05-13T14:20:48").

5. mobile_without_country_code must NOT include country/dialling code digits.
   Strip +91, 0091, leading zeros for country code.

6. If multiple emails exist, use first for "email", append rest to "crm_note".
   If multiple phone numbers exist, use first for "mobile_without_country_code", append rest to "crm_note".

7. crm_note should aggregate: remarks, follow-up notes, extra contact details, comments.
   Format: clear, concise sentences. Escape any newlines as \\n.

8. SKIP a record (set _skipped: true, _skip_reason: "reason") if:
   - It has NO email AND NO mobile number.
   - It appears to be a duplicate header row.

9. Output exactly ${rows.length} records (one per input row, even skipped ones).

10. Never invent information not present in the source data. Use null for missing fields.
`.trim();

  logger.debug(`Stage 2: Extracting batch of ${rows.length} records`);

  const result = await model.generateContent(prompt);
  const rawJson = result.response.text();

  // Gemini guarantees JSON → Zod validates each record's types/enums
  const parsed = JSON.parse(rawJson);
  const validated = BatchExtractionSchema.parse(parsed);

  logger.debug(`Stage 2: Batch extracted ${validated.records.length} records`);

  return validated.records;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Main extraction orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full AI extraction pipeline:
 *  1. Discover field mapping from headers + sample rows
 *  2. Process all rows in batches with retry
 *  3. Separate results into successful and skipped records
 *
 * @param {string[]} headers
 * @param {object[]} rows
 * @returns {{ successRecords: object[], skippedRecords: object[], fieldMapping: object }}
 */
const extractCrmRecords = async (headers, rows) => {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.');
  }

  // ── Stage 1: Field mapping (single API call, regardless of row count) ──
  const fieldMapping = await discoverFieldMapping(headers, rows.slice(0, 5));

  // ── Stage 2: Batch extraction ──
  const { results: allExtracted, failures } = await processBatches({
    items: rows,
    batchSize: config.ai.batchSize,
    concurrency: config.ai.concurrency,
    retries: config.ai.retryAttempts,
    processor: (batch) => extractBatch(batch, fieldMapping),
  });

  // Partition into success and skipped
  const successRecords = [];
  const skippedRecords = [];

  allExtracted.forEach((record) => {
    if (record._skipped) {
      skippedRecords.push({
        reason: record._skip_reason || 'No email or mobile number found',
        data: record,
      });
    } else {
      // Clean internal fields before returning
      const { _skipped, _skip_reason, ...cleanRecord } = record;
      successRecords.push(cleanRecord);
    }
  });

  // Records that failed all retries
  failures.forEach(({ original, reason }) => {
    skippedRecords.push({ reason, data: original });
  });

  logger.info(`Extraction complete: ${successRecords.length} success, ${skippedRecords.length} skipped`);

  return {
    successRecords,
    skippedRecords,
    fieldMapping: fieldMapping.mapping,
    mappingConfidence: fieldMapping.confidence,
  };
};

module.exports = { extractCrmRecords };
