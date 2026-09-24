/**
 * Interaction matrix (VISUAL_GRAMMAR §5.9): square tiles, admitted pairs in
 * ink, the rest as pale tiles; highlighted cells in the domain accent with a
 * crosshair back to both axes and their tick labels lit; axis labels and ticks
 * in mono; a count line (admitted of total) and a key under the grid.
 *
 * Tiles are drawn one per cell with a paper gap when cells are large enough
 * to read individually (≥ 9 px), and as one rect per run of admitted cells
 * per row otherwise, which keeps a 64 × 64 mask to a few hundred nodes.
 */
import type { JSX } from 'preact';
import type { MatrixSpec } from '@atlas/core';
import { matrixCells, matrixSummary } from '../matrix.ts';
import { textWidth } from '../text-metrics.ts';
import { cls, hashId, r1, widthClass } from './util.ts';

const TICK_FONT = 10.5;

function tickStride(n: number): number {
  return n <= 16 ? 1 : Math.ceil(n / 8);
}

export interface MatrixViewProps {
  readonly spec: MatrixSpec;
  readonly title: string;
  readonly desc: string;
  readonly idPrefix?: string;
}

export function MatrixView({ spec, title, desc, idPrefix }: MatrixViewProps): JSX.Element {
  const prefix = idPrefix ?? `vg-mx-${hashId(`${title}|${spec.rows}|${spec.cols}|${spec.pattern}`)}`;
  const cell = Math.max(5, Math.min(26, Math.floor(320 / Math.max(spec.rows, spec.cols))));
  const tiled = cell >= 9;
  const gap = tiled ? 1.5 : 0;
  const rowTick = (i: number): string => spec.rowTicks?.[i] ?? String(i);
  const colTick = (j: number): string => spec.colTicks?.[j] ?? String(j);
  const rowStride = tickStride(spec.rows);
  const colStride = tickStride(spec.cols);
  const highlights = spec.highlight.filter((h) => h.row < spec.rows && h.col < spec.cols);
  /** Row-major on/off bitmap ('1' where the cell carries weight) for client-side cell readouts. */
  const bitmap = matrixCells(spec)
    .map((row) => row.map((value) => (value > 0 ? '1' : '0')).join(''))
    .join('');
  const litRows = new Set(highlights.map((h) => h.row));
  const litCols = new Set(highlights.map((h) => h.col));
  let widestRowTick = 0;
  for (let i = 0; i < spec.rows; i += 1) if (i % rowStride === 0 || litRows.has(i)) widestRowTick = Math.max(widestRowTick, textWidth(rowTick(i), TICK_FONT, 'mono'));
  const left = Math.ceil(24 + widestRowTick + 8);
  const top = 40;
  const gridW = spec.cols * cell;
  const gridH = spec.rows * cell;
  const width = left + gridW + 10;
  const height = top + gridH + 8;
  const cells = matrixCells(spec);
  const binary = spec.pattern !== 'explicit';
  const summary = matrixSummary(spec);

  const tiles: JSX.Element[] = [];
  cells.forEach((row, i) => {
    if (tiled) {
      row.forEach((value, j) => {
        const on = value > 0;
        tiles.push(
          <rect
            class={cls('vg-cell', on ? 'vg-cell--on' : 'vg-cell--off')}
            x={r1(left + j * cell + gap / 2)}
            y={r1(top + i * cell + gap / 2)}
            width={r1(cell - gap)}
            height={r1(cell - gap)}
            rx="1"
            ry="1"
            fill-opacity={!binary && on ? r1(Math.max(0.12, value)) : undefined}
            key={`${i}:${j}`}
          />,
        );
      });
      return;
    }
    if (binary) {
      let start = -1;
      for (let j = 0; j <= row.length; j += 1) {
        const on = (row[j] ?? 0) > 0;
        if (on && start < 0) start = j;
        if (!on && start >= 0) {
          tiles.push(<rect class="vg-cell vg-cell--on" x={left + start * cell} y={top + i * cell} width={(j - start) * cell} height={cell} key={`${i}:${start}`} />);
          start = -1;
        }
      }
    } else {
      row.forEach((value, j) => {
        if (value > 0) tiles.push(<rect class="vg-cell vg-cell--on" x={left + j * cell} y={top + i * cell} width={cell} height={cell} fill-opacity={r1(value)} key={`${i}:${j}`} />);
      });
    }
  });

  const ticks: JSX.Element[] = [];
  for (let i = 0; i < spec.rows; i += 1) {
    if (i % rowStride !== 0 && !litRows.has(i)) continue;
    ticks.push(
      <text class={cls('vg-tick', litRows.has(i) && 'vg-tick--lit')} x={left - 6} y={r1(top + i * cell + cell / 2)} text-anchor="end" dominant-baseline="central" key={`rt${i}`}>
        {rowTick(i)}
      </text>,
    );
  }
  for (let j = 0; j < spec.cols; j += 1) {
    if (j % colStride !== 0 && !litCols.has(j)) continue;
    ticks.push(
      <text class={cls('vg-tick', litCols.has(j) && 'vg-tick--lit')} x={r1(left + j * cell + cell / 2)} y={top - 6} text-anchor="middle" key={`ct${j}`}>
        {colTick(j)}
      </text>,
    );
  }

  return (
    <div class="vg-matrix">
      <svg
        class={`vg-svg vg-matrix__svg ${widthClass(width)}`}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-labelledby={`${prefix}-title ${prefix}-desc`}
        data-mx-grid={`${left} ${top} ${cell} ${spec.rows} ${spec.cols}`}
        data-mx-cells={bitmap}
        data-mx-row-label={spec.rowLabel}
        data-mx-col-label={spec.colLabel}
        data-mx-row-ticks={Array.from({ length: spec.rows }, (_, i) => rowTick(i)).join('|')}
        data-mx-col-ticks={Array.from({ length: spec.cols }, (_, j) => colTick(j)).join('|')}
      >
        <title id={`${prefix}-title`}>{title}</title>
        <desc id={`${prefix}-desc`}>{desc}</desc>
        <text class="vg-axis-label" x={r1(left)} y="12">
          {spec.colLabel}
          <tspan class="vg-axis-scale">{' →'}</tspan>
        </text>
        <text class="vg-axis-label" x="11" y={r1(top)} text-anchor="end" transform={`rotate(-90 11 ${r1(top)})`}>
          <tspan class="vg-axis-scale">{'← '}</tspan>
          {spec.rowLabel}
        </text>
        {!tiled && <rect class="vg-cell vg-cell--off" x={left} y={top} width={gridW} height={gridH} />}
        {tiles}
        {!tiled && <rect class="vg-cell-frame" x={left} y={top} width={gridW} height={gridH} />}
        {highlights.map((h) => {
          const cx = left + h.col * cell + cell / 2;
          const cy = top + h.row * cell + cell / 2;
          return (
            <g class="vg-cell-hl" key={`h${h.row}:${h.col}`}>
              <path class="vg-cell-hl__cross" d={`M${r1(left - 2)} ${r1(cy)} H${r1(cx - cell / 2)} M${r1(cx)} ${r1(top - 2)} V${r1(cy - cell / 2)}`} />
              <rect class="vg-cell vg-cell--hl" x={r1(left + h.col * cell + gap / 2)} y={r1(top + h.row * cell + gap / 2)} width={r1(cell - gap)} height={r1(cell - gap)} rx="1" ry="1" />
            </g>
          );
        })}
        {ticks}
        {/* Exploration overlay (client figure-explore.ts): row band, column band, and cell outline under the pointer. */}
        <g class="vg-mx-hover" data-mx-hover aria-hidden="true">
          <rect class="vg-mx-hover__row" x={left} y={top} width={gridW} height={cell} />
          <rect class="vg-mx-hover__col" x={left} y={top} width={cell} height={gridH} />
          <rect class="vg-mx-hover__cell" x={left} y={top} width={cell} height={cell} />
        </g>
      </svg>
      <p class="vg-matrix__foot">
        <span class="vg-matrix__count">
          {binary ? summary.admitted : summary.mass.toFixed(1)} / {summary.total}
          <span class="vg-matrix__countlabel">{binary ? ' admitted' : ' total weight'}</span>
        </span>
        <span class="vg-matrix__key" aria-hidden="true">
          <span class="vg-matrix__swatch vg-matrix__swatch--on" /> {binary ? 'admitted' : 'weight'}
          <span class="vg-matrix__swatch vg-matrix__swatch--off" /> {binary ? 'masked' : 'zero'}
          {highlights.length > 0 && (
            <>
              <span class="vg-matrix__swatch vg-matrix__swatch--hl" /> highlighted
            </>
          )}
        </span>
      </p>
      {spec.legend !== undefined && <p class="vg-matrix__legend">{spec.legend}</p>}
    </div>
  );
}
