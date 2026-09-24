/**
 * Calculator island (UI_UX §16, VISUAL_GRAMMAR §5.5). Hydrated with
 * `client:visible`, so its JavaScript loads only when a calculator scrolls
 * into view. Holds the input values (starting at the spec defaults), clamps
 * every change to the input's domain, evaluates the outputs with core
 * `compileFormula` (compiled once per figure, evaluated in declared order),
 * and renders the pure `CalculatorView` from @atlas/visual/svg, which draws
 * the controls, presets, and the live (aria-live) outputs formatted with core
 * `formatValue`. Never throws: a non-calculator figure renders nothing, bad
 * input is clamped, and an undefined output shows "—" with a quiet note.
 */
import type { JSX } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { CalculatorSpec, CompiledFigure } from '@atlas/core';
import { CalculatorView } from '@atlas/visual/svg';
import { createCalculatorModel } from '../client/calculator-model.ts';
import { FIGURE_STATE_EVENT, type FigureStateDetail } from '../client/live-instruments.ts';

export interface CalculatorProps {
  readonly figure: CompiledFigure;
  /** Server-rendered KaTeX for the calculator's TeX (trusted compiler/build output), if the host has it. */
  readonly texHtml?: string;
}

export default function Calculator({ figure, texHtml }: CalculatorProps): JSX.Element | null {
  const spec: CalculatorSpec | null = figure.spec.kind === 'calculator' ? figure.spec.spec : null;
  const model = useMemo(() => (spec === null ? null : createCalculatorModel(spec)), [spec]);
  const [values, setValues] = useState<Record<string, number>>(() => ({ ...(model?.defaults ?? {}) }));

  const onInput = useCallback(
    (symbol: string, value: number): void => {
      if (model === null) return;
      const next = model.normalise(symbol, value);
      if (next === null) return;
      setValues((previous) => (previous[symbol] === next ? previous : { ...previous, [symbol]: next }));
    },
    [model],
  );
  const reset = useCallback((): void => {
    if (model !== null) setValues({ ...model.defaults });
  }, [model]);
  const results = useMemo(() => (model === null ? [] : model.evaluate(values)), [model, values]);

  // Live instruments (VISUAL_GRAMMAR §6.1): a region's state sets the inputs as the reader scrolls.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = rootRef.current?.closest('[data-figure]') ?? rootRef.current;
    if (host === null || model === null) return undefined;
    const onState = (event: Event): void => {
      const detail = (event as CustomEvent<FigureStateDetail>).detail;
      if (detail.figureId !== figure.spec.id) return;
      setValues((previous) => {
        const next = { ...previous };
        for (const [symbol, raw] of Object.entries(detail.variables)) {
          const value = model.normalise(symbol, raw);
          if (value !== null) next[symbol] = value;
        }
        return next;
      });
    };
    host.addEventListener(FIGURE_STATE_EVENT, onState);
    return () => { host.removeEventListener(FIGURE_STATE_EVENT, onState); };
  }, [model, figure.spec.id]);

  if (spec === null || model === null) return null;
  const undefinedOutputs = results.filter((result) => result.value === null);
  const atDefaults = model.isAtDefaults(values);

  return (
    <div class="cx-calc" data-calculator={figure.id} ref={rootRef}>
      <CalculatorView spec={spec} values={values} onInput={onInput} idPrefix={figure.anchor} {...(texHtml === undefined ? {} : { texHtml })} />
      <div class="cx-calc__foot">
        <button type="button" class="cx-calc__reset" onClick={reset} disabled={atDefaults} aria-label={`Reset ${figure.spec.title} to its default values`}>
          Reset to defaults
        </button>
        {undefinedOutputs.length > 0 && (
          <p class="cx-calc__note" role="status">
            Undefined at these values: {undefinedOutputs.map((result) => result.label).join(', ')}.
          </p>
        )}
      </div>
    </div>
  );
}
