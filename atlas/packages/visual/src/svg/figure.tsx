/**
 * Figure wrapper (VISUAL_GRAMMAR §4, §6, §7; UI_UX §52): every figure is a
 * numbered, titled, captioned, sourced research object with a text
 * equivalent. Anatomy:
 *
 *   <figure class="vg-figure vg-figure--{kind} vg-place--{placement} [has-states has-lit]"
 *           id data-figure data-figure-kind [data-states]>
 *     header   "Figure 5.3" (small-caps sans, domain) · title (serif) · [state label]
 *     body     the visual (a focusable scroll region for SVG kinds, which never shrink below 80 %)
 *     [state note]
 *     <figcaption> caption · source line (mono: EVIDENCE · sources) · context · <details> text equivalent
 *
 * Live instruments (spec.states non-empty): `data-states` carries the states
 * as JSON with their values precomputed (`resolveFigureStates`), the header
 * holds `<span class="vg-state__label" data-vg-state-label>`, and a
 * `<p class="vg-state__note" data-vg-state-note aria-live="polite">` follows
 * the body. The server render applies states[0], so the no-JS view is the
 * first state.
 *
 * Figures are separated by hairline rules, never boxed.
 */
import type { ComponentChildren, JSX } from 'preact';
import { EVIDENCE_CLASS, type CompiledFigure, type FigureSpec, type PerformanceContext } from '@atlas/core';
import { calculatorDefaults } from '../figure-math.ts';
import { resolveFigureStates } from '../state.ts';
import { CalculatorView } from './calculator.tsx';
import { ChartView } from './chart.tsx';
import { CompareView } from './compare.tsx';
import { HierarchyView } from './hierarchy.tsx';
import { LineageView } from './lineage.tsx';
import { MatrixView } from './matrix.tsx';
import { MemoryStackView } from './memory-stack.tsx';
import { SceneSvg } from './scene.tsx';
import { StatPanelView } from './stat-panel.tsx';
import { SystemsTraceTable } from './systems.tsx';
import { TensorFlowView } from './tensor.tsx';
import { cls, NO_STATE, safeId, type StateView } from './util.ts';

export interface FigureBodyProps {
  readonly figure: CompiledFigure;
  /** Pre-rendered KaTeX HTML for a calculator's `tex` (trusted compiler output). */
  readonly texHtml?: string | undefined;
  /** Resolves atlas node ids (lineage entries, compare columns) to URLs. */
  readonly nodeHref?: ((id: string) => string | null) | undefined;
}

const SCROLLED_KINDS: ReadonlySet<FigureSpec['kind']> = new Set<FigureSpec['kind']>(['diagram', 'cycle', 'chart', 'matrix']);

const CONTEXT_FIELDS: readonly (readonly [keyof PerformanceContext, string])[] = [
  ['hardware', 'hardware'],
  ['model', 'model'],
  ['precision', 'precision'],
  ['sequenceLength', 'sequence length'],
  ['ioDistribution', 'input/output'],
  ['concurrency', 'concurrency'],
  ['runtimeVersion', 'runtime'],
  ['measurementBoundary', 'measured'],
];

/** The state a figure is first drawn in: states[0] (lit parts and variable overrides), or none. */
export function initialState(spec: FigureSpec): StateView {
  const first = spec.states[0];
  if (first === undefined) return NO_STATE;
  return { lit: new Set(first.highlight), overrides: first.variables ?? null };
}

/** The visual alone, dispatched on `spec.kind`. Calculators render statically (the island supplies interactivity). */
export function FigureBody({ figure, texHtml, nodeHref }: FigureBodyProps): JSX.Element {
  const spec: FigureSpec = figure.spec;
  const prefix = safeId(figure.anchor);
  const state = initialState(spec);
  switch (spec.kind) {
    case 'diagram':
    case 'cycle':
      return figure.scene === null ? (
        <p class="vg-fallback">Layout unavailable; see the text description below.</p>
      ) : (
        <SceneSvg scene={figure.scene} title={spec.title} desc={spec.alt} idPrefix={prefix} state={state} ordinals={spec.kind === 'cycle'} />
      );
    case 'tensor-flow':
      return <TensorFlowView spec={spec.spec} state={state} />;
    case 'systems-trace':
      return <SystemsTraceTable spec={spec.spec} caption={spec.title} state={state} />;
    case 'memory-stack':
      return <MemoryStackView spec={spec.spec} state={state} />;
    case 'calculator':
      return <CalculatorView spec={spec.spec} values={{ ...calculatorDefaults(spec.spec), ...(state.overrides ?? {}) }} idPrefix={prefix} state={state} {...(texHtml === undefined ? {} : { texHtml })} />;
    case 'stat-panel':
      return <StatPanelView spec={spec.spec} state={state} />;
    case 'lineage':
      return <LineageView spec={spec.spec} nodeHref={nodeHref} state={state} />;
    case 'matrix':
      return <MatrixView spec={spec.spec} title={spec.title} desc={spec.alt} idPrefix={prefix} />;
    case 'chart':
      return <ChartView spec={spec.spec} title={spec.title} desc={spec.alt} idPrefix={prefix} placement={figure.placement} state={state} />;
    case 'hierarchy':
      return <HierarchyView spec={spec.spec} caption={spec.title} state={state} />;
    case 'compare':
      return <CompareView spec={spec.spec} nodeHref={nodeHref} state={state} />;
  }
}

