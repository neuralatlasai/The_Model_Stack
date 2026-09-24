/**
 * Inspector and preview content (UI_UX §19 paper objects, §31 citation
 * previews, §16 equation inspector). Built with safe DOM APIs from the
 * zod-validated PageData; the only markup inserted from a string is the
 * compiler's KaTeX output (see `trustedCompilerHtml`).
 *
 * The same builder serves the hover preview (`preview`: links are mouse-only,
 * keyboard users reach them by pinning) and the pinned rail inspector or
 * mobile sheet (`pinned`).
 */
import { ATTR, isCitationKey, paperUrl, type InspectTarget, type NodeId, type PageData } from '@atlas/core';
import { h, trustedCompilerHtml } from './dom.ts';
import { pageData } from './page-data.ts';
import { safeExternalHref, safeInternalHref, withBase } from './urls.ts';

export type ViewMode = 'preview' | 'pinned';

export interface InspectorView {
  /** Mono kind line: `PAPER · P19`, `TERM`, `EQUATION`, `POSITION`. */
  readonly kind: string;
  readonly title: string;
  readonly body: HTMLElement;
}

/** The page the view is built for (a PageContext satisfies it); its data island is read via page-data.ts. */
export interface ViewSource {
  readonly doc: Document;
  readonly base: string;
  readonly nodeId: NodeId | null;
}

interface Source {
  readonly data: PageData | null;
  readonly base: string;
  readonly nodeId: NodeId | null;
}

type Route = PageData['neighbours']['prerequisites'][number];

export function buildInspectorView(page: ViewSource, target: InspectTarget, mode: ViewMode): InspectorView {
  const source: Source = { data: pageData(page.doc), base: page.base, nodeId: page.nodeId };
  switch (target.type) {
    case 'paper':
      return paperView(source, target.key, mode);
    case 'term':
      return termView(source, target.slug, mode);
    case 'equation':
      return equationView(source, target.number, mode);
    case 'node':
      return target.id === source.nodeId ? positionView(source, mode) : nodeView(source, target.id, mode);
  }
}

function paperView(source: Source, key: string, mode: ViewMode): InspectorView {
  const record = source.data?.references[key];
  if (record === undefined) {
    const fallback = isCitationKey(key) ? withBase(source.base, paperUrl(key)) : null;
    return {
      kind: `PAPER · ${key}`,
      title: key,
      body: body(
        h('p', { class: 'cx-insp__note' }, 'No reference record is embedded for this citation on this page.'),
        links(mode, [['Paper page', fallback, false]]),
      ),
    };
  }
  return {
    kind: `${record.type.toUpperCase()} · ${record.key}`,
    title: record.work,
    body: body(
      record.authors === '' ? null : h('p', { class: 'cx-insp__authors' }, record.authors),
      rows([
        ['venue', record.venue],
        ['status', record.status],
      ]),
      record.usedFor === ''
        ? null
        : h('p', { class: 'cx-insp__used' }, h('span', { class: 'cx-insp__label' }, 'Used for'), ' ', record.usedFor),
      links(mode, [
        ['Open paper', safeExternalHref(record.url), true],
        ['Paper page', safeInternalHref(record.atlasUrl), false],
        ['Official code', safeExternalHref(record.code), true],
      ]),
    ),
  };
}

function termView(source: Source, slug: string, mode: ViewMode): InspectorView {
  const term = source.data?.terms[slug];
  if (term === undefined) {
    return { kind: 'TERM', title: slug, body: body(h('p', { class: 'cx-insp__note' }, 'No glossary definition is embedded on this page.')) };
  }
  return {
    kind: 'TERM',
    title: term.term,
    body: body(
      h('p', { class: 'cx-insp__definition' }, term.definition),
      links(mode, [[`Defined in ${term.ownerTitle}`, safeInternalHref(term.url), false]]),
    ),
  };
}

function equationView(source: Source, number: string, mode: ViewMode): InspectorView {
  const equation = source.data?.equations[number];
  const title = `Eq. ${number}`;
  if (equation === undefined) {
    return { kind: 'EQUATION', title, body: body(h('p', { class: 'cx-insp__note' }, 'This equation is not embedded on this page.')) };
  }
  const math = h('div', { class: 'cx-insp__math', 'data-equation': equation.number });
  math.append(trustedCompilerHtml(equation.html));
  const variables =
    equation.variables.length === 0
      ? null
      : h(
          'dl',
          { class: 'cx-insp__vars' },
          ...equation.variables.flatMap((variable) => [
            h('dt', { [ATTR.eqVar]: variable.symbol, tabindex: mode === 'pinned' ? 0 : null }, variable.symbol),
            h('dd', {}, variable.meaning),
          ]),
        );
  return {
    kind: 'EQUATION',
    title,
    body: body(math, variables, links(mode, [[`Go to Eq. ${equation.number}`, safeInternalHref(equation.url), false]])),
  };
}

const ENTITY_LABEL: Readonly<Record<string, string>> = {
  chapter: 'CHAPTER',
  section: 'SECTION',
  part: 'PART',
  volume: 'VOLUME',
  verification: 'VERIFICATION',
  references: 'REFERENCES',
  appendix: 'APPENDIX',
  frontmatter: 'FRONT MATTER',
};

