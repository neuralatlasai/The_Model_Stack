/**
 * Comparison table (VISUAL_GRAMMAR §5.12, UI_UX §15, §44) in booktabs form:
 * a heavy top rule, a hairline under the column heads, a heavy bottom rule,
 * no vertical rules. The evaluation axis is stated first, as the caption.
 * Rows whose values differ across the columns are set in full ink with a
 * `≠` mark (`vg-diff`); identical rows recede with `=` (`vg-same`). No row is
 * a ranking. Rows are keyed `data-vg-key="<dimension>"`.
 */
import type { JSX } from 'preact';
import type { CompareSpec } from '@atlas/core';
import { cls, litClass, NO_STATE, type StateView } from './util.ts';

export interface CompareViewProps {
  readonly spec: CompareSpec;
  readonly nodeHref?: ((id: string) => string | null) | undefined;
  readonly state?: StateView;
}

export function CompareView({ spec, nodeHref, state = NO_STATE }: CompareViewProps): JSX.Element {
  const differing = spec.rows.filter((row) => {
    const cells = spec.columns.map((column) => row.values[column.id] ?? '—');
    return !cells.every((cell) => cell === cells[0]);
  }).length;
  return (
    <div class="vg-compare-wrap">
      <p class="vg-compare__axis">
        <span class="vg-compare__axis-label">Axis</span> {spec.axis}
      </p>
      <div class="vg-table-scroll" role="region" aria-label={`Comparison: ${spec.axis}`} tabIndex={0}>
        <table class="vg-compare">
          <caption class="vg-visually-hidden">
            Comparison on the axis: {spec.axis}. {differing} of {spec.rows.length} rows differ across {spec.columns.map((column) => column.label).join(', ')}.
          </caption>
          <thead>
            <tr>
              <th scope="col" class="vg-compare__dimhead">
                dimension
              </th>
              {spec.columns.map((column) => {
                const href = column.node === undefined || nodeHref === undefined ? null : nodeHref(column.node);
                return (
                  <th scope="col" key={column.id} class="vg-compare__colhead">
                    {href === null ? column.label : <a href={href}>{column.label}</a>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, index) => {
              const cells = spec.columns.map((column) => row.values[column.id] ?? '—');
              const same = cells.every((cell) => cell === cells[0]);
              return (
                <tr class={cls('vg-compare__row', same ? 'vg-same' : 'vg-diff', litClass(state, row.dimension))} data-vg-key={row.dimension} key={`${index}:${row.dimension}`}>
                  <th scope="row" class="vg-compare__dim">
                    <span class="vg-compare__dimwrap">
                      <span class="vg-compare__mark" aria-hidden="true">
                        {same ? '=' : '≠'}
                      </span>
                      <span class="vg-compare__dimtext">
                        {row.dimension}
                        <span class="vg-visually-hidden">{same ? ' (same in every column)' : ' (differs)'}</span>
                        {row.note !== undefined && <span class="vg-compare__note">{row.note}</span>}
                      </span>
                    </span>
                  </th>
                  {cells.map((cell, k) => (
                    <td key={spec.columns[k]?.id ?? k}>{cell}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p class="vg-compare__key" aria-hidden="true">
        <span>≠ differs across columns</span>
        <span>= identical, recedes</span>
      </p>
    </div>
  );
}
