/**
 * Execution-topology hierarchy (VISUAL_GRAMMAR §5.11, UI_UX §26): levels as
 * table rows, each with its depth index, primitive glyph, label, optional
 * note, and mono capacity / bandwidth / latency columns. A spine with an
 * arrowhead at every level boundary runs through the glyph column in the
 * direction work descends (or ascends); the emphasised level carries the
 * domain rule. Rows are keyed `data-vg-key="<level label>"`.
 */
import type { JSX } from 'preact';
import type { HierarchySpec } from '@atlas/core';
import { GlyphIcon } from './glyphs.tsx';
import { cls, litClass, NO_STATE, type StateView } from './util.ts';

type Metric = 'capacity' | 'bandwidth' | 'latency';
const METRICS: readonly Metric[] = ['capacity', 'bandwidth', 'latency'];

export function HierarchyView({ spec, caption, state = NO_STATE }: { readonly spec: HierarchySpec; readonly caption: string; readonly state?: StateView }): JSX.Element {
  const metrics = METRICS.filter((metric) => spec.levels.some((level) => level[metric] !== undefined));
  const last = spec.levels.length - 1;
  return (
    <div class="vg-table-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table class={cls('vg-hier', `vg-hier--${spec.direction}`, metrics.length === 0 && 'vg-hier--bare')}>
        <caption class="vg-visually-hidden">{caption}</caption>
        <thead class={cls(metrics.length === 0 && 'vg-visually-hidden')}>
          <tr>
            <th scope="col" class="vg-hier__levelhead">
              level <span aria-hidden="true">{spec.direction === 'down' ? '↓' : '↑'}</span>
            </th>
            {metrics.map((metric) => (
              <th scope="col" class="vg-hier__metric" key={metric}>
                {metric}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.levels.map((level, index) => (
            <tr
              class={cls('vg-hier__level', level.emphasis && 'vg-hier__level--emph', index === 0 && 'vg-hier__level--first', index === last && 'vg-hier__level--last', litClass(state, level.label))}
              data-vg-key={level.label}
              key={`${index}:${level.label}`}
            >
              <th scope="row" class="vg-hier__name">
                <span class="vg-hier__namewrap">
                <span class="vg-hier__idx" aria-hidden="true">
                  {String(spec.direction === 'down' ? index : last - index).padStart(2, '0')}
                </span>
                <span class="vg-hier__glyph">
                  <GlyphIcon kind={level.kind} emphasis={level.emphasis} />
                </span>
                <span class="vg-hier__text">
                  <span class="vg-hier__label">{level.label}</span>
                  <span class="vg-visually-hidden"> ({level.kind})</span>
                  {level.note !== undefined && <span class="vg-hier__note">{level.note}</span>}
                </span>
                </span>
              </th>
              {metrics.map((metric) => (
                <td class="vg-hier__metric" key={metric}>
                  {level[metric] ?? <span class="vg-hier__none">·</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
