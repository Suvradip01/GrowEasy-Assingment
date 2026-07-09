'use strict';

const logger = require('../../utils/logger');
const { getStructuredModel } = require('./geminiClient');
const { isQuotaError, createAiLimitError } = require('./errorHelpers');
const { GEMINI_BATCH_SCHEMA, BatchExtractionSchema } = require('./schemas');

// Sends a batch of raw CSV rows and the discovered field mapping to Gemini.
// Returns an array of typed, Zod-validated CRM records.
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

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    if (isQuotaError(err)) throw createAiLimitError(err);
    throw err;
  }

  const rawJson = result.response.text();
  const parsed = JSON.parse(rawJson);
  const validated = BatchExtractionSchema.parse(parsed);

  if (validated.records.length !== rows.length) {
    throw new Error(
      `AI extraction returned ${validated.records.length} records for ${rows.length} input rows`
    );
  }

  logger.debug(`Stage 2: Batch extracted ${validated.records.length} records`);
  return validated.records;
};

module.exports = { extractBatch };
