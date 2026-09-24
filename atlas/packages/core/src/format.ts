/**
 * Number formatting for instruments and charts. Deterministic (no locale
 * dependence) so server-rendered and client-updated values are identical.
 * Units follow the book's conventions: memory capacity in IEC binary units
 * (GiB), bandwidth and FLOP rates in SI decimal units (GB/s, TFLOP/s).
 */
import type { ValueFormat } from './visual-spec.ts';

export interface FormattedValue {
  readonly value: string;
  readonly unit: string;
}

const THIN_NBSP = ' ';
const MINUS = '−';

/** Up to `digits` significant digits, trailing zeros trimmed, typographic minus. */
export function significant(value: number, digits = 3): string {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(magnitude)));
  const fixed = magnitude.toFixed(Math.min(decimals, 10));
  const trimmed = fixed.includes('.') ? fixed.replace(/\.?0+$/u, '') : fixed;
  return value < 0 ? `${MINUS}${trimmed}` : trimmed;
}

function scaled(value: number, base: number, units: readonly string[], digits = 3): FormattedValue {
  let index = 0;
  let magnitude = Math.abs(value);
  while (magnitude >= base && index < units.length - 1) {
    magnitude /= base;
    index += 1;
  }
  const unit = units[index] ?? '';
  return { value: significant(Math.sign(value) * magnitude, digits), unit };
}

function grouped(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const text = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
  return value < 0 ? `${MINUS}${text}` : text;
}

function secondsParts(value: number): FormattedValue {
  const magnitude = Math.abs(value);
  if (magnitude === 0) return { value: '0', unit: 's' };
  if (magnitude < 1e-6) return { value: significant(value * 1e9), unit: 'ns' };
  if (magnitude < 1e-3) return { value: significant(value * 1e6), unit: 'µs' };
  if (magnitude < 1) return { value: significant(value * 1e3), unit: 'ms' };
  if (magnitude < 120) return { value: significant(value), unit: 's' };
  if (magnitude < 7200) return { value: significant(value / 60), unit: 'min' };
  if (magnitude < 172800) return { value: significant(value / 3600), unit: 'h' };
  return { value: significant(value / 86400), unit: 'd' };
}

/** Splits a value into number and unit so instrument panels can right-align numbers and set units in small caps. */
export function formatParts(value: number, format: ValueFormat): FormattedValue {
  if (!Number.isFinite(value)) return { value: '—', unit: '' };
  switch (format) {
    case 'bytes':
      return scaled(value, 1024, ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']);
    case 'bits':
      return scaled(value, 1000, ['bit', 'kbit', 'Mbit', 'Gbit', 'Tbit']);
    case 'bytes/s':
      return scaled(value, 1000, ['B/s', 'kB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s']);
    case 'flops':
      return scaled(value, 1000, ['FLOP', 'kFLOP', 'MFLOP', 'GFLOP', 'TFLOP', 'PFLOP', 'EFLOP', 'ZFLOP', 'YFLOP']);
    case 'flop/s':
      return scaled(value, 1000, ['FLOP/s', 'kFLOP/s', 'MFLOP/s', 'GFLOP/s', 'TFLOP/s', 'PFLOP/s', 'EFLOP/s']);
    case 'params':
    case 'tokens':
      return scaled(value, 1000, ['', 'K', 'M', 'B', 'T', 'Q']);
    case 'si':
      return scaled(value, 1000, ['', 'k', 'M', 'G', 'T', 'P', 'E']);
    case 'seconds':
      return secondsParts(value);
    case 'percent':
      return { value: significant(value * 100, 3), unit: '%' };
    case 'ratio':
      return { value: significant(value, 3), unit: '×' };
    case 'integer':
      return { value: grouped(value), unit: '' };
    case 'fixed1':
      return { value: value.toFixed(1).replace('-', MINUS), unit: '' };
    case 'fixed2':
      return { value: value.toFixed(2).replace('-', MINUS), unit: '' };
    case 'fixed3':
      return { value: value.toFixed(3).replace('-', MINUS), unit: '' };
    case 'raw':
      return { value: significant(value, 4), unit: '' };
  }
}

/** Single-string form: number, narrow no-break space, unit. */
export function formatValue(value: number, format: ValueFormat): string {
  const { value: number, unit } = formatParts(value, format);
  if (unit === '') return number;
  if (unit === '×') return `${number}${unit}`;
  return `${number}${THIN_NBSP}${unit}`;
}
