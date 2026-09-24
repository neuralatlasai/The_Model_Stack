/**
 * Mini stack map in the rail (components/research/MiniStack.astro): hovering or
 * focusing a chapter dot names it in the readout line (with its degree) and
 * lights its own direct prerequisites and dependents on the map; leaving
 * restores the page's focus. The focus state itself is server-rendered.
 */
import type { PageContext } from './page.ts';

export function initMiniStack(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  for (const figure of doc.querySelectorAll<HTMLElement>('[data-mini-stack]')) {
    const readout = figure.querySelector<HTMLElement>('[data-mini-readout]');
    const svg = figure.querySelector<SVGSVGElement>('svg');
    if (readout === null || svg === null) continue;
    const initial = readout.dataset['default'] ?? readout.textContent;
    const nodes = new Map([...figure.querySelectorAll<SVGAElement>('[data-mini-node]')].map((node) => [node.dataset['miniNode'] ?? '', node]));
    const clear = (): void => {
      svg.classList.remove('has-peek');
      for (const node of nodes.values()) node.classList.remove('is-peek', 'is-peek-up', 'is-peek-down');
    };
    const show = (event: Event): void => {
      const node = event.target instanceof Element ? event.target.closest<SVGAElement>('[data-mini-node]') : null;
      if (node === null) return;
      clear();
      readout.textContent = node.dataset['miniLabel'] ?? '';
      svg.classList.add('has-peek');
      node.classList.add('is-peek');
      for (const link of (node.dataset['miniLinks'] ?? '').split(' ')) {
        const target = nodes.get(link.slice(1));
        target?.classList.add(link.startsWith('u') ? 'is-peek-up' : 'is-peek-down');
      }
    };
    const restore = (): void => {
      clear();
      readout.textContent = initial;
    };
    figure.addEventListener('pointerover', show, { signal: ctl.signal });
    figure.addEventListener('focusin', show, { signal: ctl.signal });
    figure.addEventListener('pointerleave', restore, { signal: ctl.signal });
    figure.addEventListener('focusout', (event) => {
      if (!(event.relatedTarget instanceof Node) || !figure.contains(event.relatedTarget)) restore();
    }, { signal: ctl.signal });
  }
}
