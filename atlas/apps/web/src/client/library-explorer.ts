/**
 * Library behaviour (components/shell/LibraryExplorer.astro): stat band,
 * manuscript map, readout, and ledger are one instrument.
 *
 * - Point at (or focus) a chapter tile or a ledger row: the chapter is ringed
 *   in the map and marked in the ledger; every chapter it builds on (blue) and
 *   unlocks (oxblood) lights in both, transitively, each tagged with its
 *   distance (↑1 = a direct prerequisite); direct links are drawn over the
 *   map. The readout gives its thesis, state, measures, degree, and sections.
 * - Point at a section cell (map or ledger): the chapter focuses and the
 *   readout names that section in its section list.
 * - Point at a part label (map) or a part head (ledger): its six chapters
 *   stand out and the readout lists them with their progress.
 * - "Read by" chips: pointing at one previews the map in that measure (a
 *   lens: each tile shows its value and a bar; the readout ranks the top six);
 *   clicking pins it until another is chosen ("state" returns to rest).
 * - Keyboard: the map is one tab stop (roving tabindex); arrows move across
 *   the 11 × 6 grid, Home/End along a row, Ctrl+Home/End to the first/last
 *   chapter, Enter opens, Escape clears. Each ledger section strip is one tab
 *   stop with arrows. Link drawing honours prefers-reduced-motion.
 *
 * The chapter data comes from a JSON island parsed with zod (the DOM is a
 * trust boundary); every readout node is built with textContent.
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const SectionSchema = z.object({
  number: z.string(),
  title: z.string(),
  url: z.string(),
  written: z.boolean(),
  words: z.number(),
  figures: z.number(),
});

const ChapterSchema = z.object({
  n: z.number().int(),
  number: z.string(),
  title: z.string(),
  short: z.string(),
  url: z.string(),
  part: z.number().int(),
  written: z.boolean(),
  state: z.string(),
  summary: z.string(),
  plan: z.string(),
  words: z.number(),
  figures: z.number().int(),
  equations: z.number().int(),
  works: z.number().int(),
  prereqs: z.array(z.number().int()),
  unlocks: z.array(z.number().int()),
  sections: z.array(SectionSchema),
});

const PartSchema = z.object({
  n: z.number().int(),
  numeral: z.string(),
  title: z.string(),
  domain: z.string(),
  outcome: z.string(),
  chapters: z.array(z.number().int()),
  written: z.number().int(),
  sectionsWritten: z.number().int(),
  sectionsTotal: z.number().int(),
  words: z.number(),
});

const ModelSchema = z.object({ parts: z.array(PartSchema), chapters: z.array(ChapterSchema) });
type Chapter = z.output<typeof ChapterSchema>;
type Part = z.output<typeof PartSchema>;

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_CHIPS = 6;
const LENSES = new Set(['chapters', 'sections', 'words', 'figures', 'equations', 'works']);

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
const grouped = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
const compact = (n: number): string => (n <= 0 ? '—' : n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`);

/** Breadth-first distances from `start` along `next` (start excluded). */
function distances(start: number, next: (n: number) => readonly number[]): Map<number, number> {
  const out = new Map<number, number>();
  let frontier = [start];
  let depth = 0;
  while (frontier.length > 0) {
    depth += 1;
    const following: number[] = [];
    for (const n of frontier) {
      for (const k of next(n)) {
        if (k === start || out.has(k)) continue;
        out.set(k, depth);
        following.push(k);
      }
    }
    frontier = following;
  }
  return out;
}

