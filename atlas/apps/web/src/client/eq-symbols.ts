/**
 * Symbol matching between an equation's variable table and its KaTeX output
 * (UI_UX §16: hovering a term highlights it). Best effort by design: KaTeX
 * renders an identifier as `.mord.mathnormal` glyph spans with subscripts in
 * a following `.msupsub`, so a symbol is reduced to (base glyph, subscript
 * text) and compared on that. Pure; unit-tested.
 */

export interface SymbolKey {
  /** A single glyph: `H`, `T`, `β`. */
  readonly base: string;
  /** Subscript text with markup stripped (`kv`, `h`, `in`), or '' when none. */
  readonly sub: string;
}

const GREEK: Readonly<Record<string, string>> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ϵ',
  varepsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'ϕ',
  varphi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  Gamma: 'Γ',
  Delta: 'Δ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Xi: 'Ξ',
  Pi: 'Π',
  Sigma: 'Σ',
  Phi: 'Φ',
  Psi: 'Ψ',
  Omega: 'Ω',
};

/** Strips TeX wrappers: `\mathrm{in}` → `in`, `{kv}` → `kv`, `\text{KV}` → `KV`. */
function stripTex(text: string): string {
  return text
    .replace(/\\(?:mathrm|mathit|mathbf|text|textrm|operatorname|mathsf|mathtt)\s*/gu, '')
    .replace(/\\([A-Za-z]+)/gu, (_, name: string) => GREEK[name] ?? name)
    .replace(/[{}\s$]/gu, '');
}

/**
 * Parses a variable-table symbol (`H_kv`, `H_{kv}`, `d_h`, `\beta`, `beta`,
 * `β`, `u_{\mathrm{in}}`, `$T$`). Returns null for anything that is not a
 * single-glyph base with an optional subscript (e.g. `d_model` → base `d`,
 * sub `model`; `MFU` → null).
 */
export function parseSymbol(raw: string): SymbolKey | null {
  const text = raw.trim().replace(/^\$+|\$+$/gu, '').trim();
  if (text === '') return null;
  const underscore = text.indexOf('_');
  const baseRaw = underscore === -1 ? text : text.slice(0, underscore);
  const subRaw = underscore === -1 ? '' : text.slice(underscore + 1);
  const base = normaliseBase(baseRaw);
  if (base === null) return null;
  return { base, sub: stripTex(subRaw).replace(/\^.*$/u, '') };
}

function normaliseBase(raw: string): string | null {
  const trimmed = raw.replace(/^\\/u, '').replace(/[{}]/gu, '').trim();
  if (trimmed === '') return null;
  const greek = GREEK[trimmed];
  if (greek !== undefined) return greek;
  // A single code point (Latin letter or an already-rendered Greek glyph).
  return Array.from(trimmed).length === 1 ? trimmed : null;
}

/** Normalises text read from KaTeX DOM (zero-width spaces, NBSPs, whitespace). */
export function cleanRendered(text: string): string {
  return text.replace(/[\u200b\u00a0\s]/gu, '');
}

/**
 * Whether a rendered glyph (`base`) followed by an optional rendered
 * subscript (`subText`, the text of the adjacent `.msupsub`) matches `key`.
 * A superscript shares the `.msupsub` box, so the subscript only has to be
 * contained in its text.
 */
export function matchesRendered(key: SymbolKey, base: string, subText: string): boolean {
  if (cleanRendered(base) !== key.base) return false;
  const rendered = cleanRendered(subText);
  if (key.sub === '') return rendered === '' || !/^[A-Za-z]/u.test(rendered);
  return rendered.includes(key.sub);
}

export function sameSymbol(a: SymbolKey, b: SymbolKey): boolean {
  return a.base === b.base && a.sub === b.sub;
}
