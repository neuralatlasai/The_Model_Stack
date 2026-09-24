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
 */
import { fileURLToPath } from 'node:url';
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

/** npm workspace root (`atlas/`): source of @atlas/* packages and home of `.atlas/`. */
const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
/** Default compiled-bundle directory; `ATLAS_BUNDLE_DIR` overrides it (validated in src/lib/atlas.ts). */
const defaultBundleDir = fileURLToPath(new URL('../../.atlas/', import.meta.url));

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
  integrations: [preact({ compat: false })],
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
