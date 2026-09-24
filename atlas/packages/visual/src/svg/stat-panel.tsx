/**
 * Stat panel — the AI 2040 instrument (VISUAL_GRAMMAR §5.6): a bold monospace
 * header, key/value rows with right-aligned values, and an optional glyph —
 * a dot matrix (hollow, then filled in the accent) or a squarified block
 * glyph (outlined boxes sized by weight, emphasised boxes in the accent) —
 * each with a dotted-leader legend.
 *
 * Live-instrument keys: every row carries `data-vg-key="<row key>"`; a formula
 * row's value is `<span data-vg-value="<row key>">` holding the formatted value.
 * Glyph legend rows and blocks are keyed by their label.
 */
import type { JSX } from 'preact';
import { formatValue, type StatPanelSpec } from '@atlas/core';
import { allocateCells, tryEvaluate, withOverrides } from '../figure-math.ts';
import { textWidth } from '../text-metrics.ts';
import { cls, litClass, NO_STATE, r1, type StateView } from './util.ts';

const DOT_PITCH = 9;
const DOT_R = 3;

function DotMatrix({ total, filled }: { readonly total: number; readonly filled: number }): JSX.Element {
  const rows = Math.max(1, Math.ceil(total / 26));
  const cols = Math.ceil(total / rows);
  const hollow = total - filled;
  const dots: JSX.Element[] = [];
  for (let i = 0; i < total; i += 1) {
    const cx = (i % cols) * DOT_PITCH + DOT_PITCH / 2;
    const cy = Math.floor(i / cols) * DOT_PITCH + DOT_PITCH / 2;
    dots.push(<circle class={i >= hollow ? 'vg-dot vg-dot--on' : 'vg-dot vg-dot--off'} cx={r1(cx)} cy={r1(cy)} r={i >= hollow ? DOT_R + 0.35 : DOT_R} key={i} />);
  }
  const width = cols * DOT_PITCH;
  const height = rows * DOT_PITCH;
  return (
    <svg class="vg-dots" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" focusable="false">
      {dots}
    </svg>
  );
}

