/**
 * Serialises data for embedding inside `<script type="application/json">` and
 * `<script type="application/ld+json">`. JSON.stringify alone is not safe in
 * HTML: a string containing `</script>` or `<!--` would terminate or corrupt
 * the element. Every `<`, `>`, `&` and the JS line terminators U+2028/U+2029
 * are emitted as `\uXXXX` escapes; they can only occur inside JSON strings, so
 * the escaped text parses back to the identical value.
 */
export function jsonForHtml(value: unknown): string {
  // The lib.d.ts signature claims `string`, but JSON.stringify genuinely
  // returns `undefined` for non-serialisable input (undefined, a function, a symbol).
  const text = JSON.stringify(value) as string | undefined;
  if (text === undefined) {
    throw new TypeError('jsonForHtml: value is not JSON-serialisable');
  }
  return text
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll(' ', '\\u2028')
    .replaceAll(' ', '\\u2029');
}
