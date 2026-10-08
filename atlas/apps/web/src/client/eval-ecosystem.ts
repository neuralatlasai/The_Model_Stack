/**
 * Evaluation ecosystem behaviour (components/shell/EvalEcosystemExplorer.astro):
 * the priority table, chapter chart, readout, domain × kind matrix, filters,
 * and ledger are one instrument.
 *
 * - Point at a cell or a ledger row: the readout names the entry (rank, kind,
 *   domain, maintainer, rationale, links, chapters) and its chapters and
 *   matrix cell light. Click (or Enter) pins it so its links can be followed;
 *   Esc or a second click releases.
 * - Point at a matrix row, column, or cell, or at a chapter column: its entries
 *   light in the table and the readout summarises the group; click filters.
 * - Flags, access, and text filters drive table and ledger together, with a
 *   live "shown" count. Column buttons sort the ledger in place.
 * - Keyboard: the table is one tab stop; arrows move by cell and by row.
 * - `#eco-N` on arrival pins entry N; `#domain-…` selects that domain.
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const IslandSchema = z.object({
  chapters: z.array(z.object({ n: z.number(), title: z.string(), url: z.string().nullable(), planned: z.boolean() })),
  entries: z.array(
    z.object({
      rank: z.number(),
      name: z.string(),
      type: z.string(),
      why: z.string(),
      kind: z.string(),
      domain: z.string(),
      core: z.boolean(),
      org: z.string().nullable(),
      released: z.string().nullable(),
      access: z.string().nullable(),
      official: z.string().nullable(),
      repo: z.string().nullable(),
      paper: z.string().nullable(),
      sources: z.array(z.object({ n: z.number(), label: z.string(), href: z.string() })),
      chapters: z.array(z.number()),
      named: z.array(z.object({ number: z.string(), title: z.string(), url: z.string() })),
      papers: z.array(z.object({ key: z.string(), url: z.string() })),
      status: z.string(),
      current: z.string().nullable(),
      note: z.string().nullable(),
    }),
  ),
});
type Island = z.infer<typeof IslandSchema>;
type Entry = Island['entries'][number];

const KIND_LABEL: Readonly<Record<string, string>> = {
  leaderboard: 'Leaderboard / index',
  benchmark: 'Benchmark',
  framework: 'Framework / harness',
  platform: 'Platform / service',
};
const KIND_SHORT: Readonly<Record<string, string>> = {
  leaderboard: 'Leaderboard',
  benchmark: 'Benchmark',
  framework: 'Framework',
  platform: 'Platform',
};
const KIND_PLURAL: Readonly<Record<string, string>> = {
  leaderboard: 'leaderboards',
  benchmark: 'benchmarks',
  framework: 'frameworks',
  platform: 'platforms',
};
const pad = (n: number): string => String(n).padStart(2, '0');
const host = (href: string): string => {
  try {
    const u = new URL(href);
    const name = u.hostname.replace(/^www\./u, '');
    const owner = u.pathname.split('/').find((part) => part !== '');
    return (name === 'github.com' || name === 'huggingface.co') && owner !== undefined ? `${name}/${owner}` : name;
  } catch {
    return href;
  }
};

export function initEvalEcosystem(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-eco-explorer]');
  const grid = root?.querySelector<HTMLOListElement>('[data-eco-grid]') ?? null;
  const tbody = root?.querySelector<HTMLTableSectionElement>('[data-eco-table] tbody') ?? null;
  const islandEl = root?.querySelector('[data-eco-data]') ?? null;
  if (root === null || grid === null || tbody === null || islandEl === null) return;
  const parsed = IslandSchema.safeParse(JSON.parse(islandEl.textContent));
  if (!parsed.success) return;
  const island = parsed.data;
  const signal = ctl.signal;

  const entries = new Map(island.entries.map((entry) => [entry.rank, entry]));
  const chapterInfo = new Map(island.chapters.map((chapter) => [chapter.n, chapter]));
  const cells = new Map(
    [...grid.querySelectorAll<HTMLAnchorElement>('[data-eco-cell]')].map((cell) => [
      Number(cell.dataset['ecoCell']),
      cell,
    ]),
  );
  const rows = new Map(
    [...tbody.querySelectorAll<HTMLTableRowElement>('[data-eco-row]')].map((row) => [
      Number(row.dataset['ecoRow']),
      row,
    ]),
  );
  const chapterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-eco-chapter]')];
  const mxCells = [...root.querySelectorAll<HTMLButtonElement>('[data-eco-cell-domain]')];
  const mxDomains = [...root.querySelectorAll<HTMLButtonElement>('[data-eco-domain]')];
  const mxKinds = [...root.querySelectorAll<HTMLButtonElement>('[data-eco-kind]')];

  const out = {
    kicker: root.querySelector<HTMLElement>('[data-eco-kicker]'),
    title: root.querySelector<HTMLElement>('[data-eco-title]'),
    meta: root.querySelector<HTMLElement>('[data-eco-meta]'),
    why: root.querySelector<HTMLElement>('[data-eco-why]'),
    links: root.querySelector<HTMLElement>('[data-eco-links]'),
    book: root.querySelector<HTMLElement>('[data-eco-book]'),
  };
  const readout = root.querySelector<HTMLElement>('[data-eco-readout]');
  // The idle readout carries links (Appendix I, Part XI chapters): keep node copies, not text.
  const initial = Object.fromEntries(
    Object.entries(out).map(([name, el]) => [
      name,
      el === null ? [] : [...el.childNodes].map((node) => node.cloneNode(true)),
    ]),
  ) as Record<keyof typeof out, Node[]>;

  // ── readout ────────────────────────────────────────────────────────────────
  const set = (name: keyof typeof out, ...content: (Node | string)[]): void => {
    const el = out[name];
    if (el === null) return;
    el.replaceChildren(...content);
    // Long titles step down a size so every title fits its two reserved lines.
    if (name === 'title') {
      const length = el.textContent.length;
      el.dataset['len'] = length > 62 ? 'l' : length > 46 ? 'm' : 's';
    }
  };
  const link = (href: string, text: string, external: boolean, className?: string): HTMLAnchorElement => {
    const a = doc.createElement('a');
    a.href = href;
    a.textContent = text;
    if (external) a.rel = 'external';
    if (className !== undefined) a.className = className;
    return a;
  };
  const joined = (parts: readonly (Node | string)[], separator = ' · '): (Node | string)[] =>
    parts.flatMap((part, index) => (index === 0 ? [part] : [separator, part]));
  const label = (text: string): HTMLElement => {
    const b = doc.createElement('b');
    b.textContent = text;
    return b;
  };
  const span = (className: string, text: string): HTMLElement => {
    const el = doc.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  };
  /** The kicker: a boxed badge, then plain text. */
  const kicker = (badge: string, rest: string, domain?: string): void => {
    const b = span('eco-badge', badge);
    if (domain !== undefined) b.classList.add(`eco-d--${domain}`);
    set('kicker', b, ...(rest === '' ? [] : [` ${rest}`]));
  };

  const describe = (entry: Entry, pinnedNow: boolean): void => {
    const domainName =
      root.querySelector(`[data-eco-domain="${entry.domain}"] .eco-mx__label`)?.textContent.trim() ?? entry.domain;
    kicker(
      `#${pad(entry.rank)}`,
      [KIND_SHORT[entry.kind] ?? entry.kind, domainName, pinnedNow ? 'pinned' : null]
        .filter((part) => part !== null)
        .join(' · '),
      entry.domain,
    );
    set('title', entry.current === null ? entry.name : `${entry.name} (now ${entry.current})`);
    set('meta', [entry.org, entry.released, entry.access].filter((part) => part !== null && part !== '').join(' · '));
    // The rationale, verbatim; its verification note stays in the ledger row.
    set('why', entry.why);
    const links: Node[] = [];
    if (entry.official !== null) links.push(link(entry.official, host(entry.official), true));
    if (entry.repo !== null && entry.repo !== entry.official) links.push(link(entry.repo, 'code', true));
    if (entry.paper !== null) links.push(link(entry.paper, 'paper', true));
    for (const source of entry.sources)
      links.push(link(source.href, `list source [${String(source.n)}]`, true, 'is-quiet'));
    if (links.length === 0) set('links', label('No primary link confirmed yet'));
    else set('links', label('Links '), ...joined(links));
    // Chapters as boxed chips (named-in-text first, in oxblood), then the works the atlas cites.
    const namedChapters = new Set(entry.named.map((mention) => Number.parseInt(mention.number, 10)));
    const book: Node[] = [];
    for (const n of entry.chapters) {
      const chapter = chapterInfo.get(n);
      if (chapter?.url === null || chapter?.url === undefined) continue;
      const chip = link(
        chapter.url,
        pad(n),
        false,
        `eco-bk${namedChapters.has(n) ? ' is-named' : ''}${chapter.planned ? ' is-planned' : ''}`,
      );
      chip.title = chapter.title;
      book.push(chip);
    }
    for (const paper of entry.papers.slice(0, 2)) book.push(link(paper.url, paper.key, false, 'eco-bk is-paper'));
    set('book', ...(book.length === 0 ? [span('eco-none', 'no chapter anchor')] : book));
  };
  const summarise = (
    badge: string,
    rest: string,
    title: string,
    list: readonly Entry[],
    extra: (Node | string)[] = [],
    domain?: string,
  ): void => {
    kicker(badge, rest, domain);
    set('title', title);
    // What the group holds beyond its size: the core tier, the book, open code.
    const core = list.filter((entry) => entry.core).length;
    const named = list.filter((entry) => entry.named.length > 0).length;
    const code = list.filter((entry) => entry.repo !== null).length;
    set('meta', `${String(core)} core · ${String(named)} named in the book · ${String(code)} with code`);
    set(
      'why',
      list
        .slice(0, 12)
        .map((entry) => `${String(entry.rank)} ${entry.name}`)
        .join(' · ') + (list.length > 12 ? ' …' : ''),
    );
    set('links', ...extra);
    set('book', '');
  };
  const resetReadout = (): void => {
    for (const name of Object.keys(out) as (keyof typeof out)[])
      set(name, ...initial[name].map((node) => node.cloneNode(true)));
  };

  // ── lighting ───────────────────────────────────────────────────────────────
  let pinned: number | null = null;
  const clearLight = (): void => {
    grid.classList.remove('has-focus');
    for (const cell of cells.values()) cell.classList.remove('is-lit', 'is-focus');
    for (const row of rows.values()) row.classList.remove('is-lit');
    for (const button of [...chapterButtons, ...mxCells, ...mxDomains, ...mxKinds]) button.classList.remove('is-lit');
  };
  const focusEntry = (entry: Entry): void => {
    clearLight();
    cells.get(entry.rank)?.classList.add('is-focus');
    rows.get(entry.rank)?.classList.add('is-lit');
    for (const button of chapterButtons)
      button.classList.toggle('is-lit', entry.chapters.includes(Number(button.dataset['ecoChapter'])));
    for (const button of mxCells)
      button.classList.toggle(
        'is-lit',
        button.dataset['ecoCellDomain'] === entry.domain && button.dataset['ecoCellKind'] === entry.kind,
      );
    for (const button of mxDomains) button.classList.toggle('is-lit', button.dataset['ecoDomain'] === entry.domain);
    for (const button of mxKinds) button.classList.toggle('is-lit', button.dataset['ecoKind'] === entry.kind);
    describe(entry, pinned === entry.rank);
  };
  const lightGroup = (test: (entry: Entry) => boolean, source: HTMLElement | undefined): Entry[] => {
    clearLight();
    grid.classList.add('has-focus');
    const list: Entry[] = [];
    for (const entry of entries.values()) {
      const on = test(entry);
      cells.get(entry.rank)?.classList.toggle('is-lit', on);
      if (on) list.push(entry);
    }
    source?.classList.add('is-lit');
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
    for (const [n, cell] of cells) cell.classList.toggle('is-pinned', n === rank);
    readout?.classList.toggle('is-pinned', rank !== null);
    release();
  };

  const cellFrom = (target: EventTarget | null): HTMLAnchorElement | null =>
    target instanceof Element ? target.closest<HTMLAnchorElement>('[data-eco-cell]') : null;
  const entryOfCell = (cell: HTMLElement | null): Entry | undefined =>
    cell === null ? undefined : entries.get(Number(cell.dataset['ecoCell']));
  grid.addEventListener(
    'pointerover',
    (event) => {
      const entry = entryOfCell(cellFrom(event.target));
      if (entry !== undefined) focusEntry(entry);
    },
    { signal },
  );
  grid.addEventListener('pointerleave', release, { signal });
  grid.addEventListener(
    'focusin',
    (event) => {
      const entry = entryOfCell(cellFrom(event.target));
      if (entry !== undefined) focusEntry(entry);
    },
    { signal },
  );
  grid.addEventListener(
    'click',
    (event) => {
      const cell = cellFrom(event.target);
      const entry = entryOfCell(cell);
      if (entry === undefined || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      pin(pinned === entry.rank ? null : entry.rank);
    },
    { signal },
  );
  tbody.addEventListener(
    'pointerover',
    (event) => {
      const row = event.target instanceof Element ? event.target.closest<HTMLTableRowElement>('[data-eco-row]') : null;
      const entry = row === null ? undefined : entries.get(Number(row.dataset['ecoRow']));
      if (entry !== undefined) focusEntry(entry);
    },
    { signal },
  );
  tbody.addEventListener('pointerleave', release, { signal });
  doc.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && pinned !== null) pin(null);
    },
    { signal },
  );

  // ── filters ────────────────────────────────────────────────────────────────
  const domains = new Set<string>();
  const kinds = new Set<string>();
  const flags = new Set<string>();
  const access = new Set<string>();
  let pair: { domain: string; kind: string } | null = null;
  let chapter: number | null = null;
  let query = '';
  const shown = root.querySelector<HTMLElement>('[data-eco-shown]');
  const clear = root.querySelector<HTMLButtonElement>('[data-eco-clear]');
  const search = root.querySelector<HTMLInputElement>('[data-eco-search]');

  const visibleOf = (entry: Entry, row: HTMLTableRowElement | undefined): boolean =>
    (domains.size === 0 || domains.has(entry.domain)) &&
    (kinds.size === 0 || kinds.has(entry.kind)) &&
    (pair === null || (entry.domain === pair.domain && entry.kind === pair.kind)) &&
    (chapter === null || entry.chapters.includes(chapter)) &&
    (access.size === 0 || (entry.access !== null && access.has(entry.access))) &&
    [...flags].every((flag) => row?.dataset[flag] === 'yes') &&
    (query === '' || query.split(/\s+/u).every((term) => row?.dataset['text']?.includes(term) === true));

  const apply = (): void => {
    let count = 0;
    for (const entry of entries.values()) {
      const row = rows.get(entry.rank);
      const visible = visibleOf(entry, row);
      if (row !== undefined) row.hidden = !visible;
      cells.get(entry.rank)?.classList.toggle('is-filtered', !visible);
      if (visible) count += 1;
    }
    if (shown !== null) shown.textContent = `${String(count)} of ${String(entries.size)}`;
    const active =
      domains.size +
        kinds.size +
        flags.size +
        access.size +
        (pair === null ? 0 : 1) +
        (chapter === null ? 0 : 1) +
        (query === '' ? 0 : 1) >
      0;
    if (clear !== null) clear.hidden = !active;
    for (const button of mxDomains)
      button.setAttribute('aria-pressed', String(domains.has(button.dataset['ecoDomain'] ?? '')));
    for (const button of mxKinds)
      button.setAttribute('aria-pressed', String(kinds.has(button.dataset['ecoKind'] ?? '')));
    for (const button of mxCells)
      button.setAttribute(
        'aria-pressed',
        String(
          pair !== null &&
            button.dataset['ecoCellDomain'] === pair.domain &&
            button.dataset['ecoCellKind'] === pair.kind,
        ),
      );
    for (const button of chapterButtons)
      button.setAttribute('aria-pressed', String(Number(button.dataset['ecoChapter']) === chapter));
  };
  const toggle = (set: Set<string>, value: string): void => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
    apply();
  };

  const hoverable = (button: HTMLElement, onLight: () => void): void => {
    button.addEventListener('pointerenter', onLight, { signal });
    button.addEventListener('focus', onLight, { signal });
    button.addEventListener('pointerleave', release, { signal });
    button.addEventListener('blur', release, { signal });
  };
  const all = [...entries.values()];
  for (const button of mxDomains) {
    const domain = button.dataset['ecoDomain'] ?? '';
    const light = (): void => {
      const list = lightGroup((entry) => entry.domain === domain, button);
      summarise(
        'Domain',
        `${String(list.length)} systems`,
        button.title === '' ? domain : button.title,
        list,
        [],
        domain,
      );
    };
    hoverable(button, light);
    button.addEventListener(
      'click',
      () => {
        toggle(domains, domain);
      },
      { signal },
    );
  }
  for (const button of mxKinds) {
    const kind = button.dataset['ecoKind'] ?? '';
    const light = (): void => {
      const list = lightGroup((entry) => entry.kind === kind, button);
      summarise('Kind', `${String(list.length)} systems`, KIND_LABEL[kind] ?? kind, list);
    };
    hoverable(button, light);
    button.addEventListener(
      'click',
      () => {
        toggle(kinds, kind);
      },
      { signal },
    );
  }
  for (const button of mxCells) {
    const domain = button.dataset['ecoCellDomain'] ?? '';
    const kind = button.dataset['ecoCellKind'] ?? '';
    const light = (): void => {
      const list = lightGroup((entry) => entry.domain === domain && entry.kind === kind, button);
      const domainName =
        root.querySelector(`[data-eco-domain="${domain}"] .eco-mx__label`)?.textContent.trim() ?? domain;
      summarise(String(list.length), 'systems', `${domainName} × ${KIND_PLURAL[kind] ?? kind}`, list, [], domain);
    };
    hoverable(button, light);
    button.addEventListener(
      'click',
      () => {
        pair = pair !== null && pair.domain === domain && pair.kind === kind ? null : { domain, kind };
        apply();
      },
      { signal },
    );
  }
  for (const button of chapterButtons) {
    const n = Number(button.dataset['ecoChapter']);
    const info = chapterInfo.get(n);
    const light = (): void => {
      const list = lightGroup((entry) => entry.chapters.includes(n), button);
      const named = list.filter((entry) => entry.named.some((mention) => mention.url.includes(`/ch${pad(n)}-`))).length;
      const extra =
        info?.url === null || info?.url === undefined
          ? []
          : [link(info.url, info.planned ? `Chapter ${pad(n)} (planned) →` : `Open chapter ${pad(n)} →`, false)];
      summarise(
        `Ch ${pad(n)}`,
        `${String(list.length)} systems${named > 0 ? ` · ${String(named)} named` : ''}`,
        info?.title ?? `Chapter ${pad(n)}`,
        list,
        extra,
      );
    };
    hoverable(button, light);
    button.addEventListener(
      'click',
      () => {
        chapter = chapter === n ? null : n;
        apply();
      },
      { signal },
    );
  }

  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-eco-flag]')) {
    chip.addEventListener(
      'click',
      () => {
        toggle(flags, chip.dataset['ecoFlag'] ?? '');
        chip.setAttribute('aria-pressed', String(flags.has(chip.dataset['ecoFlag'] ?? '')));
      },
      { signal },
    );
  }
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-eco-access]')) {
    chip.addEventListener(
      'click',
      () => {
        toggle(access, chip.dataset['ecoAccess'] ?? '');
        chip.setAttribute('aria-pressed', String(access.has(chip.dataset['ecoAccess'] ?? '')));
      },
      { signal },
    );
  }
  let debounce: (() => void) | null = null;
  search?.addEventListener(
    'input',
    () => {
      debounce?.();
      debounce = ctl.timeout(() => {
        query = search.value.trim().toLowerCase();
        apply();
      }, 90);
    },
    { signal },
  );
  clear?.addEventListener(
    'click',
    () => {
      domains.clear();
      kinds.clear();
      flags.clear();
      access.clear();
      pair = null;
      chapter = null;
      query = '';
      if (search !== null) search.value = '';
      for (const chip of root.querySelectorAll('[data-eco-flag], [data-eco-access]'))
        chip.setAttribute('aria-pressed', 'false');
      apply();
    },
    { signal },
  );

  // ── sorting ────────────────────────────────────────────────────────────────
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-eco-sort]')) {
    button.addEventListener(
      'click',
      () => {
        const by = button.dataset['ecoSort'] ?? 'rank';
        const th = button.closest('th');
        const descending = th?.getAttribute('aria-sort') === 'ascending';
        for (const other of root.querySelectorAll('thead th[aria-sort]')) other.setAttribute('aria-sort', 'none');
        th?.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
        const sorted = [...rows.entries()].sort(([a, ra], [b, rb]) => {
          const order = by === 'name' ? (ra.dataset['name'] ?? '').localeCompare(rb.dataset['name'] ?? '') : a - b;
          return descending ? -order : order;
        });
        tbody.append(...sorted.map(([, row]) => row));
      },
      { signal },
    );
  }

  // ── keyboard: one tab stop; arrows by cell, up/down by row ─────────────────
  const columns = (): number =>
    getComputedStyle(grid)
      .gridTemplateColumns.split(' ')
      .filter((part) => part !== '').length || 10;
  grid.addEventListener(
    'keydown',
    (event) => {
      const cell = cellFrom(event.target);
      if (cell === null) return;
      const at = Number(cell.dataset['ecoCell']);
      const step: Readonly<Record<string, number>> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: columns(),
        ArrowUp: -columns(),
      };
      const delta = step[event.key];
      const next =
        event.key === 'Home'
          ? 1
          : event.key === 'End'
            ? all.length
            : delta === undefined
              ? null
              : Math.max(1, Math.min(all.length, at + delta));
      if (next === null) return;
      event.preventDefault();
      for (const other of cells.values()) other.setAttribute('tabindex', '-1');
      const target = cells.get(next);
      target?.setAttribute('tabindex', '0');
      target?.focus();
    },
    { signal },
  );

  // ── arrival ────────────────────────────────────────────────────────────────
  const hash = location.hash;
  const arrivedRank = /^#eco-(\d{1,3})$/u.exec(hash);
  if (arrivedRank !== null && entries.has(Number(arrivedRank[1]))) pin(Number(arrivedRank[1]));
  const arrivedDomain = /^#domain-([a-z]+)$/u.exec(hash);
  if (arrivedDomain?.[1] !== undefined && mxDomains.some((button) => button.dataset['ecoDomain'] === arrivedDomain[1]))
    toggle(domains, arrivedDomain[1]);
}
