/**
 * Equations behaviour (components/shell/EquationsExplorer.astro): the chapter
 * strip, the symbol index, the sticky barcode, and the grouped index are one
 * instrument around one fixed-size readout.
 *
 * - Point at a symbol (index chip, or a dotted symbol in any row): its thread
 *   lights — cells in the strip and the barcode, the rows that use it, the
 *   symbol inside their rendered math (equations.ts), and each chapter's share
 *   ("4/27"). The readout lists what the chapters declare it to mean.
 * - Point at an equation (row, strip cell, barcode cell): the equations that
 *   share notation with it light at three strengths and say "shares 3"; its
 *   chapter lights; the readout names the closest equations by shared symbols
 *   (rarer symbols weigh more).
 * - Point at a chapter: its cells and its vocabulary in the symbol index light.
 * - Click pins a chapter or a symbol as a filter; the search matches symbols
 *   (Greek spelled out too), meanings, sections, and numbers; "shown N of M".
 * - Scrolling: the equations in view are a darker band in the barcode and the
 *   chapter being read is marked; the barcode's status line follows.
 * - Keyboard: the strip and the symbol index are one tab stop each; arrows
 *   move, Enter pins, Escape clears. `#sym-<symbol>` on arrival pins it.
 */
import type { PageContext } from './page.ts';

interface Eq {
  readonly id: string;
  readonly ch: string;
  readonly row: HTMLElement;
  readonly syms: readonly string[];
  readonly text: string;
  readonly where: string;
  readonly cell: HTMLElement | null;
  readonly bcell: HTMLElement | null;
  readonly share: HTMLElement | null;
  readonly meta: HTMLElement | null;
  readonly line: HTMLElement | null;
}

interface Chapter {
  readonly key: string;
  readonly el: HTMLElement;
  readonly button: HTMLButtonElement | null;
  readonly count: HTMLElement | null;
  readonly bar: HTMLElement | null;
  readonly group: HTMLElement | null;
  readonly label: string;
  readonly title: string;
  readonly eqs: Eq[];
}

type Focus = { readonly kind: 'symbol' | 'equation' | 'chapter'; readonly id: string } | null;

