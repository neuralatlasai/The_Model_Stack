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
import { useEffect, useState } from 'preact/hooks';
import { formatValue, type CalculatorSpec } from '@atlas/core';
import { evaluateCalculator, formatInputValue, sliderModel } from '../figure-math.ts';
import { cls, figureInstanceName, fracStyle, litClass, NO_STATE, safeId, type StateView } from './util.ts';

export interface CalculatorViewProps {
  readonly spec: CalculatorSpec;
  /** Current input values by symbol; missing symbols fall back to their defaults. */
  readonly values: Readonly<Record<string, number>>;
  /** Called with the new value when a control changes. Absent → static render (controls disabled). */
  readonly onInput?: (symbol: string, value: number) => void;
  /** Optional precise-value control. Returns the accepted value after domain normalization. */
  readonly onExactInput?: (symbol: string, value: number) => number | null;
  /** Explicit reset also discards unfinished edits whose accepted value did not change. */
  readonly resetEpoch?: number;
  /** Reserve precise-control geometry even before client callbacks are ready. */
  readonly precise?: boolean;
  /** Unique per page (the figure anchor); prefixes control ids and radio-group names. */
  readonly idPrefix: string;
  readonly title?: string | undefined;
  /** Pre-rendered KaTeX HTML for `spec.tex` (trusted compiler output). Falls back to the TeX source. */
  readonly texHtml?: string;
  /** Live-instrument state (lit rows). */
  readonly state?: StateView;
}

interface ExactValueInputProps {
  readonly input: CalculatorSpec['inputs'][number];
  readonly value: number;
  readonly id: string;
  readonly disabled: boolean;
  readonly resetEpoch: number;
  readonly onCommit?: (symbol: string, value: number) => number | null;
}

/** An unfinished edit is distinct from the accepted calculator state. */
function ExactValueInput({ input, value, id, disabled, resetEpoch, onCommit }: ExactValueInputProps): JSX.Element {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value, resetEpoch]);
  const commit = (control: HTMLInputElement): void => {
    if (!control.validity.valid || !Number.isFinite(control.valueAsNumber)) return;
    const accepted = onCommit?.(input.symbol, control.valueAsNumber);
    setDraft(String(accepted ?? value));
  };
  return (
    <div class="vg-calc__exact">
      <label for={id}>Exact value</label>
      <input
        class="vg-calc__exact-input"
        id={id}
        type="number"
        aria-label={'Exact value: ' + input.label}
        aria-describedby={id + '-help'}
        min={input.min}
        max={input.max}
        step={
          input.scale === 'log2' || input.scale === 'log10'
            ? 'any'
            : (input.step ?? (['integer', 'tokens', 'params'].includes(input.format) ? 1 : 'any'))
        }
        required
        value={draft}
        disabled={disabled}
        onInput={(event) => {
          setDraft(event.currentTarget.value);
        }}
        onChange={(event) => {
          commit(event.currentTarget);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(String(value));
          } else if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget);
          }
        }}
      />
      <span
        class={cls('vg-calc__exact-help', input.format === 'percent' && 'vg-calc__exact-help--units')}
        id={id + '-help'}
      >
        {input.format === 'percent' ? (
          <>
            Enter a fraction from {input.min} to {input.max}; 0.5 represents 50%.
          </>
        ) : (
          <>
            Enter {['integer', 'tokens', 'params'].includes(input.format) ? 'a whole number' : 'a number'} from{' '}
            {input.min} to {input.max} in the labeled units.
          </>
        )}
        {input.scale === 'log2' && ' Values snap to powers of two.'}
        {input.step !== undefined && ' Use increments of ' + String(input.step) + '.'}
        {' Press Escape to restore the applied value.'}
      </span>
    </div>
  );
}

export function CalculatorView({
  spec,
  values,
  onInput,
  onExactInput,
  resetEpoch = 0,
  precise = false,
  idPrefix,
  title,
  texHtml,
  state = NO_STATE,
}: CalculatorViewProps): JSX.Element {
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
          <div
            class="vg-calc__tex"
            role="region"
            aria-label={`${spec.equation === undefined ? 'Calculator equation' : `Equation ${spec.equation}`} for ${figureInstanceName(idPrefix, title)}`}
            tabIndex={0}
            dangerouslySetInnerHTML={{ __html: texHtml }}
          />
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
              <fieldset
                class={cls('vg-calc__field', 'vg-calc__field--options', litClass(state, input.symbol))}
                data-vg-key={input.symbol}
                key={input.symbol}
                disabled={!interactive}
              >
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
            <div
              class={cls('vg-calc__field', litClass(state, input.symbol))}
              data-vg-key={input.symbol}
              data-vg-frac={input.symbol}
              style={fracStyle(frac)}
              key={input.symbol}
            >
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
              {precise && (
                <ExactValueInput
                  input={input}
                  value={value}
                  id={id + '-exact'}
                  disabled={!interactive}
                  resetEpoch={resetEpoch}
                  {...(onExactInput === undefined ? {} : { onCommit: onExactInput })}
                />
              )}
            </div>
          );
        })}
      </div>

      <output class="vg-calc__outputs" aria-live="polite" for={controlIds.join(' ')}>
        {outputs.map((output) => (
          <span
            class={cls('vg-calc__out', output.emphasis && 'vg-calc__out--emph', litClass(state, output.symbol))}
            key={output.symbol}
            data-symbol={output.symbol}
            data-vg-key={output.symbol}
          >
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
