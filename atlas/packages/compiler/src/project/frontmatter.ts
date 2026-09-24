/**
 * Frontmatter trust boundary: split the `--- … ---` block, parse it with the
 * YAML 1.2 core schema (so `2026-09-20` stays a string and no custom tags are
 * honoured), then validate with the frozen `FrontmatterSchema`.
 */
import { FrontmatterSchema, toNodeMeta, type NodeMeta } from '@atlas/core';
import { parse as parseYaml } from 'yaml';

export interface FrontmatterSplit {
  readonly yaml: string;
  /** Markdown after the closing fence. */
  readonly body: string;
  /** 1-based line of the first body line in the original file. */
  readonly bodyStartLine: number;
}

/**
 * Returns null when the text does not open with a `---` fence on line 1, or the
 * fence is never closed. Expects LF line endings (see `normaliseText`).
 */
export function splitFrontmatter(text: string): FrontmatterSplit | null {
  if (!/^---[ \t]*\n/u.test(text)) return null;
  const lines = text.split('\n');
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (/^(?:---|\.\.\.)[ \t]*$/u.test(line)) {
      return {
        yaml: lines.slice(1, i).join('\n'),
        body: lines.slice(i + 1).join('\n'),
        bodyStartLine: i + 2,
      };
    }
  }
  return null;
}

export type FrontmatterResult =
  | { readonly ok: true; readonly meta: NodeMeta }
  | { readonly ok: false; readonly message: string; readonly line: number | null };

/** YAML parse + schema validation. Never throws. */
export function parseFrontmatter(yamlText: string): FrontmatterResult {
  let raw: unknown;
  try {
    raw = parseYaml(yamlText, { schema: 'core', uniqueKeys: true, prettyErrors: true, maxAliasCount: 16 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message.split('\n')[0] ?? error.message : String(error);
    const linePos = extractYamlLine(error);
    return { ok: false, message: `YAML: ${message}`, line: linePos === null ? null : linePos + 1 };
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, message: 'frontmatter is not a YAML mapping', line: 2 };
  }
  const parsed = FrontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 6)
      .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    const more = parsed.error.issues.length > 6 ? ` (+${String(parsed.error.issues.length - 6)} more)` : '';
    return { ok: false, message: `${issues}${more}`, line: 2 };
  }
  return { ok: true, meta: toNodeMeta(parsed.data) };
}

/** The `yaml` package attaches `linePos: [{ line, col }]` to its errors. */
function extractYamlLine(error: unknown): number | null {
  if (error === null || typeof error !== 'object' || !('linePos' in error)) return null;
  const linePos: unknown = error.linePos;
  if (!Array.isArray(linePos)) return null;
  const first: unknown = linePos[0];
  if (first === null || typeof first !== 'object' || !('line' in first)) return null;
  const line: unknown = first.line;
  return typeof line === 'number' ? line : null;
}
