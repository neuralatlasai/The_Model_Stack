/**
 * Shiki highlighter for `CompileContext.highlight`: created once per compile
 * (async grammar/WASM load), then used synchronously. Dual theme via CSS
 * variables (`defaultColor: false`). Unknown languages return null so the
 * renderer falls back to escaped plain `<pre><code>`.
 */
import { createHighlighter, type Highlighter } from 'shiki';
import { ATLAS_DARK_THEME, ATLAS_LIGHT_THEME, atlasDark, atlasLight } from './themes.ts';

/** Grammars loaded for the manuscripts (fence languages observed in docs/ plus common neighbours). */
export const HIGHLIGHT_LANGS = [
  'python',
  'yaml',
  'json',
  'bash',
  'shell',
  'cpp',
  'c',
  'markdown',
  'jinja',
  'toml',
  'javascript',
  'typescript',
] as const;

/** Shiki's built-in plain-text languages (no grammar needed). */
const PLAIN_LANGS: ReadonlySet<string> = new Set(['text', 'plaintext', 'txt', 'plain']);

export interface CodeHighlighter {
  readonly highlight: (code: string, lang: string | null) => string | null;
  /** Releases grammar/engine resources. Idempotent. */
  readonly dispose: () => void;
}

export async function createCodeHighlighter(): Promise<CodeHighlighter> {
  const highlighter: Highlighter = await createHighlighter({
    themes: [atlasLight, atlasDark],
    langs: [...HIGHLIGHT_LANGS],
  });
  const loaded = new Set(highlighter.getLoadedLanguages().map((lang) => lang.toLowerCase()));
  let disposed = false;

  const highlight = (code: string, lang: string | null): string | null => {
    if (disposed || lang === null) return null;
    const key = lang.trim().toLowerCase();
    if (!PLAIN_LANGS.has(key) && !loaded.has(key)) return null;
    return highlighter.codeToHtml(code, {
      lang: PLAIN_LANGS.has(key) ? 'text' : key,
      themes: { light: ATLAS_LIGHT_THEME, dark: ATLAS_DARK_THEME },
      defaultColor: false,
    });
  };

  return {
    highlight,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      highlighter.dispose();
    },
  };
}
