/**
 * Tensor visualisation (VISUAL_GRAMMAR §5.2, UI_UX §54): stacked shape rows
 * joined by rules that carry the operation and its cost. Every dimension
 * symbol inside a shape is a `<span data-dim="T">`; hovering one highlights
 * the same symbol everywhere in the figure (CSS `:has()` for common symbols,
 * the client script for the rest via the `is-dim-active` class).
 */
import type { JSX } from 'preact';
import type { TensorFlowSpec, TensorTraceBlock } from '@atlas/core';
import { cls, litClass, NO_STATE, type StateView } from './util.ts';

const IDENT = /[\p{L}][\p{L}\p{M}\p{N}_]*/uy;

/** Renders shape text with dimension symbols inside brackets wrapped as `data-dim` tokens. */
export function ShapeText({ text, dims }: { readonly text: string; readonly dims: ReadonlySet<string> | null }): JSX.Element {
  const parts: (string | JSX.Element)[] = [];
  let buffer = '';
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text.charAt(i);
    const prev = i > 0 ? text.charAt(i - 1) : ' ';
    if (ch === '[') {
      // An index like E[x] is not a shape.
      if (!/[\p{L}\p{N}_)]/u.test(prev) || depth > 0) depth += 1;
      buffer += ch;
      i += 1;
      continue;
    }
    if (ch === ']') {
      if (depth > 0) depth -= 1;
      buffer += ch;
      i += 1;
      continue;
    }
    if (depth > 0) {
      IDENT.lastIndex = i;
      const match = IDENT.exec(text);
      if (match !== null && match.index === i) {
        const symbol = match[0];
        if (dims === null || dims.has(symbol)) {
          if (buffer !== '') parts.push(buffer);
          buffer = '';
          parts.push(
            <span class="vg-dim" data-dim={symbol}>
              {symbol}
            </span>,
          );
        } else {
          buffer += symbol;
        }
        i += symbol.length;
        continue;
      }
    }
    buffer += ch;
    i += 1;
  }
  if (buffer !== '') parts.push(buffer);
  return <>{parts}</>;
}

/** How many times each dimension symbol occurs inside the brackets of `shape`. */
export function dimCounts(shape: string, dims: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>(dims.map((dim) => [dim, 0]));
  const inner = /\[([^\]]*)\]/u.exec(shape)?.[1] ?? '';
  for (const match of inner.matchAll(/[\p{L}][\p{L}\p{M}\p{N}_]*/gu)) {
    const symbol = match[0];
    const count = counts.get(symbol);
    if (count !== undefined) counts.set(symbol, count + 1);
  }
  return counts;
}

/** Rank of a written shape: the number of comma-separated axes. */
function rankOf(shape: string): number {
  const inner = /\[([^\]]*)\]/u.exec(shape)?.[1] ?? '';
  return inner.trim() === '' ? 0 : inner.split(',').length;
}

/**
 * The shape signature: one column per legend dimension, a filled dot where the
 * step's shape carries that dimension (a ring and a count when it carries it
 * more than once, as the score tensor carries T twice). Read down a column to
 * see where a dimension is born, split, squared, or merged away.
 */
