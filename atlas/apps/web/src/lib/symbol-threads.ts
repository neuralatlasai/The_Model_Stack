/**
 * Symbol threads for the equation index (pages/equations.astro).
 *
 * Every numbered equation is read for the symbols it uses, straight from its
 * TeX source, so equations that share notation can be connected even when the
 * chapter did not declare a variable table. Declared variables (the registry's
 * `variables[{symbol, meaning}]`) attach their meaning to the matching symbol;
 * a symbol with no declaration is shown without one, never with a guessed
 * meaning.
 *
 * Normalisation (so identical notation is one thread):
 *   - `\alpha` and `α` are one symbol; `\mathcal{D}` is `𝒟`; `\text{FLOPs}` and
 *     `\mathrm{FLOPs}` are the word symbol `FLOPs`.
 *   - Accents, primes, stars and powers are dropped (`\hat\mu`, `\mu^2` → `μ`).
 *   - Named subscripts stay (`N_{\text{act}}` → `N_act`, `p_\theta` → `p_θ`);
 *     index subscripts (`i j k l m n r s t v ℓ`, digits, or expressions such
 *     as `1-\alpha/2`) are dropped, and their symbols are read in place.
 *   - Pure index letters `i`, `j`, Euler's `e^{…}`, integration measures,
 *     named operators (`\operatorname{…}`, `Var`, `softmax`, …) and
 *     `\mathbb{E}`-style operators are not symbols.
 *
 * Best effort by construction; the page says so ("read from each equation's
 * TeX"). Pure; no DOM.
 */

const GREEK: Readonly<Record<string, string>> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  varepsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  vartheta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  pi: 'π',
  varpi: 'π',
  rho: 'ρ',
  varrho: 'ρ',
  sigma: 'σ',
  varsigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
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
  Upsilon: 'Υ',
  Phi: 'Φ',
  Psi: 'Ψ',
  Omega: 'Ω',
  ell: 'ℓ',
};

/** Unicode for `\mathcal{X}` (mathematical script capitals). */
const CALLIGRAPHIC: Readonly<Record<string, string>> = {
  A: '𝒜',
  B: 'ℬ',
  C: '𝒞',
  D: '𝒟',
  E: 'ℰ',
  F: 'ℱ',
  G: '𝒢',
  H: 'ℋ',
  I: 'ℐ',
  J: '𝒥',
  K: '𝒦',
  L: 'ℒ',
  M: 'ℳ',
  N: '𝒩',
  O: '𝒪',
  P: '𝒫',
  Q: '𝒬',
  R: 'ℛ',
  S: '𝒮',
  T: '𝒯',
  U: '𝒰',
  V: '𝒱',
  W: '𝒲',
  X: '𝒳',
  Y: '𝒴',
  Z: '𝒵',
};

/** Commands whose single argument is a (possibly multi-letter) symbol name. */
const NAMING = new Set(['text', 'mathrm', 'textrm', 'mathit', 'textit', 'mathsf', 'textsf', 'mathtt', 'texttt', 'mathbf', 'textbf', 'boldsymbol', 'bm', 'mathnormal']);
const ACCENTS = new Set(['hat', 'bar', 'tilde', 'widehat', 'widetilde', 'overline', 'vec', 'dot', 'ddot', 'check', 'breve', 'mathring']);
/** Commands whose argument is skipped entirely (operators, sets, environments, layout). */
const SKIP_ARGUMENT = new Set(['operatorname', 'mathbb', 'mathfrak', 'begin', 'end', 'label', 'tag', 'color', 'textcolor', 'hspace', 'vspace', 'phantom', 'hphantom', 'vphantom']);
/** Script commands that are words, not symbols (`x_{\min}` → sub `min`). */
const SCRIPT_WORDS: Readonly<Record<string, string>> = { min: 'min', max: 'max', star: '', top: '', prime: '', ast: '' };
/** Lower-case prose inside `\text{…}` that is never a symbol. */
const PROSE = new Set(['if', 'iff', 'for', 'and', 'or', 'with', 'where', 'st', 'to', 'all', 'otherwise', 'else', 'when', 'per', 'of', 'the', 'a', 'an', 'is', 'in', 'on', 'by', 'at', 'as', 'be', 'no', 'not', 'then', 'each', 'any', 'some', 'from', 'over', 'under', 'unless', 'subject', 'const', 'true', 'false', 'are', 'equal', 'else']);
/** Named operators written with `\mathrm`/`\text` rather than `\operatorname`. */
const OPERATORS = new Set(['Var', 'Cov', 'Corr', 'softmax', 'LSE', 'rms', 'diag', 'rank', 'tr', 'Tr', 'sign', 'sgn', 'clip', 'round', 'fl', 'Pr', 'sim', 'cos', 'sin', 'exp', 'log', 'ln', 'max', 'min', 'argmax', 'argmin', 'arg', 'mod', 'bmod', 'det', 'mean', 'median', 'sg', 'stopgrad', 'cond']);
/** Letters that are only ever indices here. */
const PURE_INDEX = new Set(['i', 'j']);
/** Letters (and ℓ) that act as indices when they appear inside a script. */
const SCRIPT_INDEX = new Set(['i', 'j', 'k', 'l', 'r', 's', 't', 'v', 'ℓ']);
/** One or two index letters (`t`, `ij`, `i,j`). */
const INDEX_SUBSCRIPT = /^[ijklmnrstvℓ](?:,?[ijklmnrstvℓ])?$/u;

