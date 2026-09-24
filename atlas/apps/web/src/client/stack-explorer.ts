/**
 * Stack Explorer behaviour (components/shell/StackExplorer.astro).
 *
 * Every interaction answers a question about the book's structure:
 * - focus a chapter → its transitive prerequisites light as "builds on", its
 *   transitive dependents as "unlocks"; direct links are drawn strongest; the
 *   readout names the chapter, its state, and its direct neighbours (links);
 *   its lineage entries light on the timeline;
 * - choose a route → the route's chapters light in reading order with order
 *   badges and a path that draws itself through the map; the readout gives the
 *   route's purpose and where to start;
 * - point at a timeline entry → its chapter lights and the readout names the work.
 *
 * Keyboard: the map is one tab stop (roving tabindex); arrows move across the
 * lane grid, Enter opens the chapter, Escape clears. Motion honours
 * prefers-reduced-motion. The model comes from a JSON island and is parsed with
 * zod (the DOM is a trust boundary).
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const ChapterSchema = z.object({
  n: z.number().int(),
  number: z.string(),
  title: z.string(),
  short: z.string(),
  url: z.string(),
  part: z.number().int(),
  written: z.boolean(),
  summary: z.string(),
  sectionsWritten: z.number().int(),
  sectionsTotal: z.number().int(),
  figures: z.number().int(),
  equations: z.number().int(),
  prereqs: z.array(z.number().int()),
  unlocks: z.array(z.number().int()),
  upstream: z.number().int(),
  downstream: z.number().int(),
});

const ModelSchema = z.object({
  parts: z.array(z.object({ n: z.number().int(), numeral: z.string(), title: z.string(), chapters: z.array(z.number().int()) })),
  chapters: z.record(z.string(), ChapterSchema),
  edges: z.array(z.tuple([z.number().int(), z.number().int()])),
  lineage: z.array(z.object({ id: z.number().int(), year: z.number(), work: z.string(), relation: z.string(), chapter: z.number().int() })),
  routes: z.array(z.object({ label: z.string(), why: z.string(), chapters: z.array(z.number().int()) })),
});
type Model = z.output<typeof ModelSchema>;
type Chapter = z.output<typeof ChapterSchema>;

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

function closure(start: number, next: (n: number) => readonly number[]): Set<number> {
  const seen = new Set<number>();
  const stack = [...next(start)];
  while (stack.length > 0) {
    const n = stack.pop();
    if (n === undefined || seen.has(n)) continue;
    seen.add(n);
    stack.push(...next(n));
  }
  return seen;
}

export function initStackExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-stack-explorer]');
  if (root === null) return;
  let model: Model;
  try {
    const parsed = ModelSchema.safeParse(JSON.parse(root.querySelector('script[data-sx-model]')?.textContent ?? ''));
    if (!parsed.success) return;
    model = parsed.data;
  } catch {
    return;
  }

  const svg = root.querySelector<SVGSVGElement>('[data-sx-svg]');
  if (svg === null) return;
  const nodes = new Map<number, SVGAElement>();
  for (const node of svg.querySelectorAll<SVGAElement>('[data-sx-node]')) nodes.set(Number(node.dataset['sxNode']), node);
  const edges = [...svg.querySelectorAll<SVGPathElement>('.sx-edge')].map((path) => ({ path, from: Number(path.dataset['from']), to: Number(path.dataset['to']) }));
  const timeline = [...root.querySelectorAll<SVGAElement>('[data-sx-tl]')];
  const routeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-sx-route]')];
  const routePath = svg.querySelector<SVGPathElement>('[data-sx-route-path]');
  const routeBadges = svg.querySelector<SVGGElement>('[data-sx-route-badges]');
  const readout = {
    kicker: root.querySelector<HTMLElement>('[data-sx-kicker]'),
    title: root.querySelector<HTMLElement>('[data-sx-title]'),
    summary: root.querySelector<HTMLElement>('[data-sx-summary]'),
    rows: root.querySelector<HTMLElement>('[data-sx-rows]'),
    links: root.querySelector<HTMLElement>('[data-sx-links]'),
  };
  const initial = {
    kicker: readout.kicker?.textContent ?? '',
    title: readout.title?.textContent ?? '',
    summary: readout.summary?.textContent ?? '',
    rows: readout.rows?.innerHTML ?? '',
  };

  const chapter = (n: number): Chapter | undefined => model.chapters[String(n)];
  const partOf = (n: number) => model.parts.find((part) => part.chapters.includes(n));
  const center = (n: number): { x: number; y: number } | null => {
    const dot = nodes.get(n)?.querySelector<SVGCircleElement>('.sx-node__dot');
    return dot === null || dot === undefined ? null : { x: Number(dot.getAttribute('cx')), y: Number(dot.getAttribute('cy')) };
  };

  // ── readout (safe DOM construction; no innerHTML with data) ─────────────
  const row = (key: string, value: string): HTMLElement => {
    const wrap = doc.createElement('div');
    const dt = doc.createElement('dt');
    dt.textContent = key;
    const dd = doc.createElement('dd');
    dd.textContent = value;
    wrap.append(dt, dd);
    return wrap;
  };
  const chapterLinks = (label: string, list: readonly number[]): HTMLElement => {
    const span = doc.createElement('span');
    span.className = 'sx-links__group';
    const head = doc.createElement('span');
    head.className = 'sx-links__label';
    head.textContent = label;
    span.append(head);
    for (const n of list) {
      const target = chapter(n);
      if (target === undefined) continue;
      const link = doc.createElement('a');
      link.href = target.url;
      link.textContent = target.number;
      link.title = target.title;
      link.dataset['sxJump'] = String(n);
      link.className = target.written ? 'is-written' : 'is-planned';
      span.append(link);
    }
    return span;
  };
  const setReadout = (kicker: string, title: string, summary: string, rows: HTMLElement[], links: HTMLElement[]): void => {
    if (readout.kicker !== null) readout.kicker.textContent = kicker;
    if (readout.title !== null) readout.title.textContent = title;
    if (readout.summary !== null) readout.summary.textContent = summary;
    readout.rows?.replaceChildren(...rows);
    readout.links?.replaceChildren(...links);
  };
  const resetReadout = (): void => {
    if (readout.kicker !== null) readout.kicker.textContent = initial.kicker;
    if (readout.title !== null) readout.title.textContent = initial.title;
    if (readout.summary !== null) readout.summary.textContent = initial.summary;
    if (readout.rows !== null) readout.rows.innerHTML = initial.rows; // server-rendered markup restored verbatim
    readout.links?.replaceChildren();
  };

  // ── states ───────────────────────────────────────────────────────────────
  const clearClasses = (): void => {
    svg.classList.remove('has-focus', 'has-route');
    for (const node of nodes.values()) node.classList.remove('is-focus', 'is-up', 'is-down', 'is-route', 'is-direct');
    for (const edge of edges) edge.path.classList.remove('is-up', 'is-down', 'is-direct');
    for (const mark of timeline) mark.classList.remove('is-lit');
    root.classList.remove('has-focus', 'has-route');
  };

  let pinnedRoute: number | null = null;

  const focusChapter = (n: number): void => {
    const target = chapter(n);
    if (target === undefined) return;
    clearRoute();
    clearClasses();
    const up = closure(n, (k) => chapter(k)?.prereqs ?? []);
    const down = closure(n, (k) => chapter(k)?.unlocks ?? []);
    svg.classList.add('has-focus');
    root.classList.add('has-focus');
    nodes.get(n)?.classList.add('is-focus');
    for (const k of up) nodes.get(k)?.classList.add('is-up');
    for (const k of down) nodes.get(k)?.classList.add('is-down');
    for (const k of [...target.prereqs, ...target.unlocks]) nodes.get(k)?.classList.add('is-direct');
    for (const edge of edges) {
      const direct = edge.to === n || edge.from === n;
      if ((up.has(edge.from) || edge.from === n) && (up.has(edge.to) || edge.to === n)) edge.path.classList.add('is-up');
      else if ((down.has(edge.from) || edge.from === n) && (down.has(edge.to) || edge.to === n)) edge.path.classList.add('is-down');
      if (direct) edge.path.classList.add('is-direct');
    }
    for (const mark of timeline) mark.classList.toggle('is-lit', Number(mark.dataset['chapter']) === n);

    const part = partOf(n);
    setReadout(
      `CHAPTER ${target.number} · PART ${part?.numeral ?? ''} · ${(part?.title ?? '').toUpperCase()}`,
      target.title,
      target.summary,
      [
        row('status', target.written ? `${String(target.sectionsWritten)}/${String(target.sectionsTotal)} sections written` : 'planned'),
        row('figures · equations', target.written ? `${String(target.figures)} · ${String(target.equations)}` : '—'),
        row('builds on', `${String(target.prereqs.length)} direct · ${String(up.size)} in all`),
        row('unlocks', `${String(target.unlocks.length)} direct · ${String(down.size)} in all`),
      ],
      [chapterLinks('builds on', target.prereqs), chapterLinks('unlocks', target.unlocks)],
    );
  };

  const clearRoute = (): void => {
    if (routePath !== null) {
      routePath.setAttribute('d', '');
      routePath.style.removeProperty('stroke-dasharray');
      routePath.style.removeProperty('stroke-dashoffset');
    }
    routeBadges?.replaceChildren();
    for (const button of routeButtons) button.setAttribute('aria-pressed', String(Number(button.dataset['sxRoute']) === pinnedRoute));
  };

  const showRoute = (index: number): void => {
    const route = model.routes[index];
    if (route === undefined) return;
    clearClasses();
    clearRoute();
    svg.classList.add('has-route');
    root.classList.add('has-route');
    const points = route.chapters.map((n) => center(n)).filter((p): p is { x: number; y: number } => p !== null);
    route.chapters.forEach((n, order) => {
      const node = nodes.get(n);
      node?.classList.add('is-route');
      const p = center(n);
      if (p === null || routeBadges === null) return;
      const badge = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      badge.setAttribute('class', 'sx-badge');
      badge.setAttribute('transform', `translate(${String(p.x + 12)} ${String(p.y - 13)})`);
      const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '7');
      const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('y', '3');
      text.textContent = String(order + 1);
      badge.append(circle, text);
      routeBadges.append(badge);
    });
    if (routePath !== null && points.length > 1) {
      const [first, ...rest] = points;
      if (first !== undefined) {
        routePath.setAttribute('d', `M${String(first.x)} ${String(first.y)} ${rest.map((p) => `L${String(p.x)} ${String(p.y)}`).join(' ')}`);
        if (!reducedMotion()) {
          const length = routePath.getTotalLength();
          routePath.style.strokeDasharray = String(length);
          routePath.style.strokeDashoffset = String(length);
          void routePath.getBoundingClientRect();
          routePath.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.3,.7,.2,1)';
          routePath.style.strokeDashoffset = '0';
        }
      }
    }
    for (const button of routeButtons) button.setAttribute('aria-pressed', String(Number(button.dataset['sxRoute']) === index));
    const start = chapter(route.chapters[0] ?? 0);
    setReadout(
      `ROUTE · ${String(route.chapters.length)} CHAPTERS`,
      route.label,
      route.why,
      [
        row('written on this route', `${String(route.chapters.filter((n) => chapter(n)?.written === true).length)} / ${String(route.chapters.length)}`),
        row('starts at', start === undefined ? '—' : `${start.number} · ${start.short}`),
      ],
      [chapterLinks('in order', route.chapters)],
    );
  };

  const reset = (): void => {
    clearClasses();
    clearRoute();
    if (pinnedRoute !== null) showRoute(pinnedRoute);
    else resetReadout();
  };

  // ── pointer and focus ───────────────────────────────────────────────────
  const nodeFrom = (target: EventTarget | null): number | null => {
    const node = target instanceof Element ? target.closest<SVGAElement>('[data-sx-node]') : null;
    return node === null ? null : Number(node.dataset['sxNode']);
  };
  svg.addEventListener('pointerover', (event) => {
    const n = nodeFrom(event.target);
    if (n !== null) focusChapter(n);
  }, { signal: ctl.signal });
  svg.addEventListener('focusin', (event) => {
    const n = nodeFrom(event.target);
    if (n !== null) focusChapter(n);
  }, { signal: ctl.signal });
  root.addEventListener('pointerleave', reset, { signal: ctl.signal });

  // Links inside the readout preview their chapter on hover.
  root.querySelector('.sx-panel')?.addEventListener('pointerover', (event) => {
    const jump = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-sx-jump]') : null;
    const n = Number(jump?.dataset['sxJump'] ?? Number.NaN);
    if (!Number.isNaN(n)) {
      for (const node of nodes.values()) node.classList.remove('is-peek');
      nodes.get(n)?.classList.add('is-peek');
    }
  }, { signal: ctl.signal });

  for (const button of routeButtons) {
    const index = Number(button.dataset['sxRoute']);
    button.addEventListener('pointerenter', () => {
      showRoute(index);
    }, { signal: ctl.signal });
    button.addEventListener('focus', () => {
      showRoute(index);
    }, { signal: ctl.signal });
    button.addEventListener('click', () => {
      pinnedRoute = pinnedRoute === index ? null : index;
      if (pinnedRoute === null) reset();
      else showRoute(index);
    }, { signal: ctl.signal });
  }

  connectStrip({ doc, root, model, timeline, focusChapter, reset, signal: ctl.signal });

  // ── keyboard: roving focus across the lane grid ─────────────────────────
  const grid = model.parts.map((part) => part.chapters);
  svg.addEventListener('keydown', (event) => {
    const n = nodeFrom(event.target);
    if (n === null) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    const r = grid.findIndex((lane) => lane.includes(n));
    const c = grid[r]?.indexOf(n) ?? -1;
    const moves: Readonly<Record<string, readonly [number, number]>> = {
      ArrowRight: [r, c + 1],
      ArrowLeft: [r, c - 1],
      ArrowDown: [r + 1, c],
      ArrowUp: [r - 1, c],
      Home: [0, 0],
      End: [grid.length - 1, 5],
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const lane = grid[Math.max(0, Math.min(grid.length - 1, move[0]))] ?? [];
    const next = lane[Math.max(0, Math.min(lane.length - 1, move[1]))];
    const target = next === undefined ? undefined : nodes.get(next);
    if (target === undefined) return;
    for (const node of nodes.values()) node.setAttribute('tabindex', '-1');
    target.setAttribute('tabindex', '0');
    target.focus();
  }, { signal: ctl.signal });

  connectListing(doc, model, ctl.signal);
}

const RELATION_NAMES: Readonly<Record<string, string>> = {
  anc: 'conceptual ancestor',
  opt: 'engineering optimization',
  alt: 'alternative branch',
  sup: 'superseded approach',
  fro: 'current frontier',
};

interface StripContext {
  readonly doc: Document;
  readonly root: HTMLElement;
  readonly model: Model;
  readonly timeline: readonly SVGAElement[];
  readonly focusChapter: (n: number) => void;
  readonly reset: () => void;
  readonly signal: AbortSignal;
}

const plural = (n: number, one: string, many: string): string => `${String(n)} ${n === 1 ? one : many}`;

/**
 * The lineage strip under the map. A dot names its work, relation, and chapter
 * in the strip's own readout and lights that chapter's whole lineage (and the
 * chapter in the map above); a year column shows the year's mix of relations;
 * relation chips isolate one relation (click pins it). Dots and years are links
 * into the timeline page. One tab stop: arrows step through dots in time order.
 */