function SourceLine({ figure }: { readonly figure: CompiledFigure }): JSX.Element {
  return (
    <p class="vg-figure__source">
      <span class={cls('vg-ev', `vg-ev--${EVIDENCE_CLASS[figure.evidence]}`)}>{figure.evidence}</span>
      {figure.sources.map((source) => (
        <span class="vg-figure__src" key={source}>
          <span class="vg-sep" aria-hidden="true">
            {' · '}
          </span>
          {source}
        </span>
      ))}
    </p>
  );
}

function ContextLine({ context }: { readonly context: PerformanceContext }): JSX.Element {
  return (
    <dl class="vg-figure__context">
      {CONTEXT_FIELDS.map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{context[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

function TextEquivalent({ text }: { readonly text: string }): JSX.Element {
  const paragraphs = text.split(/\n+/u).filter((line) => line.trim() !== '');
  return (
    <details class="vg-text">
      <summary>Text description</summary>
      <div class="vg-text__body">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </details>
  );
}

export interface FigureFrameProps {
  readonly figure: CompiledFigure;
  /** The visual; web-blocks passes a hydrated island here (e.g. the calculator). */
  readonly children?: ComponentChildren;
}

/** The figure chrome (number, title, caption, source, context, text equivalent) around `children`. */
export function FigureFrame({ figure, children }: FigureFrameProps): JSX.Element {
  const spec = figure.spec;
  // SVG figures scroll instead of shrinking past legibility (see util.widthClass); tables scroll inside their own region.
  const scroll = figure.placement !== 'rail' && SCROLLED_KINDS.has(spec.kind);
  const states = spec.states.length > 0 ? resolveFigureStates(spec) : [];
  const first = states[0];
  const lit = first !== undefined && first.highlight.length > 0;
  return (
    <figure
      class={cls('vg-figure', `vg-figure--${spec.kind}`, `vg-place--${figure.placement}`, first !== undefined && 'has-states', lit && 'has-lit')}
      id={figure.anchor}
      data-figure={figure.id}
      data-figure-kind={spec.kind}
      data-figure-origin={figure.origin}
      data-states={first === undefined ? undefined : JSON.stringify(states)}
    >
      <header class="vg-figure__head">
        {figure.number !== null && <span class="vg-figure__num">Figure {figure.number}</span>}
        <span class="vg-figure__title">{spec.title}</span>
        {first !== undefined && (
          <span class="vg-state__label" data-vg-state-label>
            {first.label ?? ''}
          </span>
        )}
      </header>
      {scroll ? (
        <div class="vg-figure__body vg-scroll" role="region" aria-label={spec.title} tabIndex={0}>
          {children}
        </div>
      ) : (
        <div class="vg-figure__body">{children}</div>
      )}
      {first !== undefined && (
        <p class="vg-state__note" data-vg-state-note aria-live="polite">
          {first.note ?? ''}
        </p>
      )}
      <figcaption class="vg-figure__caption">
        <p class="vg-figure__captext">{spec.caption}</p>
        <SourceLine figure={figure} />
        {spec.context !== undefined && <ContextLine context={spec.context} />}
        <TextEquivalent text={figure.text} />
      </figcaption>
    </figure>
  );
}

export interface FigureProps extends FigureBodyProps {
  /** Replaces the default visual (e.g. `<Calculator client:visible figure={f} />`). */
  readonly children?: ComponentChildren;
}

/** A complete figure: chrome plus the kind-specific visual. Zero client JS. */
export function Figure({ figure, texHtml, nodeHref, children }: FigureProps): JSX.Element {
  return (
    <FigureFrame figure={figure}>
      {children ?? <FigureBody figure={figure} texHtml={texHtml} nodeHref={nodeHref} />}
    </FigureFrame>
  );
}
