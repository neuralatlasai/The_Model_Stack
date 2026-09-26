/**
 * The home dashboard (components/home/StackDashboard.astro) follows the
 * story: on `hx:part` (sent to the brain by client story.ts, bubbling up) it
 * re-reads itself for that part — badge and the regions it draws on; the
 * dependency line drawn and shaded up to the part, with its values called
 * out; icon tiles filled by sections written; the evidence donut and its
 * shares; the concept grid; the part's chapters in the status strip. On
 * `hx:signal` (the brain firing a real prerequisite) the signal feed names it.
 * Numbers count to their new value; nothing moves under reduced motion.
 */
import { z } from 'zod';
import { PART_ICON } from '../lib/part-icons.ts';
import type { PageContext } from './page.ts';

const Tile = z.object({ n: z.number(), icon: z.number(), label: z.string(), url: z.string(), fill: z.number() });
const State = z.object({
  part: z.number(),
  badge: z.string(),
  range: z.string(),
  restsOn: z.number(),
  feeds: z.number(),
  written: z.string(),
  drawsOn: z.array(z.string()),
  feedsInto: z.array(z.string()),
  tiles: z.array(Tile),
  evidence: z.tuple([z.number(), z.number(), z.number()]),
  concepts: z.array(z.string()),
  chapters: z.array(z.number()),
});
const DashSchema = z.object({
  overview: State,
  parts: z.array(State),
  line: z.array(z.object({ part: z.number(), numeral: z.string(), label: z.string() })),
  status: z.array(z.object({ n: z.number(), title: z.string() })),
});
const GeometrySchema = z.object({
  xs: z.array(z.number()),
  ys: z.object({ rests: z.array(z.number()), feeds: z.array(z.number()) }),
  W: z.number(),
  X0: z.number(),
  X1: z.number(),
});
type DashState = z.infer<typeof State>;

const SVG = 'http://www.w3.org/2000/svg';
const pad = (n: number): string => String(n).padStart(2, '0');