function connectStrip(context: StripContext): void {
  const { doc, root, model, timeline, focusChapter, reset, signal } = context;
  const strip = root.querySelector<HTMLElement>('[data-sx-timeline]');
  const svg = strip?.querySelector<SVGSVGElement>('[data-sx-tl-svg]') ?? null;
  const readout = strip?.querySelector<HTMLElement>('[data-sx-tl-readout]') ?? null;
  const guide = strip?.querySelector<SVGLineElement>('[data-sx-tl-guide]') ?? null;
  if (strip === null || svg === null || readout === null) return;
  const hint = [...readout.childNodes].map((node) => node.cloneNode(true));
  const byId = new Map(model.lineage.map((entry) => [entry.id, entry]));
  const entryOf = (mark: SVGAElement) => byId.get(Number(mark.dataset['sxTl']));
  const chips = [...strip.querySelectorAll<HTMLButtonElement>('[data-sx-tl-chip]')];
  let pinned: string | null = null;

  const write = (...parts: (string | Node)[]): void => {
    readout.replaceChildren(...parts);
  };
  const strong = (text: string, className = ''): HTMLElement => {
    const b = doc.createElement('b');
    if (className !== '') b.className = className;
    b.textContent = text;
    return b;
  };
  const relationTag = (key: string, text: string): HTMLElement => {
    const span = doc.createElement('span');
    span.className = `sx-timeline__rel sx-tl--${key}`;
    span.textContent = text;
    return span;
  };

  const showRelation = (key: string): void => {
    svg.classList.add('has-rel');
    svg.dataset['rel'] = key;
    const years = timeline
      .filter((mark) => mark.dataset['relation'] === key)
      .map((mark) => entryOf(mark)?.year ?? 0)
      .filter((year) => year > 0);
    const range = years.length === 0 ? '' : ` · ${String(Math.min(...years))}–${String(Math.max(...years))}`;
    write(relationTag(key, RELATION_NAMES[key] ?? key), ` · ${plural(years.length, 'entry', 'entries')}${range}`, pinned === key ? ' · click the chip again to show all' : '');
  };
  const clearStrip = (): void => {
    svg.classList.remove('has-year', 'has-rel');
    delete svg.dataset['rel'];
    guide?.classList.remove('is-on');
    for (const mark of timeline) mark.classList.remove('is-focus', 'is-year');
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset['sxTlChip'] === pinned));
  };
  const resetStrip = (): void => {
    clearStrip();
    if (pinned !== null) showRelation(pinned);
    else write(...hint.map((node) => node.cloneNode(true)));
  };

  const showMark = (mark: SVGAElement): void => {
    const entry = entryOf(mark);
    if (entry === undefined) return;
    clearStrip();
    if (pinned !== null) {
      svg.classList.add('has-rel');
      svg.dataset['rel'] = pinned;
    }
    focusChapter(entry.chapter); // lights the chapter in the map and its lineage thread here
    mark.classList.add('is-focus');
    const target = model.chapters[String(entry.chapter)];
    const thread = timeline.filter((other) => Number(other.dataset['chapter']) === entry.chapter).length;
    const link = doc.createElement('a');
    link.href = target?.url ?? '/timeline/';
    link.textContent = target === undefined ? `Chapter ${String(entry.chapter)}` : `${target.number} ${target.short}`;
    write(
      strong(String(entry.year)),
      ' · ',
      relationTag(mark.dataset['relation'] ?? 'anc', entry.relation),
      ' · ',
      strong(entry.work, 'sx-timeline__work'),
      ' — placed by ',
      link,
      ` · ${plural(thread, 'entry', 'entries')} in its lineage`,
    );
  };

  const showYear = (column: SVGAElement): void => {
    const year = Number(column.dataset['sxYear']);
    reset();
    clearStrip();
    svg.classList.add('has-year');
    const members = timeline.filter((mark) => entryOf(mark)?.year === year);
    for (const mark of members) mark.classList.add('is-year');
    if (guide !== null) {
      const xs = members.map((mark) => Number(mark.querySelector('circle')?.getAttribute('cx') ?? Number.NaN)).filter(Number.isFinite);
      if (xs.length > 0) {
        const x = String((Math.min(...xs) + Math.max(...xs)) / 2);
        guide.setAttribute('x1', x);
        guide.setAttribute('x2', x);
        guide.classList.add('is-on');
      }
    }
    const counts = (column.dataset['sxYearCounts'] ?? '')
      .split(' ')
      .filter((part) => part !== '')
      .map((part) => {
        const [key = '', n = '0'] = part.split(':');
        return [key, Number(n)] as const;
      })
      .sort((a, b) => b[1] - a[1]);
    const total = counts.reduce((sum, [, n]) => sum + n, 0);
    const parts: (string | Node)[] = [strong(String(year)), ` · ${plural(total, 'entry', 'entries')} — `];
    counts.forEach(([key, n], index) => {
      if (index > 0) parts.push(' · ');
      parts.push(relationTag(key, `${String(n)} ${RELATION_NAMES[key] ?? key}`));
    });
    parts.push(' · click to open the year');
    write(...parts);
  };

  const markFrom = (target: EventTarget | null): SVGAElement | null =>
    target instanceof Element ? target.closest<SVGAElement>('[data-sx-tl]') : null;
  const yearFrom = (target: EventTarget | null): SVGAElement | null =>
    target instanceof Element ? target.closest<SVGAElement>('[data-sx-year]') : null;

  svg.addEventListener('pointerover', (event) => {
    const mark = markFrom(event.target);
    if (mark !== null) {
      showMark(mark);
      return;
    }
    const column = yearFrom(event.target);
    if (column !== null) showYear(column);
  }, { signal });
  strip.addEventListener('pointerleave', () => {
    reset();
    resetStrip();
  }, { signal });
  svg.addEventListener('focusin', (event) => {
    const mark = markFrom(event.target);
    if (mark !== null) showMark(mark);
  }, { signal });

  for (const chip of chips) {
    const key = chip.dataset['sxTlChip'] ?? '';
    chip.addEventListener('pointerenter', () => {
      reset();
      clearStrip();
      showRelation(key);
    }, { signal });
    chip.addEventListener('focus', () => {
      clearStrip();
      showRelation(key);
    }, { signal });
    chip.addEventListener('click', () => {
      pinned = pinned === key ? null : key;
      clearStrip();
      showRelation(key);
    }, { signal });
  }

  // Keyboard: one tab stop; arrows step through dots in time order (only the isolated relation when one is pinned).
  const STEP: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  svg.addEventListener('keydown', (event) => {
    const mark = markFrom(event.target);
    if (mark === null) return;
    if (event.key === 'Escape') {
      reset();
      resetStrip();
      return;
    }
    const visible = timeline.filter((other) => pinned === null || other.dataset['relation'] === pinned);
    const at = Math.max(0, visible.indexOf(mark));
    const step = STEP[event.key];
    const next = event.key === 'Home' ? visible[0] : event.key === 'End' ? visible.at(-1) : step === undefined ? undefined : visible[Math.max(0, Math.min(visible.length - 1, at + step))];
    if (next === undefined) return;
    event.preventDefault();
    for (const other of timeline) other.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
  }, { signal });
}