export interface SymbolAtom {
  /** Normalised key: `N_act`, `σ`, `p_θ`, `FLOPs_token`. */
  readonly key: string;
  readonly base: string;
  readonly sub: string;
}

type Read = readonly [text: string, next: number];

/** Length in code points (`𝒟` is one symbol, two UTF-16 units). */
const codePoints = (text: string): number => Array.from(text).length;

function readGroup(s: string, start: number): Read {
  let depth = 0;
  for (let k = start; k < s.length; k += 1) {
    const ch = s[k];
    if (ch === '\\') {
      k += 1;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return [s.slice(start + 1, k), k + 1];
    }
  }
  return [s.slice(start + 1), s.length];
}

function skipSpace(s: string, i: number): number {
  let k = i;
  while (k < s.length && /\s/u.test(s[k] ?? '')) k += 1;
  return k;
}

/** One TeX argument: a group, a command, or a single character. */
function readArgument(s: string, i: number): Read {
  const k = skipSpace(s, i);
  if (s[k] === '{') return readGroup(s, k);
  if (s[k] === '\\') {
    const command = /^\\(?:[A-Za-z]+|.)/u.exec(s.slice(k))?.[0] ?? '\\';
    return [command, k + command.length];
  }
  return [s[k] ?? '', k + 1];
}

/** A subscript as plain text: wrappers stripped, Greek mapped. */
function plainScript(text: string): string {
  return text
    .replace(/\\(?:text|mathrm|textrm|mathit|mathsf|mathtt|mathbf|operatorname|mathnormal)\s*/gu, '')
    .replace(/\\([A-Za-z]+)/gu, (_, name: string) => GREEK[name] ?? SCRIPT_WORDS[name] ?? '')
    .replace(/\\[,;!: ]|[{}\s$]/gu, '');
}

/** Normalised named subscript, '' for an index subscript, null for an expression (read in place). */
function namedSubscript(text: string): string | null {
  if (/\\text[a-z]*\s*\{[^}]*\s[^}]*\}/u.test(text)) return null; // prose (`a_{\text{some step}}`)
  const plain = plainScript(text);
  if (plain === '' || /^\d+$/u.test(plain) || INDEX_SUBSCRIPT.test(plain)) return '';
  if (/^[A-Za-z][A-Za-z0-9]*$/u.test(plain) || /^[\p{Script=Greek}]$/u.test(plain)) return plain;
  return null;
}

function atom(base: string, sub: string): SymbolAtom {
  return { key: sub === '' ? base : `${base}_${sub}`, base, sub };
}

function prepare(tex: string): string {
  return tex
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|biggl|biggr|big|Big|bigg|Bigg|displaystyle|textstyle|limits|nolimits|quad|qquad|mid|lvert|rvert|lVert|rVert|langle|rangle)(?![A-Za-z])/gu, ' ')
    .replace(/\\[,;!: ]/gu, ' ')
    .replace(/&|\\\\/gu, ' ');
}

