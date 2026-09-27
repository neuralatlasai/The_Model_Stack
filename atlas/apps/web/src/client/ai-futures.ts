/**
 * AI futures behaviour (components/shell/AiFuturesExplorer.astro): the horizon
 * scope, readout, legend filters, book spine, and ranked index are one
 * instrument.
 *
 * - Point at a glyph or an index line: the readout names the entry (rank,
 *   name, kind glyph and kind, geography, status, first sentence of the
 *   description, link) and its glyph and line light. Click a glyph to pin it;
 *   Esc or a second click releases.
 * - Point at a legend chip or a spine chapter: its glyphs light and the
 *   readout summarises the group; click filters the index and the scope.
 * - The sweep (CSS) pauses while the scope is off-screen.
 * - `#aif-N` on arrival pins entry N; `#kind-…` / `#geo-…` filter.
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const IslandSchema = z.object({
  entries: z.array(
    z.object({
      rank: z.number(),
      name: z.string(),
      kind: z.string(),
      geo: z.string(),
      fit: z.number(),
      status: z.string(),
      description: z.string().nullable(),
      reason: z.string(),
      url: z.string(),
      chapters: z.array(z.number()),
    }),
  ),
});
type Entry = z.infer<typeof IslandSchema>['entries'][number];

const KIND_LABEL: Readonly<Record<string, string>> = {
  scenario: 'Scenarios & forecasting',
  measurement: 'Capability & trajectory measurement',
  alignment: 'Alignment & control research',
  framework: 'Frontier safety frameworks & evaluators',
  governance: 'Governance & strategy',
  lab: 'Frontier labs',
  institute: 'Research institutes',
  compute: 'Compute & infrastructure',
};
const KIND_SHORT: Readonly<Record<string, string>> = {
  scenario: 'Scenarios & forecasting',
  measurement: 'Capability measurement',
  alignment: 'Alignment & control',
  framework: 'Safety frameworks',
  governance: 'Governance & strategy',
  lab: 'Frontier labs',
  institute: 'Research institutes',
  compute: 'Compute & infrastructure',
};
const GEO_LABEL: Readonly<Record<string, string>> = { us: 'US', cn: 'China', uk: 'UK', global: 'Global' };
const STATUS_LABEL: Readonly<Record<string, string>> = { verified: 'verified', redirected: 'address updated', unverified: 'UNVERIFIED' };
const SVG = 'http://www.w3.org/2000/svg';
const host = (href: string): string => {
  try {
    return new URL(href).hostname.replace(/^www\./u, '');
  } catch {
    return href;
  }
};
/** The first sentence: the readout carries one line; the index carries the rest. */
const firstSentence = (text: string): string => /^.+?[.;](?=\s+\p{Lu}|$)/u.exec(text)?.[0] ?? text;

