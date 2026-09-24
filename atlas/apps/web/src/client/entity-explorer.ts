/**
 * Systems and Labs instruments (pages/systems/index.astro, pages/labs/index.astro).
 * Loaded on demand by main.ts only on pages that carry `[data-entity-explorer]`.
 *
 * Every interaction answers a question about how the book uses the stack:
 *
 * Systems — the reference stack drawn as eight layers beside the 66 chapters.
 *  - point at a system  → the written chapters that analyse it light, wires run
 *    from the chip to their part lanes, the layer meter marks it, and the readout
 *    says what each chapter takes (coverage row text, sections, evidence label);
 *  - point at a chapter → the systems it analyses light, wires fan out to them,
 *    and each layer's meter counts how many of its systems the chapter touches;
 *  - point at a layer   → its systems and every chapter touching it light;
 *  - point at a part    → the systems its chapters analyse light;
 *  - point at a ledger row → the same as its chip.
 *
 * Labs — a footprint matrix, labs × chapters (× parts on narrow screens).
 *  - point at a row     → its marks stay lit; the readout names the lab, its
 *    surfaces, and what each chapter takes from it;
 *  - point at a column  → the labs that chapter (or part) draws on light;
 *  - point at a mark    → the one use it stands for, in full;
 *  - sort               → reference-stack order (a position, not a ranking) or
 *    by footprint; rows glide to their new place.
 *
 * Keyboard: each instrument is one tab stop with roving focus; arrows move,
 * Enter opens, Escape clears. Readouts have fixed geometry (entities.css): the
 * list fits its content to the reserved height instead of growing. Motion is
 * state transition only and disappears under prefers-reduced-motion. Models
 * come from JSON islands parsed with zod (the DOM is a trust boundary).
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

// ── models ─────────────────────────────────────────────────────────────────

const Int = z.number().int();
const Href = z.string().refine((url) => /^(?:\/|https?:\/\/)/u.test(url), 'relative or http(s) URL');
const UseSchema = z.object({ ch: Int, sections: z.string(), count: Int, label: z.string(), what: z.string() });
const SurfaceSchema = z.object({ label: z.string(), url: Href });
const ChapterSchema = z.object({
  n: Int,
  number: z.string(),
  short: z.string(),
  title: z.string(),
  url: Href,
  part: Int,
  written: z.boolean(),
});
const PartSchema = z.object({ n: Int, numeral: z.string(), title: z.string(), url: Href, volume: Int, chapters: z.array(Int) });
const SystemSchema = z.object({
  key: z.string(),
  name: z.string(),
  rank: Int.nullable(),
  layer: Int,
  url: Href,
  surfaces: z.array(SurfaceSchema),
  chapters: z.array(Int),
  planned: z.array(Int),
  uses: z.array(UseSchema),
  listedIn: z.record(z.string(), z.array(z.string())),
});
const SystemsSchema = z.object({
  chapters: z.record(z.string(), ChapterSchema),
  parts: z.array(PartSchema),
  layers: z.array(z.object({ index: Int, name: z.string(), systems: z.array(z.string()) })),
  systems: z.array(SystemSchema),
});
const LabSchema = z.object({
  key: z.string(),
  name: z.string(),
  rank: Int.nullable(),
  url: Href,
  surfaces: z.array(SurfaceSchema),
  chapters: z.array(Int),
  sectionsByChapter: z.record(z.string(), z.number()),
  sections: Int,
  uses: z.array(UseSchema),
});
const LabsSchema = z.object({ chapters: z.record(z.string(), ChapterSchema), parts: z.array(PartSchema), labs: z.array(LabSchema) });

type Use = z.output<typeof UseSchema>;
type Chapter = z.output<typeof ChapterSchema>;
type Part = z.output<typeof PartSchema>;
type SystemsModel = z.output<typeof SystemsSchema>;
type System = z.output<typeof SystemSchema>;
type LabsModel = z.output<typeof LabsSchema>;
type Lab = z.output<typeof LabSchema>;

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
const plural = (n: number, one: string, many = `${one}s`): string => `${String(n)} ${n === 1 ? one : many}`;
const pad = (n: number): string => String(n).padStart(2, '0');

function parseModel<T>(root: HTMLElement, schema: z.ZodType<T>): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(root.querySelector('script[data-en-model]')?.textContent ?? ''));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// ── DOM construction (text only; never innerHTML with data) ────────────────

type Child = string | Node;

function make<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className = '', ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className !== '') node.className = className;
  node.append(...children);
  return node;
}

function anchor(doc: Document, href: string, className: string, ...children: Child[]): HTMLAnchorElement {
  const link = make(doc, 'a', className, ...children);
  link.href = href;
  return link;
}

// ── readout: fixed geometry, content fitted to the reserved space ──────────

interface UseEntry {
  readonly who: HTMLElement;
  readonly meta: string;
  readonly tag: string;
  readonly what: string;
}

interface ReadoutView {
  readonly kicker: string;
  readonly title: string;
  readonly sub: string;
  readonly rows: readonly (readonly [string, readonly Child[]])[];
  readonly list: { readonly uses: readonly UseEntry[]; readonly empty: string; readonly more?: string } | { readonly nodes: readonly Node[] };
  readonly foot: readonly Child[];
}

interface Readout {
  show(view: ReadoutView): void;
  reset(): void;
}

const FIELDS = ['kicker', 'title', 'sub', 'rows', 'list', 'foot'] as const;
type Field = (typeof FIELDS)[number];

function createReadout(doc: Document, root: HTMLElement): Readout | null {
  const panel = root.querySelector<HTMLElement>('[data-en-readout]');
  if (panel === null) return null;
  const fields = new Map<Field, HTMLElement>();
  for (const field of FIELDS) {
    const node = panel.querySelector<HTMLElement>(`[data-ro-${field}]`);
    if (node === null) return null;
    fields.set(field, node);
  }
  const get = (field: Field): HTMLElement => fields.get(field) ?? panel;
  const initial = new Map(FIELDS.map((field) => [field, [...get(field).childNodes].map((node) => node.cloneNode(true))] as const));
  const initialLong = get('title').classList.contains('is-long');

  const lineHeight = (node: HTMLElement): number => Number.parseFloat(getComputedStyle(node).lineHeight) || 17;

  const fitUses = (list: HTMLElement, entries: readonly UseEntry[], empty: string, more: string): void => {
    list.replaceChildren();
    if (entries.length === 0) {
      list.append(make(doc, 'p', 'en-ro__legend', empty));
      return;
    }
    const style = getComputedStyle(list);
    const height = list.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom);
    const line = lineHeight(list);
    const gap = Number.parseFloat(style.rowGap) || 3;
    const need = (count: number, lines: number): number => count * lines * line + (count - 1) * gap;
    const n = entries.length;
    const maxK = Math.max(1, Math.min(8, Math.floor(height / line) - 1));
    let k = 0;
    for (let lines = maxK; lines >= 1; lines -= 1) {
      if (need(n, 1 + lines) <= height + 0.5) {
        k = lines;
        break;
      }
    }
    const capacity = Math.max(1, Math.floor((height + gap) / (line + gap)));
    const dense = k === 0;
    const shown = dense ? (n <= capacity ? n : capacity - 1) : n;
    for (const entry of entries.slice(0, shown)) {
      const item = make(doc, 'div', dense ? 'en-ro__item is-dense' : 'en-ro__item');
      const meta = make(doc, 'span', 'en-ro__meta', entry.meta);
      if (entry.tag !== '' && !dense) {
        const tag = make(doc, 'span', 'en-ro__tag', entry.tag);
        if (/UNVERIFIED|NOT-DISCLOSED/u.test(entry.tag)) tag.dataset['ev'] = 'gap';
        meta.append(tag);
      }
      const what = make(doc, 'span', 'en-ro__what', entry.what);
      what.style.setProperty('--k', String(Math.max(1, k)));
      item.append(entry.who, meta, what);
      list.append(item);
    }
    if (shown < n) list.append(make(doc, 'p', 'en-ro__more', `+ ${String(n - shown)} more ${more}`));
  };

  return {
    show(view) {
      get('kicker').textContent = view.kicker;
      const title = get('title');
      title.textContent = view.title;
      title.title = view.title;
      title.classList.toggle('is-long', view.title.length > 34);
      get('sub').textContent = view.sub;
      get('rows').replaceChildren(
        ...view.rows.map(([key, value]) => {
          const row = make(doc, 'div');
          row.append(make(doc, 'dt', '', key), make(doc, 'dd', '', ...value));
          return row;
        }),
      );
      get('foot').replaceChildren(...view.foot);
      const list = get('list');
      if ('uses' in view.list) fitUses(list, view.list.uses, view.list.empty, view.list.more ?? 'on its page');
      else list.replaceChildren(...view.list.nodes);
    },
    reset() {
      for (const field of FIELDS) get(field).replaceChildren(...(initial.get(field) ?? []).map((node) => node.cloneNode(true)));
      get('title').classList.toggle('is-long', initialLong);
      get('title').removeAttribute('title');
    },
  };
}

/** Roving tabindex: exactly one element of the group is tabbable. */
function rove(group: Iterable<Element>, next: HTMLElement | SVGElement): void {
  for (const item of group) item.setAttribute('tabindex', '-1');
  next.setAttribute('tabindex', '0');
  next.focus();
}

