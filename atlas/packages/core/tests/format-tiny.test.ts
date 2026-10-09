import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatParts, formatValue, significant } from '../src/format.ts';

test('small nonzero probabilities retain significant digits instead of becoming zero', () => {
  assert.equal(significant(3.775134544136581e-11, 4), '3.775e-11');
  assert.equal(formatValue(3.775134544136581e-11, 'raw'), '3.775e-11');
  assert.equal(formatValue(-3.775134544136581e-11, 'raw'), '−3.775e-11');
  assert.deepEqual(formatParts(3.775134544136581e-11, 'ratio'), { value: '3.78e-11', unit: '×' });
  assert.equal(significant(Number.MIN_VALUE, 4), '4.941e-324');
});

test('scientific notation trims only insignificant mantissa zeroes and keeps finite boundaries', () => {
  assert.equal(significant(1e-11, 4), '1e-11');
  assert.equal(significant(1.23456e-8, 4), '1.235e-8');
  assert.equal(significant(0, 4), '0');
  assert.equal(significant(-0, 4), '0');
  assert.equal(significant(0.00000123456, 4), '0.000001235');
  assert.equal(significant(12.3456, 4), '12.35');
  assert.equal(significant(Number.NaN), '—');
  assert.equal(significant(Number.POSITIVE_INFINITY), '—');
  // Explicit fixed-decimal formats retain their declared rounding contract.
  assert.equal(formatValue(3.775134544136581e-11, 'fixed3'), '0.000');
});
