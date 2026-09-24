/**
 * Reading-state persistence (UI_UX §62). localStorage is a trust boundary: a
 * value may be missing, corrupt, written by an older build, or edited by hand,
 * and the accessor itself may throw (disabled storage, sandboxed frames, quota).
 *
 * Contract: `read` parses JSON and validates with the caller's zod schema; any
 * failure returns the fallback and discards the bad value. `write` never
 * throws; when the backing store refuses, the value is kept in memory for the
 * rest of the session so the UI behaves consistently.
 *
 * Pure (no DOM globals): the backing store is injected.
 */
import type { ZodType } from 'zod';

/** The subset of the Web Storage API the store uses. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Store {
  /** Parsed and validated value, or `fallback` when absent/invalid/unreadable. */
  read<T>(key: string, schema: ZodType<T>, fallback: T): T;
  /** Like `read` but distinguishes "nothing stored" (null) from a stored value. */
  readOptional<T>(key: string, schema: ZodType<T>): T | null;
  write(key: string, value: unknown): void;
  remove(key: string): void;
  /** False once the backing store has refused an operation (values then live in memory only). */
  readonly persistent: boolean;
}

export function createStore(backing: StorageLike | null): Store {
  /** JSON text of values that could not be persisted (or everything, when there is no backing store). */
  const memory = new Map<string, string>();
  let persistent = backing !== null;

  const rawRead = (key: string): string | null => {
    const held = memory.get(key);
    if (held !== undefined) return held;
    if (backing === null) return null;
    try {
      return backing.getItem(key);
    } catch {
      persistent = false;
      return null;
    }
  };

  const discard = (key: string): void => {
    memory.delete(key);
    if (backing === null) return;
    try {
      backing.removeItem(key);
    } catch {
      persistent = false;
    }
  };

  const readOptional = <T>(key: string, schema: ZodType<T>): T | null => {
    const raw = rawRead(key);
    if (raw === null) return null;
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      discard(key);
      return null;
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      discard(key);
      return null;
    }
    return parsed.data;
  };

  return {
    read: <T>(key: string, schema: ZodType<T>, fallback: T): T => readOptional(key, schema) ?? fallback,
    readOptional,
    write: (key: string, value: unknown): void => {
      let text: string;
      try {
        text = JSON.stringify(value);
      } catch {
        return; // not serialisable (cycle, BigInt): nothing sensible to store
      }
      if (backing !== null) {
        try {
          backing.setItem(key, text);
          memory.delete(key);
          return;
        } catch {
          persistent = false;
        }
      }
      memory.set(key, text);
    },
    remove: discard,
    get persistent(): boolean {
      return persistent;
    },
  };
}

/** Resolves `window.localStorage` without throwing (the getter itself throws in some sandboxes). */
export function browserStorage(): StorageLike | null {
  try {
    const storage = globalThis.localStorage as StorageLike | undefined;
    return storage ?? null;
  } catch {
    return null;
  }
}
