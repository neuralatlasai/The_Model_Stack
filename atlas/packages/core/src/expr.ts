/**
 * Formula language for executable figures (UI_UX §16: numerical examples are
 * executable; variables adjust in the rail and results update immediately).
 *
 * A deliberately small, total, side-effect-free language evaluated by a typed
 * Pratt parser. `eval`/`Function` are never used (engineering standards §4).
 *
 *   expr   := sum
 *   sum    := product (('+' | '-') product)*
 *   product:= unary (('*' | '·' | '×' | '/') unary)*
 *   unary  := ('-' | '+') unary | power
 *   power  := atom ('^' unary)?            right-associative; -2^2 = -(2^2)
 *   atom   := number | ident | ident '(' args ')' | '(' expr ')'
 *   number := digits ('.' digits)? (('e' | 'E') ('+' | '-')? digits)?
 */

export type BinaryOp = '+' | '-' | '*' | '/' | '^';

export const FUNCTIONS = {
  min: { arity: [1, Infinity], fn: (...xs: number[]) => Math.min(...xs) },
  max: { arity: [1, Infinity], fn: (...xs: number[]) => Math.max(...xs) },
  abs: { arity: [1, 1], fn: (x: number) => Math.abs(x) },
  sqrt: { arity: [1, 1], fn: (x: number) => Math.sqrt(x) },
  exp: { arity: [1, 1], fn: (x: number) => Math.exp(x) },
  ln: { arity: [1, 1], fn: (x: number) => Math.log(x) },
  log2: { arity: [1, 1], fn: (x: number) => Math.log2(x) },
  log10: { arity: [1, 1], fn: (x: number) => Math.log10(x) },
  ceil: { arity: [1, 1], fn: (x: number) => Math.ceil(x) },
  floor: { arity: [1, 1], fn: (x: number) => Math.floor(x) },
  round: { arity: [1, 1], fn: (x: number) => Math.round(x) },
  pow: { arity: [2, 2], fn: (x: number, y: number) => x ** y },
  clamp: { arity: [3, 3], fn: (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi) },
} as const satisfies Record<string, { readonly arity: readonly [number, number]; readonly fn: (...xs: number[]) => number }>;
export type FunctionName = keyof typeof FUNCTIONS;

export type Expr =
  | { readonly type: 'num'; readonly value: number }
  | { readonly type: 'var'; readonly name: string }
  | { readonly type: 'neg'; readonly arg: Expr }
  | { readonly type: 'binary'; readonly op: BinaryOp; readonly left: Expr; readonly right: Expr }
  | { readonly type: 'call'; readonly fn: FunctionName; readonly args: readonly Expr[] };

export type ExprErrorCode = 'syntax' | 'unknown-function' | 'arity' | 'unknown-variable' | 'non-finite' | 'too-long';

export class ExprError extends Error {
  readonly code: ExprErrorCode;
  /** 0-based character offset in the source, or -1 for evaluation errors. */
  readonly position: number;

  constructor(code: ExprErrorCode, message: string, position: number) {
    super(message);
    this.name = 'ExprError';
    this.code = code;
    this.position = position;
  }
}

const MAX_SOURCE_LENGTH = 400;
const MAX_DEPTH = 64;

type Token =
  | { readonly t: 'num'; readonly value: number; readonly pos: number }
  | { readonly t: 'ident'; readonly name: string; readonly pos: number }
  | { readonly t: 'op'; readonly op: '+' | '-' | '*' | '/' | '^' | '(' | ')' | ','; readonly pos: number }
  | { readonly t: 'end'; readonly pos: number };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (/\s/u.test(ch)) {
      i += 1;
      continue;
    }
    const numberMatch = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/u.exec(source.slice(i));
    if (numberMatch !== null) {
      tokens.push({ t: 'num', value: Number(numberMatch[0]), pos: i });
      i += numberMatch[0].length;
      continue;
    }
    const identMatch = /^[A-Za-z_][A-Za-z0-9_]*/u.exec(source.slice(i));
    if (identMatch !== null) {
      tokens.push({ t: 'ident', name: identMatch[0], pos: i });
      i += identMatch[0].length;
      continue;
    }
    if (ch === '·' || ch === '×') {
      tokens.push({ t: 'op', op: '*', pos: i });
      i += 1;
      continue;
    }
    if (ch === '*' && source.charAt(i + 1) === '*') {
      tokens.push({ t: 'op', op: '^', pos: i });
      i += 2;
      continue;
    }
    if ('+-*/^(),'.includes(ch)) {
      tokens.push({ t: 'op', op: ch as '+' | '-' | '*' | '/' | '^' | '(' | ')' | ',', pos: i });
      i += 1;
      continue;
    }
    throw new ExprError('syntax', `unexpected character '${ch}'`, i);
  }
  tokens.push({ t: 'end', pos: source.length });
  return tokens;
}

function isFunctionName(name: string): name is FunctionName {
  return Object.hasOwn(FUNCTIONS, name);
}