/**
 * The volume / part / chapter listing below the map answers the same question
 * as the map: pointing at (or focusing) a chapter marks, across the whole
 * listing, every chapter it builds on and every chapter it unlocks, and the
 * row itself says how many — so the table of contents reads as a dependency
 * structure, not a list.
 */
function connectListing(doc: Document, model: Model, signal: AbortSignal): void {
  const listing = doc.querySelector<HTMLElement>('.sh-universe');
  if (listing === null) return;
  const rows = new Map<number, HTMLElement>();
  for (const link of listing.querySelectorAll<HTMLElement>('[data-chapter-link]')) {
    const n = Number(/(\d+)$/u.exec(link.dataset['chapterLink'] ?? '')?.[1] ?? Number.NaN);
    const item = link.closest<HTMLElement>('.sh-universe-chapter');
    if (Number.isInteger(n) && item !== null) rows.set(n, item);
  }
  if (rows.size === 0) return;
  const chapterOf = (n: number): Chapter | undefined => model.chapters[String(n)];
  let current: number | null = null;

  const clear = (): void => {
    current = null;
    listing.classList.remove('has-focus');
    for (const item of rows.values()) {
      item.classList.remove('is-focus', 'is-up', 'is-down', 'is-direct');
      item.removeAttribute('data-sx-degree');
    }
  };
  const light = (n: number): void => {
    if (current === n) return;
    const focus = chapterOf(n);
    if (focus === undefined) return;
    clear();
    current = n;
    const up = closure(n, (k) => chapterOf(k)?.prereqs ?? []);
    const down = closure(n, (k) => chapterOf(k)?.unlocks ?? []);
    const direct = new Set([...focus.prereqs, ...focus.unlocks]);
    listing.classList.add('has-focus');
    for (const [k, item] of rows) {
      if (k === n) item.classList.add('is-focus');
      else if (up.has(k)) item.classList.add('is-up');
      else if (down.has(k)) item.classList.add('is-down');
      if (direct.has(k)) item.classList.add('is-direct');
    }
    rows.get(n)?.setAttribute('data-sx-degree', `builds on ${String(up.size)} · unlocks ${String(down.size)}`);
  };
  const chapterFrom = (target: EventTarget | null): number | null => {
    const item = target instanceof Element ? target.closest<HTMLElement>('.sh-universe-chapter') : null;
    if (item === null) return null;
    for (const [k, row] of rows) if (row === item) return k;
    return null;
  };

  listing.addEventListener('pointerover', (event) => {
    const n = chapterFrom(event.target);
    if (n !== null) light(n);
  }, { signal });
  listing.addEventListener('pointerleave', clear, { signal });
  listing.addEventListener('focusin', (event) => {
    const n = chapterFrom(event.target);
    if (n === null) clear();
    else light(n);
  }, { signal });
  listing.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !listing.contains(event.relatedTarget)) clear();
  }, { signal });
}
