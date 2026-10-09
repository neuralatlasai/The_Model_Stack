/** Structured, server-rendered equivalent of a calculator's authored defaults. */
import type { JSX } from 'preact';
import { formatValue, type CalculatorSpec } from '@atlas/core';
import {
  calculatorDefaults,
  evaluateCalculator,
  formatInputValue,
  type CalculatorOutputValue,
} from '../figure-math.ts';

export interface CalculatorDescriptionProps {
  readonly spec: CalculatorSpec;
  readonly alt: string;
  /** HTML+MathML from the host's trusted, server-side equation renderer. */
  readonly texHtml?: string | undefined;
}

function OutputRows({ outputs }: { readonly outputs: readonly CalculatorOutputValue[] }): JSX.Element {
  return (
    <dl class="vg-calc-description__rows">
      {outputs.map((output) => (
        <div key={output.symbol} data-description-output={output.symbol}>
          <dt>
            {output.label} <code>{output.symbol}</code>
            {output.emphasis && <span class="vg-calc-description__primary">Primary</span>}
          </dt>
          <dd>
            <span class="vg-calc-description__value">
              {output.value === null ? '—' : formatValue(output.value, output.format)}
            </span>
            {output.error !== null && <span class="vg-calc-description__range">Unavailable: {output.error}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CalculatorDescription({ spec, alt, texHtml }: CalculatorDescriptionProps): JSX.Element {
  const defaults = calculatorDefaults(spec);
  return (
    <div class="vg-calc-description">
      <p class="vg-calc-description__alt">{alt}</p>
      {texHtml !== undefined && (
        <div class="vg-calc-description__equation">
          <div
            class="vg-calc-description__math"
            role="region"
            aria-label={spec.equation === undefined ? 'Calculator equation' : `Equation ${spec.equation}`}
            tabIndex={0}
            dangerouslySetInnerHTML={{ __html: texHtml }}
          />
          {spec.equation !== undefined && <span class="vg-calc-description__eqno">({spec.equation})</span>}
        </div>
      )}
      <p class="vg-calc-description__heading">Inputs · authored defaults</p>
      <dl class="vg-calc-description__rows">
        {spec.inputs.map((input) => (
          <div key={input.symbol} data-description-input={input.symbol}>
            <dt>
              {input.label} <code>{input.symbol}</code>
            </dt>
            <dd>
              <span class="vg-calc-description__value">{formatInputValue(input.default, input.format)}</span>
              <span class="vg-calc-description__range">
                {input.options === undefined ? (
                  <>
                    Range {formatInputValue(input.min, input.format)}–{formatInputValue(input.max, input.format)}
                    {input.scale === 'log2' && ' · powers of two'}
                    {input.scale === 'log10' && ' · logarithmic'}
                  </>
                ) : (
                  <>Options {input.options.map((value) => formatInputValue(value, input.format)).join(', ')}</>
                )}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p class="vg-calc-description__heading">Outputs · at authored defaults</p>
      <OutputRows outputs={evaluateCalculator(spec, defaults)} />
      {spec.presets.map((preset) => (
        <div class="vg-calc-description__preset" key={preset.label}>
          <p class="vg-calc-description__heading">Preset · {preset.label}</p>
          <p class="vg-calc-description__note">Listed inputs replace their defaults; other inputs retain them.</p>
          <dl class="vg-calc-description__rows">
            {Object.entries(preset.values).map(([symbol, value]) => {
              const input = spec.inputs.find((candidate) => candidate.symbol === symbol);
              return (
                <div key={symbol}>
                  <dt>
                    {input?.label ?? symbol} <code>{symbol}</code>
                  </dt>
                  <dd class="vg-calc-description__value">{formatInputValue(value, input?.format ?? 'raw')}</dd>
                </div>
              );
            })}
          </dl>
          <OutputRows outputs={evaluateCalculator(spec, { ...defaults, ...preset.values })} />
        </div>
      ))}
    </div>
  );
}
