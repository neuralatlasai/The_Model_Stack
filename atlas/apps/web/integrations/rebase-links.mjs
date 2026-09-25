// @ts-check
/**
 * Rebase root-relative links when the site is served under a sub-path
 * (GitHub Pages project sites: https://<owner>.github.io/<repo>/).
 *
 * Astro's `base` prefixes the assets it generates, but the atlas links pages
 * with root-relative URLs taken from the compiled graph (`/ch05-…/`), in
 * markup, in JSON data islands, and in the search payloads. After the build,
 * this integration rewrites every internal root-relative URL to start with
 * the base — once, never twice — so the same source serves `/` locally and
 * `/<repo>/` on Pages. It is a no-op when `base` is `/`.
 *
 *   HTML   href / src / action / poster / xlink:href attribute values
 *   JSON   string values under URL-like keys (url, href, atlasUrl, …) in
 *          `<script type="application/json">` islands and *.json files,
 *          re-serialised with the same HTML-safe escaping as src/lib/json.ts
 *   CSS    url(/…) references
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Keys whose string values are internal URLs in the atlas data islands and payloads. */
const URL_KEY = /^(?:url|href|atlasUrl|link|path|canonical|target)$/iu;

/** @param {string} value @param {string} base */
function rebaseUrl(value, base) {
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith(base)) return value;
  return base + value.slice(1);
}

/** @param {unknown} node @param {string} base @returns {unknown} */
function rebaseJson(node, base) {
  if (Array.isArray(node)) return node.map((item) => rebaseJson(item, base));
  if (node !== null && typeof node === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = typeof value === 'string' && URL_KEY.test(key) ? rebaseUrl(value, base) : rebaseJson(value, base);
    }
    return out;
  }
  return node;
}

/** Same escaping as src/lib/json.ts `jsonForHtml`. @param {unknown} value */
function jsonForHtml(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll(' ', '\\u2028')
    .replaceAll(' ', '\\u2029');
}

/** @param {string} html @param {string} base */
export function rebaseHtml(html, base) {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const attr = new RegExp(`(\\s(?:href|src|action|poster|xlink:href)=)(["'])/(?!/|${escaped.slice(1)})`, 'gu');
  let out = html.replace(attr, `$1$2${base}`);
  out = out.replace(/(<script\b[^>]*type="application\/(?:ld\+)?json"[^>]*>)([\s\S]*?)(<\/script>)/gu, (whole, open, body, close) => {
    try {
      return `${open}${jsonForHtml(rebaseJson(JSON.parse(body), base))}${close}`;
    } catch {
      return whole; // not JSON after all: leave untouched
    }
  });
  return out;
}

/** @param {string} css @param {string} base */
export function rebaseCss(css, base) {
  return css.replace(/url\((["']?)\/(?!\/)/gu, (match, quote, offset) => (css.startsWith(base, offset + 4 + quote.length) ? match : `url(${quote}${base}`));
}

/** JSON file text with its URL-like values rebased; unparsable text is returned unchanged. @param {string} text @param {string} base */
function rebaseJsonText(text, base) {
  try {
    return JSON.stringify(rebaseJson(JSON.parse(text), base));
  } catch {
    return text;
  }
}

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** @returns {import('astro').AstroIntegration} */
export default function rebaseLinks() {
  let base = '/';
  return {
    name: 'atlas-rebase-links',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (base === '/') return;
        const root = fileURLToPath(dir);
        let files = 0;
        for await (const path of walk(root)) {
          const kind = path.endsWith('.html') ? 'html' : path.endsWith('.css') ? 'css' : path.endsWith('.json') ? 'json' : null;
          if (kind === null) continue;
          const text = await readFile(path, 'utf8');
          const next = kind === 'html' ? rebaseHtml(text, base) : kind === 'css' ? rebaseCss(text, base) : rebaseJsonText(text, base);
          if (next !== text) {
            await writeFile(path, next);
            files += 1;
          }
        }
        logger.info(`rebased root-relative links under ${base} in ${String(files)} files`);
      },
    },
  };
}