/** Where a link leads: identity, written or planned, what it holds, and how it sits in the graph. */
function cardView(card: PageData['nodes'][string], mode: ViewMode): InspectorView {
  const entity = ENTITY_LABEL[card.entity] ?? card.entity.toUpperCase();
  const kind = [card.number === null ? entity : `${entity} ${card.number}`, card.written ? null : 'PLANNED'].filter((part) => part !== null).join(' · ');
  const facts: string[] = [];
  if (card.entity === 'chapter') {
    facts.push(`builds on ${String(card.prerequisites)}`, `unlocks ${String(card.dependents)}`);
  }
  const states = Array.from(card.sections);
  const written = states.filter((state) => state === 'w').length;
  const label =
    card.sectionPosition === null
      ? `${String(written)}/${String(states.length)} sections written`
      : `section ${String(card.sectionPosition)} of ${String(states.length)} · ${String(written)} written`;
  const sections =
    states.length === 0
      ? null
      : h(
          'p',
          { class: 'cx-insp__sections', 'aria-label': label },
          ...states.map((state, index) =>
            h('span', {
              class: ['cx-insp__sec', state === 'w' ? 'is-written' : null, index + 1 === card.sectionPosition ? 'is-self' : null]
                .filter((name) => name !== null)
                .join(' '),
            }),
          ),
          h('span', { class: 'cx-insp__sec-label', 'aria-hidden': 'true' }, label),
        );
  return {
    kind,
    title: card.title,
    body: body(
      card.within === null ? null : h('p', { class: 'cx-insp__within' }, card.within),
      card.summary === null
        ? card.written
          ? null
          : h('p', { class: 'cx-insp__note' }, 'In the book plan; the manuscript is not written yet.')
        : h('p', { class: 'cx-insp__definition' }, card.summary),
      facts.length === 0 ? null : h('p', { class: 'cx-insp__facts' }, facts.join(' · ')),
      sections,
      mode === 'pinned' ? links(mode, [[card.written ? 'Open' : 'Open plan', safeInternalHref(card.url), false]]) : null,
    ),
  };
}

function nodeView(source: Source, id: NodeId, mode: ViewMode): InspectorView {
  const card = source.data?.nodes[id];
  if (card !== undefined) return cardView(card, mode);
  const neighbours = source.data?.neighbours;
  const route = neighbours === undefined ? undefined : [...neighbours.prerequisites, ...neighbours.siblings, ...neighbours.dependents].find((r) => r.id === id);
  if (route === undefined) {
    return { kind: 'NODE', title: id, body: body(h('p', { class: 'cx-insp__note' }, 'This node is not in the current neighbourhood.')) };
  }
  return { kind: 'NODE', title: routeLabel(route), body: body(links(mode, [['Open', safeInternalHref(route.url), false]])) };
}

/** Where-am-I: prerequisites · siblings · downstream (UI_UX §1 relations 2–4). */
function positionView(source: Source, mode: ViewMode): InspectorView {
  const neighbours = source.data?.neighbours;
  const groups: readonly (readonly [string, readonly Route[]])[] = [
    ['Prerequisites', neighbours?.prerequisites ?? []],
    ['Siblings', neighbours?.siblings ?? []],
    ['Downstream', neighbours?.dependents ?? []],
  ];
  return {
    kind: 'POSITION',
    title: source.data?.title ?? 'This page',
    body: body(
      ...groups.map(([label, routes]) =>
        h(
          'section',
          { class: 'cx-insp__group', 'aria-label': label },
          h('h4', { class: 'cx-insp__label' }, label),
          routes.length === 0
            ? h('p', { class: 'cx-insp__note' }, 'None declared.')
            : h('ul', { class: 'cx-insp__list' }, ...routes.map((route) => h('li', {}, routeLink(route, mode)))),
        ),
      ),
    ),
  };
}

function routeLabel(route: Route): string {
  return route.number === null ? route.title : `${route.number} ${route.title}`;
}

function routeLink(route: Route, mode: ViewMode): HTMLElement {
  const href = safeInternalHref(route.url);
  if (href === null) return h('span', {}, routeLabel(route));
  return h('a', { href, tabindex: mode === 'preview' ? -1 : null }, routeLabel(route));
}

function body(...children: (HTMLElement | null)[]): HTMLElement {
  return h('div', { class: 'cx-insp__body' }, ...children);
}

function rows(entries: readonly (readonly [string, string])[]): HTMLElement | null {
  const present = entries.filter(([, value]) => value.trim() !== '');
  if (present.length === 0) return null;
  return h('dl', { class: 'cx-insp__rows' }, ...present.flatMap(([key, value]) => [h('dt', {}, key), h('dd', {}, value)]));
}

/** [label, href (null → omitted), external]. */
function links(mode: ViewMode, entries: readonly (readonly [string, string | null, boolean])[]): HTMLElement | null {
  const present = entries.filter((entry): entry is readonly [string, string, boolean] => entry[1] !== null);
  if (present.length === 0) return null;
  return h(
    'ul',
    { class: 'cx-insp__links' },
    ...present.map(([label, href, external]) =>
      h(
        'li',
        {},
        h(
          'a',
          {
            href,
            tabindex: mode === 'preview' ? -1 : null,
            target: external ? '_blank' : null,
            rel: external ? 'noopener noreferrer' : null,
          },
          label,
          external ? h('span', { class: 'cx-sr-only' }, ' (opens in a new tab)') : null,
        ),
      ),
    ),
  );
}
