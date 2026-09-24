/**
 * Node table: merges the manifest (structure, slugs, planned nodes, plan data)
 * with the compiled-document frontmatter (titles, metadata). The manifest is
 * authoritative for the editorial hierarchy and URLs (slugs are stable URLs,
 * CONTENT_CONTRACT §1.1); documents are authoritative for their own content.
 */
import {
  diagnostic,
  urlForNode,
  type Diagnostic,
  type EntityType,
  type NodeId,
  type NodePlan,
} from '@atlas/core';
import type { Manifest } from './manifest.ts';
import { satelliteIds } from './manifest.ts';
import { toRoman, twoDigit } from './text.ts';
import type { NodeRecord, NodeTable, SourceDoc } from './types.ts';

export const ROOT_ID: NodeId = 'ms.root';
export const APPENDICES_ID: NodeId = 'ms.appendices';
export const FRONT_MATTER_GROUP_ID: NodeId = 'ms.frontmatter';

const ROOT_PATH = 'README.md';
const APPENDICES_PATH = 'appendices/README.md';

interface Draft {
  id: NodeId;
  entityType: EntityType;
  title: string;
  shortTitle: string;
  slug: string;
  number: string | null;
  parent: NodeId | null;
  children: NodeId[];
  volume: number | null;
  part: number | null;
  chapter: number | null;
  path: string | null;
  plan: NodePlan | null;
  /** Slug of the owning chapter (sections, verification, references) for URL construction. */
  chapterSlug: string | null;
}

export interface NodeTableResult extends NodeTable {
  /** Documents accepted for compilation (unique ids), in reading order. */
  readonly docs: readonly SourceDoc[];
}

