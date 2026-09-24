/**
 * Memory stack (VISUAL_GRAMMAR §5.4) in the AI 2040 block-glyph manner:
 * each bar is a row of flat blocks separated by paper gaps, numbered in
 * stacking order; one dashed budget rule crosses every bar; the legends repeat
 * the numbers with dotted leaders, values, and shares in mono.
 *
 * HTML and CSS only, so text stays at reading size on any screen and every
 * width is a CSS fraction: each keyed block carries `--vg-frac` (its share of
 * the scale — the widest bar total, or the budget when larger) and
 * `data-vg-frac="<key>"`, so a live-instrument state animates a block by
 * changing one custom property.
 *
 * Keys: block and legend row `data-vg-key="<bar label>/<segment label>"`; bar
 * head `data-vg-key="<bar label>"`; the bars container is the budget
 * (`data-vg-key="budget"`, `--vg-frac` = budget ÷ scale), and every track's
 * dashed budget mark and the budget label read that fraction by inheritance.
 * Values: `data-vg-value` on segment values, `#share` shares, bar totals, the
 * `#budget` headroom line, and the budget.
 */
import type { JSX } from 'preact';
import { formatValue, type MemoryStackSpec } from '@atlas/core';
import { evaluateMemoryStack } from '../figure-math.ts';
import { BUDGET_KEY, budgetText, memoryScale, segmentKey, shareText } from '../state.ts';
import { cls, fracStyle, litClass, NO_STATE, type StateView } from './util.ts';

const SEGMENT_STYLES = 5;

export function Swatch({ index, emphasis = false }: { readonly index: number; readonly emphasis?: boolean }): JSX.Element {
  return <span class={cls('vg-swatch', emphasis ? 'vg-seg--emph' : `vg-seg--${index % SEGMENT_STYLES}`)} aria-hidden="true" />;
}

export function MemoryStackView({ spec, state = NO_STATE }: { readonly spec: MemoryStackSpec; readonly state?: StateView }): JSX.Element {
  const values = evaluateMemoryStack(spec, state.overrides);
  const scale = memoryScale(values);
  const budget = values.budget;
  const budgetValue = budget?.value ?? null;
  const many = values.bars.length > 1;
  return (
    <div class={cls('vg-mstack', budgetValue !== null && 'vg-mstack--budget', many && 'vg-mstack--many')}>
      <div
        class={cls('vg-mstack__bars', budgetValue !== null && litClass(state, BUDGET_KEY))}
        data-vg-key={budgetValue === null ? undefined : BUDGET_KEY}
        data-vg-frac={budgetValue === null ? undefined : BUDGET_KEY}
        style={budgetValue === null ? undefined : fracStyle(budgetValue / scale)}
      >
        {budget !== null && budgetValue !== null && (
          <p class="vg-mstack__budget">
            <span class="vg-mstack__budget-label">
              <span class="vg-mstack__budget-name">{budget.label}</span>
              <span class="vg-mstack__budget-value" data-vg-value={BUDGET_KEY}>
                {formatValue(budgetValue, spec.format)}
              </span>
            </span>
          </p>
        )}
        {values.bars.map((bar, barIndex) => (
          <div class="vg-mstack__bar" key={`${barIndex}:${bar.label}`}>
            <p class={cls('vg-mstack__head', litClass(state, bar.label))} data-vg-key={bar.label}>
              <span class="vg-mstack__name">{bar.label}</span>
              <span class="vg-mstack__total">
                <span class="vg-mstack__sum" data-vg-value={bar.label}>
                  {formatValue(bar.total, spec.format)}
                </span>
                {budgetValue !== null && (
                  <span class="vg-mstack__over" data-vg-value={`${bar.label}#budget`}>
                    {budgetText(bar.total, budgetValue, spec.format)}
                  </span>
                )}
              </span>
            </p>
            <div class="vg-mstack__track" aria-hidden="true">
              {bar.segments.map((segment, index) => {
                const key = segmentKey(bar.label, segment.label);
                return (
                  <span
                    class={cls('vg-mstack__seg', `vg-seg--${index % SEGMENT_STYLES}`, litClass(state, key))}
                    data-vg-key={key}
                    data-vg-frac={key}
                    style={fracStyle(Math.max(0, segment.value ?? 0) / scale)}
                    key={index}
                  >
                    <span class="vg-mstack__ord">{index + 1}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {values.bars.map((bar, barIndex) => (
        <div class="vg-mstack__legendblock" key={`l${barIndex}:${bar.label}`}>
          {many && <p class="vg-mstack__legendhead">{bar.label}</p>}
          <ol class="vg-mstack__legend">
            {bar.segments.map((segment, index) => {
              const key = segmentKey(bar.label, segment.label);
              return (
                <li class={cls('vg-mstack__item', litClass(state, key))} data-vg-key={key} key={index}>
                  <span class="vg-mstack__ordkey" aria-hidden="true">
                    {index + 1}
                  </span>
                  <Swatch index={index} />
                  <span class="vg-mstack__seglabel">{segment.label}</span>
                  <span class="vg-leader" aria-hidden="true" />
                  <span class="vg-mstack__value" data-vg-value={key}>
                    {segment.value === null ? '—' : formatValue(segment.value, spec.format)}
                  </span>
                  <span class="vg-mstack__share" data-vg-value={`${key}#share`}>
                    {segment.value === null ? '—' : shareText(segment.value, bar.total)}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
