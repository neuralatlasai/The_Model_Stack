/**
 * Interaction-matrix patterns (VISUAL_GRAMMAR §5.9). Row i is the query /
 * source position, column j the key / target position. When the matrix is
 * wider than tall (queries at the end of a longer key sequence), causal
 * patterns align the last row with the last column.
 */
import type { MatrixSpec } from '@atlas/core';

/** Intensity of cell (i, j) in [0, 1]. */
export function matrixCell(spec: MatrixSpec, i: number, j: number): number {
  const offset = Math.max(0, spec.cols - spec.rows);
  const causal = j <= i + offset;
  const p = spec.parameter ?? 1;
  switch (spec.pattern) {
    case 'full':
      return 1;
    case 'causal':
      return causal ? 1 : 0;
    case 'banded':
      // Causal sliding window of width p: key j within the p most recent positions.
      return causal && i + offset - j < p ? 1 : 0;
    case 'block-diagonal':
      return Math.floor(i / p) === Math.floor(j / p) ? 1 : 0;
    case 'prefix':
      // Prefix LM: the first p keys are visible to every query; the rest causally.
      return j < p || causal ? 1 : 0;
    case 'dilated':
      return causal && (i + offset - j) % p === 0 ? 1 : 0;
    case 'explicit':
      return spec.cells?.[i]?.[j] ?? 0;
  }
}

export function matrixCells(spec: MatrixSpec): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < spec.rows; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < spec.cols; j += 1) row.push(matrixCell(spec, i, j));
    out.push(row);
  }
  return out;
}

export interface MatrixSummary {
  readonly total: number;
  /** Cells with intensity > 0. */
  readonly admitted: number;
  /** Sum of intensities (equals `admitted` for binary patterns). */
  readonly mass: number;
}

export function matrixSummary(spec: MatrixSpec): MatrixSummary {
  let admitted = 0;
  let mass = 0;
  for (const row of matrixCells(spec)) {
    for (const cell of row) {
      if (cell > 0) admitted += 1;
      mass += cell;
    }
  }
  return { total: spec.rows * spec.cols, admitted, mass };
}

export const MATRIX_PATTERN_TEXT: Readonly<Record<MatrixSpec['pattern'], string>> = {
  causal: 'causal: each row admits columns up to its own position',
  full: 'full: every pair admitted',
  banded: 'causal band: each row admits the most recent w columns',
  'block-diagonal': 'block-diagonal: pairs within the same block of size b',
  prefix: 'prefix: the first P columns are visible to every row, the rest causally',
  dilated: 'dilated: causal pairs whose distance is a multiple of the stride',
  explicit: 'explicit intensities',
};
