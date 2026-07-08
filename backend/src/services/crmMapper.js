'use strict';

/**
 * Post-AI CRM field normaliser.
 * Runs AFTER Gemini extraction to sanitise and standardise field values.
 * Handles edge cases that the AI might not consistently handle.
 */

const VALID_STATUSES = new Set([
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
]);

const VALID_SOURCES = new Set([
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
]);

/**
 * Normalises a single extracted CRM record.
 * @param {object} record - AI-extracted record
 * @returns {object} Normalised record
 */
const normaliseRecord = (record) => {
  const out = { ...record };

  // ── created_at: ensure parseable date ──
  if (out.created_at) {
    const d = new Date(out.created_at);
    if (isNaN(d.getTime())) {
      out.created_at = null; // Unparseable date → null
    } else {
      out.created_at = d.toISOString();
    }
  }

  // ── email: lowercase and trim ──
  if (out.email) {
    out.email = out.email.toLowerCase().trim();
    // Basic email format sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) {
      out.email = null;
    }
  }

  // ── mobile: strip spaces, dashes, parentheses ──
  if (out.mobile_without_country_code) {
    out.mobile_without_country_code = out.mobile_without_country_code
      .replace(/[\s\-().+]/g, '')
      .trim();

    // Strip leading country code digits (e.g. "919876543210" → "9876543210" when country_code is "+91")
    if (out.mobile_without_country_code && out.country_code) {
      const codeDigits = out.country_code.replace(/\D/g, '');
      if (codeDigits && out.mobile_without_country_code.startsWith(codeDigits)) {
        const stripped = out.mobile_without_country_code.slice(codeDigits.length);
        // Only strip if remaining number is long enough to be valid (at least 7 digits)
        if (stripped.length >= 7) {
          out.mobile_without_country_code = stripped;
        }
      }
    }

    // If it's empty after stripping, null it
    if (!out.mobile_without_country_code) {
      out.mobile_without_country_code = null;
    }
  }

  // ── country_code: ensure + prefix ──
  if (out.country_code) {
    out.country_code = out.country_code.trim();
    if (out.country_code && !out.country_code.startsWith('+')) {
      out.country_code = `+${out.country_code}`;
    }
  }

  // ── crm_status: validate against allowed values ──
  if (out.crm_status && !VALID_STATUSES.has(out.crm_status)) {
    out.crm_status = null;
  }

  // ── data_source: validate against allowed values ──
  if (out.data_source && !VALID_SOURCES.has(out.data_source)) {
    out.data_source = null;
  }

  // ── name: trim and title-case ──
  if (out.name) {
    out.name = out.name.trim();
  }

  // ── string fields: null empty strings ──
  const stringFields = [
    'name', 'company', 'city', 'state', 'country',
    'lead_owner', 'crm_note', 'possession_time', 'description',
  ];
  stringFields.forEach((field) => {
    if (out[field] !== undefined && out[field] !== null) {
      out[field] = out[field].toString().trim() || null;
    }
  });

  return out;
};

/**
 * Normalises an array of CRM records.
 * @param {object[]} records
 * @returns {object[]}
 */
const normaliseRecords = (records) => records.map(normaliseRecord);

module.exports = { normaliseRecords, normaliseRecord };
