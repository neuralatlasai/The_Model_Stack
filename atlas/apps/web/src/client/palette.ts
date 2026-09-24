/**
 * Command / search palette (UI_UX §32–33). Lazily loaded chunk.
 *
 * - A native modal <dialog> (focus trap, inert page, Esc) built on first open
 *   and reused; focus returns to the element that opened it.
 * - Search: on first open the MiniSearch index (`search-index.json` under the
 *   site base, built by the compiler with core SEARCH_INDEX_OPTIONS) is fetched
 *   with a timeout and loaded with the same options. Stored fields give every
 *   result its object type, title, context, and URL; each hit is zod-parsed
 *   before it reaches the DOM, and URLs must be root-relative. Results are
 *   grouped by object type and ordered by score; lookups are synchronous
 *   (well under 100 ms once the index is loaded).
 * - Commands: a query starting with ">" lists the commands that apply to the
 *   current page (UI_UX §33).
 * - Empty query: recent concepts and bookmarks from local reading state.
 * - Keyboard: combobox + listbox pattern (↑/↓, PageUp/PageDown, Enter); mouse
 *   hover tracks the active option; counts are announced politely.
 *
 * `search-docs.json` is not fetched: the stored fields in the index already
 * carry everything a result line needs, and the documents file (with bodies)
 * would multiply the transfer for no visible gain.
 */
import { pageData } from './page-data.ts';
import MiniSearch, { type Options, type SearchResult } from 'minisearch';
import { z } from 'zod';
import { ATTR, objectAnchor, SEARCH_INDEX_OPTIONS, SEARCH_KINDS, type Depth, type SearchHit, type SearchKind } from '@atlas/core';
import { linkWithDepth } from './depth-url.ts';
import { $, h, replaceChildren } from './dom.ts';
import type { PageContext } from './page.ts';
import { COMMANDS, CONCEPT_KINDS, formatCitation, groupHits, parseQuery, rankCommands, typeLine, type CommandId } from './palette-model.ts';
import { readBookmarks, readRecent } from './reading-state.ts';
import { canonicalPageUrl, safeInternalHref, withBase } from './urls.ts';

const INDEX_FILE = 'search-index.json';
const FETCH_TIMEOUT_MS = 15_000;
const RESULT_LIMIT = 40;
const RECENT_LIMIT = 8;
const BOOKMARK_LIMIT = 8;
const PLACEHOLDER = 'Search the atlas — type > for commands';
const IDS = { dialog: 'atlas-palette', input: 'atlas-palette-input', list: 'atlas-palette-list', status: 'atlas-palette-status' } as const;

interface StoredFields {
  readonly id: string;
  readonly kind: SearchKind;
  readonly title: string;
  readonly context: string;
  readonly url: string;
}

const HitSchema = z.object({
  id: z.string().max(300),
  kind: z.enum(SEARCH_KINDS),
  title: z.string().max(400),
  context: z.string().max(400),
  url: z.string().max(400),
  score: z.number(),
});

const OPTIONS: Options<StoredFields> = {
  idField: SEARCH_INDEX_OPTIONS.idField,
  fields: [...SEARCH_INDEX_OPTIONS.fields],
  storeFields: [...SEARCH_INDEX_OPTIONS.storeFields],
  searchOptions: {
    boost: { ...SEARCH_INDEX_OPTIONS.searchOptions.boost },
    prefix: SEARCH_INDEX_OPTIONS.searchOptions.prefix,
    fuzzy: SEARCH_INDEX_OPTIONS.searchOptions.fuzzy,
  },
};

// ── index loading (module-level cache: loaded once per session) ─────────────

let index: MiniSearch<StoredFields> | null = null;
let loading: Promise<MiniSearch<StoredFields>> | null = null;