/** Parses a formula. Throws `ExprError` with a source position on any syntax or arity error. */
export function parseExpr(source: string): Expr {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new ExprError('too-long', `formula exceeds ${MAX_SOURCE_LENGTH} characters`, MAX_SOURCE_LENGTH);
  }
  const tokens = tokenize(source);
  let index = 0;
  const peek = (): Token => tokens[index] ?? { t: 'end', pos: source.length };
  const next = (): Token => {
    const token = peek();
    index += 1;
    return token;
  };
  const isOp = (token: Token, op: string): boolean => token.t === 'op' && token.op === op;
  const expectOp = (op: string): void => {
    const token = next();
    if (!isOp(token, op)) throw new ExprError('syntax', `expected '${op}'`, token.pos);
  };

  const parseSum = (depth: number): Expr => {
    let left = parseProduct(depth);
    for (let token = peek(); isOp(token, '+') || isOp(token, '-'); token = peek()) {
      next();
      const right = parseProduct(depth);
      left = { type: 'binary', op: isOp(token, '+') ? '+' : '-', left, right };
    }
    return left;
  };

  const parseProduct = (depth: number): Expr => {
    let left = parseUnary(depth);
    for (let token = peek(); isOp(token, '*') || isOp(token, '/'); token = peek()) {
      next();
      const right = parseUnary(depth);
      left = { type: 'binary', op: isOp(token, '*') ? '*' : '/', left, right };
    }
    return left;
  };

  const parseUnary = (depth: number): Expr => {
    if (depth > MAX_DEPTH) throw new ExprError('syntax', 'formula nests too deeply', peek().pos);
    const token = peek();
    if (isOp(token, '-')) {
      next();
      return { type: 'neg', arg: parseUnary(depth + 1) };
    }
    if (isOp(token, '+')) {
      next();
      return parseUnary(depth + 1);
    }
    return parsePower(depth);
  };

  const parsePower = (depth: number): Expr => {
    const base = parseAtom(depth);
    if (isOp(peek(), '^')) {
      next();
      return { type: 'binary', op: '^', left: base, right: parseUnary(depth + 1) };
    }
    return base;
  };

  const parseAtom = (depth: number): Expr => {
    const token = next();
    if (token.t === 'num') return { type: 'num', value: token.value };
    if (token.t === 'ident') {
      if (!isOp(peek(), '(')) return { type: 'var', name: token.name };
      if (!isFunctionName(token.name)) {
        throw new ExprError('unknown-function', `unknown function '${token.name}'`, token.pos);
      }
      next();
      const args: Expr[] = [];
      if (!isOp(peek(), ')')) {
        args.push(parseSum(depth + 1));
        while (isOp(peek(), ',')) {
          next();
          args.push(parseSum(depth + 1));
        }
      }
      expectOp(')');
      const [lo, hi] = FUNCTIONS[token.name].arity;
      if (args.length < lo || args.length > hi) {
        throw new ExprError('arity', `${token.name}() takes ${lo === hi ? lo : `${lo}+`} argument(s)`, token.pos);
      }
      return { type: 'call', fn: token.name, args };
    }
    if (isOp(token, '(')) {
      const inner = parseSum(depth + 1);
      expectOp(')');
      return inner;
    }
    throw new ExprError('syntax', token.t === 'end' ? 'unexpected end of formula' : 'unexpected token', token.pos);
  };

  const expr = parseSum(0);
  const trailing = peek();
  if (trailing.t !== 'end') throw new ExprError('syntax', 'unexpected trailing input', trailing.pos);
  return expr;
}

/** Identifiers the expression reads, in first-use order. */
export function freeVariables(expr: Expr): string[] {
  const seen = new Set<string>();
  const walk = (node: Expr): void => {
    switch (node.type) {
      case 'num':
        return;
      case 'var':
        seen.add(node.name);
        return;
      case 'neg':
        walk(node.arg);
        return;
      case 'binary':
        walk(node.left);
        walk(node.right);
        return;
      case 'call':
        node.args.forEach(walk);
        return;
    }
  };
  walk(expr);
  return [...seen];
}

/** Evaluates with the given bindings. Throws on unbound variables or a non-finite result. */
export function evaluate(expr: Expr, env: Readonly<Record<string, number>>): number {
  const run = (node: Expr): number => {
    switch (node.type) {
      case 'num':
        return node.value;
      case 'var': {
        const value = Object.hasOwn(env, node.name) ? env[node.name] : undefined;
        if (value === undefined) throw new ExprError('unknown-variable', `unbound variable '${node.name}'`, -1);
        return value;
      }
      case 'neg':
        return -run(node.arg);
      case 'binary': {
        const a = run(node.left);
        const b = run(node.right);
        switch (node.op) {
          case '+':
            return a + b;
          case '-':
            return a - b;
          case '*':
            return a * b;
          case '/':
            return a / b;
          case '^':
            return a ** b;
        }
        break;
      }
      case 'call': {
        const args = node.args.map(run);
        // Every entry takes numbers; the annotation widens the union of fixed-arity signatures to one rest signature.
        const fn: (...xs: number[]) => number = FUNCTIONS[node.fn].fn;
        return fn(...args);
      }
    }
    throw new ExprError('syntax', 'unreachable expression node', -1);
  };
  const result = run(expr);
  if (!Number.isFinite(result)) throw new ExprError('non-finite', 'formula produced a non-finite value', -1);
  return result;
}

export interface CompiledFormula {
  readonly source: string;
  readonly expr: Expr;
  readonly variables: readonly string[];
  readonly evaluate: (env: Readonly<Record<string, number>>) => number;
}

/** Parse once, evaluate many times (calculators re-evaluate on every input event). */
export function compileFormula(source: string): CompiledFormula {
  const expr = parseExpr(source);
  return { source, expr, variables: freeVariables(expr), evaluate: (env) => evaluate(expr, env) };
}
