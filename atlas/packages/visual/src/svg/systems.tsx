/**
 * Systems trace (VISUAL_GRAMMAR §5.3, UI_UX §55): a semantic table, stages as
 * numbered row headers on a pipeline spine, cost columns (latency · memory ·
 * compute · communication · failure) as column headers. Emphasised stages
 * carry the domain rule and a filled stage dot. Rows are keyed
 * `data-vg-key="<stage name>"`. Wrapped in a focusable scroll region so
 * narrow screens can pan it.
 */
import type { JSX } from 'preact';
import type { SystemsTraceBlock, SystemsTraceSpec } from '@atlas/core';
import { cls, litClass, NO_STATE, type StateView } from './util.ts';

interface Row {
  readonly stage: string;
  readonly cells: readonly string[];
  readonly emphasis: boolean;
}

function TraceTable({ caption, columns, rows, state = NO_STATE }: { readonly caption: string; readonly columns: readonly string[]; readonly rows: readonly Row[]; readonly state?: StateView }): JSX.Element {
  return (
    <div class="vg-table-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table class="vg-systrace">
        <caption class="vg-visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" class="vg-systrace__stagehead">
              stage
            </th>
            {columns.map((column) => (
              <th scope="col" key={column} data-column={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              class={cls('vg-systrace__row', row.emphasis && 'vg-systrace__row--emph', index === 0 && 'vg-systrace__row--first', index === rows.length - 1 && 'vg-systrace__row--last', litClass(state, row.stage))}
              data-vg-key={row.stage}
              key={`${index}:${row.stage}`}
            >
              <th scope="row" class="vg-systrace__stage">
                <span class="vg-systrace__idx" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span class="vg-systrace__dot" aria-hidden="true" />
                <span class="vg-systrace__name">{row.stage}</span>
              </th>
              {columns.map((column, k) => {
                const value = row.cells[k] ?? '';
                return (
                  <td key={column} data-column={column} class={cls(value === '' && 'vg-systrace__empty', /^(?:none|—|-|n\/a)$/iu.test(value) && 'vg-systrace__none')}>
                    {value === '' ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span class="vg-visually-hidden">no value</span>
                      </>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Authored `systems-trace` figure. */
export function SystemsTraceTable({ spec, caption, state = NO_STATE }: { readonly spec: SystemsTraceSpec; readonly caption: string; readonly state?: StateView }): JSX.Element {
  const rows = spec.stages.map((stage) => ({
    stage: stage.name,
    cells: spec.columns.map((column) => stage.values[column] ?? ''),
    emphasis: stage.emphasis,
  }));
  return <TraceTable caption={caption} columns={spec.columns} rows={rows} state={state} />;
}

/** Compiled `Systems trace` block from the manuscript. */
export function SystemsTraceView({ block }: { readonly block: SystemsTraceBlock }): JSX.Element {
  return (
    <div class="vg-trace vg-trace--systems">
      <p class="vg-trace__title">{block.title}</p>
      <TraceTable caption={block.title} columns={block.columns} rows={block.rows.map((row) => ({ stage: row.stage, cells: row.cells, emphasis: false }))} />
    </div>
  );
}
