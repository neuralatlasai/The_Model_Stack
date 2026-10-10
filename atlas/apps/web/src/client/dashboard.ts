/** Synchronise the brain, the connected stations and native chapter links. */
import { z } from 'zod';
import type { PageContext } from './page.ts';
const State = z.object({
  part: z.number(),
  badge: z.string(),
  range: z.string(),
  status: z.string(),
  chapters: z.array(z.number()),
});
const Navigation = z.object({
  overview: State,
  parts: z.array(State),
  edges: z.array(z.tuple([z.number(), z.number()])),
});
export function initDashboard(ctx: PageContext, root: HTMLElement): void {
  const parsed = Navigation.safeParse(JSON.parse(root.querySelector('[data-dash-data]')?.textContent ?? 'null'));
  if (!parsed.success) return;
  const { overview, parts, edges } = parsed.data;
  const brain = root.querySelector<HTMLElement>('[data-brain]');
  const tether = root.querySelector<SVGElement>('[data-region-tether]');
  const tetherPath = tether?.querySelector<SVGPathElement>('[data-region-tether-path]');
  const tetherOrigin = tether?.querySelector<SVGCircleElement>('[data-region-tether-origin]');
  let currentPart = 0;
  let region: { part: number; x: number; y: number } | null = null;
  let projection: {
    x: number;
    y: number;
    width: number;
    height: number;
    stations: Map<number, { x: number; y: number }>;
  } | null = null;
  const drawTether = (): void => {
    const target = projection?.stations.get(currentPart);
    if (region?.part !== currentPart || currentPart === 0 || projection === null || target === undefined) {
      tether?.setAttribute('data-visible', 'false');
      return;
    }
    tether?.setAttribute('data-visible', 'true');
    const x = projection.x + region.x * projection.width;
    const y = projection.y + region.y * projection.height;
    const bend = Math.max(y + 24, projection.y + projection.height - 18);
    tetherPath?.setAttribute('d', `M${x} ${y}C${x} ${bend} ${target.x} ${bend + 20} ${target.x} ${target.y}`);
    tetherOrigin?.setAttribute('cx', String(x));
    tetherOrigin?.setAttribute('cy', String(y));
  };
  const measureTether = (): void => {
    const canvas = root.querySelector('canvas');
    if (canvas === null) return;
    const bounds = root.getBoundingClientRect();
    const area = canvas.getBoundingClientRect();
    const stations = new Map<number, { x: number; y: number }>();
    for (const station of root.querySelectorAll<SVGElement>('[data-map-part]')) {
      const point = station.querySelector('.dx-map__point')?.getBoundingClientRect();
      if (point !== undefined)
        stations.set(Number(station.dataset['mapPart']), {
          x: point.x + point.width / 2 - bounds.x,
          y: point.y + point.height / 2 - bounds.y,
        });
    }
    projection = { x: area.x - bounds.x, y: area.y - bounds.y, width: area.width, height: area.height, stations };
    drawTether();
  };
  const sticky = root.closest<HTMLElement>('.bs-sticky');
  if (sticky !== null) {
    // A tall, expanded catalogue must scroll into view with the document.
    // Keep its lower edge reachable instead of trapping it below the viewport.
    const topbar = ctx.doc.querySelector<HTMLElement>('.sh-topbar');
    const fitSticky = (): void => {
      const top = Math.min((topbar?.getBoundingClientRect().height ?? 52) + 12, innerHeight - root.offsetHeight - 12);
      sticky.style.setProperty('--dx-sticky-top', `${top}px`);
      measureTether();
    };
    const observer = ctx.ctl.observe(new ResizeObserver(fitSticky));
    observer.observe(root);
    if (topbar !== null) observer.observe(topbar);
    window.addEventListener('resize', fitSticky, { signal: ctx.ctl.signal, passive: true });
    fitSticky();
  }
  const partOf = (chapter: number): number => parts.find((part) => part.chapters.includes(chapter))?.part ?? 0;
  let selectedChapter: number | null = null;
  const paintEdges = (): void => {
    const connected =
      selectedChapter === null
        ? null
        : edges.filter(([from, to]) => from === selectedChapter || to === selectedChapter);
    const relatedParts = new Set([currentPart]);
    for (const edge of root.querySelectorAll<SVGElement>('.dx-map__edge')) {
      const from = Number(edge.dataset['from']);
      const to = Number(edge.dataset['to']);
      const active =
        connected === null
          ? from === currentPart || to === currentPart
          : connected.some(([a, b]) => partOf(a) === from && partOf(b) === to);
      edge.classList.toggle('is-active', currentPart > 0 && active);
      edge.classList.toggle('is-outgoing', currentPart > 0 && active && from === currentPart);
      if (active) {
        relatedParts.add(from);
        relatedParts.add(to);
      }
    }
    for (const station of root.querySelectorAll<SVGElement>('[data-map-part]')) {
      station.classList.toggle('is-related', relatedParts.has(Number(station.dataset['mapPart'])));
    }
  };
  const paintMap = (part: number): void => {
    currentPart = part;
    root.dataset['activePart'] = String(part);
    for (const node of root.querySelectorAll<SVGElement>('[data-map-part]')) {
      node.setAttribute('aria-current', Number(node.dataset['mapPart']) === part ? 'true' : 'false');
    }
    for (const group of root.querySelectorAll<SVGElement>('[data-map-chapters]')) {
      group.style.display = Number(group.dataset['mapChapters']) === part ? '' : 'none';
    }
    const population = root.querySelector<SVGElement>('[data-map-overview]');
    if (population !== null) population.style.display = part === 0 ? '' : 'none';
    const state = parts.find((item) => item.part === part) ?? overview;
    const badge = root.querySelector('[data-dx-badge]');
    const range = root.querySelector('[data-dx-range]');
    const status = root.querySelector('[data-map-status]');
    if (badge !== null) badge.textContent = state.badge;
    if (range !== null) range.textContent = state.range;
    if (status !== null)
      status.textContent = part > 0 ? state.status : 'Select a part to trace its chapters and prerequisites.';
    paintEdges();
    drawTether();
  };
  const paintChapter = (chapter: number | null): void => {
    selectedChapter = chapter;
    root.dataset['selectedChapter'] = chapter === null ? '' : String(chapter);
    const related = new Set(
      chapter === null ? [] : edges.filter(([from, to]) => from === chapter || to === chapter).flat(),
    );
    for (const link of root.querySelectorAll<HTMLElement>('[data-map-chapter]')) {
      const n = Number(link.dataset['mapChapter']);
      link.classList.toggle('is-selected', n === chapter);
      link.classList.toggle('is-related', related.has(n) && n !== chapter);
    }
    for (const group of root.querySelectorAll<HTMLElement>('[data-catalog-part]')) {
      group.classList.toggle('is-related', Number(group.dataset['catalogPart']) === currentPart);
    }
    paintEdges();
  };
  root.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-map-part]') : null;
      if (target === null || brain === null || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const part = Number(target.getAttribute('data-map-part'));
      paintChapter(null);
      brain.dispatchEvent(
        new CustomEvent('hx:part', {
          detail: { part, k: 'Part', t: parts.find((state) => state.part === part)?.badge ?? '' },
          bubbles: true,
        }),
      );
    },
    { signal: ctx.ctl.signal },
  );
  for (const type of ['pointerover', 'focusin'] as const) {
    root.addEventListener(
      type,
      (event) => {
        const target = event.target instanceof Element ? event.target.closest('[data-map-chapter]') : null;
        if (target === null) return;
        const chapter = Number(target.getAttribute('data-map-chapter'));
        const part = partOf(chapter);
        if (currentPart !== part)
          brain?.dispatchEvent(
            new CustomEvent('hx:part', {
              detail: { part, k: 'Part', t: parts.find((state) => state.part === part)?.badge ?? '' },
              bubbles: true,
            }),
          );
        paintChapter(chapter);
        brain?.dispatchEvent(new CustomEvent('hx:chapter', { detail: chapter }));
      },
      { signal: ctx.ctl.signal },
    );
  }
  for (const type of ['pointerout', 'focusout'] as const) {
    root.addEventListener(
      type,
      (event) => {
        const target = event.target instanceof Element ? event.target.closest('[data-map-chapter]') : null;
        const next = event.relatedTarget instanceof Element ? event.relatedTarget.closest('[data-map-chapter]') : null;
        if (target === null || next !== null) return;
        paintChapter(null);
        brain?.dispatchEvent(new CustomEvent('hx:chapter', { detail: null }));
      },
      { signal: ctx.ctl.signal },
    );
  }
  root.addEventListener(
    'hx:part',
    (event) => {
      paintChapter(null);
      paintMap((event as CustomEvent<{ part: number }>).detail.part);
    },
    { signal: ctx.ctl.signal },
  );
  root.addEventListener(
    'webglcontextlost',
    () => {
      region = null;
      projection = null;
      drawTether();
    },
    { capture: true, signal: ctx.ctl.signal },
  );
  root.addEventListener(
    'hx:region',
    (event) => {
      region = (event as CustomEvent<{ part: number; x: number; y: number }>).detail;
      if (projection === null) measureTether();
      drawTether();
    },
    { signal: ctx.ctl.signal },
  );
  root.addEventListener(
    'hx:signal',
    (event) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const { from, to, delay, duration } = (
        event as CustomEvent<{ from: number; to: number; delay: number; duration: number }>
      ).detail;
      const source = partOf(from);
      const destination = partOf(to);
      if (source === 0 || destination === 0) return;
      const pulse = (part: number, wait: number): void => {
        root
          .querySelector(`[data-map-part="${part}"] .dx-map__point`)
          ?.animate([{ strokeWidth: 3, fill: 'var(--accent)' }, { strokeWidth: 1 }], {
            duration: 700,
            delay: wait,
            easing: 'ease-out',
          });
      };
      pulse(source, delay);
      if (source !== destination) {
        pulse(destination, delay + duration);
        const edge = root.querySelector(`.dx-map__edge[data-from="${source}"][data-to="${destination}"]`);
        edge?.animate(
          [
            { opacity: 0 },
            { opacity: 0.55, offset: 0.25 },
            { opacity: 0.55, offset: 0.75 },
            { opacity: edge.classList.contains('is-active') ? 0.65 : 0 },
          ],
          { duration, delay },
        );
      }
    },
    { signal: ctx.ctl.signal },
  );
  root.addEventListener(
    'hx:selection',
    (event) => {
      const chapter = (event as CustomEvent<{ chapter: number | null }>).detail.chapter;
      if (chapter !== null) paintMap(partOf(chapter));
      paintChapter(chapter);
    },
    { signal: ctx.ctl.signal },
  );
  paintMap(0);
}