function scan(s: string, out: SymbolAtom[], inScript: boolean): void {
  let i = 0;
  let afterIntegral = false;
  while (i < s.length) {
    const ch = s[i] ?? '';
    let base: string | null = null;
    if (ch === '\\') {
      const name = /^\\([A-Za-z]+)/u.exec(s.slice(i))?.[1];
      if (name === undefined) {
        i += 2;
        continue;
      }
      let next = i + 1 + name.length;
      if (s[next] === '*') next += 1;
      const greek = GREEK[name];
      if (greek !== undefined) base = greek;
      else if (name === 'mathcal' || name === 'mathscr') {
        const [arg, after] = readArgument(s, next);
        next = after;
        base = CALLIGRAPHIC[plainScript(arg)] ?? null;
      } else if (NAMING.has(name)) {
        const [arg, after] = readArgument(s, next);
        next = after;
        // `\text{token }` or `\text{add\_generation\_prompt}` is prose or code, not a symbol.
        const inner = arg.trim();
        const command = /^\\([A-Za-z]+)$/u.exec(inner)?.[1];
        if (command !== undefined && GREEK[command] !== undefined) base = GREEK[command];
        else if (/^[A-Za-z][A-Za-z0-9]*$/u.test(arg)) {
          const isWord = inner.length > 1;
          if (!PROSE.has(inner) && !OPERATORS.has(inner) && !(inScript && isWord)) base = inner;
        }
      } else if (ACCENTS.has(name)) {
        const [arg, after] = readArgument(s, next);
        next = after;
        const inner: SymbolAtom[] = [];
        scan(arg, inner, inScript);
        const only = inner.length === 1 ? inner[0] : undefined;
        if (only?.sub === '') base = only.base;
        else out.push(...inner);
      } else if (SKIP_ARGUMENT.has(name)) {
        next = readArgument(s, next)[1];
      } else if (name === 'int' || name === 'iint' || name === 'oint') {
        afterIntegral = true;
      }
      i = next;
      if (base === null) continue;
    } else if (/[A-Za-z]/u.test(ch)) {
      const following = s[skipSpace(s, i + 1)] ?? '';
      i += 1;
      if (ch === 'e' && following === '^') continue; // Euler's number
      if (ch === 'd' && afterIntegral && /[\\A-Za-z]/u.test(following)) continue; // integration measure
      base = ch;
    } else if (ch === '_' || ch === '^') {
      const [arg, after] = readArgument(s, i + 1);
      scan(arg, out, true);
      i = after;
      continue;
    } else {
      i += 1;
      continue;
    }

    // An atom: primes, then up to two scripts.
    let j = skipSpace(s, i);
    while (s[j] === "'") j += 1;
    let sub = '';
    const scripts: string[] = [];
    for (let pass = 0; pass < 2; pass += 1) {
      j = skipSpace(s, j);
      const mark = s[j];
      if (mark !== '_' && mark !== '^') break;
      const [arg, after] = readArgument(s, j + 1);
      j = after;
      if (mark === '_') {
        const named = namedSubscript(arg);
        if (named === null) scripts.push(arg);
        else sub = named;
      } else scripts.push(arg);
    }
    i = j;
    const single = codePoints(base) === 1;
    // A bound variable in a script (`\sum_{a=1}`, `\sum_{o \in \mathcal{O}}`) is an index, not a symbol.
    const bound = inScript && /^\s*(?:=|\\in(?![A-Za-z]))/u.test(s.slice(j));
    const isIndex = single && (PURE_INDEX.has(base) || (inScript && sub === '' && (SCRIPT_INDEX.has(base) || (bound && /[a-z]/u.test(base)))));
    if (!isIndex) out.push(atom(base, sub));
    for (const script of scripts) scan(script, out, true);
  }
}

