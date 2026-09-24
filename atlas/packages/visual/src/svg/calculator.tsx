/**
 * Calculator view (VISUAL_GRAMMAR §5.5, UI_UX §16): the equation, native
 * labelled controls, and live outputs, set as an instrument. A pure view:
 * state lives in the caller (the web-client island passes `values` and
 * `onInput`). Without `onInput` it renders statically with the controls
 * disabled, so the server HTML already has the exact geometry the hydrated
 * island will have (no layout shift).
 *
 * Controls: `options` → a radio group (segmented control); `scale: log2` →
 * a range over integer exponents (values are powers of two); `log10` → a
 * range in log space; otherwise a linear range. The filled part of each track
 * is a CSS fraction (`--vg-frac` on the keyed field, `data-vg-frac="<symbol>"`). Every input row
 * and output row reads "symbol label ……… value" on one baseline, the symbol a
 * quiet mono prefix, the label ellipsised before it can push the value.
 *
 * Live-instrument keys: input fields and output rows carry
 * `data-vg-key="<symbol>"`; the displayed input value and every output value
 * is `data-vg-value="<symbol>"` holding the formatted text.
 */
import type { JSX, TargetedEvent } from 'preact';
import { formatValue, type CalculatorSpec } from '@atlas/core';
import { evaluateCalculator, formatInputValue, sliderModel } from '../figure-math.ts';
import { cls, fracStyle, litClass, NO_STATE, safeId, type StateView } from './util.ts';

export interface CalculatorViewProps {
  readonly spec: CalculatorSpec;
  /** Current input values by symbol; missing symbols fall back to their defaults. */
  readonly values: Readonly<Record<string, number>>;
  /** Called with the new value when a control changes. Absent → static render (controls disabled). */
  readonly onInput?: (symbol: string, value: number) => void;
  /** Unique per page (the figure anchor); prefixes control ids and radio-group names. */
  readonly idPrefix: string;
  /** Pre-rendered KaTeX HTML for `spec.tex` (trusted compiler output). Falls back to the TeX source. */
  readonly texHtml?: string;
  /** Live-instrument state (lit rows). */
  readonly state?: StateView;
}

export function CalculatorView({ spec, values, onInput, idPrefix, texHtml, state = NO_STATE }: CalculatorViewProps): JSX.Element {
  const interactive = onInput !== undefined;
  const prefix = safeId(idPrefix);
  const current: Record<string, number> = {};
  for (const input of spec.inputs) {
    const given = Object.hasOwn(values, input.symbol) ? values[input.symbol] : undefined;
    current[input.symbol] = given !== undefined && Number.isFinite(given) ? given : input.default;
  }
  const outputs = evaluateCalculator(spec, current);
  const controlIds = spec.inputs.map((input) => `${prefix}-in-${safeId(input.symbol)}`);

  return (
    <div class={cls('vg-calc', !interactive && 'vg-calc--static')}>
      <div class="vg-calc__eq">
        {texHtml !== undefined ? (
          <div class="vg-calc__tex" dangerouslySetInnerHTML={{ __html: texHtml }} />
        ) : (
          <code class="vg-tex">{spec.tex}</code>
        )}
        {spec.equation !== undefined && <span class="vg-calc__eqno">({spec.equation})</span>}
      </div>

      <div class="vg-calc__inputs">
        {spec.inputs.map((input, index) => {
          const id = controlIds[index] ?? `${prefix}-in-${index}`;
          const value = current[input.symbol] ?? input.default;
          const shown = formatInputValue(value, input.format);
          const head = (
            <>
              <span class="vg-calc__sym">{input.symbol}</span>
              <span class="vg-calc__label">{input.label}</span>
            </>
          );
          if (input.options !== undefined) {
            return (
              <fieldset class={cls('vg-calc__field', 'vg-calc__field--options', litClass(state, input.symbol))} data-vg-key={input.symbol} key={input.symbol} disabled={!interactive}>
                <legend class="vg-calc__legend">
                  <span class="vg-calc__fieldhead">
                    <span class="vg-calc__name">{head}</span>
                    <span class="vg-calc__val" data-vg-value={input.symbol}>
                      {shown}
                    </span>
                  </span>
                </legend>
                <div class="vg-calc__segmented">
                  {input.options.map((option) => (
                    <label class="vg-calc__option" key={option}>
                      <input
                        type="radio"
                        name={id}
                        value={String(option)}
                        checked={option === value}
                        onChange={
                          onInput === undefined
                            ? undefined
                            : () => {
                                onInput(input.symbol, option);
                              }
                        }
                      />
                      <span>{formatInputValue(option, input.format)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }
          const model = sliderModel(input);
          const span = model.max - model.min;
          const frac = span > 0 ? (model.toPosition(value) - model.min) / span : 0;
          return (
            <div class={cls('vg-calc__field', litClass(state, input.symbol))} data-vg-key={input.symbol} data-vg-frac={input.symbol} style={fracStyle(frac)} key={input.symbol}>
              <div class="vg-calc__fieldhead">
                <label class="vg-calc__name" for={id}>
                  {head}
                </label>
                <output class="vg-calc__val" for={id} data-vg-value={input.symbol}>
                  {shown}
                </output>
              </div>
              <div class="vg-calc__rangewrap">
                <span class="vg-calc__fill" aria-hidden="true" />
                <input
                  class="vg-calc__range"
                  type="range"
                  id={id}
                  min={model.min}
                  max={model.max}
                  step={model.step}
                  value={model.toPosition(value)}
                  aria-valuetext={shown}
                  disabled={!interactive}
                  onInput={
                    onInput === undefined
                      ? undefined
                      : (event: TargetedEvent<HTMLInputElement>) => {
                          onInput(input.symbol, model.toValue(Number(event.currentTarget.value)));
                        }
                  }
                />
              </div>
              <div class="vg-calc__bounds" aria-hidden="true">
                <span>{formatInputValue(model.toValue(model.min), input.format)}</span>
                <span>{formatInputValue(model.toValue(model.max), input.format)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <output class="vg-calc__outputs" aria-live="polite" for={controlIds.join(' ')}>
        {outputs.map((output) => (
          <span class={cls('vg-calc__out', output.emphasis && 'vg-calc__out--emph', litClass(state, output.symbol))} key={output.symbol} data-symbol={output.symbol} data-vg-key={output.symbol}>
            <span class="vg-calc__outlabel">
              <span class="vg-calc__sym">{output.symbol}</span>
              <span class="vg-calc__outtext">{output.label}</span>
            </span>
            <span class="vg-leader" aria-hidden="true" />
            <span class="vg-calc__value" data-vg-value={output.symbol}>
              {output.value === null ? '—' : formatValue(output.value, output.format)}
            </span>
          </span>
        ))}
      </output>

      {spec.presets.length > 0 && (
        <div class="vg-calc__presets" role="group" aria-label="Presets">
          <span class="vg-calc__presets-label" aria-hidden="true">
            presets
          </span>
          {spec.presets.map((preset) => (
            <button
              type="button"
              class="vg-calc__preset"
              key={preset.label}
              disabled={!interactive}
              onClick={
                onInput === undefined
                  ? undefined
                  : () => {
                      for (const [symbol, value] of Object.entries(preset.values)) onInput(symbol, value);
                    }
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
