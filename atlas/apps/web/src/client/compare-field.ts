/**
 * Compare index (pages/compare/index.astro): the alternatives field and its
 * text twin, connected. Pointing at a node's group of columns, or at its row
 * in the list, lights both and names the node in the readout (its
 * alternatives, how completely they are answered); pointing at one column
 * names that alternative — why it exists and the primitive it changes.
 * Leaving restores the rest state. Focus follows the same path as the pointer.
 *
 * Loaded on demand from stack-explorer.ts when the field markup is present.
 */
import type { PageContext } from './page.ts';

export function initCompareField(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const field = doc.querySelector<HTMLElement>('[data-compare-field]');
  const readout = field?.querySelector<HTMLElement>('[data-cmp-readout]') ?? null;
  if (field === null || readout === null) return;
  const list = doc.querySelector<HTMLElement>('[data-cmp-list]');
  const scopes = [field, ...(list === null ? [] : [list])];
  const slot = (name: string): HTMLElement | null => readout.querySelector<HTMLElement>(`[data-cmp-${name}]`);
  const out = { kicker: slot('rk'), title: slot('rt'), text: slot('rx'), change: slot('rc'), answers: slot('ra') };
  const initial = Object.fromEntries(
    Object.entries(out).map(([key, element]) => [key, element?.textContent ?? '']),
  ) as Record<keyof typeof out, string>;

  const members = new Map<string, HTMLElement[]>();
  for (const scope of scopes) {
    for (const element of scope.querySelectorAll<HTMLElement>('[data-cmp-id]')) {
      const key = element.dataset['cmpId'] ?? '';
      members.set(key, [...(members.get(key) ?? []), element]);
    }
  }

  const write = (values: Record<keyof typeof out, string>): void => {
    for (const [key, element] of Object.entries(out)) {
      if (element !== null) element.textContent = values[key as keyof typeof out];
    }
  };
  let litKey: string | null = null;
  let litAlt: HTMLElement | null = null;
  const clear = (): void => {
    for (const scope of scopes) scope.classList.remove('has-lit');
    for (const group of members.values()) for (const element of group) element.classList.remove('is-lit');
    litAlt?.classList.remove('is-alt');
    litKey = null;
    litAlt = null;
  };
  const lightNode = (key: string): HTMLElement | null => {
    const group = members.get(key);
    if (group === undefined) return null;
    for (const scope of scopes) scope.classList.add('has-lit');
    for (const element of group) element.classList.add('is-lit');
    litKey = key;
    return group[0] ?? null;
  };
  const showNode = (key: string): void => {
    clear();
    const source = lightNode(key);
    if (source === null) return;
    write({
      kicker: source.dataset['cmpKicker'] ?? '',
      title: source.dataset['cmpTitle'] ?? '',
      text: source.dataset['cmpText'] ?? '',
      change: '—',
      answers: source.dataset['cmpGap'] ?? '',
    });
  };
  const showAlt = (alt: HTMLElement): void => {
    const node = alt.closest<HTMLElement>('[data-cmp-id]');
    const key = node?.dataset['cmpId'];
    if (node === null || key === undefined) return;
    clear();
    lightNode(key);
    alt.classList.add('is-alt');
    litAlt = alt;
    const total = node.querySelectorAll('[data-cmp-alt]').length;
    const why = alt.dataset['cmpWhy'] ?? '';
    const stated = Number(alt.dataset['cmpStated'] ?? '0');
    write({
      kicker: `§${node.querySelector('.cmpx__num')?.textContent ?? ''} · alternative ${alt.dataset['cmpAlt'] ?? ''} of ${String(total)}`,
      title: alt.dataset['cmpName'] ?? '',
      text: why === '' ? 'Why it exists: not stated.' : `Why it exists: ${why}`,
      change: alt.dataset['cmpChange'] === '' ? 'not stated' : (alt.dataset['cmpChange'] ?? ''),
      answers: `${String(stated)} of 6 stated`,
    });
  };
  const reset = (): void => {
    clear();
    write(initial);
  };

  for (const scope of scopes) {
    scope.addEventListener(
      'pointerover',
      (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const alt = target?.closest<HTMLElement>('[data-cmp-alt]') ?? null;
        if (alt !== null) {
          if (alt !== litAlt) showAlt(alt);
          return;
        }
        const key = target?.closest<HTMLElement>('[data-cmp-id]')?.dataset['cmpId'];
        if (key !== undefined && (key !== litKey || litAlt !== null)) showNode(key);
      },
      { signal: ctl.signal },
    );
    scope.addEventListener('pointerleave', reset, { signal: ctl.signal });
    scope.addEventListener(
      'focusin',
      (event) => {
        const key =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>('[data-cmp-id]')?.dataset['cmpId']
            : undefined;
        if (key === undefined) reset();
        else showNode(key);
      },
      { signal: ctl.signal },
    );
    scope.addEventListener(
      'focusout',
      (event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !scopes.some((other) => other.contains(event.relatedTarget as Node))
        )
          reset();
      },
      { signal: ctl.signal },
    );
  }
}
