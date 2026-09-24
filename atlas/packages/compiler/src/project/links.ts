/**
 * Link resolution for `CompileContext.resolveLink` (CONTENT_CONTRACT §11):
 * relative `.md` paths resolve from the linking file's directory through the
 * path index (manifest paths + compiled documents) to a node; planned targets
 * render muted (`link-planned`, info) and unknown ones degrade to text
 * (`link-unresolved`, warning). Diagnostics are de-duplicated per href.
 */
import path from 'node:path';
import { diagnostic, type Diagnostic, type LinkTarget, type NodeId } from '@atlas/core';
import { resolveDocsPath } from './fs.ts';
import type { NodeTable } from './types.ts';

const EXTERNAL_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:']);

export interface LinkResolver {
  readonly resolve: (href: string) => LinkTarget;
  /** Diagnostics raised so far, one per distinct problematic href. */
  readonly diagnostics: () => readonly Diagnostic[];
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Malformed percent-encoding: keep the raw text rather than failing the link.
    return value;
  }
}

export function createLinkResolver(table: NodeTable, sourcePath: string, selfId: NodeId): LinkResolver {
  const issued = new Map<string, Diagnostic>();
  const self = table.nodes.get(selfId);
  const selfUrl = self?.url ?? '/';

  const report = (href: string, make: () => Diagnostic): void => {
    if (!issued.has(href)) issued.set(href, make());
  };

  const unresolved = (href: string, why: string): LinkTarget => {
    report(href, () => diagnostic('link-unresolved', `link "${href}" ${why}`, { file: sourcePath, nodeId: selfId }));
    return { type: 'unresolved', raw: href };
  };

  const resolve = (rawHref: string): LinkTarget => {
    const href = rawHref.trim();
    if (href === '') return unresolved(rawHref, 'is empty');

    const scheme = /^([a-z][a-z0-9+.-]*:)/iu.exec(href)?.[1]?.toLowerCase();
    if (scheme !== undefined) {
      if (EXTERNAL_SCHEMES.has(scheme)) return { type: 'external', href };
      return unresolved(href, `uses the unsupported scheme ${scheme}`);
    }
    if (href.startsWith('//')) return unresolved(href, 'is protocol-relative; write an https:// URL');

    const hashAt = href.indexOf('#');
    const pathPart = (hashAt === -1 ? href : href.slice(0, hashAt)).split('?', 1)[0] ?? '';
    const anchorRaw = hashAt === -1 ? '' : href.slice(hashAt + 1);
    const anchor = anchorRaw === '' ? null : safeDecode(anchorRaw);

    if (pathPart === '') {
      return { type: 'node', nodeId: selfId, anchor, href: anchor === null ? selfUrl : `${selfUrl}#${anchor}` };
    }

    const decoded = safeDecode(pathPart);
    const fromFile = decoded.startsWith('/') ? 'index.md' : sourcePath;
    const relative = decoded.startsWith('/') ? decoded.slice(1) : decoded;
    const target = resolveDocsPath(fromFile, relative);
    if (target === null) return unresolved(href, 'points outside docs/');

    const candidates =
      target === '' || decoded.endsWith('/') || path.posix.extname(target) === ''
        ? [path.posix.join(target, 'README.md')]
        : [target];
    let nodeId: NodeId | undefined;
    for (const candidate of candidates) {
      nodeId = table.pathIndex.get(candidate);
      if (nodeId !== undefined) break;
    }
    if (nodeId === undefined) {
      const shown = candidates[0] ?? target;
      return unresolved(href, `does not resolve to an atlas node (${shown} is not in the manifest or docs/)`);
    }

    const node = table.nodes.get(nodeId);
    if (node === undefined) return unresolved(href, 'resolves to an unknown node');
    if (node.doc === null) {
      report(href, () =>
        diagnostic('link-planned', `link to planned node ${nodeId} (${node.url}) — no manuscript yet`, { file: sourcePath, nodeId: selfId }),
      );
      return { type: 'planned', nodeId, href: node.url };
    }
    return { type: 'node', nodeId, anchor, href: anchor === null ? node.url : `${node.url}#${anchor}` };
  };

  return { resolve, diagnostics: () => [...issued.values()] };
}
