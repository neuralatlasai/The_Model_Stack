/// <reference types="astro/client" />

/**
 * Absolute path of the default compiled bundle (`atlas/.atlas/`), injected by
 * `vite.define` in astro.config.mjs. Undefined when a lib module runs outside
 * Vite (node:test). Read only through src/lib/atlas.ts, which validates it
 * together with the `ATLAS_BUNDLE_DIR` environment override (read from
 * `process.env` once, at the configuration boundary).
 */
declare const __ATLAS_BUNDLE_DIR__: string | undefined;

/**
 * Per-render state shared from a page to its research components.
 * `equationRunners`: equation number → fragment of the rail calculator that executes it
 * (set by DocumentPage before its children render; read by blocks/Equation.astro).
 */
declare namespace App {
  interface Locals {
    equationRunners?: ReadonlyMap<string, string>;
  }
}
