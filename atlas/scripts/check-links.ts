/**
 * Static link check of a built atlas (run after `astro build`).
 *
 *   node scripts/check-links.ts <dist-dir> [base]
 *
 * `<dist-dir>` is the build output; `base` the sub-path it is served under
 * (default `/`). Every internal href/src on every page must resolve to a built
 * file, must stay inside `base` (a root-relative link outside it 404s on a
 * GitHub Pages project site), every `#fragment` must name an element on its
 * target page, and every URL in the JSON data islands must stay inside
 * `base`. Exits 1 on any failure, printing the first examples of each kind.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, sep } from 'node:path';

const [distArg, baseArg = '/'] = process.argv.slice(2);
if (distArg === undefined) {
  console.error('usage: node scripts/check-links.ts <dist-dir> [base]');
  process.exit(2);
}
const dist = distArg;
const base = baseArg.endsWith('/') ? baseArg : `${baseArg}/`;
const URL_KEY = /^(?:url|href|atlasUrl|link|path|canonical|target)$/iu;

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(path)));
    else out.push(path);
  }
  return out;
}

/** URL path (inside base) → built file, or null. */
const resolved = new Map<string, string | null>();
async function fileFor(urlPath: string): Promise<string | null> {
  const clean = decodeURIComponent(urlPath.split('#')[0]?.split('?')[0] ?? '');
  const cached = resolved.get(clean);
  if (cached !== undefined) return cached;
  const relative = clean.slice(base.length).split('/').join(sep);
  let found: string | null = null;
  for (const candidate of [join(dist, relative), join(dist, relative, 'index.html')]) {
    try {
      if ((await stat(candidate)).isFile()) {
        found = candidate;
        break;
      }
    } catch {
      // not this candidate
    }
  }
  resolved.set(clean, found);
  return found;
}

const idCache = new Map<string, ReadonlySet<string>>();
async function idsOf(file: string): Promise<ReadonlySet<string>> {
  const cached = idCache.get(file);
  if (cached !== undefined) return cached;
  const text = await readFile(file, 'utf8');
  const ids = new Set([...text.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1] ?? ''));
  idCache.set(file, ids);
  return ids;
}

const failures = { broken: new Map<string, string>(), outside: new Map<string, string>(), anchors: new Map<string, string>(), data: new Map<string, string>() };
const note = (map: Map<string, string>, key: string, page: string): void => {
  if (!map.has(key)) map.set(key, page);
};
let links = 0;
let fragments = 0;

function checkData(node: unknown, page: string): void {
  if (Array.isArray(node)) {
    for (const item of node) checkData(item, page);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && URL_KEY.test(key)) {
      if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith(base)) note(failures.data, `${key}: ${value}`, page);
    } else checkData(value, page);
  }
}

const pages = (await listFiles(dist)).filter((file) => file.endsWith('.html'));
for (const file of pages) {
  const page = file.slice(dist.length).split(sep).join('/');
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/\s(?:href|src|xlink:href|action|poster)=["']([^"']+)["']/gu)) {
    const url = (match[1] ?? '').replaceAll('&amp;', '&');
    if (url.startsWith('#')) {
      const id = decodeURIComponent(url.slice(1));
      fragments += 1;
      if (id !== '' && !(await idsOf(file)).has(id)) note(failures.anchors, url, page);
      continue;
    }
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    links += 1;
    if (!url.startsWith(base)) {
      note(failures.outside, url, page);
      continue;
    }
    const target = await fileFor(url);
    if (target === null) {
      note(failures.broken, url, page);
      continue;
    }
    const hash = url.split('#')[1];
    if (hash !== undefined && hash !== '' && target.endsWith('.html')) {
      fragments += 1;
      if (!(await idsOf(target)).has(decodeURIComponent(hash))) note(failures.anchors, url, page);
    }
  }
  for (const match of text.matchAll(/<script\b[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gu)) {
    try {
      checkData(JSON.parse(match[1] ?? ''), page);
    } catch {
      // not JSON
    }
  }
}

console.log(`${String(pages.length)} pages · ${String(links)} internal links · ${String(fragments)} fragments · base ${base}`);
let failed = false;
for (const [label, map] of [
  ['broken links (no built file)', failures.broken],
  [`links outside ${base}`, failures.outside],
  ['fragments with no matching id', failures.anchors],
  [`data-island URLs outside ${base}`, failures.data],
] as const) {
  console.log(`${label}: ${String(map.size)}`);
  for (const [key, page] of [...map].slice(0, 15)) console.log(`  ${key}  (on ${page})`);
  if (map.size > 0) failed = true;
}
process.exit(failed ? 1 : 0);
