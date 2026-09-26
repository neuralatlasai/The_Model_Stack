/**
 * The home dashboard (components/home/StackDashboard.astro) follows the
 * story: on `hx:part` (sent to the brain by client story.ts, bubbling up) it
 * re-reads itself for that part — badge, the rests-on/feeds line drawn up to
 * the part, chapter tiles filled by sections written, the evidence donut, the
 * concept grid, the stats, and the part's chapters in the status strip.
 * Numbers count to their new value; nothing moves under reduced motion.
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const Tile = z.object({ n: z.number(), label: z.string(), url: z.string(), fill: z.number() });
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
const DashSchema = z.object({ overview: State, parts: z.array(State), line: z.array(z.object({ part: z.number(), numeral: z.string() })) });
const GeometrySchema = z.object({ xs: z.array(z.number()), ys: z.object({ rests: z.array(z.number()), feeds: z.array(z.number()) }), W: z.number() });
type DashState = z.infer<typeof State>;

export function initDashboard(ctx: PageContext, root: HTMLElement, reduced: boolean): void {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const parsed = DashSchema.safeParse(JSON.parse(root.querySelector('[data-dash-data]')?.textContent ?? 'null'));
  const geometry = GeometrySchema.safeParse(JSON.parse(root.querySelector('[data-dx-geometry]')?.textContent ?? 'null'));
  if (!parsed.success || !geometry.success) return;
  const dash = parsed.data;
  const geo = geometry.data;

  const badge = root.querySelector<HTMLElement>('[data-dx-badge]');
  const range = root.querySelector<HTMLElement>('[data-dx-range]');
  const past = root.querySelector<SVGRectElement>('[data-dx-past]');
  const future = root.querySelector<SVGRectElement>('[data-dx-future]');
  const now = root.querySelector<SVGLineElement>('[data-dx-now]');
  const dotRests = root.querySelector<SVGCircleElement>('[data-dx-dot-rests]');
  const dotFeeds = root.querySelector<SVGCircleElement>('[data-dx-dot-feeds]');
  const ticks = [...root.querySelectorAll<SVGTextElement>('[data-dx-tick]')];
  const tiles = root.querySelector<HTMLElement>('[data-dx-tiles]');
  const arcs = [...root.querySelectorAll<SVGCircleElement>('[data-dx-arc]')];
  const donutLabel = root.querySelector<SVGTextElement>('[data-dx-donut-label]');
  const gridHead = root.querySelector<HTMLElement>('[data-dx-grid-head]');
  const squares = [...root.querySelectorAll<HTMLElement>('[data-dx-grid] i')];
  const rests = root.querySelector<HTMLElement>('[data-dx-rests]');
  const feeds = root.querySelector<HTMLElement>('[data-dx-feeds]');
  const written = root.querySelector<HTMLElement>('[data-dx-written]');
  const draws = root.querySelector<HTMLElement>('[data-dx-draws]');
  const status = [...root.querySelectorAll<HTMLElement>('[data-dx-ch]')];

  // numbers count to their new value
  const counters = new WeakMap<HTMLElement, number>();
  const count = (el: HTMLElement | null, to: number | null, suffix = ''): void => {
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
      const t = Math.min(1, (performance.now() - start) / 520);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = `${String(Math.round(from + (to - from) * eased))}${suffix}`;
      if (t < 1 && !ctl.disposed) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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
        const base = doc.createElement('span');
        base.className = 'dx-tile__t';
        base.textContent = tile.label;
        const on = doc.createElement('span');
        on.className = 'dx-tile__t is-on';
        on.setAttribute('aria-hidden', 'true');
        on.textContent = tile.label;
        a.append(base, on);
        requestAnimationFrame(() => {
          a.style.setProperty('--f', tile.fill.toFixed(3));
        });
        return a;
      }),
    );
    tiles.classList.toggle('is-parts', state.part === 0);
  };

  const show = (state: DashState): void => {
    if (badge !== null) badge.textContent = state.badge;
    if (range !== null) range.textContent = state.range;

    // the line: drawn solid up to the part, dashed beyond
    const i = state.part - 1;
    const x = state.part === 0 ? geo.W : (geo.xs[i] ?? 0);
    // CSS geometry, so the line draws on and the markers glide
    if (past !== null) past.style.width = `${String(x)}px`;
    if (future !== null) {
      future.style.x = `${String(x)}px`;
      future.style.width = `${String(Math.max(0, geo.W - x))}px`;
    }
    root.classList.toggle('is-part', state.part > 0);
    if (now !== null) now.style.transform = `translateX(${String(x)}px)`;
    if (dotRests !== null) dotRests.style.transform = `translate(${String(x)}px, ${String(geo.ys.rests[i] ?? 0)}px)`;
    if (dotFeeds !== null) dotFeeds.style.transform = `translate(${String(x)}px, ${String(geo.ys.feeds[i] ?? 0)}px)`;
    for (const tick of ticks) tick.classList.toggle('is-on', Number(tick.dataset['dxTick']) === state.part);

    renderTiles(state);

    // donut: share of cited / derived / gap
    const total = state.evidence[0] + state.evidence[1] + state.evidence[2];
    let offset = 0;
    arcs.forEach((arc, k) => {
      const value = total === 0 ? 0 : (state.evidence[k] ?? 0) / total * 100;
      arc.style.strokeDasharray = `${value.toFixed(2)} ${(100 - value).toFixed(2)}`;
      arc.style.strokeDashoffset = (25 - offset).toFixed(2);
      offset += value;
    });
    if (donutLabel !== null) donutLabel.textContent = total === 0 ? 'Planned' : 'Evidence';

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
            ? 'Concepts appear here as its chapters are written'
            : `${String(n)} concepts defined in this part`;
    }

    count(rests, state.part === 0 ? null : state.restsOn, ' ch');
    count(feeds, state.part === 0 ? null : state.feeds, ' ch');
    if (written !== null) written.textContent = state.written;
    if (draws !== null) {
      draws.textContent =
        state.part === 0
          ? 'the whole stack, one loop'
          : state.drawsOn.length > 0
            ? state.drawsOn.join(' · ')
            : 'nothing before it — the foundation';
    }
    for (const square of status) square.classList.toggle('is-cur', state.part > 0 && Number(square.dataset['dxPart']) === state.part);
  };

  root.addEventListener('hx:part', (event) => {
    const part = (event as CustomEvent<{ part: number }>).detail.part;
    show(part > 0 ? (dash.parts[part - 1] ?? dash.overview) : dash.overview);
  }, { signal });
  show(dash.overview);
}
