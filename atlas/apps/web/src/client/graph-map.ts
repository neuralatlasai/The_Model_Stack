/**
 * A node's Map page (pages/graph/[...slug].astro): wires and connected hover.
 *
 * - Wires are measured from the rendered boxes (so the HTML map reflows at any
 *   width) and redrawn on resize: prerequisites flow into the node ("builds
 *   on", blue), the node flows into what it enables (oxblood); dotted stems
 *   join the sibling and alternative bands. When the columns stack (narrow
 *   widths) the wires run down a spine at the left edge instead.
 * - Pointing at or focusing any node — a box in the map or a row of the text
 *   twin — lights every place that node appears, its wire, and the readout
 *   (kicker, title, one-sentence summary). Leaving restores the node's own.
 *
 * Loaded on demand from stack-explorer.ts when the map markup is present.
 */
import type { PageContext } from './page.ts';

const NS = 'http://www.w3.org/2000/svg';

interface Box {
  readonly l: number;
  readonly r: number;
  readonly t: number;
  readonly b: number;
  readonly cx: number;
  readonly cy: number;
}

export function initGraphMap(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-graph-map]');
  const field = root?.querySelector<HTMLElement>('[data-gmap-field]') ?? null;
  const svg = root?.querySelector<SVGSVGElement>('[data-gmap-wires]') ?? null;
  const center = root?.querySelector<HTMLElement>('[data-gmap-center]') ?? null;
  if (root === null || field === null || svg === null || center === null) return;
  const twin = doc.querySelector<HTMLElement>('[data-gmap-twin]');
  const readout = {
    kicker: root.querySelector<HTMLElement>('[data-gmap-rk]'),
    title: root.querySelector<HTMLElement>('[data-gmap-rt]'),
    summary: root.querySelector<HTMLElement>('[data-gmap-rs]'),
  };
  const initial = {
    kicker: readout.kicker?.textContent ?? '',
    title: readout.title?.textContent ?? '',
    summary: readout.summary?.textContent ?? '',
  };

  const boxes = [...field.querySelectorAll<HTMLElement>('[data-gmap-role]')];
  const wireOf = new Map<HTMLElement, SVGPathElement>();
  const scopes = [root, ...(twin === null ? [] : [twin])];
  const members = new Map<string, HTMLElement[]>();
  for (const scope of scopes) {
    for (const element of scope.querySelectorAll<HTMLElement>('[data-gmap-id]')) {
      if (element === center) continue;
      const key = element.dataset['gmapId'] ?? '';
      members.set(key, [...(members.get(key) ?? []), element]);
    }
  }

  // ── connected hover ──────────────────────────────────────────────────────
  let lit: string | null = null;
  const clear = (): void => {
    root.classList.remove('has-lit');
    twin?.classList.remove('has-lit');
    for (const list of members.values()) for (const element of list) element.classList.remove('is-lit');
    for (const wire of wireOf.values()) wire.classList.remove('is-hot');
  };
  const show = (kicker: string, title: string, summary: string): void => {
    if (readout.kicker !== null) readout.kicker.textContent = kicker;
    if (readout.title !== null) readout.title.textContent = title;
    if (readout.summary !== null) readout.summary.textContent = summary;
  };
  const light = (key: string): void => {
    const list = members.get(key);
    if (list === undefined) return;
    clear();
    lit = key;
    root.classList.add('has-lit');
    twin?.classList.add('has-lit');
    for (const element of list) {
      element.classList.add('is-lit');
      wireOf.get(element)?.classList.add('is-hot');
    }
    const source = list[0];
    if (source !== undefined) {
      show(
        source.dataset['gmapKicker'] ?? '',
        source.dataset['gmapTitle'] ?? '',
        source.dataset['gmapSummary'] === '' ? 'No summary is recorded for this node.' : (source.dataset['gmapSummary'] ?? ''),
      );
    }
  };
  const reset = (): void => {
    lit = null;
    clear();
    show(initial.kicker, initial.title, initial.summary);
  };
  // ── wires ────────────────────────────────────────────────────────────────
  const rect = (element: Element, origin: DOMRect): Box => {
    const r = element.getBoundingClientRect();
    const l = r.left - origin.left;
    const t = r.top - origin.top;
    return { l, r: l + r.width, t, b: t + r.height, cx: l + r.width / 2, cy: t + r.height / 2 };
  };
  const path = (d: string, className: string, marker: string | null): SVGPathElement => {
    const element = doc.createElementNS(NS, 'path');
    element.setAttribute('d', d);
    element.setAttribute('class', className);
    if (marker !== null) element.setAttribute('marker-end', `url(#${marker})`);
    svg.append(element);
    return element;
  };
  const f = (n: number): string => n.toFixed(1);

  const draw = (): void => {
    for (const old of svg.querySelectorAll('path.gmap__wire')) old.remove();
    wireOf.clear();
    const origin = field.getBoundingClientRect();
    if (origin.width === 0) return;
    const c = rect(center, origin);
    const stacked = c.l < 48;
    for (const box of boxes) {
      const role = box.dataset['gmapRole'];
      const b = rect(box, origin);
      if (role === 'up' || role === 'down') {
        let d: string;
        if (stacked) {
          const x = 7;
          d = role === 'up' ? `M${f(b.l)} ${f(b.cy)} H${f(x)} V${f(c.cy)} H${f(c.l - 1)}` : `M${f(c.l)} ${f(c.cy)} H${f(x)} V${f(b.cy)} H${f(b.l - 1)}`;
        } else if (role === 'up') {
          const mid = (b.r + c.l) / 2;
          d = `M${f(b.r)} ${f(b.cy)} C${f(mid)} ${f(b.cy)} ${f(mid)} ${f(c.cy)} ${f(c.l - 1)} ${f(c.cy)}`;
        } else {
          const mid = (c.r + b.l) / 2;
          d = `M${f(c.r)} ${f(c.cy)} C${f(mid)} ${f(c.cy)} ${f(mid)} ${f(b.cy)} ${f(b.l - 1)} ${f(b.cy)}`;
        }
        wireOf.set(box, path(d, `gmap__wire gmap__wire--${role}`, role === 'up' ? 'gmap-arrow-up' : 'gmap-arrow-down'));
      }
    }
    if (!stacked) {
      for (const band of field.querySelectorAll<HTMLElement>('[data-gmap-band]')) {
        const b = rect(band, origin);
        const above = b.b <= c.t;
        const d = above ? `M${f(c.cx)} ${f(c.t)} V${f(b.b)}` : `M${f(c.cx)} ${f(c.b)} V${f(b.t)}`;
        path(d, 'gmap__wire gmap__wire--band', null);
      }
    }
    if (lit !== null) light(lit);
  };

  let pending: (() => void) | null = null;
  const schedule = (): void => {
    pending ??= ctl.frame(() => {
      pending = null;
      draw();
    });
  };
  ctl.observe(new ResizeObserver(schedule)).observe(field);
  schedule();

  const keyFrom = (target: EventTarget | null): string | null => {
    const element = target instanceof Element ? target.closest<HTMLElement>('[data-gmap-id]') : null;
    if (element === null || element === center) return null;
    return element.dataset['gmapId'] ?? null;
  };

  for (const scope of scopes) {
    scope.addEventListener('pointerover', (event) => {
      const key = keyFrom(event.target);
      if (key === null) {
        if (lit !== null && event.target instanceof Element && event.target.closest('[data-gmap-center]') !== null) reset();
        return;
      }
      if (key !== lit) light(key);
    }, { signal: ctl.signal });
    scope.addEventListener('pointerleave', reset, { signal: ctl.signal });
    scope.addEventListener('focusin', (event) => {
      const key = keyFrom(event.target);
      if (key === null) reset();
      else light(key);
    }, { signal: ctl.signal });
    scope.addEventListener('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !scopes.some((other) => other.contains(event.relatedTarget as Node))) reset();
    }, { signal: ctl.signal });
  }
}
