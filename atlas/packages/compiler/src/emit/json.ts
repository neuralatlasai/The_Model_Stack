/**
 * Deterministic JSON: object keys sorted recursively (byte order), arrays kept
 * in order, `undefined` members dropped, non-finite numbers rejected. The same
 * input always serialises to the same bytes, so bundle diffs are meaningful.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function normalise(value: unknown, path: string): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`non-finite number at ${path}`);
    return value;
  }
  if (Array.isArray(value)) return value.map((item: unknown, index) => normalise(item, `${path}[${String(index)}]`));
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const member = value[key];
      if (member === undefined) continue;
      out[key] = normalise(member, `${path}.${key}`);
    }
    return out;
  }
  throw new TypeError(`unsupported JSON value (${typeof value}) at ${path}`);
}

/** Stable serialisation; `indent` 0 = compact. Always ends with a newline. */
export function stableStringify(value: unknown, indent = 0): string {
  return `${JSON.stringify(normalise(value, '$'), null, indent === 0 ? undefined : indent)}\n`;
}