/** Distinct symbols of one equation, in order of first appearance. */
export function texSymbols(tex: string): SymbolAtom[] {
  const found: SymbolAtom[] = [];
  scan(prepare(tex), found, false);
  const seen = new Set<string>();
  return found.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

/**
 * Key of a declared variable's symbol as written in a variable table
 * (`N_shared`, `σ_a²`, `x_{<t}`, `P̄`, `lat_p95`, `\beta`), or null when it is
 * not a symbol (`p(θ)`, `H(X|Y)`, free text).
 */
export function declaredKey(raw: string): string | null {
  const text = raw
    .replace(/\s*[∈=≥≤<>≈].*$/u, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC')
    .trim()
    .replace(/^\$+|\$+$/gu, '')
    .replace(/[²³¹⁰⁴-⁹⁺⁻*′']+/gu, '')
    .replace(/\^.*$/u, '')
    .trim();
  if (text === '') return null;
  const tex = text.includes('\\');
  if (tex) {
    const atoms = texSymbols(text);
    return atoms.length === 1 ? (atoms[0]?.key ?? null) : null;
  }
  const match = /^([A-Za-z][A-Za-z0-9]*|[^\s\p{P}\p{S}\d])(?:_(.+))?$/u.exec(text);
  if (match === null) return null;
  const base = match[1] ?? '';
  if (codePoints(base) === 1 && PURE_INDEX.has(base)) return null;
  const rawSub = (match[2] ?? '').replace(/^\{|\}$/gu, '');
  const sub = rawSub === '' ? '' : namedSubscript(rawSub);
  return atom(base, sub ?? '').key;
}

const GREEK_NAME = new Map(Object.entries(GREEK).filter(([name]) => !name.startsWith('var')).map(([name, glyph]) => [glyph, name]));

/** Words a reader may type for a key: the key itself plus spelled-out Greek (`σ_a` → `σ_a sigma_a sigma`). */
export function symbolSearchText(key: string): string {
  const spelled = Array.from(key, (ch) => GREEK_NAME.get(ch) ?? ch).join('');
  return spelled === key ? key : `${key} ${spelled}`;
}

/** Display parts of a key: base, subscript, and whether the base is set upright (a word). */
export function symbolParts(key: string): { readonly base: string; readonly sub: string; readonly word: boolean } {
  const cut = key.indexOf('_');
  const base = cut === -1 ? key : key.slice(0, cut);
  const sub = cut === -1 ? '' : key.slice(cut + 1);
  return { base, sub, word: codePoints(base) > 1 };
}

export interface EquationInput {
  readonly number: string;
  readonly tex: string;
  readonly variables: readonly { readonly symbol: string; readonly meaning: string }[];
}

export interface EquationSymbol {
  readonly key: string;
  /** Meaning declared by this equation's variable table, or null. */
  readonly meaning: string | null;
  /** True when the symbol comes only from the variable table (not read from the TeX). */
  readonly declaredOnly: boolean;
}

export interface SymbolThread {
  readonly key: string;
  /** Equation numbers in book order. */
  readonly equations: readonly string[];
  /** Chapter keys (`1`…`13`, `N`) the thread spans. */
  readonly chapters: readonly string[];
  /** Distinct declared meanings with how many equations declare each. */
  readonly meanings: readonly { readonly meaning: string; readonly count: number }[];
}

/** Per-equation symbols (TeX first, then declared-only) with their declared meanings. */
export function equationSymbols(equation: EquationInput): EquationSymbol[] {
  const declared = new Map<string, string>();
  for (const variable of equation.variables) {
    if (/\s/u.test(variable.symbol.trim()) && !variable.symbol.includes('\\')) continue; // free text, not a symbol
    const key = declaredKey(variable.symbol);
    if (key !== null && !declared.has(key)) declared.set(key, variable.meaning.trim());
  }
  const fromTex = texSymbols(equation.tex).map((item) => item.key);
  const keys = [...fromTex, ...[...declared.keys()].filter((key) => !fromTex.includes(key))];
  return keys.map((key) => ({ key, meaning: declared.get(key) ?? null, declaredOnly: !fromTex.includes(key) }));
}

/** Threads for every symbol used by at least `min` equations, most used first. */
export function symbolThreads(
  equations: readonly { readonly number: string; readonly chapter: string; readonly symbols: readonly EquationSymbol[] }[],
  min = 2,
): SymbolThread[] {
  const byKey = new Map<string, { equations: string[]; chapters: Set<string>; meanings: Map<string, number> }>();
  for (const equation of equations) {
    for (const symbol of equation.symbols) {
      const entry = byKey.get(symbol.key) ?? { equations: [], chapters: new Set<string>(), meanings: new Map<string, number>() };
      entry.equations.push(equation.number);
      entry.chapters.add(equation.chapter);
      if (symbol.meaning !== null && symbol.meaning !== '') entry.meanings.set(symbol.meaning, (entry.meanings.get(symbol.meaning) ?? 0) + 1);
      byKey.set(symbol.key, entry);
    }
  }
  return [...byKey.entries()]
    .filter(([, entry]) => entry.equations.length >= min)
    .map(([key, entry]) => ({
      key,
      equations: entry.equations,
      chapters: [...entry.chapters],
      meanings: [...entry.meanings.entries()].map(([meaning, count]) => ({ meaning, count })).sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.equations.length - a.equations.length || b.chapters.length - a.chapters.length || a.key.localeCompare(b.key));
}
