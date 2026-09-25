/**
 * The one inline script of the site: sets `<html data-theme>`,
 * `<html data-depth>`, and `<html data-gl>` before first paint (no flash of the wrong theme, no
 * layout shift from depth-hidden blocks), and re-applies both to the incoming
 * document on every Astro ClientRouter navigation (`astro:before-swap`),
 * because the router replaces the root element's attributes.
 *
 * Trust boundary: localStorage and the URL are parsed defensively — only the
 * enumerated values from @atlas/core are accepted; anything else is ignored.
 * Values may be stored raw (`dark`) or JSON-encoded (`"dark"`); both parse.
 * The script is generated from core constants so keys and values cannot drift
 * from the client controllers.
 */
import { ATTR, DEFAULT_DEPTH, DEPTHS, STORAGE_KEYS } from '@atlas/core';
import { jsonForHtml } from './json.ts';

const BODY = `
  var BOOT = '__atlasBootstrapped';
  function read(key) {
    var raw = null;
    try { raw = window.localStorage.getItem(key); } catch (blocked) { return null; }
    if (raw === null) return null;
    try { var value = JSON.parse(raw); return typeof value === 'string' ? value : null; } catch (notJson) { return raw; }
  }
  function theme() {
    var value = read(c.themeKey);
    return value === 'light' || value === 'dark' ? value : null;
  }
  function depth(href) {
    var fromUrl = null;
    try { fromUrl = new URL(href).searchParams.get('depth'); } catch (badUrl) { fromUrl = null; }
    if (fromUrl !== null && c.depths.indexOf(fromUrl) !== -1) return fromUrl;
    var stored = read(c.depthKey);
    return stored !== null && c.depths.indexOf(stored) !== -1 ? stored : c.fallbackDepth;
  }
  // WebGL support, known before first paint: 3D objects take their place at
  // once and their drawn 2D fallbacks never flash on load.
  var GL = (function () { try { return 'WebGLRenderingContext' in window ? '1' : '0'; } catch (noGl) { return '0'; } })();
  function apply(root, href) {
    var selected = theme();
    if (selected === null) root.removeAttribute(c.themeAttr); else root.setAttribute(c.themeAttr, selected);
    root.setAttribute(c.depthAttr, depth(href));
    root.setAttribute('data-gl', GL);
  }
  apply(document.documentElement, window.location.href);
  if (window[BOOT] !== true) {
    window[BOOT] = true;
    document.addEventListener('astro:before-swap', function (event) {
      apply(event.newDocument.documentElement, event.to.href);
    });
  }
`;

/** Inline bootstrap source (classic script, ES5-safe syntax). */
export function bootstrapScript(): string {
  const config = {
    themeKey: STORAGE_KEYS.theme,
    depthKey: STORAGE_KEYS.depth,
    depths: DEPTHS,
    fallbackDepth: DEFAULT_DEPTH,
    themeAttr: ATTR.theme,
    depthAttr: ATTR.depth,
  };
  return `(function (c) {${BODY}})(${jsonForHtml(config)});`;
}