/** Nearest item by horizontal centre (for up/down moves between rows of different lengths). */
function nearestByX(items: readonly Element[], x: number): Element | undefined {
  let best: Element | undefined;
  let distance = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const rect = item.getBoundingClientRect();
    const d = Math.abs(rect.left + rect.width / 2 - x);
    if (d < distance) {
      distance = d;
      best = item;
    }
  }
  return best;
}

const centreX = (node: Element): number => {
  const rect = node.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

// ── entry ──────────────────────────────────────────────────────────────────

export function initEntityExplorer(ctx: PageContext): void {
  for (const root of ctx.doc.querySelectorAll<HTMLElement>('[data-entity-explorer]')) {
    const kind = root.dataset['entityExplorer'];
    if (kind === 'systems') {
      const model = parseModel(root, SystemsSchema);
      if (model !== null) initSystems(ctx, root, model);
    } else if (kind === 'labs') {
      const model = parseModel(root, LabsSchema);
      if (model !== null) initLabs(ctx, root, model);
    }
  }
}

// ── systems ────────────────────────────────────────────────────────────────

const layerTag = (index: number): string => (index < 0 ? 'L?' : `L${String(index + 1)}`);

function initSystems(ctx: PageContext, root: HTMLElement, model: SystemsModel): void {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const body = root.querySelector<HTMLElement>('[data-es-body]');
  const stack = root.querySelector<HTMLElement>('[data-es-stack]');
  const grid = root.querySelector<SVGSVGElement>('[data-es-grid]');
  const wires = root.querySelector<SVGSVGElement>('[data-es-wires]');
  const readout = createReadout(doc, root);
  if (body === null || stack === null || grid === null || wires === null || readout === null) return;

  const systems = new Map(model.systems.map((system) => [system.key, system]));
  const layers = new Map(model.layers.map((layer) => [layer.index, layer]));
  const chapterOf = (n: number): Chapter | undefined => model.chapters[String(n)];
  const partOf = (n: number): Part | undefined => model.parts.find((part) => part.chapters.includes(n));
  const written = Object.values(model.chapters).filter((chapter) => chapter.written).length;
  const total = Object.keys(model.chapters).length;

  const byData = <T extends Element>(scope: ParentNode, attr: string, key: (value: string) => string | number = (v) => v): Map<string | number, T> => {
    const map = new Map<string | number, T>();
    for (const node of scope.querySelectorAll<T>(`[${attr}]`)) map.set(key(node.getAttribute(attr) ?? ''), node);
    return map;
  };
  const chips = byData<HTMLAnchorElement>(stack, 'data-es-sys');
  const meters = byData<HTMLElement>(stack, 'data-es-meter');
  const labels = byData<HTMLButtonElement>(stack, 'data-es-layer', Number);
  const bands = byData<HTMLElement>(stack, 'data-es-band', Number);
  const dots = byData<SVGAElement>(grid, 'data-es-ch', Number);
  const laneWires = byData<SVGLineElement>(grid, 'data-es-lanewire', Number);
  const partLinks = byData<SVGAElement>(grid, 'data-es-part', Number);
  const ledger = doc.querySelector<HTMLElement>('[data-es-ledger]');
  const ledgerRows = ledger === null ? new Map<string | number, HTMLElement>() : byData<HTMLElement>(ledger, 'data-es-row');

  // ── geometry: wires from chips to part lanes, routed through the gutter ──
  const dotCentre = (n: number): { x: number; y: number } | null => {
    const circle = dots.get(n)?.querySelector('.es-dot__c');
    return circle === null || circle === undefined ? null : { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) };
  };
  const sideBySide = (): boolean => grid.getBoundingClientRect().left >= stack.getBoundingClientRect().right - 2;
  const toBody = (x: number, y: number): { x: number; y: number } => {
    const frame = body.getBoundingClientRect();
    return { x: x - frame.left, y: y - frame.top };
  };
  const laneStart = (part: number): { x: number; y: number } | null => {
    const line = laneWires.get(part);
    const ctm = grid.getScreenCTM();
    if (line === undefined || ctm === null) return null;
    const point = new DOMPoint(Number(line.getAttribute('x1')), Number(line.getAttribute('y1'))).matrixTransform(ctm);
    return toBody(point.x, point.y);
  };
  const chipPort = (chip: Element): { x: number; y: number } => {
    const rect = chip.getBoundingClientRect();
    return toBody(rect.right, rect.top + rect.height / 2);
  };
  const gutter = (): number => {
    const left = stack.getBoundingClientRect().right;
    const right = grid.getBoundingClientRect().left;
    return toBody((left + right) / 2, 0).x;
  };
  const route = (p: { x: number; y: number }, q: { x: number; y: number }, gx: number): string => {
    const dy = q.y - p.y;
    if (Math.abs(dy) < 0.5) return `M${String(p.x)} ${String(p.y)} H${String(q.x)}`;
    const r = Math.min(7, Math.abs(dy) / 2);
    const sy = Math.sign(dy);
    const s1 = Math.sign(gx - p.x) || 1;
    const s2 = Math.sign(q.x - gx) || 1;
    return [
      `M${String(p.x)} ${String(p.y)}`,
      `H${String(gx - s1 * r)}`,
      `Q${String(gx)} ${String(p.y)} ${String(gx)} ${String(p.y + sy * r)}`,
      `V${String(q.y - sy * r)}`,
      `Q${String(gx)} ${String(q.y)} ${String(gx + s2 * r)} ${String(q.y)}`,
      `H${String(q.x)}`,
    ].join(' ');
  };
  /** Wires between chips and part lanes; `outward` draws from the lane (a chapter's fan) rather than from the chip. */
  const drawWires = (pairs: readonly { chip: Element; part: number; plan: boolean }[], outward: boolean): void => {
    wires.replaceChildren();
    if (!sideBySide()) return;
    const gx = gutter();
    const seen = new Set<string>();
    const animate = !reducedMotion();
    for (const { chip, part, plan } of pairs) {
      const key = `${chip.getAttribute('data-es-sys') ?? ''}|${String(part)}|${String(plan)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const lane = laneStart(part);
      if (lane === null) continue;
      const port = chipPort(chip);
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', plan ? 'es-wire es-wire--plan' : 'es-wire');
      path.setAttribute('d', outward ? route(lane, port, gx) : route(port, lane, gx));
      wires.append(path);
      if (animate && !plan) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = String(length);
        path.style.strokeDashoffset = String(length);
        void path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 260ms cubic-bezier(.3,.7,.2,1)';
        path.style.strokeDashoffset = '0';
      }
    }
  };
  /** Lights each touched part lane from its entry to the farthest chapter reached. */
  const lightLanes = (chapters: readonly number[], planned: readonly number[] = []): void => {
    const reach = new Map<number, { x: number; plan: boolean }>();
    for (const [list, plan] of [[chapters, false], [planned, true]] as const) {
      for (const n of list) {
        const part = partOf(n)?.n;
        const centre = dotCentre(n);
        if (part === undefined || centre === null) continue;
        const current = reach.get(part);
        if (current === undefined || centre.x > current.x) reach.set(part, { x: centre.x, plan: current === undefined ? plan : current.plan && plan });
        else if (!plan) reach.set(part, { ...current, plan: false });
      }
    }
    for (const [part, { x, plan }] of reach) {
      const line = laneWires.get(part);
      if (line === undefined) continue;
      line.setAttribute('x2', String(x));
      line.style.strokeDasharray = plan ? '3 3' : '';
    }
  };

  // ── states ──
  let current: (() => void) | null = null;

  const clear = (): void => {
    body.classList.remove('is-active');
    grid.classList.remove('is-active');
    for (const chip of chips.values()) chip.classList.remove('is-lit', 'is-focus', 'is-peek');
    for (const meter of meters.values()) meter.classList.remove('is-hit');
    for (const label of labels.values()) label.classList.remove('is-focus');
    for (const band of bands.values()) {
      band.classList.remove('is-focus');
      band.querySelector('.es-band__frac')?.removeAttribute('data-hits');
    }
    for (const dot of dots.values()) dot.classList.remove('is-lit', 'is-focus', 'is-plan', 'is-peek');
    for (const line of laneWires.values()) {
      line.setAttribute('x2', line.getAttribute('x1') ?? '0');
      line.style.strokeDasharray = '';
    }
    for (const link of partLinks.values()) link.classList.remove('is-focus');
    for (const row of ledgerRows.values()) row.classList.remove('is-lit');
    wires.replaceChildren();
  };
  const activate = (): void => {
    body.classList.add('is-active');
    grid.classList.add('is-active');
  };
  const reset = (): void => {
    current = null;
    clear();
    readout.reset();
  };
  /** Per-layer count of lit systems, shown after each layer's meter. */
  const countHits = (keys: readonly string[]): void => {
    for (const band of bands.values()) {
      const index = Number(band.dataset['esBand']);
      const hits = keys.filter((key) => systems.get(key)?.layer === index).length;
      if (hits > 0) band.querySelector('.es-band__frac')?.setAttribute('data-hits', String(hits));
    }
  };

  // ── readout pieces ──
  const chapterChip = (n: number, plan = false): HTMLAnchorElement => {
    const chapter = chapterOf(n);
    const link = anchor(doc, chapter?.url ?? '#', plan || chapter?.written !== true ? 'en-chap en-chap--plan' : 'en-chap', chapter?.number ?? pad(n));
    link.title = chapter === undefined ? '' : `${chapter.number} ${chapter.title}${chapter.written ? '' : ' (planned)'}`;
    link.dataset['peekCh'] = String(n);
    return link;
  };
  const systemLink = (system: System): HTMLAnchorElement => {
    const link = anchor(doc, system.url, system.chapters.length === 0 ? 'is-idle' : '', system.name);
    link.dataset['peekSys'] = system.key;
    return link;
  };
  const surfaces = (system: System): Child[] =>
    system.surfaces.length === 0
      ? ['none listed']
      : system.surfaces.map((surface) => {
          const link = anchor(doc, surface.url, 'en-surface', surface.label);
          link.rel = 'external';
          return link;
        });
  const openLink = (href: string, text: string): HTMLAnchorElement => anchor(doc, href, '', text);
  const layerLines = (keys: readonly string[]): Node[] => {
    const byLayer = new Map<number, System[]>();
    for (const key of keys) {
      const system = systems.get(key);
      if (system !== undefined) byLayer.set(system.layer, [...(byLayer.get(system.layer) ?? []), system]);
    }
    return [...byLayer.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([layer, list]) =>
        make(doc, 'div', 'en-ro__group', make(doc, 'span', '', layerTag(layer)), make(doc, 'span', 'en-ro__links', ...list.map((system) => make(doc, 'span', '', systemLink(system))))),
      );
  };

  const focusSystem = (key: string): void => {
    const system = systems.get(key);
    const chip = chips.get(key);
    if (system === undefined || chip === undefined) return;
    current = () => {
      focusSystem(key);
    };
    clear();
    activate();
    chip.classList.add('is-focus');
    meters.get(key)?.classList.add('is-hit');
    ledgerRows.get(key)?.classList.add('is-lit');
    for (const n of system.chapters) dots.get(n)?.classList.add('is-lit');
    for (const n of system.planned) dots.get(n)?.classList.add('is-plan');
    lightLanes(system.chapters, system.planned);
    drawWires(
      [
        ...system.chapters.map((n) => ({ chip, part: partOf(n)?.n ?? 0, plan: false })),
        ...system.planned.map((n) => ({ chip, part: partOf(n)?.n ?? 0, plan: true })),
      ],
      false,
    );
    const layerName = layers.get(system.layer)?.name ?? 'Layer not stated';
    const planNote = system.planned.length > 0 ? ` The plan of ${system.planned.map(pad).join(', ')} also names it.` : '';
    const entries: UseEntry[] = system.chapters.map((n) => {
      const use = system.uses.find((candidate) => candidate.ch === n);
      const listed = system.listedIn[String(n)];
      return use !== undefined
        ? { who: chapterChip(n), meta: `§ ${use.sections}`, tag: use.label, what: use.what }
        : {
            who: chapterChip(n),
            meta: listed === undefined ? 'implementations' : `§ ${listed.join(', ')}`,
            tag: '',
            what: 'Listed among the implementations of this chapter; its coverage table has no row for it.',
          };
    });
    for (const n of system.planned) entries.push({ who: chapterChip(n, true), meta: 'planned chapter', tag: '', what: 'Named in the chapter plan’s implementations; not yet written.' });
    readout.show({
      kicker: `${layerTag(system.layer)} · ${layerName}${system.rank === null ? '' : ` · reference stack #${String(system.rank)}`}`,
      title: system.name,
      sub:
        system.chapters.length > 0
          ? `Analysed by ${plural(system.chapters.length, 'written chapter')}.${planNote}`
          : `Not yet analysed by a written chapter — ${String(written)} of ${String(total)} chapters are written.${planNote}`,
      rows: [
        ['surfaces', surfaces(system)],
        ['chapters', system.chapters.length === 0 && system.planned.length === 0 ? ['—'] : [...system.chapters.map((n) => chapterChip(n)), ...system.planned.map((n) => chapterChip(n, true))]],
      ],
      list: { uses: entries, empty: 'No written chapter names this system yet; its page links the documentation and code the reference stack lists.', more: 'on the system’s page' },
      foot: [openLink(system.url, `open ${system.name} →`), ' · Esc clears'],
    });
  };

  const focusChapter = (n: number): void => {
    const chapter = chapterOf(n);
    if (chapter === undefined) return;
    current = () => {
      focusChapter(n);
    };
    clear();
    activate();
    dots.get(n)?.classList.add('is-focus');
    const used = model.systems.filter((system) => system.chapters.includes(n));
    const planned = model.systems.filter((system) => system.planned.includes(n));
    for (const system of [...used, ...planned]) {
      chips.get(system.key)?.classList.add('is-lit');
      meters.get(system.key)?.classList.add('is-hit');
      ledgerRows.get(system.key)?.classList.add('is-lit');
    }
    const keys = [...used, ...planned].map((system) => system.key);
    countHits(keys);
    const part = partOf(n);
    if (chapter.written) lightLanes([n]);
    else lightLanes([], [n]);
    drawWires(
      [...used, ...planned].flatMap((system) => {
        const chip = chips.get(system.key);
        return chip === undefined ? [] : [{ chip, part: part?.n ?? 0, plan: !chapter.written }];
      }),
      true,
    );
    const layersTouched = new Set([...used, ...planned].map((system) => system.layer));
    readout.show({
      kicker: `Chapter ${chapter.number} · Part ${part?.numeral ?? ''} · ${part?.title ?? ''}`,
      title: chapter.title,
      sub: chapter.written
        ? used.length > 0
          ? `Analyses ${plural(used.length, 'system')} across ${String(layersTouched.size)} of ${String(model.layers.filter((layer) => layer.index >= 0).length)} layers.`
          : 'Written; no reference-stack system is recorded for it.'
        : planned.length > 0
          ? `Planned — not yet written. Its plan already names ${plural(planned.length, 'system')}.`
          : 'Planned — not yet written; no system is recorded for it yet.',
      rows: [
        ['status', [chapter.written ? 'written' : 'planned']],
        ['layers', [layersTouched.size === 0 ? '—' : [...layersTouched].sort((a, b) => a - b).map(layerTag).join(' ')]],
      ],
      list: { nodes: layerLines(keys).length > 0 ? layerLines(keys) : [make(doc, 'p', 'en-ro__legend', 'Nothing to wire yet: the stack lights here once the chapter names a system.')] },
      foot: [openLink(chapter.url, `open chapter ${chapter.number} →`), ' · Esc clears'],
    });
  };

  const focusLayer = (index: number): void => {
    const layer = layers.get(index);
    if (layer === undefined) return;
    current = () => {
      focusLayer(index);
    };
    clear();
    activate();
    labels.get(index)?.classList.add('is-focus');
    bands.get(index)?.classList.add('is-focus');
    const members = layer.systems.map((key) => systems.get(key)).filter((system): system is System => system !== undefined);
    const chapters = new Set<number>();
    const planned = new Set<number>();
    for (const system of members) {
      chips.get(system.key)?.classList.add('is-lit');
      meters.get(system.key)?.classList.add('is-hit');
      for (const n of system.chapters) chapters.add(n);
      for (const n of system.planned) planned.add(n);
    }
    for (const n of chapters) dots.get(n)?.classList.add('is-lit');
    for (const n of planned) if (!chapters.has(n)) dots.get(n)?.classList.add('is-plan');
    lightLanes([...chapters], [...planned]);
    drawWires(
      members.flatMap((system) => {
        const chip = chips.get(system.key);
        if (chip === undefined) return [];
        return [
          ...system.chapters.map((n) => ({ chip, part: partOf(n)?.n ?? 0, plan: false })),
          ...system.planned.map((n) => ({ chip, part: partOf(n)?.n ?? 0, plan: true })),
        ];
      }),
      false,
    );
    const used = members.filter((system) => system.chapters.length > 0);
    const lines = [...members]
      .sort((a, b) => b.chapters.length - a.chapters.length || (a.rank ?? 99) - (b.rank ?? 99))
      .map((system) =>
        make(
          doc,
          'div',
          'en-ro__group',
          make(doc, 'span', '', system.chapters.length === 0 ? '—' : `${String(system.chapters.length)} ch`),
          make(doc, 'span', 'en-ro__links', systemLink(system)),
        ),
      );
    readout.show({
      kicker: index < 0 ? 'Layer not stated in the reference stack' : `Layer ${String(index + 1)} of ${String(model.layers.filter((entry) => entry.index >= 0).length)} · ${layerTag(index)}`,
      title: layer.name,
      sub: `${String(used.length)} of ${plural(members.length, 'system')} analysed by a written chapter; ${plural(chapters.size, 'chapter')} touch this layer.`,
      rows: [
        ['analysed', [`${String(used.length)} / ${String(members.length)}`]],
        ['chapters', chapters.size === 0 ? ['—'] : [...chapters].sort((a, b) => a - b).map((n) => chapterChip(n))],
      ],
      list: { nodes: lines },
      foot: ['Ledger below lists every system with its surfaces · Esc clears'],
    });
  };

  const focusPart = (partNumber: number): void => {
    const part = model.parts.find((candidate) => candidate.n === partNumber);
    if (part === undefined) return;
    current = () => {
      focusPart(partNumber);
    };
    clear();
    activate();
    partLinks.get(partNumber)?.classList.add('is-focus');
    const writtenHere = part.chapters.filter((n) => chapterOf(n)?.written === true);
    for (const n of part.chapters) dots.get(n)?.classList.add('is-lit');
    const used = model.systems.filter((system) => system.chapters.some((n) => part.chapters.includes(n)));
    const planned = model.systems.filter((system) => !used.includes(system) && system.planned.some((n) => part.chapters.includes(n)));
    for (const system of [...used, ...planned]) {
      chips.get(system.key)?.classList.add('is-lit');
      meters.get(system.key)?.classList.add('is-hit');
    }
    countHits([...used, ...planned].map((system) => system.key));
    lightLanes(writtenHere, part.chapters.filter((n) => !writtenHere.includes(n)));
    drawWires(
      [...used, ...planned].flatMap((system) => {
        const chip = chips.get(system.key);
        return chip === undefined ? [] : [{ chip, part: part.n, plan: planned.includes(system) }];
      }),
      true,
    );
    const first = part.chapters[0];
    const last = part.chapters.at(-1);
    const lines = part.chapters.map((n) => {
      const count = model.systems.filter((system) => system.chapters.includes(n)).length;
      const chapter = chapterOf(n);
      return make(
        doc,
        'div',
        'en-ro__group',
        make(doc, 'span', '', chapterChip(n)),
        make(doc, 'span', 'en-ro__links', make(doc, 'span', '', chapter?.short ?? ''), make(doc, 'span', 'en-ro__n', chapter?.written === true ? plural(count, 'system') : 'planned')),
      );
    });
    readout.show({
      kicker: `Part ${part.numeral} · chapters ${first === undefined ? '' : pad(first)}–${last === undefined ? '' : pad(last)}`,
      title: part.title,
      sub: `${String(writtenHere.length)} of ${String(part.chapters.length)} chapters written; together they analyse ${plural(used.length, 'system')}.`,
      rows: [
        ['written', writtenHere.length === 0 ? ['—'] : writtenHere.map((n) => chapterChip(n))],
        ['systems', [String(used.length)]],
      ],
      list: { nodes: lines },
      foot: [openLink(part.url, `open Part ${part.numeral} →`), ' · Esc clears'],
    });
  };

  // ── pointer and focus ──
  const itemOf = (target: EventTarget | null): Element | null =>
    target instanceof Element ? target.closest('[data-es-sys], [data-es-layer], [data-es-ch], [data-es-part]') : null;
  const focusItem = (item: Element | null): void => {
    if (item === null) return;
    const sys = item.getAttribute('data-es-sys');
    const layer = item.getAttribute('data-es-layer');
    const ch = item.getAttribute('data-es-ch');
    const part = item.getAttribute('data-es-part');
    if (sys !== null) focusSystem(sys);
    else if (layer !== null) focusLayer(Number(layer));
    else if (ch !== null) focusChapter(Number(ch));
    else if (part !== null) focusPart(Number(part));
  };
  let lastItem: Element | null = null;
  const onOver = (event: Event): void => {
    const item = itemOf(event.target);
    if (item === null || item === lastItem) return;
    lastItem = item;
    focusItem(item);
  };
  for (const scope of [stack, grid]) {
    scope.addEventListener('pointerover', onOver, { signal });
    scope.addEventListener('focusin', (event) => {
      lastItem = itemOf(event.target);
      focusItem(lastItem);
    }, { signal });
  }
  for (const label of labels.values()) {
    label.addEventListener('click', () => {
      focusLayer(Number(label.dataset['esLayer']));
    }, { signal });
  }
  root.addEventListener('pointerleave', () => {
    lastItem = null;
    if (!root.contains(doc.activeElement)) reset();
  }, { signal });
  root.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) {
      lastItem = null;
      if (!root.matches(':hover')) reset();
    }
  }, { signal });

  // Links in the readout preview their chip or chapter.
  root.querySelector('[data-en-readout]')?.addEventListener('pointerover', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-peek-sys], [data-peek-ch]') : null;
    for (const chip of chips.values()) chip.classList.remove('is-peek');
    for (const dot of dots.values()) dot.classList.remove('is-peek');
    if (link === null) return;
    const sys = link.dataset['peekSys'];
    const ch = link.dataset['peekCh'];
    if (sys !== undefined) chips.get(sys)?.classList.add('is-peek');
    if (ch !== undefined) dots.get(Number(ch))?.classList.add('is-peek');
  }, { signal });

  // The ledger answers the same question as the chips.
  if (ledger !== null) {
    const rowOf = (target: EventTarget | null): string | null =>
      target instanceof Element ? (target.closest<HTMLElement>('[data-es-row]')?.dataset['esRow'] ?? null) : null;
    ledger.addEventListener('pointerover', (event) => {
      const key = rowOf(event.target);
      if (key !== null) focusSystem(key);
    }, { signal });
    ledger.addEventListener('focusin', (event) => {
      const key = rowOf(event.target);
      if (key !== null) focusSystem(key);
    }, { signal });
    ledger.addEventListener('pointerleave', reset, { signal });
    ledger.addEventListener('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !ledger.contains(event.relatedTarget)) reset();
    }, { signal });
  }

  // ── keyboard: the stack and the chapter grid are one tab stop each ──
  const stackRows = (): Element[][] => [...stack.querySelectorAll('.es-band')].map((band) => [...band.querySelectorAll('[data-es-layer], [data-es-sys]')]);
  const stackAll = (): Element[] => stackRows().flat();
  stack.addEventListener('keydown', (event) => {
    const item = itemOf(event.target);
    if (item === null) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    const rows = stackRows();
    const r = rows.findIndex((row) => row.includes(item));
    const row = rows[r] ?? [];
    const c = row.indexOf(item);
    let next: Element | undefined;
    if (event.key === 'ArrowRight') next = row[c + 1];
    else if (event.key === 'ArrowLeft') next = row[c - 1];
    else if (event.key === 'ArrowUp') next = nearestByX(rows[r - 1] ?? [], centreX(item));
    else if (event.key === 'ArrowDown') next = nearestByX(rows[r + 1] ?? [], centreX(item));
    else if (event.key === 'Home') next = rows[0]?.[0];
    else if (event.key === 'End') next = rows.at(-1)?.at(-1);
    else return;
    event.preventDefault();
    if (next instanceof HTMLElement) rove(stackAll(), next);
  }, { signal });

  const gridRows = model.parts.map((part) =>
    [partLinks.get(part.n), ...part.chapters.map((n) => dots.get(n))].filter((node): node is SVGAElement => node !== undefined),
  );
  const gridAll = gridRows.flat();
  grid.addEventListener('keydown', (event) => {
    const item = itemOf(event.target);
    if (item === null) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    const r = gridRows.findIndex((row) => row.some((node) => node === item));
    const c = gridRows[r]?.findIndex((node) => node === item) ?? -1;
    const at = (row: number, column: number): SVGAElement | undefined => {
      const lane = gridRows[Math.max(0, Math.min(gridRows.length - 1, row))] ?? [];
      return lane[Math.max(0, Math.min(lane.length - 1, column))];
    };
    const moves: Readonly<Record<string, readonly [number, number]>> = {
      ArrowRight: [r, c + 1],
      ArrowLeft: [r, c - 1],
      ArrowDown: [r + 1, c],
      ArrowUp: [r - 1, c],
      Home: [0, 1],
      End: [gridRows.length - 1, 6],
    };
    const move = moves[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const next = at(move[0], move[1]);
    if (next !== undefined) rove(gridAll, next);
  }, { signal });

  // Layout changes (resize, container breakpoint) redraw the current state's wires.
  let frame = 0;
  const observer = ctl.observe(
    new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        current?.();
      });
    }),
  );
  observer.observe(body);
  ctl.defer(() => {
    cancelAnimationFrame(frame);
  });
}

// ── labs ───────────────────────────────────────────────────────────────────

type Order = 'rank' | 'footprint';

function initLabs(ctx: PageContext, root: HTMLElement, model: LabsModel): void {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const wrap = root.querySelector<HTMLElement>('[data-el-matrix]');
  const readout = createReadout(doc, root);
  const tables = [...root.querySelectorAll<HTMLTableElement>('[data-el-grain]')];
  if (wrap === null || readout === null || tables.length === 0) return;

  const labs = new Map(model.labs.map((lab) => [lab.key, lab]));
  const chapterOf = (n: number): Chapter | undefined => model.chapters[String(n)];
  const partByN = (n: number): Part | undefined => model.parts.find((part) => part.n === n);
  const partOf = (n: number): Part | undefined => model.parts.find((part) => part.chapters.includes(n));
  const chapterList = Object.values(model.chapters);
  const written = chapterList.filter((chapter) => chapter.written).length;
  const visible = (): HTMLTableElement | undefined => tables.find((table) => getComputedStyle(table).display !== 'none') ?? tables[0];
  const rowsOf = (table: HTMLTableElement): HTMLTableRowElement[] => [...table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-el-row]')];
  const idleLinks = [...root.querySelectorAll<HTMLAnchorElement>('[data-el-idle]')];

  // ── readout pieces ──
  const chapterChip = (n: number, href?: string): HTMLAnchorElement => {
    const chapter = chapterOf(n);
    const link = anchor(doc, href ?? chapter?.url ?? '#', chapter?.written === true ? 'en-chap' : 'en-chap en-chap--plan', chapter?.number ?? pad(n));
    link.title = chapter === undefined ? '' : `${chapter.number} ${chapter.title}`;
    return link;
  };
  const labLink = (lab: Lab): HTMLAnchorElement => {
    const link = anchor(doc, lab.url, 'en-ro__who', lab.name);
    link.dataset['peekRow'] = lab.key;
    return link;
  };
  const surfaceLinks = (lab: Lab): Child[] =>
    lab.surfaces.length === 0
      ? ['none listed']
      : lab.surfaces.map((surface) => {
          const link = anchor(doc, surface.url, 'en-surface', surface.label);
          link.rel = 'external';
          return link;
        });
  const useEntries = (lab: Lab, uses: readonly Use[], who: 'chapter' | 'lab'): UseEntry[] =>
    uses.map((use) => ({
      who: who === 'chapter' ? chapterChip(use.ch, `${lab.url}#ch-${pad(use.ch)}`) : labLink(lab),
      meta: `§ ${use.sections}`,
      tag: use.label,
      what: use.what,
    }));
  const openLink = (href: string, text: string): HTMLAnchorElement => anchor(doc, href, '', text);

  // ── states ──
  let currentKey: string | null = null;
  let currentCol: string | null = null;

  const clear = (): void => {
    currentKey = null;
    currentCol = null;
    for (const table of tables) {
      table.classList.remove('is-active', 'is-colmode');
      for (const node of table.querySelectorAll('.is-lit, .is-focus, .is-col, .is-colfocus, .is-peek')) node.classList.remove('is-lit', 'is-focus', 'is-col', 'is-colfocus', 'is-peek');
    }
    for (const link of idleLinks) link.classList.remove('is-focus');
  };
  const reset = (): void => {
    clear();
    readout.reset();
  };
  const tint = (selector: string): void => {
    for (const table of tables) for (const node of table.querySelectorAll(selector)) node.classList.add('is-col');
  };
  const rowsFor = (key: string): HTMLTableRowElement[] => tables.flatMap((table) => [...table.querySelectorAll<HTMLTableRowElement>(`tr[data-el-row="${CSS.escape(key)}"]`)]);

  const showLab = (lab: Lab): void => {
    readout.show({
      kicker: `Lab${lab.rank === null ? '' : ` · reference-stack position ${String(lab.rank)}`}`,
      title: lab.name,
      sub:
        lab.chapters.length > 0
          ? `Drawn on by ${String(lab.chapters.length)} of ${String(written)} written chapters, across ${plural(lab.sections, 'section')}.`
          : `Not yet drawn on by a written chapter — ${String(written)} of ${String(chapterList.length)} chapters are written.`,
      rows: [
        ['surfaces', surfaceLinks(lab)],
        ['chapters', lab.chapters.length === 0 ? ['—'] : lab.chapters.map((n) => chapterChip(n, `${lab.url}#ch-${pad(n)}`))],
      ],
      list: { uses: useEntries(lab, lab.uses, 'chapter'), empty: 'No written chapter cites this lab yet. Its surfaces are listed above, exactly as the reference stack gives them.', more: 'on the lab’s page' },
      foot: [openLink(lab.url, `open ${lab.name} →`), ' · Esc clears'],
    });
  };

  /** Row focus; `col` adds a crosshair tint without rebuilding the readout. */
  const focusLab = (key: string, col: string | null = null): void => {
    const lab = labs.get(key);
    if (lab === undefined) return;
    if (currentKey !== key || currentCol !== null) {
      clear();
      currentKey = key;
      for (const table of tables) table.classList.add('is-active');
      for (const row of rowsFor(key)) row.classList.add('is-focus');
      showLab(lab);
    } else {
      for (const table of tables) for (const node of table.querySelectorAll('.is-col')) node.classList.remove('is-col');
    }
    if (col !== null) tint(col);
  };

  const focusColumn = (n: number): void => {
    const chapter = chapterOf(n);
    if (chapter === undefined || currentCol === `ch${String(n)}`) return;
    clear();
    currentCol = `ch${String(n)}`;
    for (const table of tables) table.classList.add('is-active', 'is-colmode');
    tint(`[data-el-col="${String(n)}"]`);
    const users = model.labs.filter((lab) => lab.chapters.includes(n));
    for (const lab of users) for (const row of rowsFor(lab.key)) row.classList.add('is-lit');
    for (const table of tables) table.querySelector(`[data-el-part="${String(partOf(n)?.n ?? 0)}"]`)?.classList.add('is-colfocus');
    const part = partOf(n);
    const sections = users.reduce((sum, lab) => sum + (lab.sectionsByChapter[String(n)] ?? 0), 0);
    readout.show({
      kicker: `Chapter ${chapter.number} · Part ${part?.numeral ?? ''}`,
      title: chapter.title,
      sub: chapter.written
        ? users.length > 0
          ? `Draws on ${plural(users.length, 'lab')} across ${plural(sections, 'section')}.`
          : 'Written; its coverage table names no reference-stack lab.'
        : 'Planned — not yet written, so it draws on no lab yet.',
      rows: [
        ['part', [`${part?.numeral ?? ''} · ${part?.title ?? ''}`]],
        ['labs', [String(users.length)]],
      ],
      list: {
        uses: users.flatMap((lab) => useEntries(lab, lab.uses.filter((use) => use.ch === n), 'lab')),
        empty: chapter.written ? 'No lab is named in this chapter’s coverage table.' : 'This column fills when the chapter is written.',
        more: 'in the chapter’s references',
      },
      foot: [openLink(chapter.url, `open chapter ${chapter.number} →`), ' · Esc clears'],
    });
  };

  const focusPart = (n: number): void => {
    const part = partByN(n);
    if (part === undefined || currentCol === `pt${String(n)}`) return;
    clear();
    currentCol = `pt${String(n)}`;
    for (const table of tables) table.classList.add('is-active', 'is-colmode');
    tint(part.chapters.map((c) => `[data-el-col="${String(c)}"]`).join(', '));
    tint(`td[data-el-part="${String(n)}"], th.el-pcol[data-el-part="${String(n)}"]`);
    for (const table of tables) for (const node of table.querySelectorAll(`th[data-el-part="${String(n)}"]`)) node.classList.add('is-focus');
    const users = model.labs.filter((lab) => lab.chapters.some((c) => part.chapters.includes(c)));
    for (const lab of users) for (const row of rowsFor(lab.key)) row.classList.add('is-lit');
    const writtenHere = part.chapters.filter((c) => chapterOf(c)?.written === true);
    const first = part.chapters[0];
    const last = part.chapters.at(-1);
    readout.show({
      kicker: `Part ${part.numeral} · chapters ${first === undefined ? '' : pad(first)}–${last === undefined ? '' : pad(last)}`,
      title: part.title,
      sub: `${String(writtenHere.length)} of ${String(part.chapters.length)} chapters written; they draw on ${plural(users.length, 'lab')}.`,
      rows: [
        ['written', writtenHere.length === 0 ? ['—'] : writtenHere.map((c) => chapterChip(c))],
        ['labs', [String(users.length)]],
      ],
      list: {
        uses: users.map((lab) => {
          const here = lab.chapters.filter((c) => part.chapters.includes(c));
          const sections = here.reduce((sum, c) => sum + (lab.sectionsByChapter[String(c)] ?? 0), 0);
          return { who: labLink(lab), meta: here.map(pad).join(' '), tag: '', what: `${plural(here.length, 'chapter')} · ${plural(sections, 'section')}` };
        }),
        empty: writtenHere.length === 0 ? 'No chapter of this part is written yet, so it draws on no lab yet.' : 'No lab is named in these chapters’ coverage tables.',
      },
      foot: [openLink(part.url, `open Part ${part.numeral} →`), ' · Esc clears'],
    });
  };

  const focusCell = (key: string, n: number, mark: Element): void => {
    const lab = labs.get(key);
    const chapter = chapterOf(n);
    if (lab === undefined || chapter === undefined) return;
    clear();
    currentKey = key;
    currentCol = `cell${String(n)}`;
    for (const table of tables) table.classList.add('is-active');
    for (const row of rowsFor(key)) row.classList.add('is-focus');
    tint(`[data-el-col="${String(n)}"]`);
    mark.classList.add('is-focus');
    const uses = lab.uses.filter((use) => use.ch === n);
    readout.show({
      kicker: `${lab.name} × chapter ${chapter.number}`,
      title: chapter.title,
      sub: uses.map((use) => `§ ${use.sections}${use.label === '' ? '' : ` · ${use.label}`}`).join('; '),
      rows: [
        ['lab', [lab.name]],
        ['sections', [String(lab.sectionsByChapter[String(n)] ?? 0)]],
      ],
      list: { uses: useEntries(lab, uses, 'chapter'), empty: '' },
      foot: [openLink(`${lab.url}#ch-${pad(n)}`, `open ${lab.name} at chapter ${chapter.number} →`)],
    });
  };

  const focusPartCell = (key: string, n: number, mark: Element): void => {
    const lab = labs.get(key);
    const part = partByN(n);
    if (lab === undefined || part === undefined) return;
    clear();
    currentKey = key;
    currentCol = `pcell${String(n)}`;
    for (const table of tables) table.classList.add('is-active');
    for (const row of rowsFor(key)) row.classList.add('is-focus');
    tint(`td[data-el-part="${String(n)}"], th.el-pcol[data-el-part="${String(n)}"]`);
    mark.classList.add('is-focus');
    const uses = lab.uses.filter((use) => part.chapters.includes(use.ch));
    readout.show({
      kicker: `${lab.name} × Part ${part.numeral}`,
      title: part.title,
      sub: `${plural(new Set(uses.map((use) => use.ch)).size, 'written chapter')} of this part draw on ${lab.name}.`,
      rows: [
        ['lab', [lab.name]],
        ['chapters', [...new Set(uses.map((use) => use.ch))].map((c) => chapterChip(c, `${lab.url}#ch-${pad(c)}`))],
      ],
      list: { uses: useEntries(lab, uses, 'chapter'), empty: '' },
      foot: [openLink(lab.url, `open ${lab.name} →`)],
    });
  };

  const focusIdle = (key: string, link: HTMLAnchorElement): void => {
    const lab = labs.get(key);
    if (lab === undefined) return;
    clear();
    currentKey = key;
    link.classList.add('is-focus');
    showLab(lab);
  };

  // ── pointer and focus ──
  const dispatch = (target: EventTarget | null): void => {
    if (!(target instanceof Element)) return;
    const row = target.closest<HTMLElement>('tr[data-el-row]');
    const key = row?.dataset['elRow'];
    const mark = target.closest<HTMLElement>('[data-el-cell], [data-el-pcell]');
    if (key !== undefined && mark !== null) {
      const cell = mark.dataset['elCell'];
      const pcell = mark.dataset['elPcell'];
      if (cell !== undefined) focusCell(key, Number(cell), mark);
      else if (pcell !== undefined) focusPartCell(key, Number(pcell), mark);
      return;
    }
    if (key !== undefined) {
      const cell = target.closest<HTMLElement>('td[data-el-col], td[data-el-part]');
      const col = cell?.dataset['elCol'];
      const part = cell?.dataset['elPart'];
      focusLab(key, col !== undefined ? `[data-el-col="${col}"]` : part !== undefined ? `td[data-el-part="${part}"], th.el-pcol[data-el-part="${part}"]` : null);
      return;
    }
    const head = target.closest<HTMLElement>('th[data-el-col], th[data-el-part]');
    const col = head?.dataset['elCol'];
    const part = head?.dataset['elPart'];
    if (col !== undefined) focusColumn(Number(col));
    else if (part !== undefined) focusPart(Number(part));
  };
  wrap.addEventListener('pointerover', (event) => {
    dispatch(event.target);
  }, { signal });
  wrap.addEventListener('focusin', (event) => {
    dispatch(event.target);
  }, { signal });
  // A click anywhere on a row that is not itself a link opens the lab.
  wrap.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || event.target.closest('a') !== null) return;
    const key = event.target.closest<HTMLElement>('tr[data-el-row]')?.dataset['elRow'];
    const lab = key === undefined ? undefined : labs.get(key);
    if (lab !== undefined) window.location.assign(lab.url);
  }, { signal });
  for (const link of idleLinks) {
    const key = link.dataset['elIdle'] ?? '';
    link.addEventListener('pointerenter', () => {
      focusIdle(key, link);
    }, { signal });
    link.addEventListener('focus', () => {
      focusIdle(key, link);
    }, { signal });
  }
  root.addEventListener('pointerleave', () => {
    if (!root.contains(doc.activeElement)) reset();
  }, { signal });
  root.addEventListener('focusout', (event) => {
    if ((!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) && !root.matches(':hover')) reset();
  }, { signal });
  root.querySelector('[data-en-readout]')?.addEventListener('pointerover', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-peek-row]') : null;
    for (const table of tables) for (const node of table.querySelectorAll('.is-peek')) node.classList.remove('is-peek');
    const key = link?.dataset['peekRow'];
    if (key !== undefined) for (const row of rowsFor(key)) row.classList.add('is-peek');
  }, { signal });

  // ── keyboard: one tab stop per table; arrows move by row and column ──
  const navRows = (table: HTMLTableElement): HTMLElement[][] => rowsOf(table).map((row) => [...row.querySelectorAll<HTMLElement>('[data-el-nav]')]);
  const columnOf = (item: HTMLElement): number => Number(item.dataset['elCell'] ?? item.dataset['elPcell'] ?? 0);
  wrap.addEventListener('keydown', (event) => {
    const item = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[data-el-nav]') : null;
    const table = item?.closest('table');
    if (item === null || table === null || table === undefined) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    const rows = navRows(table);
    const r = rows.findIndex((row) => row.includes(item));
    const row = rows[r] ?? [];
    const c = row.indexOf(item);
    const nearest = (candidates: readonly HTMLElement[]): HTMLElement | undefined => {
      const col = columnOf(item);
      return [...candidates].sort((a, b) => Math.abs(columnOf(a) - col) - Math.abs(columnOf(b) - col))[0];
    };
    let next: HTMLElement | undefined;
    if (event.key === 'ArrowRight') next = row[c + 1];
    else if (event.key === 'ArrowLeft') next = row[c - 1];
    else if (event.key === 'ArrowUp') next = nearest(rows[r - 1] ?? []);
    else if (event.key === 'ArrowDown') next = nearest(rows[r + 1] ?? []);
    else if (event.key === 'Home') next = rows[0]?.[0];
    else if (event.key === 'End') next = rows.at(-1)?.[0];
    else return;
    event.preventDefault();
    if (next !== undefined) rove(rows.flat(), next);
  }, { signal });

  // ── ordering: reference-stack position (default) or footprint ──
  const sortbar = root.querySelector<HTMLElement>('[data-el-sortbar]');
  const note = root.querySelector<HTMLElement>('[data-el-sortnote]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-el-sort]')];
  const NOTES: Readonly<Record<Order, string>> = {
    rank: 'Reference-stack list order — a position, not a ranking.',
    footprint: 'By footprint: chapters, then sections — a measure of the book so far, not of the lab.',
  };
  const applyOrder = (order: Order, animate: boolean): void => {
    const shown = visible();
    const before = new Map(shown === undefined ? [] : rowsOf(shown).map((row) => [row, row.getBoundingClientRect().top] as const));
    for (const table of tables) {
      const tbody = table.querySelector('tbody');
      if (tbody === null) continue;
      const sorted = rowsOf(table).sort((a, b) => {
        const rank = Number(a.dataset['rank']) - Number(b.dataset['rank']);
        return order === 'rank' ? rank : Number(b.dataset['fp']) - Number(a.dataset['fp']) || rank;
      });
      tbody.append(...sorted);
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset['elSort'] === order));
    if (note !== null) note.textContent = NOTES[order];
    if (!animate || reducedMotion()) return;
    for (const [row, top] of before) {
      const delta = top - row.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) continue;
      row.classList.remove('is-moving');
      row.style.transform = `translateY(${String(delta)}px)`;
      void row.getBoundingClientRect();
      row.classList.add('is-moving');
      row.style.transform = '';
      ctl.timeout(() => {
        row.classList.remove('is-moving');
      }, 320);
    }
  };
  if (sortbar !== null && buttons.length > 0) {
    sortbar.hidden = false;
    const initial = new URLSearchParams(window.location.search).get('order') === 'footprint' ? 'footprint' : 'rank';
    if (initial !== 'rank') applyOrder(initial, false);
    for (const button of buttons) {
      button.addEventListener('click', () => {
        const order: Order = button.dataset['elSort'] === 'footprint' ? 'footprint' : 'rank';
        reset();
        applyOrder(order, true);
        const url = new URL(window.location.href);
        if (order === 'rank') url.searchParams.delete('order');
        else url.searchParams.set('order', order);
        history.replaceState(history.state, '', url);
      }, { signal });
    }
  }
}
