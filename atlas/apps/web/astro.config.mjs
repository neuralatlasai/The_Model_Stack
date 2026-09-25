// @ts-check
/**
 * Research Atlas — static site configuration.
 *
 * - Static output only: every page is pre-rendered from the compiled bundle in
 *   `atlas/.atlas/` (see src/lib/atlas.ts). No server runtime, no adapter.
 * - URLs end with `/` and build as `<path>/index.html` so slugs from
 *   docs/atlas-manifest.json are the stable URLs (CONTENT_CONTRACT §1.1).
 * - Workspace packages (@atlas/core, @atlas/visual) ship TypeScript/TSX
 *   sources; they are bundled (not externalised) so Vite transforms them.
 * - Deploy target: `ATLAS_SITE` (origin, e.g. https://neuralatlasai.github.io)
 *   and `ATLAS_BASE` (sub-path, e.g. /The_Model_Stack/) are set by the GitHub
 *   Pages workflow; locally both default to a root deployment. The
 *   rebase-links integration then prefixes every root-relative internal URL.
 */
import { fileURLToPath } from 'node:url';
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';
import rebaseLinks from './integrations/rebase-links.mjs';

/** npm workspace root (`atlas/`): source of @atlas/* packages and home of `.atlas/`. */
const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
/** Default compiled-bundle directory; `ATLAS_BUNDLE_DIR` overrides it (validated in src/lib/atlas.ts). */
const defaultBundleDir = fileURLToPath(new URL('../../.atlas/', import.meta.url));

const base = process.env['ATLAS_BASE'] ?? '/';

export default defineConfig({
  output: 'static',
  ...(process.env['ATLAS_SITE'] === undefined ? {} : { site: process.env['ATLAS_SITE'] }),
  base: base.endsWith('/') ? base : `${base}/`,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
  integrations: [preact({ compat: false }), rebaseLinks()],
  vite: {
    define: {
      __ATLAS_BUNDLE_DIR__: JSON.stringify(defaultBundleDir),
    },
    ssr: {
      noExternal: ['@atlas/core', '@atlas/visual'],
    },
    server: {
      fs: { allow: [workspaceRoot] },
    },
  },
});