function capitalise(value: string): string {
  return value.length === 0 ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

/** `ms.frontmatter.reading-routes` → `reading-routes`. */
function frontMatterSlug(id: NodeId): string {
  return id.startsWith('ms.frontmatter.') ? id.slice('ms.frontmatter.'.length) : id.replace(/^ms\./u, '');
}

export function buildNodeTable(manifest: Manifest, sourceDocs: readonly SourceDoc[]): NodeTableResult {
  const diagnostics: Diagnostic[] = [];
  const drafts = new Map<NodeId, Draft>();
  const order: NodeId[] = [];
  const manifestPathOf = new Map<NodeId, string>();

  const add = (draft: Draft): void => {
    drafts.set(draft.id, draft);
    order.push(draft.id);
    if (draft.path !== null) manifestPathOf.set(draft.id, draft.path);
  };

  // ── documents by id (duplicates rejected) ──────────────────────────────────
  const docsById = new Map<NodeId, SourceDoc>();
  for (const doc of sourceDocs) {
    const existing = docsById.get(doc.meta.id);
    if (existing !== undefined) {
      diagnostics.push(
        diagnostic('frontmatter-id-mismatch', `duplicate id ${doc.meta.id}: already declared by ${existing.path}; this file is skipped`, {
          file: doc.path,
          line: 2,
          nodeId: doc.meta.id,
        }),
      );
      continue;
    }
    docsById.set(doc.meta.id, doc);
  }

  // ── manifest skeleton, in reading order ────────────────────────────────────
  const volumeIds: NodeId[] = manifest.volumes.map((volume) => volume.id);
  const frontMatterIds: NodeId[] = manifest.front_matter.map((entry) => entry.id);
  const appendixIds: NodeId[] = manifest.appendices.map((appendix) => appendix.id);

  add({
    id: ROOT_ID,
    entityType: 'frontmatter',
    title: 'The Model Stack',
    shortTitle: 'Atlas index',
    slug: 'index',
    number: null,
    parent: null,
    children: [...volumeIds, FRONT_MATTER_GROUP_ID, APPENDICES_ID],
    volume: null,
    part: null,
    chapter: null,
    path: ROOT_PATH,
    plan: null,
    chapterSlug: null,
  });

  for (const volume of manifest.volumes) {
    const roman = toRoman(volume.number);
    add({
      id: volume.id,
      entityType: 'volume',
      title: `Volume ${roman} — ${volume.title}`,
      shortTitle: `Volume ${roman}`,
      slug: volume.slug,
      number: roman,
      parent: ROOT_ID,
      children: volume.parts.map((part) => part.id),
      volume: volume.number,
      part: null,
      chapter: null,
      path: volume.path,
      plan: null,
      chapterSlug: null,
    });
    for (const part of volume.parts) {
      const partRoman = toRoman(part.number);
      add({
        id: part.id,
        entityType: 'part',
        title: `Part ${partRoman} — ${part.title}`,
        shortTitle: `Part ${partRoman}`,
        slug: part.slug,
        number: partRoman,
        parent: volume.id,
        children: part.chapters.map((chapter) => chapter.id),
        volume: volume.number,
        part: part.number,
        chapter: null,
        path: part.path,
        plan: { artifact: null, prerequisitesText: null, outcome: part.outcome, sections: [] },
        chapterSlug: null,
      });
      for (const chapter of part.chapters) {
        const satellites = satelliteIds(chapter.number);
        const chapterNumber = twoDigit(chapter.number);
        add({
          id: chapter.id,
          entityType: 'chapter',
          title: chapter.title,
          shortTitle: chapter.title,
          slug: chapter.slug,
          number: chapterNumber,
          parent: part.id,
          children: [...chapter.sections.map((section) => section.id), satellites.verification, satellites.references],
          volume: volume.number,
          part: part.number,
          chapter: chapter.number,
          path: chapter.path,
          plan: {
            artifact: chapter.artifact,
            prerequisitesText: chapter.prerequisites_text,
            outcome: part.outcome,
            sections: chapter.sections.map((section) => ({ id: section.id, number: section.number, title: section.title })),
          },
          chapterSlug: chapter.slug,
        });
        for (const section of chapter.sections) {
          add({
            id: section.id,
            entityType: 'section',
            title: section.title,
            shortTitle: section.title,
            slug: section.slug,
            number: section.number,
            parent: chapter.id,
            children: [],
            volume: volume.number,
            part: part.number,
            chapter: chapter.number,
            path: section.path,
            plan: null,
            chapterSlug: chapter.slug,
          });
        }
        add({
          id: satellites.verification,
          entityType: 'verification',
          title: `Verification — Chapter ${chapterNumber}`,
          shortTitle: `Verification ${chapterNumber}`,
          slug: 'verification',
          number: null,
          parent: chapter.id,
          children: [],
          volume: volume.number,
          part: part.number,
          chapter: chapter.number,
          path: chapter.verification,
          plan: null,
          chapterSlug: chapter.slug,
        });
        add({
          id: satellites.references,
          entityType: 'references',
          title: `References — Chapter ${chapterNumber}`,
          shortTitle: `References ${chapterNumber}`,
          slug: 'references',
          number: null,
          parent: chapter.id,
          children: [],
          volume: volume.number,
          part: part.number,
          chapter: chapter.number,
          path: chapter.references,
          plan: null,
          chapterSlug: chapter.slug,
        });
      }
    }
  }

  add({
    id: FRONT_MATTER_GROUP_ID,
    entityType: 'frontmatter',
    title: 'Front matter',
    shortTitle: 'Front matter',
    slug: 'front-matter',
    number: null,
    parent: ROOT_ID,
    children: frontMatterIds,
    volume: null,
    part: null,
    chapter: null,
    path: null,
    plan: null,
    chapterSlug: null,
  });
  for (const entry of manifest.front_matter) {
    const slug = frontMatterSlug(entry.id);
    add({
      id: entry.id,
      entityType: 'frontmatter',
      title: capitalise(slug.replaceAll('-', ' ')),
      shortTitle: capitalise(slug.replaceAll('-', ' ')),
      slug,
      number: null,
      parent: FRONT_MATTER_GROUP_ID,
      children: [],
      volume: null,
      part: null,
      chapter: null,
      path: entry.path,
      plan: null,
      chapterSlug: null,
    });
  }

  add({
    id: APPENDICES_ID,
    entityType: 'frontmatter',
    title: 'Reference appendices',
    shortTitle: 'Appendices',
    slug: 'appendices',
    number: null,
    parent: ROOT_ID,
    children: appendixIds,
    volume: null,
    part: null,
    chapter: null,
    path: APPENDICES_PATH,
    plan: null,
    chapterSlug: null,
  });
  for (const appendix of manifest.appendices) {
    add({
      id: appendix.id,
      entityType: 'appendix',
      title: appendix.title,
      shortTitle: `Appendix ${appendix.letter}`,
      slug: appendix.slug,
      number: appendix.letter,
      parent: APPENDICES_ID,
      children: [],
      volume: null,
      part: null,
      chapter: null,
      path: appendix.path,
      plan: null,
      chapterSlug: null,
    });
  }

  // ── overlay documents ──────────────────────────────────────────────────────
  const idAtManifestPath = new Map<string, NodeId>();
  for (const [id, manifestPath] of manifestPathOf) idAtManifestPath.set(manifestPath, id);

  const attached = new Map<NodeId, SourceDoc>();
  const extras: SourceDoc[] = [];
  for (const doc of docsById.values()) {
    const draft = drafts.get(doc.meta.id);
    const location = { file: doc.path, line: 2, nodeId: doc.meta.id } as const;
    if (draft === undefined) {
      const owner = idAtManifestPath.get(doc.path);
      if (owner !== undefined) {
        diagnostics.push(
          diagnostic('frontmatter-id-mismatch', `frontmatter id ${doc.meta.id} does not match the manifest id ${owner} for this path`, location),
        );
      } else {
        diagnostics.push(diagnostic('manifest-unknown-node', `${doc.meta.id} is not listed in atlas-manifest.json`, location));
      }
      extras.push(doc);
      continue;
    }
    if (draft.path !== null && draft.path !== doc.path) {
      diagnostics.push(
        diagnostic('frontmatter-id-mismatch', `${doc.meta.id} is declared here but the manifest places it at ${draft.path}`, location),
      );
    }
    if (draft.slug !== doc.meta.slug && draft.id !== ROOT_ID) {
      diagnostics.push(
        diagnostic(
          'frontmatter-id-mismatch',
          `slug "${doc.meta.slug}" differs from the manifest slug "${draft.slug}"; the manifest slug is the URL`,
          location,
        ),
      );
    }
    draft.title = doc.meta.title;
    draft.shortTitle = doc.meta.shortTitle;
    attached.set(draft.id, doc);
  }

  // Extra documents join the table under their declared parent (URL derived best-effort).
  for (const doc of [...extras].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    const parent = doc.meta.parent !== null && drafts.has(doc.meta.parent) ? doc.meta.parent : null;
    const parentDraft = parent === null ? undefined : drafts.get(parent);
    add({
      id: doc.meta.id,
      entityType: doc.meta.entityType,
      title: doc.meta.title,
      shortTitle: doc.meta.shortTitle,
      slug: doc.meta.slug,
      number: doc.meta.section,
      parent,
      children: [],
      volume: doc.meta.volume,
      part: doc.meta.part,
      chapter: doc.meta.chapter,
      path: doc.path,
      plan: null,
      chapterSlug: parentDraft?.entityType === 'chapter' ? parentDraft.slug : null,
    });
    if (parentDraft !== undefined && !parentDraft.children.includes(doc.meta.id)) parentDraft.children.push(doc.meta.id);
    attached.set(doc.meta.id, doc);
  }

  // ── URLs, path index, records ──────────────────────────────────────────────
  const nodes = new Map<NodeId, NodeRecord>();
  const urls = new Map<string, NodeId>();
  for (const id of order) {
    const draft = drafts.get(id);
    if (draft === undefined) continue;
    const doc = attached.get(id) ?? null;
    const url = urlOf(draft);
    const clash = urls.get(url);
    if (clash !== undefined) {
      diagnostics.push(
        diagnostic('frontmatter-id-mismatch', `${id} and ${clash} resolve to the same URL ${url}`, {
          file: doc?.path ?? draft.path,
          nodeId: id,
        }),
      );
    } else {
      urls.set(url, id);
    }
    nodes.set(id, {
      id,
      entityType: draft.entityType,
      title: draft.title,
      shortTitle: draft.shortTitle,
      slug: draft.slug,
      number: draft.number,
      url,
      parent: draft.parent,
      children: draft.children,
      volume: draft.volume,
      part: draft.part,
      chapter: draft.chapter,
      path: doc?.path ?? draft.path,
      doc,
      plan: draft.plan,
    });
  }

  const pathIndex = new Map<string, NodeId>();
  for (const [id, manifestPath] of manifestPathOf) pathIndex.set(manifestPath, id);
  for (const [id, doc] of attached) pathIndex.set(doc.path, id);

  const docs = order.flatMap((id) => {
    const doc = attached.get(id);
    return doc === undefined ? [] : [doc];
  });

  return { nodes, order, pathIndex, diagnostics, docs };
}

function urlOf(draft: Draft): string {
  if (draft.id === ROOT_ID) return '/';
  if (draft.id === APPENDICES_ID) return '/appendices/';
  if (draft.id === FRONT_MATTER_GROUP_ID) return '/front-matter/';
  switch (draft.entityType) {
    case 'volume':
    case 'part':
    case 'chapter':
      return urlForNode({ type: draft.entityType, slug: draft.slug });
    case 'section':
      return draft.chapterSlug === null
        ? urlForNode({ type: 'chapter', slug: draft.slug })
        : urlForNode({ type: 'section', chapterSlug: draft.chapterSlug, slug: draft.slug });
    case 'verification':
    case 'references':
      return draft.chapterSlug === null
        ? urlForNode({ type: 'chapter', slug: `${draft.slug}-${String(draft.chapter ?? 0)}` })
        : urlForNode({ type: draft.entityType, chapterSlug: draft.chapterSlug });
    case 'appendix':
      return urlForNode({ type: 'appendix', slug: draft.slug });
    case 'frontmatter':
      return urlForNode({ type: 'frontmatter', slug: draft.slug });
  }
}