export function initLibraryExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-library-explorer]');
  if (root === null) return;
  const signal = ctl.signal;

  let parsed: z.output<typeof ModelSchema>;
  try {
    const result = ModelSchema.safeParse(JSON.parse(root.querySelector('script[data-lib-model]')?.textContent ?? ''));
    if (!result.success) return;
    parsed = result.data;
  } catch {
    return;
  }
  const model = parsed;
  const chapterOf = new Map<number, Chapter>(model.chapters.map((chapter) => [chapter.n, chapter]));
  const partOf = new Map<number, Part>(model.parts.map((part) => [part.n, part]));

  const body = root.querySelector<HTMLElement>('[data-lib-body]');
  const grid = root.querySelector<HTMLElement>('[data-lib-grid]');
  const ledger = root.querySelector<HTMLElement>('#lib-ledger');
  const links = root.querySelector<SVGSVGElement>('[data-lib-links]');
  const readout = root.querySelector<HTMLElement>('[data-lib-readout]');
  if (body === null || grid === null || ledger === null || readout === null) return;

  const tiles = new Map<number, HTMLElement>();
  for (const tile of grid.querySelectorAll<HTMLElement>('.lib-tile[data-lib-n]')) tiles.set(Number(tile.dataset['libN']), tile);
  const tileLinks = new Map<number, HTMLAnchorElement>();
  for (const link of grid.querySelectorAll<HTMLAnchorElement>('[data-lib-tile]')) tileLinks.set(Number(link.dataset['libTile']), link);
  const rows = new Map<number, HTMLTableRowElement>();
  for (const row of ledger.querySelectorAll<HTMLTableRowElement>('tr[data-lib-n]')) rows.set(Number(row.dataset['libN']), row);
  const mapRows = new Map<number, HTMLElement>();
  for (const row of grid.querySelectorAll<HTMLElement>('.lib-row[data-lib-part]')) mapRows.set(Number(row.dataset['libPart']), row);
  const ledgerParts = new Map<number, HTMLElement>();
  for (const part of ledger.querySelectorAll<HTMLElement>('.lib-part[data-lib-part]')) ledgerParts.set(Number(part.dataset['libPart']), part);
  const chipsOfLens = [...root.querySelectorAll<HTMLButtonElement>('button[data-lib-lens]')];

  // ── readout slots (restored from clones of the server-rendered nodes) ─────
  const slot = (name: string): HTMLElement | null => readout.querySelector<HTMLElement>(`[data-lib-${name}]`);
  const out = {
    kicker: slot('kicker'),
    title: slot('title'),
    state: slot('state'),
    thesis: slot('thesis'),
    rows: slot('rows'),
    listhead: slot('listhead'),
    list: slot('list'),
    links: slot('links-out'),
  };
  const initial = new Map<HTMLElement, Node[]>();
  for (const el of Object.values(out)) if (el !== null) initial.set(el, [...el.childNodes].map((node) => node.cloneNode(true)));

  const text = (el: HTMLElement | null, value: string): void => {
    if (el !== null) el.textContent = value;
  };
  const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, content = ''): HTMLElementTagNameMap[K] => {
    const el = doc.createElement(tag);
    if (className !== '') el.className = className;
    if (content !== '') el.textContent = content;
    return el;
  };
  const setRows = (pairs: readonly (readonly [string, string])[]): void => {
    out.rows?.replaceChildren(
      ...pairs.map(([key, value]) => {
        const wrap = make('div', '');
        wrap.append(make('dt', '', key), make('dd', '', value));
        return wrap;
      }),
    );
  };
  const setListHead = (left: string, right: string): void => {
    out.listhead?.replaceChildren(make('span', '', left), make('span', '', right));
  };
  const chips = (label: string, list: readonly number[], role: 'up' | 'down'): HTMLElement => {
    const group = make('span', 'lib-links__group');
    group.append(make('span', 'lib-links__label', label));
    if (list.length === 0) {
      group.append(make('span', 'lib-links__none', role === 'up' ? 'nothing — a starting point' : 'nothing yet'));
      return group;
    }
    const shown = list.length > MAX_CHIPS ? list.slice(0, MAX_CHIPS - 1) : list;
    for (const n of shown) {
      const target = chapterOf.get(n);
      if (target === undefined) continue;
      const link = make('a', `is-${role}`, target.number);
      link.href = target.url;
      link.title = `${target.number} ${target.title}`;
      link.dataset['libJump'] = String(n);
      link.tabIndex = -1;
      group.append(link);
    }
    if (shown.length < list.length) group.append(make('span', 'lib-links__more', `+${String(list.length - shown.length)}`));
    return group;
  };
  const restore = (): void => {
    for (const [el, nodes] of initial) el.replaceChildren(...nodes.map((node) => node.cloneNode(true)));
    delete readout.dataset['domain'];
  };

  const sectionItems = (chapter: Chapter): HTMLElement[] =>
    chapter.sections.map((section, index) => {
      const item = make('li', `lib-ro__item${section.written ? '' : ' is-planned'}`);
      item.dataset['libItem'] = String(index);
      item.append(
        make('span', `lib-ro__cell${section.written ? ' is-written' : ''}`),
        make('span', 'lib-ro__num', section.number),
        make('span', 'lib-ro__itemtext', section.title),
        make('span', 'lib-ro__val', section.written ? `${compact(section.words)} w` : 'planned'),
      );
      return item;
    });

  let up = new Map<number, number>();
  let down = new Map<number, number>();

  const describeChapter = (chapter: Chapter): void => {
    const part = partOf.get(chapter.part);
    if (part !== undefined) readout.dataset['domain'] = part.domain;
    text(out.kicker, `Chapter ${chapter.number} · Part ${part?.numeral ?? ''} · ${part?.title ?? ''}`);
    text(out.title, chapter.title);
    const drafted = chapter.sections.filter((section) => section.written).length;
    text(out.state, `${chapter.state} · ${chapter.words > 0 ? `${grouped(chapter.words)} words` : 'no words yet'}`);
    const planned = chapter.plan === '' ? '' : ` It is planned to produce ${chapter.plan}.`;
    text(
      out.thesis,
      chapter.summary !== ''
        ? chapter.summary
        : drafted > 0
          ? `No thesis on the chapter page yet; ${String(drafted)} of its ${String(chapter.sections.length)} sections are drafted.${planned}`
          : `Planned: six sections outlined, no manuscript yet.${planned}`,
    );
    setRows([
      ['figures · equations', `${String(chapter.figures)} · ${String(chapter.equations)}`],
      ['works cited', String(chapter.works)],
      ['builds on', `${String(chapter.prereqs.length)} direct · ${String(up.size)} in all`],
      ['unlocks', `${String(chapter.unlocks.length)} direct · ${String(down.size)} in all`],
    ]);
    setListHead('Sections', `${String(drafted)} of ${String(chapter.sections.length)} drafted`);
    out.list?.replaceChildren(...sectionItems(chapter));
    out.links?.replaceChildren(chips('builds on', chapter.prereqs, 'up'), chips('unlocks', chapter.unlocks, 'down'));
  };

  const describePart = (part: Part): void => {
    readout.dataset['domain'] = part.domain;
    const members = part.chapters.map((n) => chapterOf.get(n)).filter((c): c is Chapter => c !== undefined);
    text(out.kicker, `Part ${part.numeral} · ${String(part.chapters.length)} chapters`);
    text(out.title, part.title);
    text(out.state, `${String(part.written)}/${String(part.chapters.length)} chapters · ${String(part.sectionsWritten)}/${String(part.sectionsTotal)} sections · ${grouped(part.words)} words`);
    text(out.thesis, part.outcome === '' ? 'No outcome is recorded for this part.' : `Outcome — ${part.outcome}.`);
    const inside = new Set(part.chapters);
    const external = (list: (c: Chapter) => readonly number[]): number => new Set(members.flatMap(list).filter((n) => !inside.has(n))).size;
    setRows([
      ['figures · equations', `${String(members.reduce((s, c) => s + c.figures, 0))} · ${String(members.reduce((s, c) => s + c.equations, 0))}`],
      ['chapters with a thesis', `${String(members.filter((c) => c.summary !== '').length)} / ${String(members.length)}`],
      ['builds on (outside)', `${String(external((c) => c.prereqs))} chapters`],
      ['unlocks (outside)', `${String(external((c) => c.unlocks))} chapters`],
    ]);
    setListHead('Chapters', 'sections drafted');
    out.list?.replaceChildren(
      ...members.map((chapter) => {
        const drafted = chapter.sections.filter((section) => section.written).length;
        const item = make('li', `lib-ro__item${chapter.written ? '' : ' is-planned'}`);
        const cell = make('span', 'lib-ro__cell is-part');
        cell.style.setProperty('--fill', `${String(Math.round((drafted / Math.max(1, chapter.sections.length)) * 100))}%`);
        item.append(cell, make('span', 'lib-ro__num', chapter.number), make('span', 'lib-ro__itemtext', chapter.short), make('span', 'lib-ro__val', `${String(drafted)}/${String(chapter.sections.length)}`));
        return item;
      }),
    );
    out.links?.replaceChildren();
  };

  // ── lighting ──────────────────────────────────────────────────────────────
  let current: number | null = null;
  let currentPart: number | null = null;
  let currentSection: number | null = null;
  let cancelDraw: (() => void) | null = null;

  const clearSection = (): void => {
    currentSection = null;
    for (const cell of root.querySelectorAll('.lib-cell.is-on')) cell.classList.remove('is-on');
    for (const item of out.list?.querySelectorAll('.is-on') ?? []) item.classList.remove('is-on');
  };
  const clearLight = (): void => {
    current = null;
    currentPart = null;
    clearSection();
    cancelDraw?.();
    cancelDraw = null;
    grid.classList.remove('has-focus', 'has-part');
    ledger.classList.remove('has-focus', 'has-part');
    for (const tile of tiles.values()) tile.classList.remove('is-focus', 'is-up', 'is-down', 'is-direct', 'is-peek');
    for (const row of rows.values()) {
      row.classList.remove('is-focus', 'is-up', 'is-down', 'is-direct');
      row.cells[0]?.removeAttribute('data-hop');
    }
    for (const row of mapRows.values()) row.classList.remove('is-part');
    for (const part of ledgerParts.values()) part.classList.remove('is-part');
    links?.replaceChildren();
  };
  const reset = (): void => {
    clearLight();
    restore();
    if (root.dataset['lens'] !== undefined && root.dataset['lens'] !== 'none') describeLens(root.dataset['lens']);
  };

  const center = (el: Element, box: DOMRect): { x: number; y: number; hw: number; hh: number } => {
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, hw: r.width / 2 + 3, hh: r.height / 2 + 3 };
  };
  /** The point where the ray from a rectangle's centre towards (tx, ty) leaves the rectangle. */
  const edge = (from: { x: number; y: number; hw: number; hh: number }, tx: number, ty: number): { x: number; y: number } => {
    const dx = tx - from.x;
    const dy = ty - from.y;
    const t = Math.min(dx === 0 ? Infinity : from.hw / Math.abs(dx), dy === 0 ? Infinity : from.hh / Math.abs(dy));
    return Number.isFinite(t) ? { x: from.x + dx * t, y: from.y + dy * t } : { x: from.x, y: from.y };
  };
  const drawLinks = (chapter: Chapter): void => {
    if (links === null) return;
    const focus = tiles.get(chapter.n);
    if (focus === undefined) return;
    const box = grid.getBoundingClientRect();
    links.setAttribute('viewBox', `0 0 ${String(box.width)} ${String(box.height)}`);
    const f = center(focus, box);
    const paths: SVGPathElement[] = [];
    const nodes: SVGElement[] = [];
    const add = (n: number, role: 'up' | 'down'): void => {
      const tile = tiles.get(n);
      if (tile === undefined) return;
      const o = center(tile, box);
      const a = edge(o, f.x, f.y);
      const b = edge(f, o.x, o.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const bend = Math.min(36, len * 0.18) * (role === 'up' ? 1 : -1);
      const nx = len === 0 ? 0 : -(b.y - a.y) / len;
      const ny = len === 0 ? 0 : (b.x - a.x) / len;
      const path = doc.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${(mx + nx * bend).toFixed(1)} ${(my + ny * bend).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
      path.setAttribute('class', `is-${role}`);
      const dot = doc.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', a.x.toFixed(1));
      dot.setAttribute('cy', a.y.toFixed(1));
      dot.setAttribute('r', '3.2');
      dot.setAttribute('class', `is-${role}`);
      paths.push(path);
      nodes.push(dot);
    };
    for (const n of chapter.prereqs) add(n, 'up');
    for (const n of chapter.unlocks) add(n, 'down');
    links.replaceChildren(...paths, ...nodes);
    if (reducedMotion()) return;
    for (const path of paths) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
    }
    cancelDraw = ctl.frame(() => {
      for (const path of paths) {
        path.style.transition = 'stroke-dashoffset 260ms cubic-bezier(.3,.7,.2,1)';
        path.style.strokeDashoffset = '0';
      }
    });
  };

  const focusChapter = (n: number): void => {
    if (current === n) return;
    const chapter = chapterOf.get(n);
    if (chapter === undefined) return;
    clearLight();
    current = n;
    up = distances(n, (k) => chapterOf.get(k)?.prereqs ?? []);
    down = distances(n, (k) => chapterOf.get(k)?.unlocks ?? []);
    const direct = new Set([...chapter.prereqs, ...chapter.unlocks]);
    grid.classList.add('has-focus');
    ledger.classList.add('has-focus');
    const mark = (el: HTMLElement, k: number): string | null => {
      if (k === n) {
        el.classList.add('is-focus');
        return null;
      }
      const u = up.get(k);
      const d = down.get(k);
      if (direct.has(k)) el.classList.add('is-direct');
      if (u !== undefined) {
        el.classList.add('is-up');
        return `↑${String(u)}`;
      }
      if (d !== undefined) {
        el.classList.add('is-down');
        return `↓${String(d)}`;
      }
      return null;
    };
    for (const [k, tile] of tiles) {
      const hop = mark(tile, k);
      const badge = tile.querySelector<HTMLElement>('[data-lib-hop]');
      if (badge !== null) badge.textContent = hop ?? '';
    }
    for (const [k, row] of rows) {
      const hop = mark(row, k);
      if (hop !== null) row.cells[0]?.setAttribute('data-hop', hop);
    }
    describeChapter(chapter);
    drawLinks(chapter);
  };

  const focusSection = (n: number, index: number): void => {
    focusChapter(n);
    if (currentSection === index) return;
    clearSection();
    currentSection = index;
    const chapter = chapterOf.get(n);
    const section = chapter?.sections[index];
    if (chapter === undefined || section === undefined) return;
    for (const scope of [tiles.get(n), rows.get(n)]) scope?.querySelector(`.lib-cell[data-lib-s="${String(index)}"]`)?.classList.add('is-on');
    out.list?.querySelector(`[data-lib-item="${String(index)}"]`)?.classList.add('is-on');
    setListHead(
      `§ ${section.number}`,
      section.written ? `drafted · ${grouped(section.words)} words · ${String(section.figures)} fig` : 'planned — not yet drafted',
    );
  };

  const focusPart = (n: number): void => {
    if (currentPart === n) return;
    const part = partOf.get(n);
    if (part === undefined) return;
    clearLight();
    currentPart = n;
    grid.classList.add('has-part');
    ledger.classList.add('has-part');
    mapRows.get(n)?.classList.add('is-part');
    ledgerParts.get(n)?.classList.add('is-part');
    describePart(part);
  };

  // ── pointer and focus ─────────────────────────────────────────────────────
  const numberFrom = (target: EventTarget | null, selector: string, key: string): number | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>(selector) : null;
    const value = el?.dataset[key];
    return value === undefined ? null : Number(value);
  };
  const route = (target: EventTarget | null): void => {
    const n = numberFrom(target, '[data-lib-n]', 'libN');
    if (n !== null) {
      const s = numberFrom(target, '.lib-cell[data-lib-s]', 'libS');
      if (s !== null) focusSection(n, s);
      else {
        focusChapter(n);
        if (currentSection !== null) {
          const chapter = chapterOf.get(n);
          clearSection();
          if (chapter !== undefined) setListHead('Sections', `${String(chapter.sections.filter((x) => x.written).length)} of ${String(chapter.sections.length)} drafted`);
        }
      }
      return;
    }
    const p = numberFrom(target, '.lib-row__label, .lib-part__head', 'libPartlink') ?? (target instanceof Element && target.closest('.lib-part__head') !== null ? numberFrom(target, '.lib-part', 'libPart') : null);
    if (p !== null) focusPart(p);
  };

  grid.addEventListener('pointerover', (event) => {
    route(event.target);
  }, { signal });
  ledger.addEventListener('pointerover', (event) => {
    route(event.target);
  }, { signal });
  body.addEventListener('pointerleave', reset, { signal });
  for (const scope of [grid, ledger]) {
    scope.addEventListener('focusin', (event) => {
      route(event.target);
    }, { signal });
    scope.addEventListener('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !body.contains(event.relatedTarget)) reset();
    }, { signal });
  }

  // Readout chips preview their chapter in the map.
  readout.addEventListener('pointerover', (event) => {
    const n = numberFrom(event.target, '[data-lib-jump]', 'libJump');
    for (const tile of tiles.values()) tile.classList.remove('is-peek');
    if (n !== null) tiles.get(n)?.classList.add('is-peek');
  }, { signal });
  readout.addEventListener('pointerleave', () => {
    for (const tile of tiles.values()) tile.classList.remove('is-peek');
  }, { signal });

  // ── lenses: the map re-reads in one measure; the readout ranks it ─────────
  const MEASURES: Readonly<Record<string, { readonly name: string; readonly unit: string; readonly of: (c: Chapter) => number }>> = {
    words: { name: 'Words', unit: 'words', of: (c) => c.words },
    figures: { name: 'Figures', unit: 'figures', of: (c) => c.figures },
    equations: { name: 'Equations', unit: 'equations', of: (c) => c.equations },
    works: { name: 'Works cited', unit: 'works', of: (c) => c.works },
    sections: { name: 'Sections drafted', unit: 'sections', of: (c) => c.sections.filter((x) => x.written).length },
    chapters: { name: 'Chapters written', unit: 'sections', of: (c) => (c.written ? 0 : c.sections.filter((x) => x.written).length) },
  };
  const rankItem = (chapter: Chapter, value: number, max: number, label: string): HTMLElement => {
    const item = make('li', 'lib-ro__item');
    const cell = make('span', 'lib-ro__cell is-part');
    const part = partOf.get(chapter.part);
    if (part !== undefined) cell.dataset['domain'] = part.domain;
    cell.style.setProperty('--fill', `${String(Math.round((value / Math.max(1, max)) * 100))}%`);
    item.append(cell, make('span', 'lib-ro__num', chapter.number), make('span', 'lib-ro__itemtext', chapter.short), make('span', 'lib-ro__val', label));
    return item;
  };
  const describeLens = (lens: string): void => {
    const measure = MEASURES[lens];
    if (measure === undefined) return;
    delete readout.dataset['domain'];
    const values = model.chapters.map((c) => ({ c, v: measure.of(c) }));
    const present = values.filter((x) => x.v > 0).sort((a, b) => b.v - a.v || a.c.n - b.c.n);
    const total = values.reduce((sum, x) => sum + x.v, 0);
    const max = present[0]?.v ?? 0;
    const top = present[0];
    const written = model.chapters.filter((c) => c.written).length;
    if (lens === 'chapters') {
      text(out.kicker, 'Lens · chapters written');
      text(out.title, `${String(written)} of ${String(model.chapters.length)} chapters written`);
      text(out.state, `${String(present.length)} more with sections drafted`);
      text(out.thesis, 'Written chapters stay solid; planned ones fade. Below: the chapters closest to being written — planned chapter pages whose sections are already drafted.');
    } else {
      const drafted = model.chapters.reduce((sum, c) => sum + c.sections.filter((x) => x.written).length, 0);
      text(out.kicker, `Lens · ${measure.name.toLowerCase()}`);
      text(out.title, lens === 'sections' ? `${String(drafted)} of ${String(model.chapters.reduce((s2, c) => s2 + c.sections.length, 0))} sections drafted` : `${measure.name}, chapter by chapter`);
      text(out.state, `${grouped(total)} ${measure.unit} in ${String(present.length)} of ${String(model.chapters.length)} chapters`);
      text(
        out.thesis,
        lens === 'sections'
          ? 'Every drafted section is a filled cell; tile colour steps back so the cells carry the picture. Below: the chapters with the most sections drafted.'
          : `Each tile now shows its chapter's ${measure.unit}, with a bar relative to the largest; chapters with none fade. Below: the six chapters with the most.`,
      );
    }
    setRows([
      ['chapters with any', `${String(present.length)} / ${String(model.chapters.length)}`],
      ['largest', top === undefined ? '—' : `${grouped(top.v)} · ch ${top.c.number}`],
      ['mean where present', present.length === 0 ? '—' : grouped(total / present.length)],
      ['total', grouped(total)],
    ]);
    setListHead(lens === 'chapters' ? 'Closest to written' : `Most ${measure.unit}`, lens === 'chapters' ? 'sections drafted' : 'top 6');
    out.list?.replaceChildren(...present.slice(0, 6).map((x) => rankItem(x.c, x.v, lens === 'chapters' || lens === 'sections' ? x.c.sections.length : max, lens === 'chapters' || lens === 'sections' ? `${String(x.v)}/${String(x.c.sections.length)}` : grouped(x.v))));
    out.links?.replaceChildren();
  };
  let pinnedLens: string | null = null;
  const setLens = (lens: string | null): void => {
    const on = lens !== null && LENSES.has(lens) ? lens : null;
    root.dataset['lens'] = on ?? 'none';
    for (const chip of chipsOfLens) chip.classList.toggle('is-on', chip.dataset['libLens'] === (on ?? 'none'));
    if (on !== null) {
      clearLight();
      describeLens(on);
    } else if (current === null && currentPart === null) restore();
  };
  for (const chip of chipsOfLens) {
    const lens = chip.dataset['libLens'] ?? 'none';
    chip.addEventListener('pointerenter', () => {
      setLens(lens);
    }, { signal });
    chip.addEventListener('focus', () => {
      setLens(lens);
    }, { signal });
    chip.addEventListener('pointerleave', () => {
      setLens(pinnedLens);
    }, { signal });
    chip.addEventListener('blur', () => {
      setLens(pinnedLens);
    }, { signal });
    chip.addEventListener('click', () => {
      pinnedLens = lens === 'none' ? null : lens;
      for (const other of chipsOfLens) other.setAttribute('aria-pressed', String(other === chip));
      setLens(pinnedLens);
    }, { signal });
  }

  // ── keyboard: one tab stop across the 11 × 6 map ──────────────────────────
  const lanes = model.parts.map((part) => part.chapters.filter((n) => tileLinks.has(n)));
  const flat = lanes.flat();
  const move = (to: number | undefined): void => {
    const target = to === undefined ? undefined : tileLinks.get(to);
    if (target === undefined) return;
    for (const link of tileLinks.values()) link.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  };
  grid.addEventListener('keydown', (event) => {
    const n = numberFrom(event.target, '[data-lib-tile]', 'libTile');
    if (n === null) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    const r = lanes.findIndex((lane) => lane.includes(n));
    const lane = lanes[r] ?? [];
    const c = lane.indexOf(n);
    const at = flat.indexOf(n);
    let to: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
        to = flat[Math.min(flat.length - 1, at + 1)];
        break;
      case 'ArrowLeft':
        to = flat[Math.max(0, at - 1)];
        break;
      case 'ArrowDown': {
        const next = lanes[Math.min(lanes.length - 1, r + 1)] ?? [];
        to = next[Math.min(next.length - 1, c)];
        break;
      }
      case 'ArrowUp': {
        const previous = lanes[Math.max(0, r - 1)] ?? [];
        to = previous[Math.min(previous.length - 1, c)];
        break;
      }
      case 'Home':
        to = event.ctrlKey ? flat[0] : lane[0];
        break;
      case 'End':
        to = event.ctrlKey ? flat.at(-1) : lane.at(-1);
        break;
      default:
        return;
    }
    event.preventDefault();
    move(to);
  }, { signal });

  // Each ledger section strip becomes one tab stop; arrows move within it.
  for (const strip of ledger.querySelectorAll<HTMLElement>('.lib-strip')) {
    const cells = [...strip.querySelectorAll<HTMLAnchorElement>('.lib-cell')];
    cells.forEach((cell, index) => {
      cell.tabIndex = index === 0 ? 0 : -1;
    });
    strip.addEventListener('keydown', (event) => {
      const at = cells.indexOf(event.target as HTMLAnchorElement);
      if (at === -1) return;
      const to = event.key === 'ArrowRight' ? at + 1 : event.key === 'ArrowLeft' ? at - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? cells.length - 1 : null;
      if (event.key === 'Escape') {
        reset();
        return;
      }
      if (to === null) return;
      event.preventDefault();
      const next = cells[Math.max(0, Math.min(cells.length - 1, to))];
      if (next === undefined) return;
      for (const cell of cells) cell.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    }, { signal });
  }

  // Links are drawn in pixels: redraw on resize while a chapter is focused.
  const observer = ctl.observe(
    new ResizeObserver(() => {
      if (current === null) return;
      const chapter = chapterOf.get(current);
      if (chapter !== undefined) {
        cancelDraw?.();
        drawLinks(chapter);
      }
    }),
  );
  observer.observe(grid);
}