interface Cell {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Squarified treemap (Bruls, Huizing & van Wijk 2000): deterministic, largest first. */
function squarify(weights: readonly number[], width: number, height: number): Cell[] {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 0) return [];
  const scale = (width * height) / total;
  const items = weights.map((weight, index) => ({ index, area: Math.max(0, weight) * scale })).sort((a, b) => b.area - a.area || a.index - b.index);
  const cells: Cell[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  const worst = (row: readonly { area: number }[], side: number): number => {
    const sum = row.reduce((acc, item) => acc + item.area, 0);
    let max = 0;
    for (const item of row) {
      if (item.area <= 0) continue;
      const a = (side * side * item.area) / (sum * sum);
      max = Math.max(max, a, 1 / a);
    }
    return max;
  };
  let row: { index: number; area: number }[] = [];
  const flush = (): void => {
    const sum = row.reduce((acc, item) => acc + item.area, 0);
    if (sum <= 0) return;
    if (w >= h) {
      const colW = sum / h;
      let cy = y;
      for (const item of row) {
        const ch = item.area / colW;
        cells.push({ index: item.index, x, y: cy, w: colW, h: ch });
        cy += ch;
      }
      x += colW;
      w -= colW;
    } else {
      const rowH = sum / w;
      let cx = x;
      for (const item of row) {
        const cw = item.area / rowH;
        cells.push({ index: item.index, x: cx, y, w: cw, h: rowH });
        cx += cw;
      }
      y += rowH;
      h -= rowH;
    }
    row = [];
  };
  for (const item of items) {
    const side = Math.min(w, h);
    if (row.length === 0 || worst([...row, item], side) <= worst(row, side)) {
      row.push(item);
    } else {
      flush();
      row.push(item);
    }
  }
  flush();
  return cells.sort((a, b) => a.index - b.index);
}

const BLOCK_W = 300;
const BLOCK_H = 92;
const BLOCK_GAP = 2;
const BLOCK_FONT = 10;

function BlockGlyph({ items, state }: { readonly items: readonly { readonly label: string; readonly weight: number; readonly emphasis: boolean }[]; readonly state: StateView }): JSX.Element {
  const cells = squarify(
    items.map((item) => item.weight),
    BLOCK_W,
    BLOCK_H,
  );
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  return (
    <svg class="vg-boxes" viewBox={`-1 -1 ${BLOCK_W + 2} ${BLOCK_H + 2}`} width={BLOCK_W + 2} height={BLOCK_H + 2} aria-hidden="true" focusable="false">
      {cells.map((cell) => {
        const item = items[cell.index];
        if (item === undefined) return null;
        const w = cell.w - BLOCK_GAP * 2;
        const h = cell.h - BLOCK_GAP * 2;
        // A weight too small to draw is still listed in the legend; a sliver would read as a rendering fault.
        if (w < 3 || h < 3) return null;
        const x = cell.x + BLOCK_GAP;
        const y = cell.y + BLOCK_GAP;
        const share = total > 0 ? `${Math.round((item.weight / total) * 100)}%` : '';
        const label = textWidth(item.label, BLOCK_FONT, 'mono') + 10 <= w && h >= 16;
        const showShare = h >= 16 && textWidth(share, BLOCK_FONT, 'mono') + 10 <= w && (label ? h >= 32 : true);
        return (
          <g class={cls('vg-box', item.emphasis && 'vg-box--emph', litClass(state, item.label))} data-vg-key={item.label} key={cell.index}>
            <rect class="vg-box__rect" x={r1(x)} y={r1(y)} width={r1(Math.max(1, w))} height={r1(Math.max(1, h))} rx="2.5" ry="2.5" />
            {label && (
              <text class="vg-box__label" x={r1(x + 5)} y={r1(y + 12)}>
                {item.label}
              </text>
            )}
            {showShare && (
              <text class="vg-box__share" x={r1(x + 5)} y={r1(label ? y + h - 6 : y + 12)}>
                {share}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function StatPanelView({ spec, state = NO_STATE }: { readonly spec: StatPanelSpec; readonly state?: StateView }): JSX.Element {
  const env = withOverrides(spec.variables, state.overrides);
  const glyph = spec.glyph;
  const blockTotal = glyph?.type === 'blocks' ? glyph.items.reduce((sum, item) => sum + item.weight, 0) : 0;
  const blockShares = glyph?.type === 'blocks' ? allocateCells(glyph.items.map((item) => item.weight), 100) : [];
  return (
    <div class="vg-stat">
      <p class="vg-stat__header">{spec.header}</p>
      <dl class="vg-stat__rows">
        {spec.rows.map((row, index) => {
          const formula = row.formula;
          let text = row.value ?? '—';
          if (formula !== undefined) {
            const result = tryEvaluate(formula, env);
            text = result.value === null ? '—' : formatValue(result.value, row.format);
          }
          return (
            <div class={cls('vg-stat__row', litClass(state, row.key))} data-vg-key={row.key} key={`${index}:${row.key}`}>
              <dt class="vg-stat__key">
                {row.key}
                {row.note !== undefined && <span class="vg-stat__note">{row.note}</span>}
              </dt>
              <dd class="vg-stat__value">
                <span class="vg-stat__num" data-vg-value={formula === undefined ? undefined : row.key}>
                  {text}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      {glyph?.type === 'dots' && (
        <div class="vg-stat__glyph">
          <DotMatrix total={glyph.total} filled={Math.min(glyph.filled, glyph.total)} />
          <p class="vg-stat__count">
            <span class="vg-visually-hidden">Dot matrix: </span>
            {Math.min(glyph.filled, glyph.total)} of {glyph.total} filled
          </p>
          {glyph.legend.length > 0 && (
            <ul class="vg-legendlines">
              {glyph.legend.map((entry) => (
                <li class={cls('vg-legendline', entry.marker === 'filled' && 'vg-legendline--on', litClass(state, entry.label))} data-vg-key={entry.label} key={entry.label}>
                  <span class={cls('vg-marker', entry.marker === 'filled' ? 'vg-marker--on' : 'vg-marker--off')} aria-hidden="true" />
                  <span class="vg-legendline__label">{entry.label}</span>
                  <span class="vg-leader" aria-hidden="true" />
                  <span class="vg-legendline__value">{entry.value ?? ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {glyph?.type === 'blocks' && (
        <div class="vg-stat__glyph">
          <BlockGlyph items={glyph.items} state={state} />
          <ul class="vg-legendlines">
            {glyph.items.map((item, index) => (
              <li class={cls('vg-legendline', item.emphasis && 'vg-legendline--on', litClass(state, item.label))} data-vg-key={item.label} key={`${index}:${item.label}`}>
                <span class={cls('vg-marker', 'vg-marker--box', item.emphasis ? 'vg-marker--on' : 'vg-marker--off')} aria-hidden="true" />
                <span class="vg-legendline__label">{item.label}</span>
                <span class="vg-leader" aria-hidden="true" />
                <span class="vg-legendline__value">{blockTotal > 0 ? `${blockShares[index] ?? 0} %` : '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
