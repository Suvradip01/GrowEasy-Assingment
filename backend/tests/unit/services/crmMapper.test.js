'use strict';

const { normaliseRecord, normaliseRecords } = require('../../../src/services/crmMapper');

describe('crmMapper — normaliseRecord', () => {

  // ── Email ──────────────────────────────────────────────────────────────────

  describe('email normalisation', () => {
    it('lowercases and trims email', () => {
      const result = normaliseRecord({ email: '  JOHN@Example.COM  ' });
      expect(result.email).toBe('john@example.com');
    });

    it('sets email to null when format is invalid', () => {
      const result = normaliseRecord({ email: 'not-an-email' });
      expect(result.email).toBeNull();
    });

    it('sets email to null for empty string', () => {
      const result = normaliseRecord({ email: '' });
      expect(result.email).toBeNull();
    });

    it('preserves valid email unchanged (after lowercase)', () => {
      const result = normaliseRecord({ email: 'valid@test.org' });
      expect(result.email).toBe('valid@test.org');
    });
  });

  // ── Mobile ─────────────────────────────────────────────────────────────────

  describe('mobile normalisation', () => {
    it('strips spaces, dashes, parentheses and plus from mobile', () => {
      const result = normaliseRecord({ mobile_without_country_code: '+91 98765-43210' });
      expect(result.mobile_without_country_code).toBe('9198765432');
    });

    it('strips leading country code digits when country_code matches', () => {
      const result = normaliseRecord({
        mobile_without_country_code: '919876543210',
        country_code: '+91',
      });
      expect(result.mobile_without_country_code).toBe('9876543210');
    });

    it('does NOT strip country code if remaining number is too short (< 7 digits)', () => {
      const result = normaliseRecord({
        mobile_without_country_code: '91123',
        country_code: '+91',
      });
      // 91123 → stripping 91 gives 123 (3 digits) → don't strip
      expect(result.mobile_without_country_code).toBe('91123');
    });

    it('sets mobile to null when empty after stripping', () => {
      const result = normaliseRecord({ mobile_without_country_code: '+  -' });
      expect(result.mobile_without_country_code).toBeNull();
    });

    it('leaves valid mobile unchanged', () => {
      const result = normaliseRecord({ mobile_without_country_code: '9876543210' });
      expect(result.mobile_without_country_code).toBe('9876543210');
    });
  });

  // ── Country code ───────────────────────────────────────────────────────────

  describe('country_code normalisation', () => {
    it('adds + prefix when missing', () => {
      const result = normaliseRecord({ country_code: '91' });
      expect(result.country_code).toBe('+91');
    });

    it('preserves + prefix when already present', () => {
      const result = normaliseRecord({ country_code: '+91' });
      expect(result.country_code).toBe('+91');
    });

    it('trims whitespace from country_code', () => {
      const result = normaliseRecord({ country_code: '  44  ' });
      expect(result.country_code).toBe('+44');
    });
  });

  // ── CRM Status ────────────────────────────────────────────────────────────

  describe('crm_status validation', () => {
    it.each(['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'])(
      'accepts valid status: %s',
      (status) => {
        const result = normaliseRecord({ crm_status: status });
        expect(result.crm_status).toBe(status);
      }
    );

    it('sets crm_status to null for invalid value', () => {
      const result = normaliseRecord({ crm_status: 'INVALID_STATUS' });
      expect(result.crm_status).toBeNull();
    });

    it('sets crm_status to null for empty string', () => {
      const result = normaliseRecord({ crm_status: '' });
      expect(result.crm_status).toBeNull();
    });
  });

  // ── Data source ───────────────────────────────────────────────────────────

  describe('data_source validation', () => {
    it.each(['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'])(
      'accepts valid data_source: %s',
      (source) => {
        const result = normaliseRecord({ data_source: source });
        expect(result.data_source).toBe(source);
      }
    );

    it('sets data_source to null for invalid value', () => {
      const result = normaliseRecord({ data_source: 'unknown_source' });
      expect(result.data_source).toBeNull();
    });
  });

  // ── Dates ─────────────────────────────────────────────────────────────────

  describe('created_at date normalisation', () => {
    it('converts a valid date string to ISO format', () => {
      const result = normaliseRecord({ created_at: '2026-01-15' });
      expect(result.created_at).toMatch(/^2026-01-15T/);
    });

    it('sets created_at to null for unparseable date', () => {
      const result = normaliseRecord({ created_at: 'not-a-date' });
      expect(result.created_at).toBeNull();
    });

    it('preserves ISO date strings', () => {
      const iso = '2026-05-13T14:20:48.000Z';
      const result = normaliseRecord({ created_at: iso });
      expect(result.created_at).toBe(iso);
    });
  });

  // ── String fields ─────────────────────────────────────────────────────────

  describe('string field trimming', () => {
    it('trims whitespace from name', () => {
      const result = normaliseRecord({ name: '  John Doe  ' });
      expect(result.name).toBe('John Doe');
    });

    it.each(['name', 'company', 'city', 'state', 'country', 'lead_owner', 'crm_note', 'possession_time', 'description'])(
      'sets %s to null when empty string after trim',
      (field) => {
        const result = normaliseRecord({ [field]: '   ' });
        expect(result[field]).toBeNull();
      }
    );
  });

  // ── Full record ───────────────────────────────────────────────────────────

  describe('full record normalisation', () => {
    it('normalises a complete record correctly', () => {
      const input = {
        created_at: '2026-03-10',
        name: '  Alice Brown  ',
        email: '  ALICE@CORP.COM  ',
        country_code: '1',
        mobile_without_country_code: '16543210987',
        crm_status: 'SALE_DONE',
        data_source: 'eden_park',
        crm_note: 'Deal closed',
      };

      const result = normaliseRecord(input);

      expect(result.name).toBe('Alice Brown');
      expect(result.email).toBe('alice@corp.com');
      expect(result.country_code).toBe('+1');
      expect(result.mobile_without_country_code).toBe('6543210987');
      expect(result.crm_status).toBe('SALE_DONE');
      expect(result.data_source).toBe('eden_park');
      expect(result.crm_note).toBe('Deal closed');
      expect(result.created_at).toMatch(/^2026-03-10T/);
    });

    it('handles a fully null record without throwing', () => {
      const result = normaliseRecord({});
      expect(result).toBeDefined();
    });
  });
});

// ── normaliseRecords ──────────────────────────────────────────────────────────

describe('crmMapper — normaliseRecords', () => {
  it('maps normaliseRecord over an array', () => {
    const records = [
      { email: 'A@B.COM', crm_status: 'GOOD_LEAD_FOLLOW_UP' },
      { email: 'bad-email', crm_status: 'INVALID' },
    ];
    const result = normaliseRecords(records);
    expect(result[0].email).toBe('a@b.com');
    expect(result[1].email).toBeNull();
    expect(result[1].crm_status).toBeNull();
  });

  it('returns empty array for empty input', () => {
    expect(normaliseRecords([])).toEqual([]);
  });
});
