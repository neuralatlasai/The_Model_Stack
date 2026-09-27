/**
 * AI futures behaviour (components/shell/AiFuturesExplorer.astro): the field
 * panel, the share bands, the unit histogram, and the ranked index are one
 * instrument around one lit source.
 *
 * - Point at any mark (line column, chip, tile, circle, band column, unit,
 *   index line): that source lights everywhere — the line's dot and drop, its
 *   chip, tile, circle, unit, band label and index line — and the readouts
 *   name it. Click a mark to pin it; Esc or a second click releases.
 * - Each chart is one keyboard stop, a slider over the ranking: arrows step,
 *   PageUp/PageDown jump ten, Home/End go to the ends, Enter pins.
 * - Kind row labels and geography boundary labels light their group on hover
 *   and filter the index on click; status chips and the search filter too.
 * - Idle and on screen, the lit source advances every ADVANCE_MS through the
 *   ranking (only the sources the filters leave); any interaction stops it
 *   until IDLE_MS of quiet. Never under reduced motion, off-screen, or pinned.
 * - `#aif-N` on arrival pins entry N; `#kind-…` / `#geo-…` filter.
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const ADVANCE_MS = 3000;
const IDLE_MS = 9000;

const IslandSchema = z.object({
  entries: z.array(
    z.object({
      rank: z.number(),
      name: z.string(),
      kind: z.string(),
      geo: z.string(),
      fit: z.number(),
      status: z.string(),
      named: z.boolean(),
      description: z.string().nullable(),
      reason: z.string(),
      url: z.string(),
      x: z.number(),
      y: z.number(),
      nx: z.number(),
      ny: z.number(),
    }),
  ),
  kinds: z.record(z.string(), z.string()),
  geos: z.record(z.string(), z.string()),
  statuses: z.record(z.string(), z.string()),
});
type Entry = z.infer<typeof IslandSchema>['entries'][number];

/** The first sentence: the readout carries one line; the index carries the rest. */
const firstSentence = (text: string): string => /^.+?[.;](?=\s+\p{Lu}|$)/u.exec(text)?.[0] ?? text;