function loadIndex(base: string): Promise<MiniSearch<StoredFields>> {
  if (index !== null) return Promise.resolve(index);
  loading ??= (async () => {
    const response = await fetch(`${base}${INDEX_FILE}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), credentials: 'same-origin' });
    if (!response.ok) throw new Error(`search index request failed with HTTP ${String(response.status)}`);
    const text = await response.text();
    // MiniSearch parses and rebuilds the index (yielding between chunks); malformed input rejects.
    const loaded = await MiniSearch.loadJSONAsync(text, OPTIONS);
    index = loaded;
    return loaded;
  })().catch((error: unknown) => {
    loading = null; // the next attempt retries: one request per attempt, never a loop
    throw error instanceof Error ? error : new Error('search index failed to load');
  });
  return loading;
}

function search(engine: MiniSearch<StoredFields>, text: string, conceptsOnly: boolean): SearchHit[] {
  const hits: SearchHit[] = [];
  let results: SearchResult[];
  try {
    results = engine.search(text);
  } catch {
    return hits;
  }
  for (const result of results) {
    const parsed = HitSchema.safeParse(result);
    if (!parsed.success) continue;
    if (conceptsOnly && !CONCEPT_KINDS.has(parsed.data.kind)) continue;
    hits.push(parsed.data);
    if (hits.length >= RESULT_LIMIT) break;
  }
  return hits;
}

// ── option model ─────────────────────────────────────────────────────────

interface OptionSpec {
  readonly title: string;
  readonly typeLine: string;
  /** Link target (search hits, recent items, bookmarks) or a command. */
  readonly target: { readonly href: string } | { readonly command: Command };
}

interface Command {
  readonly run: () => void;
  /** Commands that refine the palette itself keep it open. */
  readonly keepOpen: boolean;
}

interface Group {
  readonly label: string;
  readonly items: readonly OptionSpec[];
}

// ── the dialog ────────────────────────────────────────────────────────────

interface PaletteView {
  readonly dialog: HTMLDialogElement;
  readonly input: HTMLInputElement;
  readonly list: HTMLElement;
  readonly status: HTMLElement;
}

let view: PaletteView | null = null;
/** Identifies the current open session, so a stale `close` event from an earlier session is ignored. */
let session: AbortController | null = null;

function buildView(doc: Document): PaletteView {
  const input = h('input', {
    id: IDS.input,
    class: 'cx-palette__input',
    type: 'text',
    role: 'combobox',
    'aria-expanded': 'true',
    'aria-controls': IDS.list,
    'aria-autocomplete': 'list',
    'aria-describedby': IDS.status,
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
    placeholder: PLACEHOLDER,
  });
  const list = h('div', { id: IDS.list, class: 'cx-palette__list', role: 'listbox', 'aria-label': 'Results' });
  const status = h('p', { id: IDS.status, class: 'cx-palette__status', role: 'status', 'aria-live': 'polite' });
  const dialog = h(
    'dialog',
    { id: IDS.dialog, class: 'cx-palette', 'aria-label': 'Search and commands' },
    h(
      'div',
      { class: 'cx-palette__frame' },
      h(
        'div',
        { class: 'cx-palette__bar' },
        h('label', { class: 'cx-sr-only', for: IDS.input }, 'Search concepts, papers, equations, systems; type > for commands'),
        input,
        h('kbd', { class: 'cx-palette__esc', 'aria-hidden': 'true' }, 'Esc'),
      ),
      status,
      list,
    ),
  );
  doc.body.append(dialog);
  return { dialog, input, list, status };
}

export function openPalette(ctx: PageContext, returnFocus: HTMLElement | null): void {
  const { doc, ctl } = ctx;
  if (view?.dialog.isConnected !== true) view = buildView(doc);
  const { dialog, input, list, status } = view;
  if (dialog.open) {
    input.focus();
    input.select();
    return;
  }

  // Per-open listeners are bound to this session and released on close or page dispose.
  session?.abort();
  const own = new AbortController();
  session = own;
  const listen = { signal: own.signal };
  ctl.defer(() => {
    own.abort();
    if (dialog.open) dialog.close();
  });

  let options: { readonly element: HTMLElement; readonly spec: OptionSpec }[] = [];
  let active = -1;
  let conceptsOnly = false;
  let token = 0;

  const setActive = (next: number, scroll: boolean): void => {
    options[active]?.element.setAttribute('aria-selected', 'false');
    active = options.length === 0 ? -1 : Math.max(0, Math.min(options.length - 1, next));
    const option = options[active];
    if (option === undefined) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    option.element.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', option.element.id);
    if (scroll) option.element.scrollIntoView({ block: 'nearest' });
  };

  const close = (): void => {
    if (dialog.open) dialog.close();
  };

  /** Commands run after the dialog has closed (and returned focus), so they may move focus themselves. */
  const runCommand = (command: Command): void => {
    if (command.keepOpen) {
      command.run();
      return;
    }
    close();
    queueMicrotask(command.run);
  };

  const render = (groups: readonly Group[], message: string): void => {
    options = [];
    const nodes: HTMLElement[] = [];
    groups.forEach((group, groupIndex) => {
      if (group.items.length === 0) return;
      const headingId = `${IDS.list}-g${String(groupIndex)}`;
      const container = h(
        'div',
        { role: 'group', 'aria-labelledby': headingId, class: 'cx-palette__group' },
        h('div', { id: headingId, class: 'cx-palette__group-label', role: 'presentation' }, group.label),
      );
      for (const spec of group.items) {
        const position = options.length;
        const element = optionElement(`${IDS.list}-o${String(position)}`, spec);
        element.addEventListener(
          'pointermove',
          () => {
            if (active !== position) setActive(position, false);
          },
          listen,
        );
        element.addEventListener(
          'click',
          (event) => {
            const target = spec.target;
            if ('command' in target) {
              runCommand(target.command);
            } else if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
              close(); // the link itself navigates (the router intercepts it)
            }
          },
          listen,
        );
        options.push({ element, spec });
        container.append(element);
      }
      nodes.push(container);
    });
    replaceChildren(list, ...nodes);
    setActive(0, false);
    status.textContent = message;
  };

  const runners = commandRunners(ctx, {
    run: () => {
      conceptsOnly = true;
      input.value = '';
      input.placeholder = 'Go to concept…';
      update();
      input.focus();
    },
    keepOpen: true,
  });
  const commands = COMMANDS.flatMap((command) => {
    const runner = runners[command.id];
    return runner === null ? [] : [{ ...command, runner }];
  });

  const update = (): void => {
    const query = parseQuery(input.value);
    token += 1;
    const current = token;
    if (query.mode === 'command') {
      const ranked = rankCommands(commands, query.text);
      render(
        [{ label: 'COMMANDS', items: ranked.map((command) => ({ title: command.title, typeLine: 'COMMAND', target: { command: command.runner } })) }],
        ranked.length === 0 ? 'No matching commands.' : `${String(ranked.length)} commands.`,
      );
      return;
    }
    if (query.text === '') {
      render(emptyStateGroups(ctx), conceptsOnly ? 'Type to find a concept.' : 'Recent concepts and bookmarks. Type to search, or > for commands.');
      return;
    }
    const show = (engine: MiniSearch<StoredFields>): void => {
      if (current !== token || own.signal.aborted) return; // superseded or closed
      const groups = groupHits(search(engine, query.text, conceptsOnly), RESULT_LIMIT);
      const items = groups.map(
        (group): Group => ({
          label: group.label,
          items: group.hits.flatMap((hit): OptionSpec[] => {
            const href = resolveHref(ctx.base, ctx.state.depth, hit.url);
            return href === null ? [] : [{ title: hit.title, typeLine: typeLine(hit), target: { href } }];
          }),
        }),
      );
      const count = items.reduce((sum, group) => sum + group.items.length, 0);
      render(items, count === 0 ? `No results for “${query.text}”.` : `${String(count)} results.`);
    };
    if (index !== null) {
      show(index);
      return;
    }
    status.textContent = 'Loading the search index…';
    loadIndex(ctx.base)
      .then(show)
      .catch(() => {
        if (current === token && !own.signal.aborted) render([], 'The search index could not be loaded. Close and reopen search to retry.');
      });
  };

  input.addEventListener('input', update, listen);
  input.addEventListener(
    'keydown',
    (event) => {
      const moves: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 };
      const move = moves[event.key];
      if (move !== undefined) {
        event.preventDefault();
        setActive(active + move, true);
        return;
      }
      if (event.key !== 'Enter' || event.isComposing) return;
      const option = options[active];
      if (option === undefined) return;
      event.preventDefault();
      const target = option.spec.target;
      if ('command' in target) runCommand(target.command);
      else option.element.click(); // follows the link through the router; the click handler closes the dialog
    },
    listen,
  );
  dialog.addEventListener(
    'click',
    (event) => {
      if (event.target === dialog) close(); // a click on the backdrop
    },
    listen,
  );
  dialog.addEventListener(
    'close',
    () => {
      if (dialog.open || session !== own) return; // stale event from an earlier session
      own.abort();
      session = null;
      input.placeholder = PLACEHOLDER;
      // The platform restores focus to the opener; cover openers that left the DOM or lost focus.
      if (returnFocus?.isConnected === true && (doc.activeElement === doc.body || doc.activeElement === null)) returnFocus.focus({ preventScroll: true });
    },
    listen,
  );

  input.value = '';
  input.placeholder = PLACEHOLDER;
  dialog.showModal();
  input.focus();
  update();
  // Warm the index while the reader types their first characters.
  void loadIndex(ctx.base).catch(() => undefined);
}

function optionElement(id: string, spec: OptionSpec): HTMLElement {
  const children = [h('span', { class: 'cx-palette__type' }, spec.typeLine), h('span', { class: 'cx-palette__title' }, spec.title)];
  if ('href' in spec.target) {
    return h('a', { id, role: 'option', class: 'cx-palette__option', href: spec.target.href, 'aria-selected': 'false', tabindex: -1 }, ...children);
  }
  return h('div', { id, role: 'option', class: 'cx-palette__option', 'aria-selected': 'false' }, ...children);
}

/** Root-relative data URL → base-prefixed href carrying the reader's depth; null when unsafe. */
function resolveHref(base: string, depth: Depth, url: string): string | null {
  const internal = safeInternalHref(url);
  if (internal === null) return null;
  const based = withBase(base, internal);
  return linkWithDepth(based, depth, location.href) ?? based;
}

function emptyStateGroups(ctx: PageContext): Group[] {
  const recent = readRecent(ctx.store)
    .filter((entry) => entry.nodeId !== ctx.nodeId)
    .slice(0, RECENT_LIMIT)
    .flatMap((entry): OptionSpec[] => {
      const href = resolveHref(ctx.base, ctx.state.depth, entry.url);
      return href === null ? [] : [{ title: entry.title, typeLine: 'RECENT', target: { href } }];
    });
  const bookmarks = readBookmarks(ctx.store)
    .slice(0, BOOKMARK_LIMIT)
    .flatMap((entry): OptionSpec[] => {
      const href = resolveHref(ctx.base, ctx.state.depth, entry.url);
      const context = entry.context === '' ? '' : ` · ${entry.context.length > 90 ? `${entry.context.slice(0, 89)}…` : entry.context}`;
      return href === null ? [] : [{ title: entry.title, typeLine: `BOOKMARK · ${entry.kind.toUpperCase()}${context}`, target: { href } }];
    });
  return [
    { label: 'RECENT', items: recent },
    { label: 'BOOKMARKS', items: bookmarks },
  ];
}

// ── commands ─────────────────────────────────────────────────────────────

/** A runner per command for the current page, or null when the command does not apply here. */
function commandRunners(ctx: PageContext, goToConcept: Command): Readonly<Record<CommandId, Command | null>> {
  const { doc, actions, nodeId, base } = ctx;
  const data = pageData(doc);
  const activeAnchor = ctx.state.activeAnchor;
  const later = (run: () => void): Command => ({ run, keepOpen: false });
  const follow = (href: string): Command =>
    later(() => {
      // A real link click, so Astro's ClientRouter handles it like any other navigation.
      const link = h('a', { href, hidden: true });
      doc.body.append(link);
      link.click();
      link.remove();
    });
  const mapHref = viewHref(doc, base, 'map') ?? (nodeId === null ? null : withBase(base, `/graph${location.pathname.slice(base.length - 1)}`));
  const compareHref = viewHref(doc, base, 'compare');
  const equation = firstEquationNumber(ctx, activeAnchor);
  const { setDepth, copyText, inspect, linkTo, showPosition, toggleDarkMode, toggleBookmark } = actions;
  const depth = (target: Depth): Command | null =>
    setDepth === undefined || ctx.state.depth === target
      ? null
      : later(() => {
          setDepth(target);
        });

  return {
    'go-to-concept': goToConcept,
    'open-graph': mapHref === null ? null : follow(mapHref),
    compare: compareHref === null ? null : follow(compareHref),
    'copy-citation':
      copyText === undefined || data === null
        ? null
        : later(() => {
            void copyText(formatCitation(data.title, nodeId, canonicalPageUrl(location.href)), 'Citation copied to the clipboard.');
          }),
    'show-prerequisites': showPosition === undefined ? null : later(showPosition),
    'depth-overview': depth('overview'),
    'depth-technical': depth('technical'),
    'depth-research': depth('research'),
    'depth-implementation': depth('implementation'),
    'toggle-dark': toggleDarkMode === undefined ? null : later(toggleDarkMode),
    'equation-inspector':
      inspect === undefined || equation === null
        ? null
        : later(() => {
            inspect({ type: 'equation', number: equation }, null);
          }),
    bookmark:
      toggleBookmark === undefined
        ? null
        : later(() => {
            toggleBookmark(null);
          }),
    'copy-link':
      copyText === undefined || linkTo === undefined
        ? null
        : later(() => {
            void copyText(linkTo(activeAnchor), 'Link copied to the clipboard.');
          }),
  };
}

/** The header's mode link (`data-view="map"`, or a `/graph/…` / `/compare/…` link in the mode strip). */
function viewHref(doc: Document, base: string, view: 'map' | 'compare'): string | null {
  const tagged = $(`a[data-view="${view}"]`, doc);
  if (tagged !== null) return tagged.getAttribute('href');
  const prefix = `${base}${view === 'map' ? 'graph' : 'compare'}/`;
  for (const link of doc.querySelectorAll<HTMLAnchorElement>('.sh-modes a[href]')) {
    const url = new URL(link.href, location.href);
    // A compare link to an index fragment (`/compare/#ch-05`) is not this node's comparison.
    if (url.pathname.startsWith(prefix) && url.pathname !== prefix) return `${url.pathname}${url.search}`;
  }
  return null;
}

/** First equation of the active region, else of the page. */
function firstEquationNumber(ctx: PageContext, activeAnchor: string | null): string | null {
  const numbers = Object.keys(pageData(ctx.doc)?.equations ?? {});
  if (numbers.length === 0) return null;
  const regionOf = (number: string): string | null =>
    ctx.doc.getElementById(objectAnchor('eq', number))?.closest(`[${ATTR.region}]`)?.getAttribute(ATTR.region) ?? null;
  if (activeAnchor !== null) {
    const inRegion = numbers.find((number) => regionOf(number) === activeAnchor);
    if (inRegion !== undefined) return inRegion;
  }
  return numbers.find((number) => ctx.doc.getElementById(objectAnchor('eq', number)) !== null) ?? numbers[0] ?? null;
}