function Signature({ counts, dims }: { readonly counts: ReadonlyMap<string, number>; readonly dims: readonly string[] }): JSX.Element {
  return (
    <span class="vg-sig" aria-hidden="true">
      {dims.map((dim) => {
        const count = counts.get(dim) ?? 0;
        return (
          <span class={cls('vg-sig__cell', 'vg-dim', count === 0 ? 'vg-sig__cell--0' : count === 1 ? 'vg-sig__cell--1' : 'vg-sig__cell--n')} data-dim={dim} key={dim}>
            {count > 1 ? <span class="vg-sig__count">{count}</span> : null}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Authored `tensor-flow` figure (UI_UX §54): a vertical pipeline. Each state is
 * a numbered tensor chip (the stacked tensor primitive, mono shape, label,
 * rank, and its shape signature); each transition between states carries the
 * operation and its cost along the spine. Steps are keyed `data-vg-key="0"`,
 * `"1"`, … for live-instrument states.
 */
export function TensorFlowView({ spec, state = NO_STATE }: { readonly spec: TensorFlowSpec; readonly state?: StateView }): JSX.Element {
  const dimList = Object.keys(spec.dims);
  const dims = new Set(dimList);
  return (
    <div class="vg-tensor vg-dimscope" style={{ '--vg-dims': String(dimList.length) }}>
      <div class="vg-tensor__sighead" aria-hidden="true">
        <span class="vg-tensor__sighead-label">shape signature</span>
        <span class="vg-sig">
          {dimList.map((dim) => (
            <span class="vg-sig__cell vg-sig__head vg-dim" data-dim={dim} key={dim}>
              {dim}
            </span>
          ))}
        </span>
      </div>
      <ol class="vg-tensor__steps">
        {spec.steps.map((step, index) => (
          <li class={cls('vg-tensor__step', index === 0 && 'vg-tensor__step--first', litClass(state, String(index)))} data-vg-key={String(index)} key={`${index}:${step.shape}`}>
            {step.op !== undefined && (
              <div class="vg-tensor__op">
                <span class="vg-tensor__opname">{step.op}</span>
                {step.cost !== undefined && <span class="vg-tensor__cost">{step.cost}</span>}
              </div>
            )}
            <div class="vg-tensor__state">
              <span class="vg-tensor__idx" aria-hidden="true">
                {String(index).padStart(2, '0')}
              </span>
              <span class="vg-tensor__chip">
                <code class="vg-tensor__shape">
                  <ShapeText text={step.shape} dims={dims} />
                </code>
              </span>
              <span class="vg-tensor__meta">
                {step.label !== undefined && <span class="vg-tensor__label">{step.label}</span>}
                <span class="vg-tensor__rank">rank {rankOf(step.shape)}</span>
              </span>
              <Signature counts={dimCounts(step.shape, dimList)} dims={dimList} />
            </div>
          </li>
        ))}
      </ol>
      <dl class="vg-tensor__legend">
        {Object.entries(spec.dims).map(([symbol, meaning]) => (
          <div class="vg-tensor__dim" key={symbol}>
            <dt>
              <code class="vg-dim" data-dim={symbol}>
                {symbol}
              </code>
            </dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Compiled `Tensor trace` block from the manuscript (CONTENT_CONTRACT §5). */
export function TensorTraceView({ block }: { readonly block: TensorTraceBlock }): JSX.Element {
  const dims = new Set(block.dims);
  return (
    <div class="vg-trace vg-dimscope">
      <p class="vg-trace__title">{block.title}</p>
      <ol class="vg-trace__lines">
        {block.lines.map((line, index) => {
          const only = line.length === 1 ? line[0] : undefined;
          if (only?.type === 'op' && /^-{3,}/u.test(only.text)) {
            return (
              <li class="vg-trace__divider" key={index}>
                <span>{only.text.replace(/^-+\s*|\s*-+$/gu, '')}</span>
              </li>
            );
          }
          return (
            <li class="vg-trace__line" key={index}>
              {line.map((segment, k) => {
                if (segment.type === 'op' && segment.text.startsWith('# ')) {
                  return (
                    <span class="vg-trace__cost" key={k}>
                      {segment.text.slice(2)}
                    </span>
                  );
                }
                const arrow = k > 0 && !(line[k - 1]?.text.startsWith('# ') ?? false);
                return (
                  <span class={cls('vg-trace__seg', `vg-trace__seg--${segment.type}`)} key={k}>
                    {arrow && (
                      <>
                        <span class="vg-trace__arrow" aria-hidden="true">
                          →
                        </span>
                        <span class="vg-visually-hidden"> then </span>
                      </>
                    )}
                    {segment.type === 'shape' ? (
                      <code class="vg-trace__shape">
                        <ShapeText text={segment.text} dims={dims} />
                      </code>
                    ) : (
                      <span class="vg-trace__op">{segment.text}</span>
                    )}
                  </span>
                );
              })}
            </li>
          );
        })}
      </ol>
      {block.dims.length > 0 && (
        <p class="vg-trace__dims">
          <span class="vg-trace__dims-label">dims</span>
          {block.dims.map((symbol) => (
            <code class="vg-dim" data-dim={symbol} key={symbol}>
              {symbol}
            </code>
          ))}
        </p>
      )}
    </div>
  );
}
