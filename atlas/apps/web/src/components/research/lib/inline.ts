/**
 * Inline view model: resolves each core `Inline` node into exactly what the
 * template prints (tag, href, class), so Inline.astro stays a flat, typed
 * dispatch. Pure: the deploy base is a parameter.
 *
 * Security: hrefs are re-checked here even though the compiler resolved them.
 * Internal links must be root-relative or fragments; external links must be
 * http(s)/mailto. Anything else degrades to plain text, never to a live link.
 */
import type { CitationKey, EvidenceLabel, Inline } from '@atlas/core';
import { assertNever, paperUrl } from '@atlas/core';
import { isBareUrl, isInternalHref, isSafeExternalHref, shortUrl, withBase } from './url.ts';

export type InlineView =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'emphasis' | 'strong' | 'delete' | 'plain'; readonly children: readonly Inline[] }
  | { readonly kind: 'code'; readonly value: string }
  | { readonly kind: 'math'; readonly html: string }
  | {
      readonly kind: 'link';
      readonly href: string;
      readonly className: string;
      readonly title: string | undefined;
      readonly rel: string | undefined;
      /** Atlas node id for internal links (drives the link preview card). */
      readonly node: string | undefined;
      readonly children: readonly Inline[];
    }
  | { readonly kind: 'cite'; readonly key: CitationKey; readonly resolved: boolean }
  | { readonly kind: 'label'; readonly label: EvidenceLabel }
  | { readonly kind: 'xref'; readonly href: string; readonly xref: string; readonly text: string }
  | { readonly kind: 'xref-missing'; readonly text: string }
  | { readonly kind: 'break' };

function internal(href: string, base: string): string | null {
  return isInternalHref(href) ? withBase(href, base) : null;
}

export function inlineView(node: Inline, base: string): InlineView {
  switch (node.kind) {
    case 'text':
      return { kind: 'text', value: node.value };
    case 'emphasis':
    case 'strong':
    case 'delete':
      return { kind: node.kind, children: node.children };
    case 'code':
      return { kind: 'code', value: node.value };
    case 'math':
      return { kind: 'math', html: node.html };
    case 'cite':
      return { kind: 'cite', key: node.key, resolved: node.resolved };
    case 'label':
      return { kind: 'label', label: node.label };
    case 'break':
      return { kind: 'break' };
    case 'xref': {
      const href = node.target === null ? null : internal(node.target.href, base);
      return href === null
        ? { kind: 'xref-missing', text: node.text }
        : { kind: 'xref', href, xref: `${node.ref}:${node.number}`, text: node.text };
    }
    case 'link': {
      const target = node.target;
      switch (target.type) {
        case 'node': {
          const href = internal(target.href, base);
          return href === null
            ? { kind: 'plain', children: node.children }
            : { kind: 'link', href, className: 'rb-link', title: undefined, rel: undefined, node: target.nodeId, children: node.children };
        }
        case 'planned': {
          const href = internal(target.href, base);
          return href === null
            ? { kind: 'plain', children: node.children }
            : { kind: 'link', href, className: 'rb-link rb-planned', title: undefined, rel: undefined, node: target.nodeId, children: node.children };
        }
        case 'external': {
          if (!isSafeExternalHref(target.href)) return { kind: 'plain', children: node.children };
          // A bare URL written as its own link text reads as noise in prose and blows up table
          // columns: show `host/path…` and keep the full URL as the title.
          const bare = isBareUrl(node.children, target.href);
          return {
            kind: 'link',
            href: target.href,
            className: bare ? 'rb-link rb-link--ext rb-link--url' : 'rb-link rb-link--ext',
            title: bare ? target.href : undefined,
            rel: 'noopener',
            node: undefined,
            children: bare ? [{ kind: 'text', value: shortUrl(target.href) }] : node.children,
          };
        }
        case 'unresolved':
          return { kind: 'plain', children: node.children };
        default:
          return assertNever(target);
      }
    }
    default:
      return assertNever(node);
  }
}

export function inlineViews(nodes: readonly Inline[], base: string): InlineView[] {
  return nodes.map((node) => inlineView(node, base));
}

/** Base-aware paper page for a citation key. */
export function citeHrefFor(key: CitationKey, base: string): string {
  return withBase(paperUrl(key), base);
}
