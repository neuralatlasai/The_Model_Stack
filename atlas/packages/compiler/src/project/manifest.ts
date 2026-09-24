/**
 * `docs/atlas-manifest.json` trust boundary. The manifest is the machine-readable
 * node list (3 volumes, 11 parts, 66 chapters, 396 sections, 8 appendices,
 * front matter); it is what makes planned-but-unwritten nodes addressable.
 */
import { isNodeId, parseNodeId, type NodeId } from '@atlas/core';
import { z } from 'zod';

const nodeId = z
  .string()
  .refine((value): value is NodeId => isNodeId(value), { message: 'not a node id' });
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/u);
const docsPath = z
  .string()
  .min(1)
  .refine((value) => !value.startsWith('/') && !value.split('/').includes('..') && value.endsWith('.md'), {
    message: 'must be a docs-relative .md path',
  });

const SectionSchema = z
  .object({
    id: nodeId,
    number: z.string().regex(/^\d+\.\d+$/u),
    title: z.string().min(1),
    slug,
    path: docsPath,
    prev: nodeId.nullable(),
    next: nodeId.nullable(),
  })
  .strict();

const ChapterSchema = z
  .object({
    id: nodeId,
    number: z.number().int().positive(),
    title: z.string().min(1),
    slug,
    path: docsPath,
    prerequisites_text: z.string().nullable(),
    artifact: z.string().nullable(),
    prev: nodeId.nullable(),
    next: nodeId.nullable(),
    verification: docsPath,
    references: docsPath,
    sections: z.array(SectionSchema),
  })
  .strict();

const PartSchema = z
  .object({
    id: nodeId,
    number: z.number().int().positive(),
    title: z.string().min(1),
    slug,
    path: docsPath,
    outcome: z.string().nullable(),
    chapters: z.array(ChapterSchema),
  })
  .strict();

const VolumeSchema = z
  .object({
    id: nodeId,
    number: z.number().int().positive(),
    title: z.string().min(1),
    slug,
    path: docsPath,
    parts: z.array(PartSchema),
  })
  .strict();

const AppendixSchema = z
  .object({
    id: nodeId,
    letter: z.string().regex(/^[A-Z]$/u),
    title: z.string().min(1),
    slug,
    path: docsPath,
  })
  .strict();

const FrontMatterEntrySchema = z.object({ id: nodeId, path: docsPath }).strict();

export const ManifestSchema = z
  .object({
    edition: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
    root: z.string().min(1),
    volumes: z.array(VolumeSchema).min(1),
    appendices: z.array(AppendixSchema),
    front_matter: z.array(FrontMatterEntrySchema),
  })
  .strict();

export type Manifest = z.output<typeof ManifestSchema>;
export type ManifestVolume = z.output<typeof VolumeSchema>;
export type ManifestPart = z.output<typeof PartSchema>;
export type ManifestChapter = z.output<typeof ChapterSchema>;
export type ManifestSection = z.output<typeof SectionSchema>;
export type ManifestAppendix = z.output<typeof AppendixSchema>;

/** Raised when the manifest is missing or invalid: without it no route can be computed. */
export class ManifestError extends Error {
  readonly code = 'manifest-invalid';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ManifestError';
  }
}

/** Parses manifest JSON text. Throws `ManifestError` with a readable issue list. */
export function parseManifest(jsonText: string): Manifest {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (error: unknown) {
    throw new ManifestError('atlas-manifest.json is not valid JSON', { cause: error });
  }
  const parsed = ManifestSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`)
      .join('; ');
    throw new ManifestError(`atlas-manifest.json failed validation: ${issues}`);
  }
  return parsed.data;
}

/** Chapter id → verification / references ids (`ms.chapter.5` → `ms.verification.5`). */
export function satelliteIds(chapterNumber: number): { readonly verification: NodeId; readonly references: NodeId } {
  return {
    verification: derivedId(`ms.verification.${String(chapterNumber)}`),
    references: derivedId(`ms.references.${String(chapterNumber)}`),
  };
}

/** Validates an id built from manifest numbers (a positive integer always yields a valid id). */
function derivedId(value: string): NodeId {
  const id = parseNodeId(value);
  if (id === null) throw new ManifestError(`derived node id ${value} is invalid`);
  return id;
}
