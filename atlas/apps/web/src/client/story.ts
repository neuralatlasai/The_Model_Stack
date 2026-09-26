/**
 * Home story (components/home/BrainStory.astro): the brain follows the text.
 *
 * - The step crossing the middle of the viewport is the current one; it is
 *   marked and its part is sent to the brain (`hx:part`), which turns to that
 *   region and draws its connections. The intro and the close show the whole
 *   brain.
 * - Pointing at (or focusing) a chapter in the text lights its neuron
 *   (`hx:chapter`) — the text and the image are one instrument.
 * - The WebGL brain starts at once (client brain3d.ts); without WebGL the
 *   drawn brain (client brain.ts) stands in.
 */
import type { PageContext } from './page.ts';

interface Part {
  readonly part: number;
  readonly k: string;
  readonly t: string;
}

export function initStory(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const root = doc.querySelector<HTMLElement>('[data-story]');
  const fig = root?.querySelector<HTMLElement>('[data-brain]') ?? null;
  if (root === null || fig === null) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const home = root.closest('main');
  if (!reduced) home?.classList.add('hx-anim');
  ctl.defer(() => {
    home?.classList.remove('hx-anim');
  });

  // ── the brain ──────────────────────────────────────────────────────────────
  let current: Part = { part: 0, k: 'The Model Stack', t: 'From data and silicon to intelligence' };
  // sent to the brain; it bubbles to the dashboard around it
  const send = (): void => {
    fig.dispatchEvent(new CustomEvent('hx:part', { detail: current, bubbles: true }));
  };
  const dash = root.querySelector<HTMLElement>('[data-dash]');
  if (dash !== null) {
    void import('./dashboard.ts').then((module) => {
      if (ctl.disposed) return;
      module.initDashboard(ctx, dash, reduced);
      send();
    });
  }
  void import('./brain3d.ts')
    .then((module) => !ctl.disposed && module.initBrain3D(ctx, fig, reduced))
    .catch(() => false)
    .then((ok) => {
      if (ctl.disposed) return;
      if (ok) {
        send();
        return;
      }
      fig.classList.add('is-2d');
      void import('./brain.ts').then((module) => {
        if (!ctl.disposed) module.initBrain(ctx, fig, reduced);
      });
    });

  // ── steps: the one crossing the middle of the viewport leads ──────────────
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const choose = (step: HTMLElement): void => {
    for (const other of steps) other.classList.toggle('is-current', other === step);
    const next = { part: Number(step.dataset['part'] ?? 0), k: step.dataset['k'] ?? '', t: step.dataset['t'] ?? '' };
    if (next.part === current.part && next.t === current.t) return;
    current = next;
    send();
  };
  const band = new IntersectionObserver(
    (entries) => {
      const hit = entries.find((entry) => entry.isIntersecting);
      if (hit?.target instanceof HTMLElement) choose(hit.target);
    },
    { rootMargin: '-42% 0px -42% 0px' },
  );
  ctl.observe(band);
  for (const step of steps) band.observe(step);
  const first = steps[0];
  if (first !== undefined) first.classList.add('is-current');

  // ── chapters named in the text light their neurons ────────────────────────
  const chapterOf = (target: EventTarget | null): number | null => {
    const link = target instanceof Element ? target.closest<HTMLElement>('[data-ch]') : null;
    return link === null ? null : Number(link.dataset['ch']);
  };
  const light = (n: number | null): void => {
    fig.dispatchEvent(new CustomEvent('hx:chapter', { detail: n }));
  };
  for (const type of ['pointerover', 'focusin'] as const) {
    root.addEventListener(type, (event) => {
      const n = chapterOf(event.target);
      if (n !== null) light(n);
    }, { signal });
  }
  for (const type of ['pointerout', 'focusout'] as const) {
    root.addEventListener(type, (event) => {
      if (chapterOf(event.target) !== null) light(null);
    }, { signal });
  }
}
