/**
 * Terms behaviour (components/shell/TermsExplorer.astro): the owner strip, the
 * A–Z rail, and the entries are one instrument around one fixed-size readout.
 *
 * - Point at a term (entry, strip cell, or a mention inside a definition): the
 *   terms it mentions light accent (→), the terms that mention it violet (←),
 *   in the strip and the entries; its chapter lights; the readout gives its
 *   owner, definition, links, and the equations it cites.
 * - Point at a chapter: its cells and entries light and the A–Z rail recounts
 *   to that chapter's terms; click pins it as a filter.
 * - Point at a letter in the rail: where its terms are owned lights in the strip.
 * - Search matches term and definition; the rail recounts live and letters
 *   with no match fade; "shown N of M".
 * - Scrolling: the rail marks the letter being read; cells of the entries in
 *   view are underlined in the strip.
 * - Keyboard: strip and rail are one tab stop each; arrows move, Enter
 *   activates, Escape clears. Clamped definitions get a "more" expander.
 */
import type { PageContext } from './page.ts';

interface Term {
  readonly slug: string;
  readonly el: HTMLElement;
  readonly name: string;
  readonly ch: string;
  readonly sec: string;
  readonly letter: string;
  readonly out: readonly string[];
  readonly in: readonly string[];
  readonly eqs: readonly string[];
  readonly text: string;
  readonly owner: string;
  readonly def: HTMLElement | null;
  readonly cell: HTMLElement | null;
}

type Focus = { readonly kind: 'term' | 'chapter' | 'letter'; readonly id: string } | null;

const LIGHT = ['is-lit', 'is-focus', 'is-out', 'is-in'] as const;

