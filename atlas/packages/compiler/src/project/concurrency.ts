/**
 * Bounded-concurrency map (engineering standards §7: unbounded
 * `Promise.all(items.map(...))` is forbidden). Results keep input order, so
 * output is deterministic regardless of completion order.
 */

/** Hard ceiling for any fan-out in the compiler. */
export const MAX_CONCURRENCY = 8;

export function clampConcurrency(value: number | undefined, fallback: number): number {
  const requested = value ?? fallback;
  if (!Number.isFinite(requested)) return fallback;
  return Math.min(MAX_CONCURRENCY, Math.max(1, Math.floor(requested)));
}

/**
 * Applies `fn` to every item with at most `limit` promises in flight.
 * Rejects with the first failure (remaining workers stop picking up items)
 * and with `signal.reason` when the signal aborts.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R> | R,
  signal?: AbortSignal,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  const width = Math.min(clampConcurrency(limit, 1), Math.max(1, items.length));
  let next = 0;
  let failed = false;

  const worker = async (): Promise<void> => {
    while (!failed) {
      signal?.throwIfAborted();
      const index = next;
      next += 1;
      if (index >= items.length) return;
      try {
        // Index is in range by the check above; the non-null assertion is avoided by a typed read.
        const item = items[index] as T;
        results[index] = await fn(item, index);
      } catch (error: unknown) {
        failed = true;
        throw error;
      }
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < width; i += 1) workers.push(worker());
  // Bounded: `workers.length ≤ MAX_CONCURRENCY`.
  const settled = await Promise.allSettled(workers);
  for (const outcome of settled) {
    if (outcome.status === 'rejected') throw outcome.reason;
  }
  signal?.throwIfAborted();
  return results;
}
