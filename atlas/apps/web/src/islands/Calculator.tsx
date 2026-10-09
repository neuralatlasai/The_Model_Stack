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
import { calculatorSweep } from '../client/calculator-sweep.ts';
import ResearchChart from './ResearchChart.tsx';

export interface CalculatorProps {
  readonly figure: CompiledFigure;
  /** Server-rendered KaTeX for the calculator's TeX (trusted compiler/build output), if the host has it. */
  readonly texHtml?: string;
  /** Chapter30–39 instruments include a formula-derived sensitivity plot. */
  readonly explore?: boolean;
}

export default function Calculator({ figure, texHtml, explore = false }: CalculatorProps): JSX.Element | null {
  const spec: CalculatorSpec | null = figure.spec.kind === 'calculator' ? figure.spec.spec : null;
  const model = useMemo(() => (spec === null ? null : createCalculatorModel(spec)), [spec]);
  const [values, setValues] = useState<Record<string, number>>(() => ({ ...(model?.defaults ?? {}) }));
  const [inputSymbol, setInputSymbol] = useState(() => spec?.inputs[0]?.symbol ?? '');
  const [outputSymbol, setOutputSymbol] = useState(
    () => spec?.outputs.find((output) => output.emphasis)?.symbol ?? spec?.outputs[0]?.symbol ?? '',
  );
  const [interaction, setInteraction] = useState(0);
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    if (interaction === 0) return undefined;
    const timer = setTimeout(() => {
      setSettled(interaction);
    }, 200);
    return () => {
      clearTimeout(timer);
    };
  }, [interaction]);
  const sweep = useMemo(
    () =>
      explore && spec !== null && model !== null
        ? calculatorSweep(spec, model, values, inputSymbol, outputSymbol)
        : null,
    [explore, spec, model, values, inputSymbol, outputSymbol],
  );

  const onInput = useCallback(
    (symbol: string, value: number): void => {
      if (model === null) return;
      const next = model.normalise(symbol, value);
      if (next === null) return;
      setValues((previous) => (previous[symbol] === next ? previous : { ...previous, [symbol]: next }));
      if (explore) setInteraction((previous) => previous + 1);
    },
    [model, explore],
  );
  const reset = useCallback((): void => {
    if (model !== null) setValues({ ...model.defaults });
    if (explore) setInteraction((previous) => previous + 1);
  }, [model, explore]);
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
    return () => {
      host.removeEventListener(FIGURE_STATE_EVENT, onState);
    };
  }, [model, figure.spec.id]);

  if (spec === null || model === null) return null;
  const undefinedOutputs = results.filter((result) => result.value === null);
  const atDefaults = model.isAtDefaults(values);

  return (
    <div
      class={`cx-calc${explore ? ' sc-calculator' : ''}`}
      data-calculator={figure.id}
      data-adjusting={explore && interaction !== settled ? 'true' : undefined}
      ref={rootRef}
    >
      {explore && (
        <p class="sc-calculator__intro">
          Adjust the controls to trace the equation.{' '}
          <span>{atDefaults ? 'Authored defaults' : 'Modified settings'}</span>
        </p>
      )}
      <div class="sc-calculator__controls">
        <CalculatorView
          spec={spec}
          values={values}
          onInput={onInput}
          idPrefix={figure.anchor}
          state={{ lit: new Set(explore ? [inputSymbol, outputSymbol] : []), overrides: null }}
          {...(texHtml === undefined ? {} : { texHtml })}
        />
        <div class="cx-calc__foot">
          <button
            type="button"
            class="cx-calc__reset"
            onClick={reset}
            disabled={atDefaults}
            aria-label={`Reset ${figure.spec.title} to its default values`}
          >
            Reset to defaults
          </button>
          {undefinedOutputs.length > 0 && (
            <p class="cx-calc__note" role="status">
              Undefined at these values: {undefinedOutputs.map((result) => result.label).join(', ')}.
            </p>
          )}
        </div>
      </div>
      {explore && sweep !== null && (
        <section class="sc-sensitivity" aria-label="Calculator sensitivity exploration">
          <header class="sc-sensitivity__head">
            <h3>Explore the response</h3>
            <div class="sc-sensitivity__choices">
              <label for={`${figure.anchor}-sweep-input`}>
                Vary
                <select
                  id={`${figure.anchor}-sweep-input`}
                  value={inputSymbol}
                  onChange={(event) => {
                    setInputSymbol(event.currentTarget.value);
                    setInteraction((previous) => previous + 1);
                  }}
                >
                  {spec.inputs.map((input) => (
                    <option key={input.symbol} value={input.symbol}>
                      {input.label}
                    </option>
                  ))}
                </select>
              </label>
              <label for={`${figure.anchor}-sweep-output`}>
                Observe
                <select
                  id={`${figure.anchor}-sweep-output`}
                  value={outputSymbol}
                  onChange={(event) => {
                    setOutputSymbol(event.currentTarget.value);
                    setInteraction((previous) => previous + 1);
                  }}
                >
                  {spec.outputs.map((output) => (
                    <option key={output.symbol} value={output.symbol}>
                      {output.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>
          <ResearchChart
            spec={sweep.chart}
            title={`Sensitivity of ${outputSymbol} to ${inputSymbol}`}
            desc="Formula evaluations at legal input settings. The remaining controls are held either at their authored defaults or at the selected values; the current setting is evaluated exactly."
            idPrefix={`${figure.anchor}-sweep`}
            compact
          />
          <p class="sc-sensitivity__note">
            Calculated from this equation; remaining controls held fixed.{' '}
            {sweep.chart.type === 'scatter' ? 'Points show sampled legal settings.' : 'Lines connect sampled settings.'}{' '}
            {sweep.omitted > 0 ? `${sweep.omitted} undefined evaluations omitted; no line bridges them.` : ''}
          </p>
        </section>
      )}
    </div>
  );
}