const LIGHT_CLASSES = ['is-lit', 'is-focus', 'is-s1', 'is-s2', 'is-s3'] as const;
const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initEquationsExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-equations-explorer]');
  const strip = root?.querySelector<HTMLElement>('[data-eqx-strip]') ?? null;
  const symidx = root?.querySelector<HTMLElement>('[data-eqx-symidx]') ?? null;
  const index = root?.querySelector<HTMLElement>('.eqx-index') ?? null;
  const bar = root?.querySelector<HTMLElement>('[data-eqx-bar]') ?? null;
  if (root === null || strip === null || symidx === null || index === null) return;
  const signal = ctl.signal;
  root.classList.add('is-enhanced');

  // ── model ──────────────────────────────────────────────────────────────────
  const cellOf = new Map([...strip.querySelectorAll<HTMLElement>('[data-eqx-cell]')].map((cell) => [cell.dataset['eqxCell'] ?? '', cell]));
  const bcellOf = new Map([...(bar?.querySelectorAll<HTMLElement>('[data-eqx-bcell]') ?? [])].map((cell) => [cell.dataset['eqxBcell'] ?? '', cell]));
  const eqs: Eq[] = [...index.querySelectorAll<HTMLElement>('[data-eqx-row]')].map((row) => {
    const id = row.dataset['eqxRow'] ?? '';
    return {
      id,
      ch: row.dataset['ch'] ?? '',
      row,
      syms: (row.dataset['syms'] ?? '').split(' ').filter((key) => key !== ''),
      text: row.dataset['text'] ?? '',
      where: row.querySelector('.eqx-row__where')?.textContent.trim() ?? '',
      cell: cellOf.get(id) ?? null,
      bcell: bcellOf.get(id) ?? null,
      share: row.querySelector<HTMLElement>('[data-eqx-share]'),
      meta: row.querySelector<HTMLElement>('.eqx-row__meta'),
      line: row.querySelector<HTMLElement>('[data-eqx-line]'),
    };
  });
  const byId = new Map(eqs.map((eq) => [eq.id, eq]));
  const bySym = new Map<string, Eq[]>();
  for (const eq of eqs) for (const key of eq.syms) bySym.set(key, [...(bySym.get(key) ?? []), eq]);
  const idf = (key: string): number => Math.log(1 + eqs.length / Math.max(1, bySym.get(key)?.length ?? 1));

  const chapters: Chapter[] = [...strip.querySelectorAll<HTMLElement>('[data-eqx-ch]')].map((el) => {
    const key = el.dataset['eqxCh'] ?? '';
    const button = el.querySelector<HTMLButtonElement>('[data-eqx-chbtn]');
    return {
      key,
      el,
      button,
      count: el.querySelector<HTMLElement>('[data-eqx-chcount]'),
      bar: bar?.querySelector<HTMLElement>(`[data-eqx-barch="${CSS.escape(key)}"]`) ?? null,
      group: index.querySelector<HTMLElement>(`[data-eqx-group="${CSS.escape(key)}"]`),
      label: el.querySelector('.eqx-ch__n')?.textContent.trim() ?? key,
      title: button?.getAttribute('title') ?? '',
      eqs: eqs.filter((eq) => eq.ch === key),
    };
  });
  const chapterOf = new Map(chapters.map((chapter) => [chapter.key, chapter]));
  const buttons = chapters.map((chapter) => chapter.button).filter((button): button is HTMLButtonElement => button !== null);
  const chips = [...symidx.querySelectorAll<HTMLButtonElement>('[data-eqx-sym]')];
  const chipOf = new Map(chips.map((chip) => [chip.dataset['eqxSym'] ?? '', chip]));

  const out = {
    kicker: root.querySelector<HTMLElement>('[data-eqx-kicker]'),
    title: root.querySelector<HTMLElement>('[data-eqx-title]'),
    meta: root.querySelector<HTMLElement>('[data-eqx-meta]'),
    list: root.querySelector<HTMLElement>('[data-eqx-list]'),
  };
  // Server-rendered markup of our own component, restored verbatim on release.
  const initial = { kicker: out.kicker?.innerHTML ?? '', title: out.title?.innerHTML ?? '', meta: out.meta?.innerHTML ?? '', list: out.list?.innerHTML ?? '' };
  const status = root.querySelector<HTMLElement>('[data-eqx-status]');
  const shown = root.querySelector<HTMLElement>('[data-eqx-shown]');
  const pins = root.querySelector<HTMLElement>('[data-eqx-pins]');
  const clearButton = root.querySelector<HTMLButtonElement>('[data-eqx-clear]');
  const more = root.querySelector<HTMLButtonElement>('[data-eqx-more]');
  const search = root.querySelector<HTMLInputElement>('[data-eqx-search]');

  // ── small DOM helpers ──────────────────────────────────────────────────────
  /** A symbol key set like SymbolGlyph.astro. */
  const glyph = (key: string): HTMLElement => {
    const cut = key.indexOf('_');
    const base = cut === -1 ? key : key.slice(0, cut);
    const sub = cut === -1 ? '' : key.slice(cut + 1);
    const span = doc.createElement('span');
    const italic = /^[A-Za-zα-ω]$/u.test(base);
    span.className = `sg ${italic ? 'sg--it' : 'sg--rm'}`;
    span.append(base);
    if (sub !== '') {
      const s = doc.createElement('sub');
      s.textContent = sub;
      span.append(s);
    }
    return span;
  };
  const glyphs = (keys: readonly string[]): (Node | string)[] => keys.flatMap((key, i) => (i === 0 ? [glyph(key)] : [' · ', glyph(key)]));
  const put = (el: HTMLElement | null, ...parts: (Node | string)[]): void => {
    el?.replaceChildren(...parts);
  };
  const line = (lead: Node | string, ...rest: (Node | string)[]): HTMLLIElement => {
    const li = doc.createElement('li');
    const b = doc.createElement('b');
    b.append(lead);
    li.append(b, ' ', ...rest);
    return li;
  };
  const chaptersOf = (list: readonly Eq[]): string[] => [...new Set(list.map((eq) => eq.ch))];
  const meaningIn = (eq: Eq, key: string): string =>
    eq.row.querySelector(`[data-eqx-rsym="${CSS.escape(key)}"] .eqx-sym__m`)?.textContent.trim() ?? '';

  // ── lighting ───────────────────────────────────────────────────────────────
  let lit: Element[] = [];
  let shareSlots: HTMLElement[] = [];
  let focus: Focus = null;
  let pinnedCh: string | null = null;
  let pinnedSym: string | null = null;
  const mark = (el: Element | null | undefined, cls: (typeof LIGHT_CLASSES)[number]): void => {
    if (el === null || el === undefined) return;
    el.classList.add(cls);
    lit.push(el);
  };
  const clearLight = (): void => {
    for (const el of lit) el.classList.remove(...LIGHT_CLASSES);
    lit = [];
    for (const slot of shareSlots) slot.textContent = '';
    shareSlots = [];
    for (const chapter of chapters) if (chapter.count !== null) chapter.count.textContent = String(chapter.eqs.length);
    root.classList.remove('has-light');
    symidx.classList.remove('has-light');
    focus = null;
  };

  const lightSymbol = (key: string): void => {
    if (focus?.kind === 'symbol' && focus.id === key) return;
    clearLight();
    focus = { kind: 'symbol', id: key };
    const list = bySym.get(key) ?? [];
    root.classList.add('has-light');
    mark(chipOf.get(key), 'is-focus');
    for (const eq of list) {
      mark(eq.cell, 'is-lit');
      mark(eq.bcell, 'is-lit');
      mark(eq.row, 'is-lit');
      for (const sym of eq.row.querySelectorAll(`[data-eqx-rsym="${CSS.escape(key)}"]`)) mark(sym, 'is-lit');
    }
    for (const chapter of chapters) {
      const n = chapter.eqs.filter((eq) => eq.syms.includes(key)).length;
      if (n === 0) continue;
      mark(chapter.el, 'is-lit');
      if (chapter.count !== null) chapter.count.textContent = `${String(n)}/${String(chapter.eqs.length)}`;
    }
    const chs = chaptersOf(list);
    const meanings = list.map((eq) => ({ eq, meaning: meaningIn(eq, key) }));
    const declared = meanings.filter((item) => item.meaning !== '');
    const distinctMeanings = [...new Set(declared.map((item) => item.meaning))];
    put(out.kicker, `symbol · ${String(list.length)} equation${list.length === 1 ? '' : 's'} · ${String(chs.length)} chapter${chs.length === 1 ? '' : 's'}`);
    put(out.title, glyph(key), ` — ${distinctMeanings.length === 0 ? 'no chapter declares a meaning' : distinctMeanings.length === 1 ? (distinctMeanings[0] ?? '') : `${String(distinctMeanings.length)} declared meanings`}`);
    put(
      out.meta,
      `in ${chs.map((ch) => chapterOf.get(ch)?.label ?? ch).join(' · ')}. `,
      pinnedSym === key ? 'Pinned as a filter — click again to clear.' : 'Click to pin it as a filter.',
    );
    const items = [...declared, ...meanings.filter((item) => item.meaning === '')];
    put(
      out.list,
      ...items.slice(0, 5).map((item) => line(`(${item.eq.id})`, item.meaning === '' ? item.eq.where : item.meaning)),
      ...(items.length > 5 ? [line('', `+ ${String(items.length - 5)} more equations use it`)] : []),
    );
    put(status, glyph(key), ` · ${String(list.length)} equation${list.length === 1 ? '' : 's'} in ${String(chs.length)} chapter${chs.length === 1 ? '' : 's'}`, distinctMeanings.length > 0 ? ` · declared as: ${distinctMeanings.slice(0, 3).join('; ')}` : ' · no declared meaning');
  };

  const lightEquation = (eq: Eq): void => {
    if (focus?.kind === 'equation' && focus.id === eq.id) return;
    clearLight();
    focus = { kind: 'equation', id: eq.id };
    root.classList.add('has-light');
    symidx.classList.add('has-light');
    mark(eq.cell, 'is-focus');
    mark(eq.bcell, 'is-focus');
    mark(eq.row, 'is-focus');
    mark(chapterOf.get(eq.ch)?.el, 'is-lit');
    for (const key of eq.syms) mark(chipOf.get(key), 'is-lit');
    const shared = new Map<Eq, { n: number; score: number; keys: string[] }>();
    for (const key of eq.syms) {
      for (const other of bySym.get(key) ?? []) {
        if (other === eq) continue;
        const entry = shared.get(other) ?? { n: 0, score: 0, keys: [] };
        entry.n += 1;
        entry.score += idf(key);
        entry.keys.push(key);
        shared.set(other, entry);
      }
    }
    for (const [other, { n }] of shared) {
      const level = n >= 3 ? 'is-s3' : n === 2 ? 'is-s2' : 'is-s1';
      mark(other.cell, level);
      mark(other.bcell, level);
      if (other.share !== null) {
        other.share.textContent = `shares ${String(n)}`;
        shareSlots.push(other.share);
      }
    }
    const chs = chaptersOf([...shared.keys()]);
    const chapter = chapterOf.get(eq.ch);
    put(out.kicker, `(${eq.id}) · ${chapter?.label === 'N' ? 'notation' : `chapter ${chapter?.label ?? eq.ch}`} · ${String(eq.syms.length)} symbols`);
    put(out.title, eq.where);
    put(
      out.meta,
      shared.size === 0
        ? 'No other equation shares its symbols.'
        : `Shares notation with ${String(shared.size)} equation${shared.size === 1 ? '' : 's'} in ${String(chs.length)} chapter${chs.length === 1 ? '' : 's'}; closest, weighting rarer symbols more:`,
    );
    const closest = [...shared.entries()].sort((a, b) => b[1].score - a[1].score || b[1].n - a[1].n).slice(0, 6);
    put(out.list, ...closest.map(([other, entry]) => line(`(${other.id})`, ...glyphs(entry.keys.slice(0, 5)))));
    put(status, `(${eq.id}) ${eq.where} · `, shared.size === 0 ? 'shares no symbols' : `shares notation with ${String(shared.size)} equation${shared.size === 1 ? '' : 's'} in ${String(chs.length)} chapter${chs.length === 1 ? '' : 's'}`);
  };

  const lightChapter = (key: string): void => {
    if (focus?.kind === 'chapter' && focus.id === key) return;
    const chapter = chapterOf.get(key);
    if (chapter === undefined) return;
    clearLight();
    focus = { kind: 'chapter', id: key };
    root.classList.add('has-light');
    symidx.classList.add('has-light');
    mark(chapter.el, 'is-lit');
    for (const eq of chapter.eqs) {
      mark(eq.cell, 'is-lit');
      mark(eq.bcell, 'is-lit');
    }
    const counts = new Map<string, number>();
    for (const eq of chapter.eqs) for (const sym of eq.syms) counts.set(sym, (counts.get(sym) ?? 0) + 1);
    for (const sym of counts.keys()) mark(chipOf.get(sym), 'is-lit');
    const top = [...counts.entries()].filter(([sym]) => chipOf.has(sym)).sort((a, b) => b[1] - a[1]);
    put(out.kicker, `${key === 'N' ? 'notation' : `chapter ${chapter.label}`} · ${String(chapter.eqs.length)} equations · ${String(counts.size)} symbols`);
    put(out.title, chapter.title);
    put(out.meta, pinnedCh === key ? 'The index is filtered to this chapter — click again to clear. Its most used shared symbols:' : 'Its vocabulary is lit in the symbol index; click to filter the index. Most used shared symbols:');
    put(out.list, ...top.slice(0, 6).map(([sym, n]) => line(glyph(sym), `in ${String(n)} of its equations · ${String(bySym.get(sym)?.length ?? 0)} book-wide`)));
    put(status, `${chapter.label} ${chapter.title} · ${String(chapter.eqs.length)} equations · ${String(counts.size)} symbols`);
  };

  const idle = (): void => {
    put(status, ...idleStatus());
  };
  const release = (): void => {
    clearLight();
    if (pinnedSym !== null) {
      lightSymbol(pinnedSym);
      return;
    }
    if (pinnedCh !== null) {
      lightChapter(pinnedCh);
      return;
    }
    if (out.kicker !== null) out.kicker.innerHTML = initial.kicker;
    if (out.title !== null) out.title.innerHTML = initial.title;
    if (out.meta !== null) out.meta.innerHTML = initial.meta;
    if (out.list !== null) out.list.innerHTML = initial.list;
    idle();
  };

  // ── filters ────────────────────────────────────────────────────────────────
  let terms: string[] = [];
  const apply = (): void => {
    let count = 0;
    const visible = new Set<Eq>();
    for (const eq of eqs) {
      const on =
        (pinnedCh === null || eq.ch === pinnedCh) &&
        (pinnedSym === null || eq.syms.includes(pinnedSym)) &&
        terms.every((term) => eq.text.includes(term));
      eq.row.hidden = !on;
      eq.cell?.classList.toggle('is-filtered', !on);
      eq.bcell?.classList.toggle('is-filtered', !on);
      if (on) {
        count += 1;
        visible.add(eq);
      }
    }
    for (const chapter of chapters) if (chapter.group !== null) chapter.group.hidden = !chapter.eqs.some((eq) => visible.has(eq));
    const filtering = pinnedCh !== null || pinnedSym !== null || terms.length > 0;
    for (const chip of chips) chip.classList.toggle('is-empty', filtering && !(bySym.get(chip.dataset['eqxSym'] ?? '') ?? []).some((eq) => visible.has(eq)));
    for (const chapter of chapters) {
      chapter.el.classList.toggle('is-pinned', chapter.key === pinnedCh);
      chapter.button?.setAttribute('aria-pressed', String(chapter.key === pinnedCh));
    }
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset['eqxSym'] === pinnedSym));
    if (shown !== null) shown.textContent = `${String(count)} of ${String(eqs.length)}`;
    if (clearButton !== null) clearButton.hidden = !filtering;
    if (pins !== null) {
      const parts: (Node | string)[] = [];
      if (pinnedCh !== null) {
        const b = doc.createElement('b');
        b.textContent = 'chapter';
        parts.push(b, ` ${chapterOf.get(pinnedCh)?.label ?? pinnedCh} `);
      }
      if (pinnedSym !== null) {
        const b = doc.createElement('b');
        b.textContent = 'symbol';
        parts.push(b, ' ', glyph(pinnedSym));
      }
      pins.replaceChildren(...parts);
    }
    measureMore();
  };
  const pinChapter = (key: string | null): void => {
    pinnedCh = pinnedCh === key ? null : key;
    apply();
    focus = null;
    if (pinnedCh !== null) lightChapter(pinnedCh);
    else release();
  };
  const pinSymbol = (key: string | null): void => {
    pinnedSym = pinnedSym === key ? null : key;
    apply();
    focus = null;
    if (pinnedSym !== null) lightSymbol(pinnedSym);
    else release();
  };
  const clearAll = (): void => {
    pinnedCh = null;
    pinnedSym = null;
    terms = [];
    if (search !== null) search.value = '';
    apply();
    release();
  };
  clearButton?.addEventListener('click', clearAll, { signal });

  let debounce: (() => void) | null = null;
  search?.addEventListener('input', () => {
    debounce?.();
    debounce = ctl.timeout(() => {
      terms = search.value.trim().toLowerCase().split(/\s+/u).filter((term) => term !== '');
      apply();
    }, 90);
  }, { signal });

  // ── "+N" on rows whose symbol line is clamped ──────────────────────────────
  function measureMore(): void {
    const results: [HTMLElement, number][] = [];
    for (const eq of eqs) {
      if (eq.row.hidden || eq.line === null || eq.meta === null) continue;
      const width = eq.line.clientWidth;
      if (eq.line.scrollWidth <= width + 1) {
        results.push([eq.meta, 0]);
        continue;
      }
      let hidden = 0;
      for (const sym of eq.line.querySelectorAll<HTMLElement>('.eqx-sym')) if (sym.offsetLeft + sym.offsetWidth > width - 24) hidden += 1;
      results.push([eq.meta, hidden]);
    }
    for (const [meta, hidden] of results) {
      if (hidden > 0) meta.dataset['more'] = String(hidden);
      else delete meta.dataset['more'];
    }
  }
  let resizeCancel: (() => void) | null = null;
  addEventListener('resize', () => {
    resizeCancel?.();
    resizeCancel = ctl.timeout(measureMore, 160);
  }, { signal });

  // ── pointer ────────────────────────────────────────────────────────────────
  const closest = (target: EventTarget | null, selector: string): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>(selector) : null;

  strip.addEventListener('pointerover', (event) => {
    const cell = closest(event.target, '[data-eqx-cell]');
    const eq = byId.get(cell?.dataset['eqxCell'] ?? '');
    if (eq !== undefined) {
      lightEquation(eq);
      return;
    }
    const chapter = closest(event.target, '[data-eqx-ch]');
    if (chapter !== null) lightChapter(chapter.dataset['eqxCh'] ?? '');
  }, { signal });
  strip.addEventListener('pointerleave', release, { signal });
  strip.addEventListener('click', (event) => {
    const button = closest(event.target, '[data-eqx-chbtn]');
    if (button !== null) {
      pinChapter(button.dataset['eqxChbtn'] ?? null);
      return;
    }
    const cell = closest(event.target, '[data-eqx-cell]');
    const eq = byId.get(cell?.dataset['eqxCell'] ?? '');
    if (eq?.row.hidden === true) clearAll();
  }, { signal });

  symidx.addEventListener('pointerover', (event) => {
    const chip = closest(event.target, '[data-eqx-sym]');
    if (chip !== null) lightSymbol(chip.dataset['eqxSym'] ?? '');
  }, { signal });
  symidx.addEventListener('pointerleave', release, { signal });
  symidx.addEventListener('click', (event) => {
    const chip = closest(event.target, '[data-eqx-sym]');
    if (chip !== null) pinSymbol(chip.dataset['eqxSym'] ?? null);
  }, { signal });

  index.addEventListener('pointerover', (event) => {
    const sym = closest(event.target, '.eqx-sym.is-thread');
    if (sym !== null) {
      lightSymbol(sym.dataset['eqxRsym'] ?? '');
      return;
    }
    const eq = byId.get(closest(event.target, '[data-eqx-row]')?.dataset['eqxRow'] ?? '');
    if (eq !== undefined) lightEquation(eq);
  }, { signal });
  index.addEventListener('pointerleave', release, { signal });
  index.addEventListener('focusin', (event) => {
    const eq = byId.get(closest(event.target, '[data-eqx-row]')?.dataset['eqxRow'] ?? '');
    if (eq !== undefined) lightEquation(eq);
  }, { signal });
  index.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && index.contains(event.relatedTarget))) release();
  }, { signal });
  index.addEventListener('click', (event) => {
    const sym = closest(event.target, '.eqx-sym.is-thread');
    if (sym !== null) pinSymbol(sym.dataset['eqxRsym'] ?? null);
  }, { signal });

  if (bar !== null) {
    bar.addEventListener('pointerover', (event) => {
      const eq = byId.get(closest(event.target, '[data-eqx-bcell]')?.dataset['eqxBcell'] ?? '');
      if (eq !== undefined) lightEquation(eq);
    }, { signal });
    bar.addEventListener('pointerleave', release, { signal });
    bar.addEventListener('click', (event) => {
      const eq = byId.get(closest(event.target, '[data-eqx-bcell]')?.dataset['eqxBcell'] ?? '');
      if (eq === undefined) return;
      if (eq.row.hidden) clearAll();
      eq.row.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
      history.replaceState(history.state, '', `#${eq.row.id}`);
    }, { signal });
  }

  more?.addEventListener('click', () => {
    const open = !symidx.classList.contains('is-open');
    symidx.classList.toggle('is-open', open);
    more.setAttribute('aria-expanded', String(open));
  }, { signal });
  if (more !== null) more.hidden = symidx.scrollHeight <= symidx.clientHeight + 2;

  // ── keyboard: one tab stop per instrument ──────────────────────────────────
  const rove = (items: readonly HTMLElement[], event: KeyboardEvent, current: HTMLElement): HTMLElement | undefined => {
    const at = items.indexOf(current);
    if (at === -1) return undefined;
    const step: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const delta = step[event.key];
    if (event.key === 'Home') return items[0];
    if (event.key === 'End') return items.at(-1);
    return delta === undefined ? undefined : items[Math.max(0, Math.min(items.length - 1, at + delta))];
  };
  const moveTo = (items: readonly HTMLElement[], next: HTMLElement): void => {
    for (const item of items) item.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  };
  strip.addEventListener('keydown', (event) => {
    const button = closest(event.target, '[data-eqx-chbtn]');
    if (button === null) return;
    if (event.key === 'Escape') {
      if (pinnedCh !== null) pinChapter(null);
      else release();
      return;
    }
    const next = rove(buttons, event, button);
    if (next === undefined) return;
    event.preventDefault();
    moveTo(buttons, next);
  }, { signal });
  strip.addEventListener('focusin', (event) => {
    const button = closest(event.target, '[data-eqx-chbtn]');
    if (button !== null) lightChapter(button.dataset['eqxChbtn'] ?? '');
  }, { signal });
  strip.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && strip.contains(event.relatedTarget))) release();
  }, { signal });

  symidx.addEventListener('keydown', (event) => {
    const chip = closest(event.target, '[data-eqx-sym]');
    if (chip === null) return;
    if (event.key === 'Escape') {
      if (pinnedSym !== null) pinSymbol(null);
      else release();
      return;
    }
    const next = rove(chips, event, chip);
    if (next === undefined) return;
    event.preventDefault();
    if (next.offsetTop >= symidx.clientHeight && !symidx.classList.contains('is-open')) {
      symidx.classList.add('is-open');
      more?.setAttribute('aria-expanded', 'true');
    }
    moveTo(chips, next);
  }, { signal });
  symidx.addEventListener('focusin', (event) => {
    const chip = closest(event.target, '[data-eqx-sym]');
    if (chip !== null) lightSymbol(chip.dataset['eqxSym'] ?? '');
  }, { signal });
  symidx.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && symidx.contains(event.relatedTarget))) release();
  }, { signal });

  // ── scroll: equations in view, the chapter being read ──────────────────────
  const inView = new Set<Eq>();
  const rowEq = new Map(eqs.map((eq) => [eq.row, eq]));
  let frame: (() => void) | null = null;
  let viewed: Eq[] = [];
  let here: Chapter | null = null;
  const idleStatus = (): (Node | string)[] => {
    if (viewed.length === 0) return ['Point at any cell, symbol, or equation; the index below follows.'];
    const first = viewed[0];
    const last = viewed.at(-1);
    const b = doc.createElement('b');
    b.textContent = 'in view';
    return [b, ` (${first?.id ?? ''})–(${last?.id ?? ''}) · ${here?.label ?? ''} ${here?.title ?? ''}`];
  };
  const syncView = (): void => {
    frame = null;
    for (const eq of viewed) {
      eq.cell?.classList.remove('is-view');
      eq.bcell?.classList.remove('is-view');
    }
    viewed = eqs.filter((eq) => inView.has(eq));
    for (const eq of viewed) {
      eq.cell?.classList.add('is-view');
      eq.bcell?.classList.add('is-view');
    }
    const tally = new Map<string, number>();
    for (const eq of viewed) tally.set(eq.ch, (tally.get(eq.ch) ?? 0) + 1);
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const next = top === undefined ? null : (chapterOf.get(top) ?? null);
    if (next !== here) {
      here?.el.classList.remove('is-here');
      here?.bar?.classList.remove('is-here');
      here = next;
      here?.el.classList.add('is-here');
      here?.bar?.classList.add('is-here');
    }
    if (focus === null) idle();
  };
  const barHeight = bar?.offsetHeight ?? 0;
  const observer = ctl.observe(
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const eq = rowEq.get(entry.target as HTMLElement);
          if (eq === undefined) continue;
          if (entry.isIntersecting) inView.add(eq);
          else inView.delete(eq);
        }
        frame ??= ctl.frame(syncView);
      },
      { rootMargin: `-${String(Math.round(52 + barHeight))}px 0px 0px 0px` },
    ),
  );
  for (const eq of eqs) observer.observe(eq.row);

  // ── arrival ────────────────────────────────────────────────────────────────
  measureMore();
  idle();
  const hash = (() => {
    try {
      return decodeURIComponent(location.hash.slice(1));
    } catch {
      return '';
    }
  })();
  if (hash.startsWith('sym-') && chipOf.has(hash.slice(4))) pinSymbol(hash.slice(4));
}