export function initAiFutures(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-aif-explorer]');
  const islandEl = root?.querySelector('[data-aif-data]') ?? null;
  if (root === null || islandEl === null) return;
  const parsed = IslandSchema.safeParse(JSON.parse(islandEl.textContent));
  if (!parsed.success) return;
  const { kinds: KIND, geos: GEO, statuses: STATUS } = parsed.data;
  const signal = ctl.signal;
  const on = <K extends keyof HTMLElementEventMap>(
    el: EventTarget | null,
    type: K,
    fn: (event: HTMLElementEventMap[K]) => void,
  ): void => {
    el?.addEventListener(type, fn as EventListener, { signal });
  };

  const list = parsed.data.entries;
  const entries = new Map(list.map((entry) => [entry.rank, entry]));
  const marks = new Map<number, Element[]>();
  for (const el of root.querySelectorAll('[data-aif-r]')) {
    const rank = Number(el.getAttribute('data-aif-r'));
    const bucket = marks.get(rank);
    if (bucket === undefined) marks.set(rank, [el]);
    else bucket.push(el);
  }
  const lines = new Map(
    [...root.querySelectorAll<HTMLLIElement>('[data-aif-line]')].map((li) => [Number(li.dataset['aifLine']), li]),
  );
  const sliders = [...root.querySelectorAll<HTMLElement>('[data-aif-slider]')];
  const kindButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-kind]')];
  const geoButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-geo]')];
  const statusButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-aif-status]')];
  const bandLabels = [...root.querySelectorAll<SVGGElement>('.aif-area__lab')];
  const panel = root.querySelector<HTMLElement>('[data-aif-panel]');

  // ── the field line ─────────────────────────────────────────────────────────
  // One dot and drop per drawn variant (wide, narrow); each knows its own axis.
  const dots = [...root.querySelectorAll<SVGGElement>('[data-aif-dot]')].map((g) => ({
    g,
    narrow: g.dataset['aifDot'] === 'narrow',
    base: Number(g.dataset['base'] ?? 0),
    drop: root.querySelector<SVGRectElement>(`[data-aif-drop="${g.dataset['aifDot'] ?? ''}"]`),
  }));
  const cursors = [...root.querySelectorAll<SVGGElement>('[data-aif-cursor]')].map((g) => {
    const svg = g.ownerSVGElement;
    return { g, left: Number(svg?.dataset['left'] ?? 0), plot: Number(svg?.dataset['plot'] ?? 1) };
  });
  const moveLine = (entry: Entry): void => {
    for (const { g, narrow, base, drop } of dots) {
      const x = narrow ? entry.nx : entry.x;
      const y = narrow ? entry.ny : entry.y;
      g.style.transform = `translate(${String(x)}px,${String(y)}px)`;
      if (drop !== null) {
        drop.style.transform = `translate(${String(x)}px,${String(y)}px)`;
        drop.style.height = `${String(Math.max(0, base - y))}px`;
      }
    }
    const t = (entry.rank - 1) / Math.max(1, list.length - 1);
    for (const { g, left, plot } of cursors) g.style.transform = `translateX(${String(left + t * plot)}px)`;
  };

  // ── readouts ───────────────────────────────────────────────────────────────
  const readout = root.querySelector<HTMLElement>('[data-aif-readout]');
  const o = (name: string): HTMLElement | SVGElement | null =>
    readout?.querySelector<HTMLElement | SVGElement>(`[data-aif-o="${name}"]`) ?? null;
  const out = {
    rank: o('rank'),
    fit: o('fit'),
    status: o('status'),
    stuse: o('stuse'),
    sttext: o('sttext'),
    pin: o('pin'),
    book: o('book'),
    name: o('name'),
    chip: o('chip'),
    kinduse: o('kinduse'),
    kind: o('kind'),
    geo: o('geo'),
    desc: o('desc'),
  };
  const minis = [...root.querySelectorAll<HTMLElement>('[data-aif-mini]')];
  const valueText = (entry: Entry): string =>
    `#${String(entry.rank)} ${entry.name}, ${KIND[entry.kind] ?? entry.kind}, ${GEO[entry.geo] ?? entry.geo}, fit ${String(entry.fit)}`;
  const describe = (entry: Entry): void => {
    if (out.rank !== null) out.rank.textContent = `#${String(entry.rank)}`;
    if (out.fit !== null) out.fit.textContent = `fit ${String(entry.fit)}`;
    out.status?.setAttribute('class', `aif-readout__st is-${entry.status}`);
    out.stuse?.setAttribute('href', `#aif-st-${entry.status}`);
    if (out.sttext !== null) out.sttext.textContent = STATUS[entry.status] ?? entry.status;
    if (out.pin instanceof HTMLElement) out.pin.hidden = pinned !== entry.rank;
    if (out.book instanceof HTMLElement) out.book.hidden = !entry.named;
    if (out.name instanceof HTMLAnchorElement) {
      out.name.href = entry.url;
      out.name.textContent = entry.name;
    }
    out.chip?.setAttribute('class', `aif-chip aif-geo--${entry.geo} is-${entry.status}`);
    out.kinduse?.setAttribute('href', `#aif-ic-${entry.kind}`);
    if (out.kind !== null) out.kind.textContent = KIND[entry.kind] ?? entry.kind;
    if (out.geo !== null) out.geo.textContent = GEO[entry.geo] ?? entry.geo;
    if (out.desc !== null)
      out.desc.textContent =
        entry.description === null ? `Supplier’s reason: ${entry.reason}` : firstSentence(entry.description);
    readout?.classList.toggle('is-pinned', pinned === entry.rank);
    for (const mini of minis) {
      const b = doc.createElement('b');
      b.textContent = `#${String(entry.rank)}`;
      const name = doc.createElement('span');
      name.className = 'aif-mini__name';
      name.textContent = entry.name;
      const rest = doc.createElement('span');
      rest.textContent = `${KIND[entry.kind] ?? entry.kind} · ${GEO[entry.geo] ?? entry.geo} · fit ${String(entry.fit)}`;
      mini.replaceChildren(b, name, rest);
    }
  };

  // ── the lit source ─────────────────────────────────────────────────────────
  let active = 1;
  let pinned: number | null = null;
  const light = (rank: number, by: 'auto' | 'user'): void => {
    const entry = entries.get(rank);
    if (entry === undefined) return;
    for (const el of marks.get(active) ?? []) el.classList.remove('is-on');
    active = rank;
    for (const el of marks.get(rank) ?? []) el.classList.add('is-on');
    for (const label of bandLabels) label.classList.toggle('is-kind', label.dataset['kind'] === entry.kind);
    moveLine(entry);
    readout?.setAttribute('aria-live', by === 'auto' ? 'off' : 'polite');
    describe(entry);
    const text = valueText(entry);
    for (const slider of sliders) {
      slider.setAttribute('aria-valuenow', String(rank));
      slider.setAttribute('aria-valuetext', text);
    }
  };
  const pin = (rank: number | null): void => {
    for (const el of marks.get(pinned ?? 0) ?? []) el.classList.remove('is-pinned');
    pinned = rank;
    for (const el of marks.get(rank ?? 0) ?? []) el.classList.add('is-pinned');
    light(rank ?? active, 'user');
  };
  const settle = (): void => {
    if (pinned !== null && active !== pinned) light(pinned, 'user');
  };

  // ── interaction clock: any touch of the page's instruments pauses the advance
  let lastUser = -Infinity;
  let hovering = 0;
  const touch = (): void => {
    lastUser = performance.now();
  };

  const rankFrom = (target: EventTarget | null): number | null => {
    const el = target instanceof Element ? target.closest('[data-aif-r]') : null;
    if (el === null || !root.contains(el)) return null;
    const rank = Number(el.getAttribute('data-aif-r'));
    return entries.has(rank) ? rank : null;
  };
  const areaRank = (event: PointerEvent | MouseEvent): number | null => {
    const svg = event.target instanceof Element ? event.target.closest<SVGSVGElement>('.aif-area__svg') : null;
    if (svg === null) return null;
    const box = svg.getBoundingClientRect();
    const view = svg.viewBox.baseVal;
    const x = ((event.clientX - box.left) / box.width) * view.width;
    const left = Number(svg.dataset['left'] ?? 0);
    const plot = Number(svg.dataset['plot'] ?? 1);
    return Math.round(Math.min(1, Math.max(0, (x - left) / plot)) * (list.length - 1)) + 1;
  };

  on(root, 'pointerover', (event) => {
    const rank = rankFrom(event.target);
    if (rank === null) return;
    touch();
    if (rank !== active) light(rank, 'user');
  });
  on(root, 'pointermove', (event) => {
    const rank = areaRank(event);
    if (rank === null) return;
    touch();
    if (rank !== active) light(rank, 'user');
  });
  for (const zone of root.querySelectorAll<HTMLElement>('[data-aif-inst], .aif-index')) {
    on(zone, 'pointerenter', () => {
      hovering += 1;
      touch();
    });
    on(zone, 'pointerleave', () => {
      hovering = Math.max(0, hovering - 1);
      touch();
      settle();
    });
  }
  on(root, 'click', (event) => {
    if (
      !(event.target instanceof Element) ||
      event.target.closest('a, button, input, summary, [data-aif-line]') !== null
    )
      return;
    const rank = rankFrom(event.target) ?? areaRank(event);
    if (rank === null) return;
    touch();
    pin(pinned === rank ? null : rank);
  });
  on(root.querySelector('[data-aif-index]'), 'focusin', (event) => {
    const rank = rankFrom(event.target);
    if (rank === null) return;
    touch();
    light(rank, 'user');
  });
  on(doc, 'keydown', (event) => {
    if (event.key === 'Escape' && pinned !== null) {
      touch();
      pin(null);
    }
  });

  // ── sliders: every chart is one keyboard stop over the ranking ─────────────
  const order = (): number[] => list.filter((entry) => visible(entry)).map((entry) => entry.rank);
  for (const slider of sliders) {
    on(slider, 'focus', () => {
      touch();
      hovering += 1;
    });
    on(slider, 'blur', () => {
      hovering = Math.max(0, hovering - 1);
      settle();
    });
    on(slider, 'keydown', (event) => {
      const ranks = order();
      if (ranks.length === 0) return;
      const step: Record<string, number> = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
        PageDown: 10,
        PageUp: -10,
      };
      const by = step[event.key] ?? 0;
      // A lit source the filters hide counts as sitting between its visible neighbours.
      const found = ranks.indexOf(active);
      const after = ranks.findIndex((rank) => rank > active);
      const at =
        found >= 0 ? found : by > 0 ? (after < 0 ? ranks.length : after) - 1 : after < 0 ? ranks.length : after;
      let next: number | undefined;
      if (by !== 0) next = ranks[Math.min(ranks.length - 1, Math.max(0, at + by))];
      else if (event.key === 'Home') next = ranks[0];
      else if (event.key === 'End') next = ranks.at(-1);
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        touch();
        pin(pinned === active ? null : active);
        return;
      } else return;
      event.preventDefault();
      touch();
      if (next !== undefined) light(next, 'user');
    });
  }

  // ── groups and filters ─────────────────────────────────────────────────────
  const kinds = new Set<string>();
  const geos = new Set<string>();
  const statuses = new Set<string>();
  let query = '';
  const shown = root.querySelector<HTMLElement>('[data-aif-shown]');
  const clear = root.querySelector<HTMLButtonElement>('[data-aif-clear]');
  const search = root.querySelector<HTMLInputElement>('[data-aif-search]');
  const tokens = root.querySelector<HTMLElement>('[data-aif-tokens]');

  function visible(entry: Entry): boolean {
    return (
      (kinds.size === 0 || kinds.has(entry.kind)) &&
      (geos.size === 0 || geos.has(entry.geo)) &&
      (statuses.size === 0 || statuses.has(entry.status)) &&
      (query === '' ||
        query.split(/\s+/u).every((term) => lines.get(entry.rank)?.dataset['text']?.includes(term) === true))
    );
  }

  const groupOff = (): void => {
    root.classList.remove('has-group');
    for (const els of marks.values()) for (const el of els) el.classList.remove('is-in');
    for (const button of [...kindButtons, ...geoButtons]) button.classList.remove('is-lit');
    for (const label of bandLabels) label.classList.remove('is-in');
  };
  const groupOn = (test: (entry: Entry) => boolean, source: HTMLElement): void => {
    groupOff();
    root.classList.add('has-group');
    source.classList.add('is-lit');
    for (const entry of list) {
      const inside = test(entry);
      for (const el of marks.get(entry.rank) ?? []) el.classList.toggle('is-in', inside);
    }
  };

  const apply = (): void => {
    let count = 0;
    for (const entry of list) {
      const shownNow = visible(entry);
      const li = lines.get(entry.rank);
      if (li !== undefined) li.hidden = !shownNow;
      for (const el of marks.get(entry.rank) ?? []) if (el !== li) el.classList.toggle('is-out', !shownNow);
      if (shownNow) count += 1;
    }
    if (shown !== null) shown.textContent = `${String(count)} of ${String(list.length)}`;
    const any = kinds.size + geos.size + statuses.size + (query === '' ? 0 : 1) > 0;
    if (clear !== null) clear.hidden = !any;
    for (const button of kindButtons)
      button.setAttribute('aria-pressed', String(kinds.has(button.dataset['aifKind'] ?? '')));
    for (const button of geoButtons)
      button.setAttribute('aria-pressed', String(geos.has(button.dataset['aifGeo'] ?? '')));
    for (const button of statusButtons)
      button.setAttribute('aria-pressed', String(statuses.has(button.dataset['aifStatus'] ?? '')));
    if (tokens !== null) {
      const make = (label: string, cls: string, remove: () => void): HTMLButtonElement => {
        const button = doc.createElement('button');
        button.type = 'button';
        button.className = `aif-token ${cls}`;
        button.setAttribute('aria-label', `Remove filter: ${label}`);
        const x = doc.createElement('span');
        x.setAttribute('aria-hidden', 'true');
        x.textContent = '×';
        button.append(label, x);
        button.addEventListener('click', remove, { signal });
        return button;
      };
      tokens.replaceChildren(
        ...[...kinds].map((kind) =>
          make(KIND[kind] ?? kind, 'is-kind', () => {
            kinds.delete(kind);
            apply();
          }),
        ),
        ...[...geos].map((geo) =>
          make(GEO[geo] ?? geo, 'is-geo', () => {
            geos.delete(geo);
            apply();
          }),
        ),
      );
    }
  };
  const toggle = (bucket: Set<string>, value: string): void => {
    if (bucket.has(value)) bucket.delete(value);
    else bucket.add(value);
    apply();
  };
  const groupButton = (button: HTMLButtonElement, field: 'kind' | 'geo', bucket: Set<string>, value: string): void => {
    const lightUp = (): void => {
      touch();
      groupOn((entry) => entry[field] === value, button);
      if (field === 'kind')
        for (const label of bandLabels) label.classList.toggle('is-in', label.dataset['kind'] === value);
    };
    on(button, 'pointerenter', lightUp);
    on(button, 'focus', lightUp);
    on(button, 'pointerleave', groupOff);
    on(button, 'blur', groupOff);
    on(button, 'click', () => {
      touch();
      toggle(bucket, value);
    });
  };
  for (const button of kindButtons) groupButton(button, 'kind', kinds, button.dataset['aifKind'] ?? '');
  for (const button of geoButtons) groupButton(button, 'geo', geos, button.dataset['aifGeo'] ?? '');
  for (const button of statusButtons) {
    on(button, 'click', () => {
      toggle(statuses, button.dataset['aifStatus'] ?? '');
    });
  }
  let cancelSearch: (() => void) | null = null;
  on(search, 'input', () => {
    cancelSearch?.();
    cancelSearch = ctl.timeout(() => {
      query = search?.value.trim().toLowerCase() ?? '';
      apply();
    }, 90);
  });
  on(clear, 'click', () => {
    kinds.clear();
    geos.clear();
    statuses.clear();
    query = '';
    if (search !== null) search.value = '';
    apply();
  });

  // ── auto-advance: alive while idle and on screen ───────────────────────────
  const reduce = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const seen = new Set<Element>();
  const tick = (): void => {
    const idle = performance.now() - lastUser > IDLE_MS && hovering === 0;
    if (seen.size > 0 && idle && pinned === null && reduce?.matches !== true && doc.visibilityState === 'visible') {
      const ranks = order();
      if (ranks.length > 0) {
        const next = ranks.find((rank) => rank > active) ?? ranks[0];
        if (next !== undefined) light(next, 'auto');
      }
    }
  };
  if (typeof IntersectionObserver === 'function') {
    const observer = ctl.observe(
      new IntersectionObserver((records) => {
        for (const record of records) {
          if (record.isIntersecting) seen.add(record.target);
          else seen.delete(record.target);
        }
      }),
    );
    for (const zone of [panel, ...root.querySelectorAll('.aif-area, .aif-units')])
      if (zone !== null) observer.observe(zone);
  }

  // ── arrival ────────────────────────────────────────────────────────────────
  light(1, 'auto');
  apply();
  const hash = location.hash;
  const arrivedRank = /^#aif-(\d{1,3})$/u.exec(hash);
  if (arrivedRank !== null && entries.has(Number(arrivedRank[1]))) {
    touch();
    pin(Number(arrivedRank[1]));
  }
  const arrivedKind = /^#kind-([a-z]+)$/u.exec(hash)?.[1];
  if (arrivedKind !== undefined && kindButtons.some((button) => button.dataset['aifKind'] === arrivedKind))
    toggle(kinds, arrivedKind);
  const arrivedGeo = /^#geo-([a-z]+)$/u.exec(hash)?.[1];
  if (arrivedGeo !== undefined && geoButtons.some((button) => button.dataset['aifGeo'] === arrivedGeo))
    toggle(geos, arrivedGeo);
  const timer = setInterval(tick, ADVANCE_MS);
  ctl.defer(() => {
    clearInterval(timer);
  });
}
