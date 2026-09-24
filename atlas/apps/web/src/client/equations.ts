/**
 * Equation and tensor interplay (UI_UX §16, §54).
 *
 * - Hovering or focusing a variable row `[data-eq-var="H_kv"]` highlights the
 *   matching symbol in the displayed KaTeX equation it belongs to, and
 *   hovering a symbol in the equation highlights its row. Matching is best
 *   effort (see eq-symbols.ts); an unmatched symbol simply highlights nothing.
 * - Hovering or focusing a tensor dimension `[data-dim="T"]` highlights every
 *   token of the same symbol within the same figure or trace.
 *
 * Highlight is a class (`is-var-hit`, `is-dim-active`) only; nothing moves.
 */
import { ATTR, objectAnchor } from './contract.ts';
import { $$ } from './dom.ts';
import { cleanRendered, matchesRendered, parseSymbol, sameSymbol, type SymbolKey } from './eq-symbols.ts';
import type { PageContext } from './page.ts';

const VAR_HIT = 'is-var-hit';
/** Shared with the visual grammar's CSS (`.vg-dim.is-dim-active`). */
const DIM_HIT = 'is-dim-active';
const MAX_SCOPE_DEPTH = 6;
const GLYPH_SELECTOR = '.katex-html .mord';

export function initEquations(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  let lit: Element[] = [];

  const clear = (): void => {
    for (const element of lit) element.classList.remove(VAR_HIT, DIM_HIT);
    lit = [];
  };
  const light = (elements: readonly Element[], className: string): void => {
    clear();
    for (const element of elements) element.classList.add(className);
    lit = [...elements];
  };

  const activate = (target: EventTarget | null): void => {
    if (!(target instanceof Element)) return;
    const dim = target.closest<HTMLElement>(`[${ATTR.dim}]`);
    if (dim !== null) {
      const symbol = dim.getAttribute(ATTR.dim) ?? '';
      const scope = dim.closest(`.vg-dimscope, [${ATTR.figure}], figure, pre`) ?? dim.parentElement ?? doc.body;
      light(
        $$(`[${ATTR.dim}]`, scope).filter((token) => token.getAttribute(ATTR.dim) === symbol),
        DIM_HIT,
      );
      return;
    }
    const row = target.closest<HTMLElement>(`[${ATTR.eqVar}]`);
    if (row !== null) {
      const key = parseSymbol(row.getAttribute(ATTR.eqVar) ?? '');
      const scope = equationScopeForRow(doc, row);
      if (key === null || scope === null) {
        light([row], VAR_HIT);
        return;
      }
      light([row, ...glyphsFor(scope, key)], VAR_HIT);
      return;
    }
    const glyph = target.closest<HTMLElement>(GLYPH_SELECTOR);
    if (glyph !== null) {
      const key = renderedKey(glyph);
      const scope = key === null ? null : ancestorWith(glyph, `[${ATTR.eqVar}]`);
      if (key === null || scope === null) return;
      const rows = $$(`[${ATTR.eqVar}]`, scope).filter((candidate) => {
        const parsed = parseSymbol(candidate.getAttribute(ATTR.eqVar) ?? '');
        return parsed !== null && sameSymbol(parsed, key);
      });
      if (rows.length > 0) light([...rows, ...glyphsFor(scope, key)], VAR_HIT);
    }
  };

  const deactivate = (event: PointerEvent | FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Element && lit.some((element) => element.contains(next))) return;
    clear();
  };

  doc.addEventListener(
    'pointerover',
    (event) => {
      activate(event.target);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener('pointerout', deactivate, { signal: ctl.signal });
  doc.addEventListener(
    'focusin',
    (event) => {
      activate(event.target);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener('focusout', deactivate, { signal: ctl.signal });
  ctl.defer(clear);
}

/** Nearest ancestor (≤ 6 levels) that contains both the row and a rendered equation; else the equation the row names. */
function equationScopeForRow(doc: Document, row: HTMLElement): Element | null {
  const local = ancestorWith(row, '.katex-html');
  if (local !== null) return local;
  const number = row.closest('[data-equation]')?.getAttribute('data-equation') ?? null;
  if (number === null) return null;
  return doc.getElementById(objectAnchor('eq', number));
}

function ancestorWith(start: Element, selector: string): Element | null {
  let node: Element | null = start.parentElement;
  for (let depth = 0; node !== null && depth < MAX_SCOPE_DEPTH; depth += 1, node = node.parentElement) {
    if (node.querySelector(selector) !== null) return node;
  }
  return null;
}

/** Base glyphs of `key` in the scope's KaTeX output, plus their subscript wrappers. */
function glyphsFor(scope: Element, key: SymbolKey): Element[] {
  const hits: Element[] = [];
  for (const glyph of $$(GLYPH_SELECTOR, scope)) {
    if (glyph.childElementCount > 0 || glyph.closest('.msupsub') !== null) continue;
    const sub = glyph.nextElementSibling?.classList.contains('msupsub') === true ? glyph.nextElementSibling.textContent : '';
    if (!matchesRendered(key, glyph.textContent, sub)) continue;
    hits.push(sub === '' ? glyph : (glyph.parentElement ?? glyph));
  }
  return hits;
}

/** The symbol a hovered glyph renders (`H` + `kv`), or null for operators, digits, and subscripts. */
function renderedKey(glyph: HTMLElement): SymbolKey | null {
  if (glyph.childElementCount > 0 || glyph.closest('.msupsub') !== null) return null;
  const base = cleanRendered(glyph.textContent);
  if (Array.from(base).length !== 1 || !/\p{L}/u.test(base)) return null;
  const next = glyph.nextElementSibling;
  // A superscript shares the `.msupsub` box and renders first (`H_{kv}^2` → "2kv"): drop leading non-letters.
  const sub = next?.classList.contains('msupsub') === true ? cleanRendered(next.textContent).replace(/^[^A-Za-z]+/u, '') : '';
  return { base, sub };
}