export function initDashboard(ctx: PageContext, root: HTMLElement, reduced: boolean): void {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const parsed = DashSchema.safeParse(JSON.parse(root.querySelector('[data-dash-data]')?.textContent ?? 'null'));
  const geometry = GeometrySchema.safeParse(JSON.parse(root.querySelector('[data-dx-geometry]')?.textContent ?? 'null'));
  if (!parsed.success || !geometry.success) return;
  const dash = parsed.data;
  const geo = geometry.data;
  const titleOf = new Map(dash.status.map((chapter) => [chapter.n, chapter.title]));

  const badge = root.querySelector<HTMLElement>('[data-dx-badge]');
  const range = root.querySelector<HTMLElement>('[data-dx-range]');
  const past = root.querySelector<SVGRectElement>('[data-dx-past]');
  const future = root.querySelector<SVGRectElement>('[data-dx-future]');
  const now = root.querySelector<SVGLineElement>('[data-dx-now]');
  const nowLabel = root.querySelector<SVGTextElement>('[data-dx-now-label]');
  const dotRests = root.querySelector<SVGCircleElement>('[data-dx-dot-rests]');
  const dotFeeds = root.querySelector<SVGCircleElement>('[data-dx-dot-feeds]');
  const pillRests = root.querySelector<SVGGElement>('[data-dx-pill-rests]');
  const pillFeeds = root.querySelector<SVGGElement>('[data-dx-pill-feeds]');
  const ticks = [...root.querySelectorAll<SVGTextElement>('[data-dx-tick]')];
  const tiles = root.querySelector<HTMLElement>('[data-dx-tiles]');
  const arcs = [...root.querySelectorAll<SVGCircleElement>('[data-dx-arc]')];
  const donutPct = root.querySelector<SVGTextElement>('[data-dx-donut-pct]');
  const donutLabel = root.querySelector<SVGTextElement>('[data-dx-donut-label]');
  const pcts = [...root.querySelectorAll<HTMLElement>('[data-dx-pct]')];
  const gridHead = root.querySelector<HTMLElement>('[data-dx-grid-head]');
  const squares = [...root.querySelectorAll<HTMLElement>('[data-dx-grid] i')];
  const draws = root.querySelector<HTMLElement>('[data-dx-draws]');
  const status = [...root.querySelectorAll<HTMLElement>('[data-dx-ch]')];
  const feed = root.querySelector<HTMLOListElement>('[data-dx-feed]');

  // ── numbers count to their new value ──────────────────────────────────────
  const counters = new WeakMap<Element, number>();
  const count = (el: Element | null, to: number | null, suffix = ''): void => {
    if (el === null) return;
    if (to === null) {
      el.textContent = '—';
      counters.delete(el);
      return;
    }
    const from = counters.get(el) ?? 0;
    counters.set(el, to);
    if (reduced || from === to) {
      el.textContent = `${String(to)}${suffix}`;
      return;
    }
    const start = performance.now();
    const step = (): void => {
      const t = Math.min(1, (performance.now() - start) / 560);
      el.textContent = `${String(Math.round(from + (to - from) * (1 - (1 - t) ** 3)))}${suffix}`;
      if (t < 1 && !ctl.disposed) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ── tiles: icon + label, filled by sections written ──────────────────────
  const icon = (part: number): SVGSVGElement => {
    const svg = doc.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = doc.createElementNS(SVG, 'path');
    path.setAttribute('d', PART_ICON[part] ?? '');
    svg.append(path);
    return svg;
  };
  const renderTiles = (state: DashState): void => {
    if (tiles === null) return;
    tiles.replaceChildren(
      ...state.tiles.map((tile) => {
        const a = doc.createElement('a');
        a.className = 'dx-tile';
        a.href = tile.url;
        a.title = tile.label;
        a.style.setProperty('--f', '0');
        const box = doc.createElement('span');
        box.className = state.part === 0 ? 'dx-tile__i' : 'dx-tile__i is-num';
        box.setAttribute('aria-hidden', 'true');
        // parts carry their icon; a part's chapters carry their number
        if (state.part === 0) box.append(icon(tile.icon));
        else box.textContent = pad(tile.n);
        const bar = doc.createElement('span');
        bar.className = 'dx-tile__bar';
        const base = doc.createElement('span');
        base.className = 'dx-tile__t';
        base.textContent = tile.label;
        const on = base.cloneNode(true) as HTMLElement;
        on.classList.add('is-on');
        on.setAttribute('aria-hidden', 'true');
        bar.append(base, on);
        a.append(box, bar);
        requestAnimationFrame(() => {
          a.style.setProperty('--f', tile.fill.toFixed(3));
        });
        return a;
      }),
    );
    tiles.classList.toggle('is-parts', state.part === 0);
  };

  // ── pills beside the markers, kept apart ─────────────────────────────────
  const place = (pill: SVGGElement | null, x: number, y: number, above: boolean, value: number): void => {
    if (pill === null) return;
    const text = pill.querySelector('text');
    if (text !== null) count(text, value);
    const px = Math.min(geo.X1 - 4, Math.max(geo.X0 + 4, x + 22));
    pill.style.transform = `translate(${String(px)}px, ${String(y + (above ? -14 : 14))}px)`;
  };

  const show = (state: DashState): void => {
    if (badge !== null) badge.textContent = state.badge;
    if (range !== null) range.textContent = state.range;

    // the line, drawn and shaded up to the part, dashed beyond
    const i = state.part - 1;
    const x = state.part === 0 ? geo.W : (geo.xs[i] ?? 0);
    if (past !== null) past.style.width = `${String(x)}px`;
    if (future !== null) {
      future.style.x = `${String(x)}px`;
      future.style.width = `${String(Math.max(0, geo.W - x))}px`;
    }
    root.classList.toggle('is-part', state.part > 0);
    const yr = geo.ys.rests[i] ?? 0;
    const yf = geo.ys.feeds[i] ?? 0;
    if (now !== null) now.style.transform = `translateX(${String(x)}px)`;
    if (nowLabel !== null) {
      const label = dash.line[i]?.label ?? '';
      nowLabel.textContent = label;
      const lx = Math.min(geo.X1 - label.length * 3.4, Math.max(geo.X0 + label.length * 3.4, x));
      nowLabel.style.transform = `translateX(${String(lx)}px)`;
    }
    if (dotRests !== null) dotRests.style.transform = `translate(${String(x)}px, ${String(yr)}px)`;
    if (dotFeeds !== null) dotFeeds.style.transform = `translate(${String(x)}px, ${String(yf)}px)`;
    if (state.part > 0) {
      const restsAbove = yr <= yf;
      place(pillRests, x, yr, restsAbove, state.restsOn);
      place(pillFeeds, x, yf, !restsAbove, state.feeds);
    }
    for (const tick of ticks) tick.classList.toggle('is-on', Number(tick.dataset['dxTick']) === state.part);

    renderTiles(state);

    // donut: share of cited / derived / gap
    const total = state.evidence[0] + state.evidence[1] + state.evidence[2];
    let offset = 0;
    arcs.forEach((arc, k) => {
      const value = total === 0 ? 0 : ((state.evidence[k] ?? 0) / total) * 100;
      arc.style.strokeDasharray = `${value.toFixed(2)} ${(100 - value).toFixed(2)}`;
      arc.style.strokeDashoffset = (25 - offset).toFixed(2);
      offset += value;
    });
    const shares = state.evidence.map((v) => (total === 0 ? null : Math.round((v / total) * 100)));
    count(donutPct, shares[0] ?? null, '%');
    if (donutLabel !== null) donutLabel.textContent = total === 0 ? 'planned' : 'cited';
    pcts.forEach((el, k) => {
      count(el, shares[k] ?? null, '%');
    });

    // concepts, one square each, filling in order
    const n = state.concepts.length;
    squares.forEach((square, k) => {
      square.style.transitionDelay = reduced ? '0ms' : `${String(Math.min(k, 120) * 4)}ms`;
      square.classList.toggle('is-on', k < n);
    });
    if (gridHead !== null) {
      gridHead.textContent =
        state.part === 0
          ? `${String(n)} concepts the book defines`
          : n === 0
            ? 'No concepts defined yet'
            : `${String(n)} concepts defined in this part`;
    }

    if (draws !== null) {
      draws.textContent =
        state.part === 0 ? '' : state.drawsOn.length > 0 ? `draws on ${state.drawsOn.join(' · ')}` : 'the foundation — draws on nothing before it';
    }
    for (const square of status) square.classList.toggle('is-cur', state.part > 0 && Number(square.dataset['dxPart']) === state.part);
  };

  // ── the signal feed: prerequisites as the brain fires them ───────────────
  let lastSignal = 0;
  root.addEventListener('hx:signal', (event) => {
    if (feed === null) return;
    const { from, to } = (event as CustomEvent<{ from: number; to: number }>).detail;
    const t = performance.now();
    const key = `${String(from)}-${String(to)}`;
    // one line per firing; a fibre that fires again soon is not repeated
    if (t - lastSignal < 650 || [...feed.children].some((item) => (item as HTMLElement).dataset['route'] === key)) return;
    lastSignal = t;
    const li = doc.createElement('li');
    li.dataset['route'] = key;
    const route = doc.createElement('b');
    route.textContent = `${pad(from)} → ${pad(to)}`;
    const names = doc.createElement('span');
    names.textContent = `${titleOf.get(from) ?? ''} → ${titleOf.get(to) ?? ''}`;
    li.append(route, names);
    feed.prepend(li);
    while (feed.children.length > 3) feed.lastElementChild?.remove();
  }, { signal });

  root.addEventListener('hx:part', (event) => {
    const part = (event as CustomEvent<{ part: number }>).detail.part;
    show(part > 0 ? (dash.parts[part - 1] ?? dash.overview) : dash.overview);
  }, { signal });
  show(dash.overview);
}