export function initAiFutures(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-aif-explorer]');
  const scope = root?.querySelector<HTMLElement>('[data-aif-scope]') ?? null;
  const index = root?.querySelector<HTMLOListElement>('[data-aif-index]') ?? null;
  const islandEl = root?.querySelector('[data-aif-data]') ?? null;
  if (root === null || scope === null || index === null || islandEl === null) return;
  const parsed = IslandSchema.safeParse(JSON.parse(islandEl.textContent));
  if (!parsed.success) return;
  const signal = ctl.signal;

  const entries = new Map(parsed.data.entries.map((entry) => [entry.rank, entry]));
  const glyphs = new Map([...scope.querySelectorAll<SVGGElement>('[data-aif-glyph]')].map((g) => [Number(g.dataset['aifGlyph']), g]));
  const lines = new Map([...index.querySelectorAll<HTMLLIElement>('[data-aif-line]')].map((li) => [Number(li.dataset['aifLine']), li]));
  const kindChips = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-kind]')];
  const geoChips = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-geo]')];
  const statusChips = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-status]')];
  const chapterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-chapter]')];
  const rims = [...scope.querySelectorAll<SVGTextElement>('[data-aif-rim]')];

  // ── readout ────────────────────────────────────────────────────────────────
  const out = {
    kicker: root.querySelector<HTMLElement>('[data-aif-kicker]'),
    title: root.querySelector<HTMLElement>('[data-aif-title]'),
    kind: root.querySelector<HTMLElement>('[data-aif-kindline]'),
    desc: root.querySelector<HTMLElement>('[data-aif-desc]'),
    links: root.querySelector<HTMLElement>('[data-aif-links]'),
  };
  const readout = root.querySelector<HTMLElement>('[data-aif-readout]');
  const initial = Object.fromEntries(Object.entries(out).map(([name, el]) => [name, el === null ? [] : [...el.childNodes].map((node) => node.cloneNode(true))])) as Record<keyof typeof out, Node[]>;
  const set = (name: keyof typeof out, ...content: (Node | string)[]): void => {
    out[name]?.replaceChildren(...content);
  };
  const symbol = (id: string, className: string, box: string): SVGSVGElement => {
    const svg = doc.createElementNS(SVG, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('viewBox', box);
    svg.setAttribute('aria-hidden', 'true');
    const use = doc.createElementNS(SVG, 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  };
  const span = (className: string, ...content: (Node | string)[]): HTMLSpanElement => {
    const el = doc.createElement('span');
    el.className = className;
    el.append(...content);
    return el;
  };

  const describe = (entry: Entry, pinnedNow: boolean): void => {
    set('kicker', [`#${String(entry.rank)}`, `supplier fit ${String(entry.fit)}`, pinnedNow ? 'pinned · Esc releases' : null].filter((part) => part !== null).join(' · '));
    set('title', entry.name);
    set('kind', span(`aif-readout__glyph aif-geo--${entry.geo}`, symbol(`aif-sym-${entry.kind}`, 'aif-sym', '0 0 18 18')), ` ${KIND_SHORT[entry.kind] ?? entry.kind} · ${GEO_LABEL[entry.geo] ?? entry.geo}`);
    set('desc', entry.description === null ? `Supplier’s reason: ${entry.reason}` : firstSentence(entry.description));
    const a = doc.createElement('a');
    a.href = entry.url;
    a.rel = 'external';
    a.textContent = host(entry.url);
    set('links', a, ' ', span(`aif-st is-${entry.status}`, symbol(`aif-st-${entry.status}`, 'aif-st__sym', '0 0 14 14'), ` ${STATUS_LABEL[entry.status] ?? entry.status}`));
  };
  const summarise = (kicker: string, title: string, list: readonly Entry[]): void => {
    set('kicker', kicker);
    set('title', title);
    const byGeo = Object.entries(Object.groupBy(list, (entry) => entry.geo)).map(([geo, group]) => `${String(group?.length ?? 0)} ${GEO_LABEL[geo] ?? geo}`);
    set('kind', byGeo.join(' · '));
    set('desc', list.slice(0, 12).map((entry) => `${String(entry.rank)} ${entry.name}`).join(' · ') + (list.length > 12 ? ' …' : ''));
    set('links', '');
  };
  const resetReadout = (): void => {
    for (const name of Object.keys(out) as (keyof typeof out)[]) set(name, ...initial[name].map((node) => node.cloneNode(true)));
  };

  // ── lighting ───────────────────────────────────────────────────────────────
  let pinned: number | null = null;
  const clearLight = (): void => {
    scope.classList.remove('has-focus');
    for (const g of glyphs.values()) g.classList.remove('is-lit', 'is-focus');
    for (const li of lines.values()) li.classList.remove('is-lit');
    for (const rim of rims) rim.classList.remove('is-lit');
    for (const button of [...kindChips, ...geoChips, ...statusChips, ...chapterButtons]) button.classList.remove('is-lit');
  };
  const focusEntry = (entry: Entry): void => {
    clearLight();
    scope.classList.add('has-focus');
    glyphs.get(entry.rank)?.classList.add('is-focus');
    lines.get(entry.rank)?.classList.add('is-lit');
    for (const rim of rims) rim.classList.toggle('is-lit', rim.dataset['aifRim'] === entry.kind);
    for (const button of chapterButtons) button.classList.toggle('is-lit', entry.chapters.includes(Number(button.dataset['aifChapter'])));
    describe(entry, pinned === entry.rank);
  };
  const lightGroup = (test: (entry: Entry) => boolean, source: HTMLElement): Entry[] => {
    clearLight();
    scope.classList.add('has-focus');
    const list: Entry[] = [];
    for (const entry of entries.values()) {
      const on = test(entry);
      glyphs.get(entry.rank)?.classList.toggle('is-lit', on);
      if (on) list.push(entry);
    }
    source.classList.add('is-lit');
    return list;
  };
  const release = (): void => {
    clearLight();
    const entry = pinned === null ? undefined : entries.get(pinned);
    if (entry !== undefined) focusEntry(entry);
    else resetReadout();
  };
  const pin = (rank: number | null): void => {
    pinned = rank;
    for (const [n, g] of glyphs) g.classList.toggle('is-pinned', n === rank);
    readout?.classList.toggle('is-pinned', rank !== null);
    release();
  };

  const glyphFrom = (target: EventTarget | null): Entry | undefined => {
    const g = target instanceof Element ? target.closest<SVGGElement>('[data-aif-glyph]') : null;
    return g === null ? undefined : entries.get(Number(g.dataset['aifGlyph']));
  };
  const svg = scope.querySelector('svg');
  svg?.addEventListener('pointerover', (event) => {
    const entry = glyphFrom(event.target);
    if (entry !== undefined) focusEntry(entry);
  }, { signal });
  svg?.addEventListener('pointerleave', release, { signal });
  svg?.addEventListener('click', (event) => {
    const entry = glyphFrom(event.target);
    if (entry === undefined) return;
    pin(pinned === entry.rank ? null : entry.rank);
  }, { signal });
  const lineFrom = (target: EventTarget | null): Entry | undefined => {
    const li = target instanceof Element ? target.closest<HTMLLIElement>('[data-aif-line]') : null;
    return li === null ? undefined : entries.get(Number(li.dataset['aifLine']));
  };
  index.addEventListener('pointerover', (event) => {
    const entry = lineFrom(event.target);
    if (entry !== undefined) focusEntry(entry);
  }, { signal });
  index.addEventListener('pointerleave', release, { signal });
  index.addEventListener('focusin', (event) => {
    const entry = lineFrom(event.target);
    if (entry !== undefined) focusEntry(entry);
  }, { signal });
  index.addEventListener('focusout', release, { signal });
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && pinned !== null) pin(null);
  }, { signal });

  // ── filters ────────────────────────────────────────────────────────────────
  const kinds = new Set<string>();
  const geos = new Set<string>();
  const statuses = new Set<string>();
  let chapter: number | null = null;
  let query = '';
  const shown = root.querySelector<HTMLElement>('[data-aif-shown]');
  const clear = root.querySelector<HTMLButtonElement>('[data-aif-clear]');
  const search = root.querySelector<HTMLInputElement>('[data-aif-search]');

  const visibleOf = (entry: Entry, li: HTMLLIElement | undefined): boolean =>
    (kinds.size === 0 || kinds.has(entry.kind)) &&
    (geos.size === 0 || geos.has(entry.geo)) &&
    (statuses.size === 0 || statuses.has(entry.status)) &&
    (chapter === null || entry.chapters.includes(chapter)) &&
    (query === '' || query.split(/\s+/u).every((term) => li?.dataset['text']?.includes(term) === true));

  const apply = (): void => {
    let count = 0;
    for (const entry of entries.values()) {
      const li = lines.get(entry.rank);
      const visible = visibleOf(entry, li);
      if (li !== undefined) li.hidden = !visible;
      glyphs.get(entry.rank)?.classList.toggle('is-filtered', !visible);
      if (visible) count += 1;
    }
    if (shown !== null) shown.textContent = `${String(count)} of ${String(entries.size)}`;
    const active = kinds.size + geos.size + statuses.size + (chapter === null ? 0 : 1) + (query === '' ? 0 : 1) > 0;
    if (clear !== null) clear.hidden = !active;
    for (const chip of kindChips) chip.setAttribute('aria-pressed', String(kinds.has(chip.dataset['aifKind'] ?? '')));
    for (const chip of geoChips) chip.setAttribute('aria-pressed', String(geos.has(chip.dataset['aifGeo'] ?? '')));
    for (const chip of statusChips) chip.setAttribute('aria-pressed', String(statuses.has(chip.dataset['aifStatus'] ?? '')));
    for (const button of chapterButtons) button.setAttribute('aria-pressed', String(Number(button.dataset['aifChapter']) === chapter));
  };
  const toggle = (bucket: Set<string>, value: string): void => {
    if (bucket.has(value)) bucket.delete(value);
    else bucket.add(value);
    apply();
  };
  const hoverable = (button: HTMLElement, onLight: () => void): void => {
    button.addEventListener('pointerenter', onLight, { signal });
    button.addEventListener('focus', onLight, { signal });
    button.addEventListener('pointerleave', release, { signal });
    button.addEventListener('blur', release, { signal });
  };
  const GROUP_LABEL = { kind: 'kind', geo: 'geography', status: 'status' } as const;
  const chipGroup = (chips: readonly HTMLButtonElement[], key: 'aifKind' | 'aifGeo' | 'aifStatus', field: 'kind' | 'geo' | 'status', bucket: Set<string>, name: Readonly<Record<string, string>>): void => {
    for (const chip of chips) {
      const value = chip.dataset[key] ?? '';
      hoverable(chip, () => {
        const list = lightGroup((entry) => entry[field] === value, chip);
        summarise(`${GROUP_LABEL[field]} · ${String(list.length)} sources`, name[value] ?? value, list);
        if (field === 'kind') for (const rim of rims) rim.classList.toggle('is-lit', rim.dataset['aifRim'] === value);
      });
      chip.addEventListener('click', () => {
        toggle(bucket, value);
      }, { signal });
    }
  };
  chipGroup(kindChips, 'aifKind', 'kind', kinds, KIND_LABEL);
  chipGroup(geoChips, 'aifGeo', 'geo', geos, GEO_LABEL);
  chipGroup(statusChips, 'aifStatus', 'status', statuses, STATUS_LABEL);
  for (const button of chapterButtons) {
    const n = Number(button.dataset['aifChapter']);
    hoverable(button, () => {
      const list = lightGroup((entry) => entry.chapters.includes(n), button);
      summarise(`chapter ${String(n).padStart(2, '0')} · ${String(list.length)} sources`, button.getAttribute('title')?.split(' · ')[0] ?? `Chapter ${String(n)}`, list);
    });
    button.addEventListener('click', () => {
      chapter = chapter === n ? null : n;
      apply();
    }, { signal });
  }
  let debounce: (() => void) | null = null;
  search?.addEventListener('input', () => {
    debounce?.();
    debounce = ctl.timeout(() => {
      query = search.value.trim().toLowerCase();
      apply();
    }, 90);
  }, { signal });
  clear?.addEventListener('click', () => {
    kinds.clear();
    geos.clear();
    statuses.clear();
    chapter = null;
    query = '';
    if (search !== null) search.value = '';
    apply();
  }, { signal });

  // ── sweep: pause while off-screen ──────────────────────────────────────────
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((records) => {
      for (const record of records) scope.classList.toggle('is-paused', !record.isIntersecting);
    });
    observer.observe(scope);
    signal.addEventListener('abort', () => {
      observer.disconnect();
    });
  }

  // ── arrival ────────────────────────────────────────────────────────────────
  const hash = location.hash;
  const arrivedRank = /^#aif-(\d{1,3})$/u.exec(hash);
  if (arrivedRank !== null && entries.has(Number(arrivedRank[1]))) pin(Number(arrivedRank[1]));
  const arrivedKind = /^#kind-([a-z]+)$/u.exec(hash);
  if (arrivedKind?.[1] !== undefined && kindChips.some((chip) => chip.dataset['aifKind'] === arrivedKind[1])) toggle(kinds, arrivedKind[1]);
  const arrivedGeo = /^#geo-([a-z]+)$/u.exec(hash);
  if (arrivedGeo?.[1] !== undefined && geoChips.some((chip) => chip.dataset['aifGeo'] === arrivedGeo[1])) toggle(geos, arrivedGeo[1]);
}
