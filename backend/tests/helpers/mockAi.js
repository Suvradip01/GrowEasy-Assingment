'use strict';

/**
 * mockAi.js
 * Shared mock factory for @google/generative-ai.
 * Used in both unit and integration tests to avoid real API calls.
 */

/**
 * Creates a mock Gemini model that returns a fixed JSON response.
 * @param {object} responseData - The JSON object to return from generateContent
 * @returns {{ generateContent: jest.fn }}
 */
const createMockModel = (responseData) => ({
  generateContent: jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify(responseData),
    },
  }),
});

/**
 * Default mock mapping discovery response.
 */
const DEFAULT_MAPPING_RESPONSE = {
  mapping: {
    Name: 'name',
    Email: 'email',
    Phone: 'mobile_without_country_code',
    'Country Code': 'country_code',
    Status: 'crm_status',
    Source: 'data_source',
    City: 'city',
    State: 'state',
    Notes: 'crm_note',
    Created: 'created_at',
  },
  confidence: 0.95,
};

/**
 * Default mock batch extraction response for 2 rows.
 */
const DEFAULT_BATCH_RESPONSE = (rows) => ({
  records: rows.map((row) => ({
    created_at: row.Created || null,
    name: row.Name || null,
    email: row.Email || null,
    country_code: row['Country Code'] || null,
    mobile_without_country_code: row.Phone || null,
    company: null,
    city: row.City || null,
    state: row.State || null,
    country: null,
    lead_owner: null,
    crm_status: row.Status || 'GOOD_LEAD_FOLLOW_UP',
    crm_note: row.Notes || null,
    data_source: row.Source || null,
    possession_time: null,
    description: null,
    _skipped: !row.Email && !row.Phone,
    _skip_reason: !row.Email && !row.Phone ? 'No email or mobile number found' : null,
  })),
});

module.exports = { createMockModel, DEFAULT_MAPPING_RESPONSE, DEFAULT_BATCH_RESPONSE };
