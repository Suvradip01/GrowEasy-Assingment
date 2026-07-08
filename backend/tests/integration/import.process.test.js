'use strict';

const request = require('supertest');
const path = require('path');
const app = require('../../src/app');
const { getRedisClient } = require('../../src/config/redis');

// Mock out the AI extraction module entirely
const aiExtractor = require('../../src/services/aiExtractor');
jest.mock('../../src/services/aiExtractor');

const FIXTURE_CSV = path.join(__dirname, '../helpers/fixtures/sample.csv');

describe('POST /api/v1/import/process — integration', () => {
  let redis;

  beforeAll(() => {
    redis = getRedisClient();
  });

  afterAll(async () => {
    // Flush keys and quit client to avoid keeping Jest hanging
    await redis.flushall();
    await redis.quit();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('runs the full import pipeline successfully (parses CSV, mocks AI extraction, normalises)', async () => {
    const mockSuccessRecord = {
      created_at: '2026-01-15T00:00:00.000Z',
      name: 'John Doe',
      email: 'john.doe@example.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: null,
      city: 'Bengaluru',
      state: 'Karnataka',
      country: null,
      lead_owner: null,
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note: 'Interested in 2BHK',
      data_source: 'leads_on_demand',
      possession_time: null,
      description: null,
    };

    const mockSkippedRecord = {
      reason: 'No email or mobile number found',
      data: {
        'Country Code': '+91',
        Notes: 'No email or mobile',
        Created: '2026-05-01',
      },
    };

    aiExtractor.extractCrmRecords.mockResolvedValue({
      successRecords: [mockSuccessRecord],
      skippedRecords: [mockSkippedRecord],
      fieldMapping: { Name: 'name', Email: 'email' },
      mappingConfidence: 0.95,
      extractionMode: 'ai_mapping_ai_batches',
    });

    const res = await request(app)
      .post('/api/v1/import/process')
      .attach('file', FIXTURE_CSV);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalImported).toBe(1);
    expect(res.body.data.summary.totalSkipped).toBe(1);
    expect(res.body.data.records).toHaveLength(1);
    expect(res.body.data.records[0].name).toBe('John Doe');
    expect(res.body.data.skipped).toHaveLength(1);
    expect(res.body.data.skipped[0].reason).toBe('No email or mobile number found');
  });

  // ── Error cases ─────────────────────────────────────────────────────────────

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/v1/import/process');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
