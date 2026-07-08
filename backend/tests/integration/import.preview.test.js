'use strict';

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../../src/app');

const FIXTURE_CSV = path.join(__dirname, '../helpers/fixtures/sample.csv');

describe('POST /api/v1/import/preview — integration', () => {

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('returns 200 with correct structure for a valid CSV upload', async () => {
    const res = await request(app)
      .post('/api/v1/import/preview')
      .attach('file', FIXTURE_CSV);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const data = res.body.data;
    expect(Array.isArray(data.headers)).toBe(true);
    expect(Array.isArray(data.rows)).toBe(true);
    expect(typeof data.totalRows).toBe('number');
    expect(typeof data.previewRowCount).toBe('number');
    expect(typeof data.previewRowLimit).toBe('number');
    expect(typeof data.fileName).toBe('string');
    expect(typeof data.fileSizeBytes).toBe('number');
  });

  it('returns correct headers from the fixture CSV', async () => {
    const res = await request(app)
      .post('/api/v1/import/preview')
      .attach('file', FIXTURE_CSV);

    const expectedHeaders = ['Name', 'Email', 'Phone', 'Country Code', 'Status', 'Source', 'City', 'State', 'Notes', 'Created'];
    expect(res.body.data.headers).toEqual(expectedHeaders);
  });

  it('parses the correct number of data rows', async () => {
    const res = await request(app)
      .post('/api/v1/import/preview')
      .attach('file', FIXTURE_CSV);

    // Fixture has 6 rows (1 completely empty row is skipped by PapaParse)
    expect(res.body.data.totalRows).toBeGreaterThan(0);
  });

  it('row objects have keys matching the headers', async () => {
    const res = await request(app)
      .post('/api/v1/import/preview')
      .attach('file', FIXTURE_CSV);

    const { headers, rows } = res.body.data;
    if (rows.length > 0) {
      const rowKeys = Object.keys(rows[0]);
      headers.forEach((header) => expect(rowKeys).toContain(header));
    }
  });

  // ── Error cases ─────────────────────────────────────────────────────────────

  it('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/v1/import/preview');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('returns 400 when a non-CSV file (e.g. plain .txt) is uploaded', async () => {
    const txtBuffer = Buffer.from('this is not a csv file');
    const res = await request(app)
      .post('/api/v1/import/preview')
      .attach('file', txtBuffer, { filename: 'test.txt', contentType: 'text/plain' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('handles an empty CSV (headers only) gracefully', async () => {
    const emptyBuffer = Buffer.from('Name,Email,Phone\n');
    const res = await request(app)
      .post('/api/v1/import/preview')
      .attach('file', emptyBuffer, { filename: 'empty.csv', contentType: 'text/csv' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalRows).toBe(0);
    expect(res.body.data.rows).toHaveLength(0);
    expect(res.body.data.headers).toEqual(['Name', 'Email', 'Phone']);
  });
});

// ── Health check (sanity test) ───────────────────────────────────────────────

describe('GET /api/v1/health', () => {
  it('returns 200 with status: ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('ok');
  });
});
