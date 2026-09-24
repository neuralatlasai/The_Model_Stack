/**
 * Bounded-concurrency map (engineering standards §7: no unbounded
 * `Promise.all(data.map(...))`). Results keep input order; the first
 * rejection rejects the whole call after in-flight work settles.
 */
export async function mapBounded<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`mapBounded: limit must be a positive integer, got ${String(limit)}`);
  }
  const results = new Array<R>(items.length);
  // Shared by the workers; an object so control-flow narrowing does not assume it stays null.
  const state: { next: number; failure: { readonly error: unknown } | null } = { next: 0, failure: null };

  const worker = async (): Promise<void> => {
    while (state.failure === null) {
      const index = state.next;
      state.next += 1;
      if (index >= items.length) return;
      const item = items[index] as T;
      try {
        results[index] = await task(item, index);
      } catch (error: unknown) {
        state.failure ??= { error };
      }
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(limit, items.length); i += 1) workers.push(worker());
  await Promise.all(workers);
  const { failure } = state;
  if (failure !== null) {
    throw failure.error instanceof Error ? failure.error : new Error('mapBounded: task failed', { cause: failure.error });
  }
  return results;
}
