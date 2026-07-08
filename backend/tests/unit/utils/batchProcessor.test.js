'use strict';

const { processBatches } = require('../../../src/utils/batchProcessor');

describe('batchProcessor — processBatches', () => {

  const makeItems = (count) => Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

  // ── Basic operation ────────────────────────────────────────────────────────

  it('processes all items and returns results', async () => {
    const items = makeItems(5);
    const processor = jest.fn().mockImplementation(async (batch) =>
      batch.map((item) => ({ ...item, processed: true }))
    );

    const { results, failures } = await processBatches({
      items,
      batchSize: 2,
      concurrency: 1,
      retries: 1,
      processor,
    });

    expect(results).toHaveLength(5);
    expect(failures).toHaveLength(0);
    results.forEach((r) => expect(r.processed).toBe(true));
  });

  it('returns empty results and failures for empty items array', async () => {
    const processor = jest.fn();
    const { results, failures } = await processBatches({
      items: [],
      batchSize: 10,
      concurrency: 2,
      retries: 3,
      processor,
    });

    expect(results).toHaveLength(0);
    expect(failures).toHaveLength(0);
    expect(processor).not.toHaveBeenCalled();
  });

  // ── Batching ───────────────────────────────────────────────────────────────

  it('respects batchSize by calling processor with correct chunk sizes', async () => {
    const items = makeItems(7);
    const processor = jest.fn().mockImplementation(async (batch) => batch);

    await processBatches({ items, batchSize: 3, concurrency: 1, retries: 1, processor });

    // Batches: [3, 3, 1] = 3 calls
    expect(processor).toHaveBeenCalledTimes(3);
    expect(processor.mock.calls[0][0]).toHaveLength(3);
    expect(processor.mock.calls[1][0]).toHaveLength(3);
    expect(processor.mock.calls[2][0]).toHaveLength(1);
  });

  // ── Concurrency ────────────────────────────────────────────────────────────

  it('runs batches in concurrent groups (concurrency=2)', async () => {
    const items = makeItems(6);
    const callOrder = [];
    const processor = jest.fn().mockImplementation(async (batch) => {
      callOrder.push(batch.map((i) => i.id));
      return batch;
    });

    await processBatches({ items, batchSize: 2, concurrency: 2, retries: 1, processor });

    // 3 batches total, processed in 2 concurrent groups
    expect(processor).toHaveBeenCalledTimes(3);
  });

  // ── Retries ────────────────────────────────────────────────────────────────

  it('retries a failing batch and succeeds on retry', async () => {
    const items = makeItems(2);
    let attempt = 0;
    const processor = jest.fn().mockImplementation(async (batch) => {
      attempt++;
      if (attempt === 1) throw new Error('Transient failure');
      return batch.map((i) => ({ ...i, ok: true }));
    });

    const { results, failures } = await processBatches({
      items,
      batchSize: 10,
      concurrency: 1,
      retries: 3,
      processor,
    });

    expect(failures).toHaveLength(0);
    expect(results).toHaveLength(2);
    expect(processor).toHaveBeenCalledTimes(2);
  });

  it('records permanent failures after all retries are exhausted', async () => {
    const items = makeItems(2);
    const processor = jest.fn().mockRejectedValue(new Error('Permanent failure'));

    const { results, failures } = await processBatches({
      items,
      batchSize: 10,
      concurrency: 1,
      retries: 2,
      processor,
    });

    expect(results).toHaveLength(0);
    expect(failures).toHaveLength(2); // 2 items in failed batch
    expect(failures[0].reason).toBe('Permanent failure');
    expect(processor).toHaveBeenCalledTimes(2); // 2 retries
  });

  // ── Abort ──────────────────────────────────────────────────────────────────

  it('aborts remaining batches when shouldAbort returns true', async () => {
    const items = makeItems(6);
    let callCount = 0;
    const processor = jest.fn().mockImplementation(async () => {
      callCount++;
      const err = new Error('Quota exhausted');
      err.abortRemainingBatches = true;
      throw err;
    });

    await expect(
      processBatches({
        items,
        batchSize: 2,
        concurrency: 1,
        retries: 1,
        processor,
        shouldAbort: (err) => err?.abortRemainingBatches === true,
      })
    ).rejects.toThrow('Quota exhausted');
  });

  // ── Retry delay ────────────────────────────────────────────────────────────

  it('uses provider retry delay when getRetryDelayMs is provided', async () => {
    jest.useFakeTimers();
    const items = makeItems(1);
    let attempt = 0;

    const processor = jest.fn().mockImplementation(async () => {
      attempt++;
      if (attempt === 1) throw new Error('rate limit');
      return items;
    });

    const getRetryDelayMs = jest.fn().mockReturnValue(1000);

    const promise = processBatches({
      items,
      batchSize: 10,
      concurrency: 1,
      retries: 2,
      processor,
      getRetryDelayMs,
    });

    await jest.runAllTimersAsync();
    const { results } = await promise;

    expect(getRetryDelayMs).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    jest.useRealTimers();
  });
});
