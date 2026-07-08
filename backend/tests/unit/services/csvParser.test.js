'use strict';

const { parseCsvBuffer } = require('../../../src/services/csvParser');

describe('csvParser — parseCsvBuffer', () => {

  const makeBuffer = (str) => Buffer.from(str, 'utf8');

  it('parses a standard CSV into headers and rows', () => {
    const csv = 'Name,Email,Phone\nJohn,john@test.com,1234567890\nJane,jane@test.com,0987654321';
    const { headers, rows, totalRows } = parseCsvBuffer(makeBuffer(csv));

    expect(headers).toEqual(['Name', 'Email', 'Phone']);
    expect(totalRows).toBe(2);
    expect(rows[0]).toEqual({ Name: 'John', Email: 'john@test.com', Phone: '1234567890' });
    expect(rows[1]).toEqual({ Name: 'Jane', Email: 'jane@test.com', Phone: '0987654321' });
  });

  it('returns empty rows for header-only CSV', () => {
    const csv = 'Name,Email,Phone\n';
    const { headers, rows, totalRows } = parseCsvBuffer(makeBuffer(csv));

    expect(headers).toEqual(['Name', 'Email', 'Phone']);
    expect(rows).toHaveLength(0);
    expect(totalRows).toBe(0);
  });

  it('skips completely empty lines', () => {
    const csv = 'Name,Email\nJohn,john@test.com\n\n\nJane,jane@test.com';
    const { rows, totalRows } = parseCsvBuffer(makeBuffer(csv));

    expect(totalRows).toBe(2);
    expect(rows).toHaveLength(2);
  });

  it('trims whitespace from header names', () => {
    const csv = ' Name , Email , Phone \nJohn,john@test.com,123';
    const { headers } = parseCsvBuffer(makeBuffer(csv));

    expect(headers).toEqual(['Name', 'Email', 'Phone']);
  });

  it('trims whitespace from cell values', () => {
    const csv = 'Name,Email\n  John  ,  john@test.com  ';
    const { rows } = parseCsvBuffer(makeBuffer(csv));

    expect(rows[0].Name).toBe('John');
    expect(rows[0].Email).toBe('john@test.com');
  });

  it('strips UTF-8 BOM if present', () => {
    const bom = '\uFEFF';
    const csv = `${bom}Name,Email\nJohn,john@test.com`;
    const { headers } = parseCsvBuffer(makeBuffer(csv));

    // PapaParse handles BOM — check that first header doesn't start with \uFEFF
    expect(headers[0]).not.toContain('\uFEFF');
  });

  it('returns correct totalRows count', () => {
    const csv = 'Name,Email\nA,a@a.com\nB,b@b.com\nC,c@c.com\nD,d@d.com\nE,e@e.com';
    const { totalRows } = parseCsvBuffer(makeBuffer(csv));
    expect(totalRows).toBe(5);
  });

  it('handles CSV with quoted fields containing commas', () => {
    const csv = 'Name,Note\n"Smith, John","A note, with comma"';
    const { rows } = parseCsvBuffer(makeBuffer(csv));

    expect(rows[0].Name).toBe('Smith, John');
    expect(rows[0].Note).toBe('A note, with comma');
  });
});