export function initTermsExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-terms-explorer]');
  const strip = root?.querySelector<HTMLElement>('[data-tmx-strip]') ?? null;
  const list = root?.querySelector<HTMLElement>('.tmx-list') ?? null;
  const rail = root?.querySelector<HTMLElement>('[data-tmx-az]') ?? null;
  if (root === null || strip === null || list === null || rail === null) return;
  const signal = ctl.signal;

  // ── model ──────────────────────────────────────────────────────────────────
  const cellOf = new Map([...strip.querySelectorAll<HTMLElement>('[data-tmx-cell]')].map((cell) => [cell.dataset['tmxCell'] ?? '', cell]));
  const words = (value: string | undefined): string[] => (value ?? '').split(' ').filter((item) => item !== '');
  const terms: Term[] = [...list.querySelectorAll<HTMLElement>('[data-tmx-entry]')].map((el) => {
    const slug = el.dataset['tmxEntry'] ?? '';
    const ownerEl = el.querySelector('.tmx-owner');
    return {
      slug,
      el,
      name: el.querySelector('.tmx-term')?.textContent.trim() ?? slug,
      ch: el.dataset['ch'] ?? '',
      sec: el.dataset['sec'] ?? '',
      letter: el.dataset['letter'] ?? '',
      out: words(el.dataset['out']),
      in: words(el.dataset['in']),
      eqs: words(el.dataset['eqs']),
      text: el.dataset['text'] ?? '',
      owner: ownerEl?.textContent.replace(/\s+/gu, ' ').trim() ?? '',
      def: el.querySelector<HTMLElement>('[data-tmx-def]'),
      cell: cellOf.get(slug) ?? null,
    };
  });
  const bySlug = new Map(terms.map((term) => [term.slug, term]));
  const chapters = [...strip.querySelectorAll<HTMLElement>('[data-tmx-ch]')].map((el) => ({
    key: el.dataset['tmxCh'] ?? '',
    el,
    button: el.querySelector<HTMLButtonElement>('[data-tmx-chbtn]'),
    count: el.querySelector<HTMLElement>('[data-tmx-chcount]'),
    label: el.querySelector('.tmx-ch__n')?.textContent.trim() ?? '',
    title: el.querySelector('.tmx-ch__t')?.textContent.trim() ?? '',
    full: el.querySelector('[data-tmx-chbtn]')?.getAttribute('title') ?? '',
  }));
  const chapterOf = new Map(chapters.map((chapter) => [chapter.key, chapter]));
  const buttons = chapters.map((chapter) => chapter.button).filter((button): button is HTMLButtonElement => button !== null);
  const letters = [...rail.querySelectorAll<HTMLAnchorElement>('[data-tmx-letter]')].map((el) => ({
    letter: el.dataset['tmxLetter'] ?? '',
    el,
    count: el.querySelector<HTMLElement>('[data-tmx-azn]'),
    total: Number(el.querySelector<HTMLElement>('[data-tmx-azn]')?.dataset['tmxAzn'] ?? 0),
  }));
  const letterLinks = letters.map((item) => item.el);
  const groups = new Map([...list.querySelectorAll<HTMLElement>('[data-tmx-group]')].map((group) => [group.dataset['tmxGroup'] ?? '', group]));
  const sectionTitle = new Map([...strip.querySelectorAll<HTMLElement>('[data-tmx-sec]')].map((sec) => [sec.dataset['tmxSec'] ?? '', sec.getAttribute('title') ?? '']));

  const out = {
    kicker: root.querySelector<HTMLElement>('[data-tmx-kicker]'),
    title: root.querySelector<HTMLElement>('[data-tmx-title]'),
    meta: root.querySelector<HTMLElement>('[data-tmx-meta]'),
    list: root.querySelector<HTMLElement>('[data-tmx-list]'),
  };
  // Server-rendered markup of our own component, restored verbatim on release.
  const initial = { kicker: out.kicker?.innerHTML ?? '', title: out.title?.innerHTML ?? '', meta: out.meta?.innerHTML ?? '', list: out.list?.innerHTML ?? '' };
  const shown = root.querySelector<HTMLElement>('[data-tmx-shown]');
  const pins = root.querySelector<HTMLElement>('[data-tmx-pins]');
  const clearButton = root.querySelector<HTMLButtonElement>('[data-tmx-clear]');
  const search = root.querySelector<HTMLInputElement>('[data-tmx-search]');

  const put = (el: HTMLElement | null, ...parts: (Node | string)[]): void => {
    el?.replaceChildren(...parts);
  };
  const line = (lead: string, text: string, cls = ''): HTMLLIElement => {
    const li = doc.createElement('li');
    if (cls !== '') li.className = cls;
    const b = doc.createElement('b');
    b.textContent = lead;
    li.append(b, ' ', text);
    return li;
  };
  const names = (slugs: readonly string[]): string => slugs.map((slug) => bySlug.get(slug)?.name ?? slug).join(' · ');

  // ── lighting ───────────────────────────────────────────────────────────────
  let lit: Element[] = [];
  let focus: Focus = null;
  let pinnedCh: string | null = null;
  let query: string[] = [];
  const visible = new Set<Term>(terms);
  const mark = (el: Element | null | undefined, cls: (typeof LIGHT)[number]): void => {
    if (el === null || el === undefined) return;
    el.classList.add(cls);
    lit.push(el);
  };
  const recount = (subset: ReadonlySet<Term> | null): void => {
    // The rail counts what is lit (subset) or, at rest, what the filters show.
    for (const item of letters) {
      const n = terms.filter((term) => term.letter === item.letter && visible.has(term) && (subset === null || subset.has(term))).length;
      if (item.count !== null) item.count.textContent = String(n);
      item.el.classList.toggle('is-zero', n === 0);
      item.el.classList.toggle('is-lit', subset !== null && n > 0);
    }
  };
  const clearLight = (): void => {
    for (const el of lit) el.classList.remove(...LIGHT);
    lit = [];
    for (const chapter of chapters) {
      if (chapter.count !== null) chapter.count.textContent = String(terms.filter((term) => term.ch === chapter.key).length);
    }
    root.classList.remove('has-light');
    focus = null;
  };

  const lightTerm = (term: Term): void => {
    if (focus?.kind === 'term' && focus.id === term.slug) return;
    clearLight();
    focus = { kind: 'term', id: term.slug };
    root.classList.add('has-light');
    mark(term.el, 'is-focus');
    mark(term.cell, 'is-focus');
    mark(chapterOf.get(term.ch)?.el, 'is-lit');
    for (const slug of term.out) {
      const other = bySlug.get(slug);
      mark(other?.el, 'is-out');
      mark(other?.cell, 'is-out');
    }
    for (const slug of term.in) {
      const other = bySlug.get(slug);
      mark(other?.el, 'is-in');
      mark(other?.cell, 'is-in');
    }
    for (const mention of term.el.querySelectorAll('[data-tmx-mention]')) mark(mention, 'is-focus');
    recount(new Set([term, ...[...term.out, ...term.in].map((slug) => bySlug.get(slug)).filter((other): other is Term => other !== undefined)]));
    const chapter = chapterOf.get(term.ch);
    const siblings = terms.filter((other) => other.sec === term.sec && other !== term);
    put(out.kicker, `ch ${chapter?.label ?? term.ch} · ${term.owner}`);
    put(out.title, term.name);
    put(out.meta, term.def?.textContent.replace(/\s+/gu, ' ').trim() ?? '');
    const lines: HTMLLIElement[] = [];
    if (term.out.length > 0) lines.push(line(`→ ${String(term.out.length)}`, `mentions ${names(term.out)}`));
    if (term.in.length > 0) lines.push(line(`← ${String(term.in.length)}`, `mentioned by ${names(term.in)}`, 'is-in'));
    if (term.eqs.length > 0) lines.push(line('Eq', term.eqs.join(' · '), 'is-quiet'));
    if (siblings.length > 0) lines.push(line(`§ ${String(siblings.length)}`, `also owned here: ${names(siblings.map((other) => other.slug))}`, 'is-quiet'));
    if (term.out.length + term.in.length === 0) lines.unshift(line('—', 'no other glossary term is named in its definition, or names it', 'is-quiet'));
    put(out.list, ...lines.slice(0, 5));
  };

  const lightChapter = (key: string): void => {
    if (focus?.kind === 'chapter' && focus.id === key) return;
    const chapter = chapterOf.get(key);
    if (chapter === undefined) return;
    clearLight();
    focus = { kind: 'chapter', id: key };
    root.classList.add('has-light');
    mark(chapter.el, 'is-lit');
    const members = terms.filter((term) => term.ch === key);
    for (const term of members) {
      mark(term.cell, 'is-lit');
      mark(term.el, 'is-lit');
    }
    recount(new Set(members));
    const sections = new Map<string, number>();
    for (const term of members) sections.set(term.sec, (sections.get(term.sec) ?? 0) + 1);
    const linkedCount = members.filter((term) => term.out.length + term.in.length > 0).length;
    put(out.kicker, `chapter ${chapter.label} · ${String(members.length)} terms · ${String(sections.size)} sections`);
    put(out.title, chapter.full === '' ? chapter.title : chapter.full);
    put(
      out.meta,
      `${String(linkedCount)} of its terms are linked to others. The A–Z rail now counts only its terms. `,
      pinnedCh === key ? 'Filtered to this chapter — click again to clear.' : 'Click to filter the list to it.',
    );
    put(
      out.list,
      ...[...sections.entries()]
        .map(([sec, n]) => ({ n, title: sectionTitle.get(sec) ?? sec }))
        .sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true }))
        .slice(0, 5)
        .map(({ n, title }) => line(String(n), title)),
    );
  };

  const lightLetter = (letter: string): void => {
    if (focus?.kind === 'letter' && focus.id === letter) return;
    clearLight();
    focus = { kind: 'letter', id: letter };
    root.classList.add('has-light');
    const members = terms.filter((term) => term.letter === letter && visible.has(term));
    for (const term of members) mark(term.cell, 'is-lit');
    const byChapter = new Map<string, number>();
    for (const term of members) byChapter.set(term.ch, (byChapter.get(term.ch) ?? 0) + 1);
    for (const [ch, n] of byChapter) {
      const chapter = chapterOf.get(ch);
      mark(chapter?.el, 'is-lit');
      if (chapter?.count !== null && chapter?.count !== undefined) chapter.count.textContent = `${String(n)}/${chapter.count.dataset['tmxChcount'] ?? ''}`;
    }
    put(out.kicker, `letter ${letter} · ${String(members.length)} terms · ${String(byChapter.size)} chapters`);
    put(out.title, members.slice(0, 3).map((term) => term.name).join(' · ') + (members.length > 3 ? ' …' : ''));
    put(out.meta, 'Where its terms are owned is lit in the strip. Enter or click jumps to the letter.');
    put(
      out.list,
      ...[...byChapter.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ch, n]) => line(String(n), `ch ${chapterOf.get(ch)?.label ?? ch} ${chapterOf.get(ch)?.title ?? ''}`)),
    );
  };

  const release = (): void => {
    clearLight();
    recount(null);
    if (pinnedCh !== null) {
      lightChapter(pinnedCh);
      return;
    }
    if (out.kicker !== null) out.kicker.innerHTML = initial.kicker;
    if (out.title !== null) out.title.innerHTML = initial.title;
    if (out.meta !== null) out.meta.innerHTML = initial.meta;
    if (out.list !== null) out.list.innerHTML = initial.list;
  };

  // ── filters ────────────────────────────────────────────────────────────────
  const apply = (): void => {
    visible.clear();
    for (const term of terms) {
      const on = (pinnedCh === null || term.ch === pinnedCh) && query.every((word) => term.text.includes(word));
      term.el.hidden = !on;
      term.cell?.classList.toggle('is-filtered', !on);
      if (on) visible.add(term);
    }
    for (const [letter, group] of groups) group.hidden = !terms.some((term) => term.letter === letter && visible.has(term));
    for (const chapter of chapters) {
      chapter.el.classList.toggle('is-pinned', chapter.key === pinnedCh);
      chapter.button?.setAttribute('aria-pressed', String(chapter.key === pinnedCh));
    }
    const filtering = pinnedCh !== null || query.length > 0;
    if (shown !== null) shown.textContent = `${String(visible.size)} of ${String(terms.length)}`;
    if (clearButton !== null) clearButton.hidden = !filtering;
    if (pins !== null) {
      const parts: (Node | string)[] = [];
      if (pinnedCh !== null) {
        const b = doc.createElement('b');
        b.textContent = 'chapter';
        const chapter = chapterOf.get(pinnedCh);
        parts.push(b, ` ${chapter?.label ?? pinnedCh} ${chapter?.title ?? ''}`);
      }
      pins.replaceChildren(...parts);
    }
    recount(null);
    measure();
  };
  const pinChapter = (key: string | null): void => {
    pinnedCh = pinnedCh === key ? null : key;
    apply();
    focus = null;
    release();
  };
  const clearAll = (): void => {
    pinnedCh = null;
    query = [];
    if (search !== null) search.value = '';
    apply();
    release();
  };
  clearButton?.addEventListener('click', clearAll, { signal });
  let debounce: (() => void) | null = null;
  search?.addEventListener('input', () => {
    debounce?.();
    debounce = ctl.timeout(() => {
      query = search.value.trim().toLowerCase().split(/\s+/u).filter((word) => word !== '');
      apply();
    }, 90);
  }, { signal });

  // ── "more" on definitions that are clamped ─────────────────────────────────
  function measure(): void {
    const clamped = terms.map((term) => [term, term.def !== null && !term.el.hidden && term.def.scrollHeight > term.def.clientHeight + 2] as const);
    for (const [term, isClamped] of clamped) {
      const button = term.el.querySelector<HTMLButtonElement>('[data-tmx-more]');
      if (button !== null) button.hidden = !isClamped && !term.el.classList.contains('is-open');
    }
  }
  list.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const more = target?.closest<HTMLButtonElement>('[data-tmx-more]') ?? null;
    if (more !== null) {
      const entry = more.closest<HTMLElement>('[data-tmx-entry]');
      const open = entry?.classList.toggle('is-open') ?? false;
      more.setAttribute('aria-expanded', String(open));
      more.textContent = open ? 'less' : 'more';
      return;
    }
    const mention = target?.closest<HTMLElement>('[data-tmx-mention]') ?? null;
    const goal = bySlug.get(mention?.dataset['tmxMention'] ?? '');
    if (goal?.el.hidden === true) clearAll();
  }, { signal });
  let resizeCancel: (() => void) | null = null;
  addEventListener('resize', () => {
    resizeCancel?.();
    resizeCancel = ctl.timeout(measure, 160);
  }, { signal });

  // ── pointer ────────────────────────────────────────────────────────────────
  const closest = (target: EventTarget | null, selector: string): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>(selector) : null;

  strip.addEventListener('pointerover', (event) => {
    const term = bySlug.get(closest(event.target, '[data-tmx-cell]')?.dataset['tmxCell'] ?? '');
    if (term !== undefined) {
      lightTerm(term);
      return;
    }
    const chapter = closest(event.target, '[data-tmx-ch]');
    if (chapter !== null) lightChapter(chapter.dataset['tmxCh'] ?? '');
  }, { signal });
  strip.addEventListener('pointerleave', release, { signal });
  strip.addEventListener('click', (event) => {
    const button = closest(event.target, '[data-tmx-chbtn]');
    if (button !== null) {
      pinChapter(button.dataset['tmxChbtn'] ?? null);
      return;
    }
    const term = bySlug.get(closest(event.target, '[data-tmx-cell]')?.dataset['tmxCell'] ?? '');
    if (term?.el.hidden === true) clearAll();
  }, { signal });

  list.addEventListener('pointerover', (event) => {
    const mention = bySlug.get(closest(event.target, '[data-tmx-mention]')?.dataset['tmxMention'] ?? '');
    if (mention !== undefined) {
      lightTerm(mention);
      return;
    }
    const term = bySlug.get(closest(event.target, '[data-tmx-entry]')?.dataset['tmxEntry'] ?? '');
    if (term !== undefined) lightTerm(term);
  }, { signal });
  list.addEventListener('pointerleave', release, { signal });
  list.addEventListener('focusin', (event) => {
    const term = bySlug.get(closest(event.target, '[data-tmx-entry]')?.dataset['tmxEntry'] ?? '');
    if (term !== undefined) lightTerm(term);
  }, { signal });
  list.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && list.contains(event.relatedTarget))) release();
  }, { signal });

  rail.addEventListener('pointerover', (event) => {
    const link = closest(event.target, '[data-tmx-letter]');
    if (link !== null) lightLetter(link.dataset['tmxLetter'] ?? '');
  }, { signal });
  rail.addEventListener('pointerleave', release, { signal });

  // ── keyboard: one tab stop per instrument ──────────────────────────────────
  const rove = (items: readonly HTMLElement[], event: KeyboardEvent, current: HTMLElement): HTMLElement | undefined => {
    const at = items.indexOf(current);
    if (at === -1) return undefined;
    if (event.key === 'Home') return items[0];
    if (event.key === 'End') return items.at(-1);
    const step: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const delta = step[event.key];
    return delta === undefined ? undefined : items[Math.max(0, Math.min(items.length - 1, at + delta))];
  };
  const moveTo = (items: readonly HTMLElement[], next: HTMLElement): void => {
    for (const item of items) item.tabIndex = -1;
    next.tabIndex = 0;
    next.focus();
  };
  strip.addEventListener('keydown', (event) => {
    const button = closest(event.target, '[data-tmx-chbtn]');
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
    const button = closest(event.target, '[data-tmx-chbtn]');
    if (button !== null) lightChapter(button.dataset['tmxChbtn'] ?? '');
  }, { signal });
  strip.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && strip.contains(event.relatedTarget))) release();
  }, { signal });
  rail.addEventListener('keydown', (event) => {
    const link = closest(event.target, '[data-tmx-letter]');
    if (link === null) return;
    if (event.key === 'Escape') {
      release();
      return;
    }
    const next = rove(letterLinks, event, link);
    if (next === undefined) return;
    event.preventDefault();
    moveTo(letterLinks, next);
  }, { signal });
  rail.addEventListener('focusin', (event) => {
    const link = closest(event.target, '[data-tmx-letter]');
    if (link !== null) lightLetter(link.dataset['tmxLetter'] ?? '');
  }, { signal });
  rail.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && rail.contains(event.relatedTarget))) release();
  }, { signal });

  // ── scroll: the letter being read, the entries in view ─────────────────────
  const inView = new Set<Term>();
  const entryTerm = new Map(terms.map((term) => [term.el, term]));
  let viewed: Term[] = [];
  let here: HTMLElement | null = null;
  let hereChapter: HTMLElement | null = null;
  let frame: (() => void) | null = null;
  const sync = (): void => {
    frame = null;
    for (const term of viewed) term.cell?.classList.remove('is-view');
    viewed = terms.filter((term) => inView.has(term));
    for (const term of viewed) term.cell?.classList.add('is-view');
    const first = viewed[0];
    const link = letters.find((item) => item.letter === first?.letter)?.el ?? null;
    if (link !== here) {
      here?.classList.remove('is-here');
      here = link;
      here?.classList.add('is-here');
    }
    const tally = new Map<string, number>();
    for (const term of viewed) tally.set(term.ch, (tally.get(term.ch) ?? 0) + 1);
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const chapterEl = top === undefined ? null : (chapterOf.get(top)?.el ?? null);
    if (chapterEl !== hereChapter) {
      hereChapter?.classList.remove('is-here');
      hereChapter = chapterEl;
      hereChapter?.classList.add('is-here');
    }
  };
  const observer = ctl.observe(
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const term = entryTerm.get(entry.target as HTMLElement);
          if (term === undefined) continue;
          if (entry.isIntersecting) inView.add(term);
          else inView.delete(term);
        }
        frame ??= ctl.frame(sync);
      },
      { rootMargin: `-${String(Math.round(52 + rail.offsetHeight))}px 0px 0px 0px` },
    ),
  );
  for (const term of terms) observer.observe(term.el);

  measure();
}
