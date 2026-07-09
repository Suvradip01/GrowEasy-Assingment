'use strict';

const { CRM_STATUSES, DATA_SOURCES } = require('./schemas');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanPhone = (raw) => {
  if (!raw) return null;
  // Remove spaces, dashes, parentheses, dots
  let cleaned = raw.toString().replace(/[\s\-().+]/g, '').trim();
  if (!cleaned || cleaned.length < 7) return null;
  return cleaned;
};

const stripCountryCode = (phone, countryCode) => {
  if (!phone || !countryCode) return phone;
  const codeDigits = countryCode.replace(/\D/g, '');
  if (codeDigits && phone.startsWith(codeDigits)) {
    const stripped = phone.slice(codeDigits.length);
    if (stripped.length >= 7) return stripped;
  }
  return phone;
};

const parseDate = (raw) => {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString();
  return null;
};

/** Strip internal _skipped / _skip_reason fields from a record */
const withoutInternalFields = (record) => {
  const { _skipped, _skip_reason, ...clean } = record;
  return clean;
};

/**
 * Extract unique non-empty values for a mapped CRM field from all CSV rows.
 */
const extractUniqueValues = (rows, mapping, crmField) => {
  const csvCols = Object.entries(mapping)
    .filter(([, crm]) => crm === crmField)
    .map(([col]) => col);

  if (csvCols.length === 0) return [];

  const seen = new Set();
  for (const row of rows) {
    for (const col of csvCols) {
      const val = (row[col] || '').toString().trim();
      if (val) seen.add(val);
    }
  }
  return [...seen];
};

/**
 * Maps a single raw CSV row to a CRM record programmatically.
 */
const mapRowProgrammatically = (row, headerMap, statusMap, sourceMap) => {
  const crm = {
    created_at: null,
    name: null,
    email: null,
    country_code: null,
    mobile_without_country_code: null,
    company: null,
    city: null,
    state: null,
    country: null,
    lead_owner: null,
    crm_status: null,
    crm_note: null,
    data_source: null,
    possession_time: null,
    description: null,
  };

  const extraNotes = [];

  for (const [csvCol, crmField] of Object.entries(headerMap)) {
    const rawVal = (row[csvCol] || '').toString().trim();
    if (!rawVal) continue;

    if (crmField === 'email') {
      if (!crm.email) {
        crm.email = EMAIL_REGEX.test(rawVal.toLowerCase()) ? rawVal.toLowerCase() : null;
      } else {
        extraNotes.push(`Alt email: ${rawVal}`);
      }
    } else if (crmField === 'mobile_without_country_code') {
      if (!crm.mobile_without_country_code) {
        crm.mobile_without_country_code = cleanPhone(rawVal);
      } else {
        extraNotes.push(`Alt phone: ${rawVal}`);
      }
    } else if (crmField === 'crm_status') {
      const normalized = statusMap[rawVal];
      if (normalized && CRM_STATUSES.includes(normalized)) {
        crm.crm_status = normalized;
      }
    } else if (crmField === 'data_source') {
      const normalized = sourceMap[rawVal];
      if (normalized && DATA_SOURCES.includes(normalized)) {
        crm.data_source = normalized;
      }
    } else if (crmField === 'created_at') {
      crm.created_at = parseDate(rawVal);
    } else if (crmField === 'crm_note') {
      extraNotes.push(rawVal);
    } else if (crmField in crm) {
      if (!crm[crmField]) crm[crmField] = rawVal;
    }
  }

  if (extraNotes.length > 0) {
    const existingNote = crm.crm_note || '';
    crm.crm_note = [existingNote, ...extraNotes].filter(Boolean).join(' | ').replace(/\n/g, '\\n');
  }

  if (crm.mobile_without_country_code && crm.country_code) {
    crm.mobile_without_country_code = stripCountryCode(
      crm.mobile_without_country_code,
      crm.country_code
    );
  }

  if (crm.country_code && !crm.country_code.startsWith('+')) {
    crm.country_code = `+${crm.country_code}`;
  }

  const hasEmail = crm.email && EMAIL_REGEX.test(crm.email);
  const hasPhone = crm.mobile_without_country_code && crm.mobile_without_country_code.length >= 7;
  
  if (!hasEmail && !hasPhone) {
    return { record: crm, skipped: true, skipReason: 'No valid email or mobile number found' };
  }

  return { record: crm, skipped: false, skipReason: null };
};

module.exports = {
  EMAIL_REGEX,
  withoutInternalFields,
  extractUniqueValues,
  mapRowProgrammatically,
};
