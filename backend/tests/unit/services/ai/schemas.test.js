'use strict';

const { z } = require('zod');

// Import the schemas directly from the module
const {
  CrmRecordSchema,
  FieldMappingSchema,
  BatchExtractionSchema,
  CRM_STATUSES,
  DATA_SOURCES,
} = require('../../../../src/services/ai/schemas');

describe('AI Schemas (Zod validation)', () => {

  // ── CrmRecordSchema ────────────────────────────────────────────────────────

  describe('CrmRecordSchema', () => {
    it('accepts a fully valid CRM record', () => {
      const valid = {
        created_at: '2026-01-15',
        name: 'John Doe',
        email: 'john@example.com',
        country_code: '+91',
        mobile_without_country_code: '9876543210',
        company: 'Acme Corp',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        lead_owner: 'Agent 1',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: 'Interested in 3BHK',
        data_source: 'leads_on_demand',
        possession_time: '2027-Q1',
        description: 'Premium project lead',
      };
      expect(() => CrmRecordSchema.parse(valid)).not.toThrow();
    });

    it('accepts a record with all null fields', () => {
      const nullRecord = {
        created_at: null, name: null, email: null,
        country_code: null, mobile_without_country_code: null,
        company: null, city: null, state: null, country: null,
        lead_owner: null, crm_status: null, crm_note: null,
        data_source: null, possession_time: null, description: null,
      };
      expect(() => CrmRecordSchema.parse(nullRecord)).not.toThrow();
    });

    it('accepts an empty object (all fields optional)', () => {
      expect(() => CrmRecordSchema.parse({})).not.toThrow();
    });

    it('rejects an invalid email format', () => {
      expect(() => CrmRecordSchema.parse({ email: 'not-an-email' })).toThrow(z.ZodError);
    });

    it('rejects an invalid crm_status value', () => {
      expect(() => CrmRecordSchema.parse({ crm_status: 'INVALID_STATUS' })).toThrow(z.ZodError);
    });

    it('rejects an invalid data_source value', () => {
      expect(() => CrmRecordSchema.parse({ data_source: 'unknown_source' })).toThrow(z.ZodError);
    });

    it.each(CRM_STATUSES)('accepts valid crm_status: %s', (status) => {
      expect(() => CrmRecordSchema.parse({ crm_status: status })).not.toThrow();
    });

    it.each(DATA_SOURCES)('accepts valid data_source: %s', (source) => {
      expect(() => CrmRecordSchema.parse({ data_source: source })).not.toThrow();
    });

    it('accepts _skipped and _skip_reason fields', () => {
      expect(() =>
        CrmRecordSchema.parse({ _skipped: true, _skip_reason: 'No mobile or email' })
      ).not.toThrow();
    });
  });

  // ── FieldMappingSchema ────────────────────────────────────────────────────

  describe('FieldMappingSchema', () => {
    it('accepts a valid field mapping response', () => {
      const valid = {
        mapping: { Name: 'name', Email: 'email', Phone: 'mobile_without_country_code' },
        confidence: 0.95,
      };
      expect(() => FieldMappingSchema.parse(valid)).not.toThrow();
    });

    it('rejects when confidence is greater than 1', () => {
      expect(() => FieldMappingSchema.parse({ mapping: {}, confidence: 1.5 })).toThrow(z.ZodError);
    });

    it('rejects when confidence is less than 0', () => {
      expect(() => FieldMappingSchema.parse({ mapping: {}, confidence: -0.1 })).toThrow(z.ZodError);
    });

    it('rejects when mapping is missing', () => {
      expect(() => FieldMappingSchema.parse({ confidence: 0.8 })).toThrow(z.ZodError);
    });

    it('rejects when confidence is missing', () => {
      expect(() => FieldMappingSchema.parse({ mapping: {} })).toThrow(z.ZodError);
    });
  });

  // ── BatchExtractionSchema ─────────────────────────────────────────────────

  describe('BatchExtractionSchema', () => {
    it('accepts a valid batch with multiple records', () => {
      const valid = {
        records: [
          { name: 'Alice', email: 'alice@test.com' },
          { name: 'Bob', email: 'bob@test.com' },
        ],
      };
      expect(() => BatchExtractionSchema.parse(valid)).not.toThrow();
    });

    it('accepts an empty records array', () => {
      expect(() => BatchExtractionSchema.parse({ records: [] })).not.toThrow();
    });

    it('rejects if records is not an array', () => {
      expect(() => BatchExtractionSchema.parse({ records: 'not-an-array' })).toThrow(z.ZodError);
    });

    it('rejects if any record has an invalid crm_status', () => {
      expect(() =>
        BatchExtractionSchema.parse({ records: [{ crm_status: 'MADE_UP_STATUS' }] })
      ).toThrow(z.ZodError);
    });
  });
});
