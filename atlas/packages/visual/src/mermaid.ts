/**
 * Mermaid `flowchart` subset → `DiagramSpec` (VISUAL_GRAMMAR §2, §3; CONTENT_CONTRACT §8).
 *
 * Concept maps are authored in Mermaid so they stay readable in plain Markdown.
 * The atlas never runs Mermaid: this parser reads the subset the book uses and
 * maps it onto the fixed primitive vocabulary, so a concept map is drawn with
 * the same glyphs as every authored diagram.
 *
 * Supported: `flowchart|graph TD|TB|BT|LR|RL`; node declarations with the
 * shapes `A["…"]`, `A[…]`, `A("…")`, `A(["…"])`, `A[("…")]`, `A{…}`, `A{{…}}`,
 * `A[[…]]`, `A((…))`, `A>…]`; bare references; `&`-joined node groups; edge
 * chains; links `-->`, `---`, `-.->`, `-.-`, `==>`, `===`, `<-->`, `~~~`
 * (invisible, ignored), labels via `-->|label|`, `-- label -->`,
 * `-. "label" .->`, `== label ==>`; `subgraph … end` (→ groups); `%%` comments;
 * styling statements (`classDef`, `class`, `style`, `linkStyle`, `click`) are
 * ignored because the renderer owns the look.
 *
 * Label grammar: an optional `[Primitive]` prefix selects the node kind
 * (§3.1, default `node`); a trailing bracketed shape (`token ids [B, T]`)
 * becomes the monospace sub-label. Link strokes map to edge kinds: solid →
 * `flow`, dotted → `dependency`, thick → `emphasis`. A `[Feedback]` prefix on
 * an edge label selects `feedback`. Back-edges stay `flow`; layout decides.
 */
import { DiagramSpecSchema, EDGE_KINDS, NODE_KINDS, type DiagramSpec, type EdgeKind, type NodeKind } from '@atlas/core';

export interface MermaidIssue {
  readonly message: string;
  /** 1-based line within the Mermaid source, or null for whole-diagram issues. */
  readonly line: number | null;
}

export interface MermaidParseResult {
  readonly spec: DiagramSpec | null;
  readonly issues: MermaidIssue[];
}

const MAX_LABEL = 80;
const MAX_SUB = 60;
const MAX_EDGE_LABEL = 60;
const MAX_GROUP_LABEL = 60;

const KIND_BY_PREFIX: ReadonlyMap<string, NodeKind> = new Map<string, NodeKind>([
  ...NODE_KINDS.map((kind): [string, NodeKind] => [kind, kind]),
  ['feedback loop', 'feedback'],
  ['concept', 'node'],
]);

const EDGE_KIND_BY_PREFIX: ReadonlyMap<string, EdgeKind> = new Map<string, EdgeKind>(EDGE_KINDS.map((kind): [string, EdgeKind] => [kind, kind]));

/** Shape openers, longest first, with their accepted closers and the fallback kind when no `[Prefix]` is given. */
const SHAPES: readonly { readonly open: string; readonly close: readonly string[]; readonly kind: NodeKind }[] = [
  { open: '(((', close: [')))'], kind: 'node' },
  { open: '((', close: ['))'], kind: 'node' },
  { open: '([', close: ['])'], kind: 'state' },
  { open: '[(', close: [')]'], kind: 'dataset' },
  { open: '[[', close: [']]'], kind: 'process' },
  { open: '[/', close: ['/]', '\\]'], kind: 'node' },
  { open: '[\\', close: ['\\]', '/]'], kind: 'node' },
  { open: '{{', close: ['}}'], kind: 'process' },
  { open: '(', close: [')'], kind: 'state' },
  { open: '[', close: [']'], kind: 'node' },
  { open: '{', close: ['}'], kind: 'branch' },
  { open: '>', close: [']'], kind: 'node' },
];

const IGNORED_STATEMENT = /^(?:classDef|class|style|linkStyle|click|accTitle|accDescr|direction)\b/u;
const HEADER = /^(?:flowchart|graph)(?:\s+(TD|TB|BT|LR|RL))?\s*$/iu;
const ID = /^[A-Za-z0-9_]+/u;
const LOCAL_ID = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/u;

interface NodeDraft {
  readonly id: string;
  label: string | null;
  kind: NodeKind | null;
  shapeKind: NodeKind | null;
  sub: string | null;
  group: string | null;
}

interface EdgeDraft {
  readonly from: string;
  readonly to: string;
  readonly kind: EdgeKind;
  readonly label: string | null;
}

interface GroupDraft {
  readonly id: string;
  readonly label: string;
}

interface Link {
  readonly kind: EdgeKind | 'invisible';
  readonly label: string | null;
  readonly bidirectional: boolean;
}

const ENTITIES: Readonly<Record<string, string>> = { quot: '"', amp: '&', lt: '<', gt: '>', nbsp: ' ', apos: "'" };

function decodeEntities(text: string): string {
  return text.replace(/#([a-z]+|\d+);/giu, (whole, name: string) => {
    if (/^\d+$/u.test(name)) return String.fromCodePoint(Number.parseInt(name, 10));
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

function cleanText(raw: string): string {
  return decodeEntities(raw)
    .replace(/<br\s*\/?>/giu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function stripQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
  return trimmed;
}

/** Removes a `%%` comment outside quotes. */
function stripComment(line: string): string {
  let inQuote = false;
  for (let i = 0; i < line.length - 1; i += 1) {
    const ch = line.charAt(i);
    if (ch === '"') inQuote = !inQuote;
    if (!inQuote && ch === '%' && line.charAt(i + 1) === '%') return line.slice(0, i);
  }
  return line;
}

/** Splits on `;` statement separators outside quotes and brackets. */
function splitStatements(line: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inQuote = false;
  let start = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line.charAt(i);
    if (ch === '"') inQuote = !inQuote;
    if (inQuote) continue;
    if (ch === '[' || ch === '(' || ch === '{') depth += 1;
    if ((ch === ']' || ch === ')' || ch === '}') && depth > 0) depth -= 1;
    if (ch === ';' && depth === 0) {
      out.push(line.slice(start, i));
      start = i + 1;
    }
  }
  out.push(line.slice(start));
  return out.map((part) => part.trim()).filter((part) => part !== '');
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const base = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${base.replace(/[\s,;:(–—-]+$/u, '')}…`;
}

/**
 * Fits a long label into the schema's label (≤ 80) and sub (≤ 60) fields by
 * moving a trailing clause into the sub-label, splitting at `: `, a trailing
 * parenthetical, or ` — `. Truncation is the last resort.
 */
function fitLabel(label: string, sub: string | null): { label: string; sub: string | null } {
  if (label.length <= MAX_LABEL) return { label, sub: sub === null ? null : truncateAtWord(sub, MAX_SUB) };
  if (sub === null) {
    const candidates: (readonly [string, string])[] = [];
    const colon = label.indexOf(': ');
    if (colon > 0) candidates.push([label.slice(0, colon), label.slice(colon + 2)]);
    const paren = /^(.*?)\s*\((.+)\)$/u.exec(label);
    if (paren !== null) candidates.push([paren[1] ?? '', paren[2] ?? '']);
    const dash = label.indexOf(' — ');
    if (dash > 0) candidates.push([label.slice(0, dash), label.slice(dash + 3)]);
    for (const [head, tail] of candidates) {
      if (head.length > 0 && head.length <= MAX_LABEL && tail.length > 0 && tail.length <= MAX_SUB) {
        return { label: head.trim(), sub: tail.trim() };
      }
    }
    for (const [head, tail] of candidates) {
      if (head.length > 0 && head.length <= MAX_LABEL && tail.length > 0) {
        return { label: head.trim(), sub: truncateAtWord(tail.trim(), MAX_SUB) };
      }
    }
  }
  return { label: truncateAtWord(label, MAX_LABEL), sub: sub === null ? null : truncateAtWord(sub, MAX_SUB) };
}

function sanitizeId(raw: string): string {
  if (LOCAL_ID.test(raw)) return raw;
  const cleaned = raw.replace(/[^A-Za-z0-9_-]/gu, '_').slice(0, 38);
  return LOCAL_ID.test(cleaned) ? cleaned : `n${cleaned}`.slice(0, 40);
}

function slugId(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 36);
  return slug === '' ? 'group' : sanitizeId(/^[a-z]/u.test(slug) ? slug : `g-${slug}`);
}

/** Parses a Mermaid flowchart into a validated `DiagramSpec`. Never throws. */
export function parseMermaid(source: string): MermaidParseResult {
  const issues: MermaidIssue[] = [];
  const nodes = new Map<string, NodeDraft>();
  const edges: EdgeDraft[] = [];
  const groups: GroupDraft[] = [];
  const groupStack: string[] = [];
  let direction: 'LR' | 'TB' | null = null;

  const issue = (message: string, line: number | null): void => {
    issues.push({ message, line });
  };

  const touchNode = (rawId: string): NodeDraft => {
    const id = sanitizeId(rawId);
    let node = nodes.get(id);
    if (node === undefined) {
      node = { id, label: null, kind: null, shapeKind: null, sub: null, group: null };
      nodes.set(id, node);
    }
    const currentGroup = groupStack.at(-1);
    if (node.group === null && currentGroup !== undefined) node.group = currentGroup;
    return node;
  };

  const applyLabel = (node: NodeDraft, rawLabel: string, shapeKind: NodeKind, line: number): void => {
    let text = cleanText(stripQuotes(rawLabel));
    let kind: NodeKind | null = null;
    const prefix = /^\[([A-Za-z][A-Za-z ]*)\]\s*/u.exec(text);
    if (prefix !== null) {
      const word = (prefix[1] ?? '').trim();
      const mapped = KIND_BY_PREFIX.get(word.toLowerCase());
      if (mapped !== undefined) {
        kind = mapped;
        text = text.slice(prefix[0].length);
      } else if (/^[A-Z][a-z]+(?: [a-z]+)?$/u.test(word)) {
        issue(`unknown primitive prefix [${word}] on node '${node.id}' (VISUAL_GRAMMAR §3.1)`, line);
      }
    }
    let sub: string | null = null;
    const shape = /(?:^|\s)(\[[^[\]]+\])$/u.exec(text);
    if (shape?.[1] !== undefined && text.trim() !== shape[1]) {
      sub = shape[1];
      text = text.slice(0, shape.index).trim();
    }
    if (text === '') text = node.id;
    const fitted = fitLabel(text, sub);
    node.label = fitted.label;
    node.sub = fitted.sub;
    node.kind = kind;
    node.shapeKind = shapeKind;
  };

  /** Parses one chain statement: group (link group)*. */
  const parseChain = (text: string, line: number): void => {
    let pos = 0;
    const skipWs = (): void => {
      while (pos < text.length && /\s/u.test(text.charAt(pos))) pos += 1;
    };

    const parseShape = (node: NodeDraft): boolean => {
      for (const shape of SHAPES) {
        if (!text.startsWith(shape.open, pos)) continue;
        let cursor = pos + shape.open.length;
        let content: string;
        let closeAt = -1;
        let closeLen = 0;
        const rest = text.slice(cursor);
        const quoted = /^\s*"/u.exec(rest);
        if (quoted !== null) {
          const qStart = cursor + quoted[0].length;
          const qEnd = text.indexOf('"', qStart);
          if (qEnd < 0) {
            issue(`unterminated quoted label on node '${node.id}'`, line);
            pos = text.length;
            return true;
          }
          content = text.slice(qStart, qEnd);
          cursor = qEnd + 1;
          while (cursor < text.length && /\s/u.test(text.charAt(cursor))) cursor += 1;
          for (const close of shape.close) {
            if (text.startsWith(close, cursor)) {
              closeAt = cursor;
              closeLen = close.length;
              break;
            }
          }
        } else {
          for (const close of shape.close) {
            const at = text.indexOf(close, cursor);
            if (at >= 0 && (closeAt < 0 || at < closeAt)) {
              closeAt = at;
              closeLen = close.length;
            }
          }
          content = closeAt >= 0 ? text.slice(cursor, closeAt) : '';
        }
        if (closeAt < 0) {
          issue(`unclosed '${shape.open}' shape on node '${node.id}'`, line);
          pos = text.length;
          return true;
        }
        applyLabel(node, content, shape.kind, line);
        pos = closeAt + closeLen;
        const cls = /^:::[\w-]+/u.exec(text.slice(pos));
        if (cls !== null) pos += cls[0].length;
        return true;
      }
      return false;
    };

    const parseNodeRef = (): NodeDraft | null => {
      skipWs();
      const match = ID.exec(text.slice(pos));
      if (match === null) return null;
      const rawId = match[0];
      if (rawId === 'end' || rawId === 'subgraph') return null;
      pos += rawId.length;
      const node = touchNode(rawId);
      if (groups.some((group) => group.id === node.id)) {
        issue(`edges to subgraph '${node.id}' are not supported; connect its nodes instead`, line);
      }
      const save = pos;
      skipWs();
      if (!parseShape(node)) {
        pos = save;
        const cls = /^:::[\w-]+/u.exec(text.slice(pos));
        if (cls !== null) pos += cls[0].length;
      }
      return node;
    };

    const parseGroup = (): NodeDraft[] | null => {
      const first = parseNodeRef();
      if (first === null) return null;
      const members = [first];
      for (;;) {
        const save = pos;
        skipWs();
        if (text.charAt(pos) !== '&') {
          pos = save;
          break;
        }
        pos += 1;
        const next = parseNodeRef();
        if (next === null) {
          issue("expected a node after '&'", line);
          break;
        }
        members.push(next);
      }
      return members;
    };

    const parseLink = (): Link | null => {
      skipWs();
      const rest = text.slice(pos);
      const labelled = /^(<)?(--|==|-\.)(?=[\s"])\s*("[^"]*"|[^"]+?)\s*(-{2,}>|-{3,}|\.-+>|\.-+|={2,}>|={3,})/u.exec(rest);
      if (labelled !== null) {
        const open = labelled[2] ?? '--';
        pos += labelled[0].length;
        const stroke = open === '-.' ? 'dependency' : open === '==' ? 'emphasis' : 'flow';
        return { kind: stroke, label: stripQuotes(labelled[3] ?? ''), bidirectional: labelled[1] === '<' };
      }
      const plain = /^(<)?(?:(-\.+-)|(-{2,})|(={2,})|(~{3,}))(>|o|x)?/u.exec(rest);
      if (plain === null) return null;
      pos += plain[0].length;
      let kind: Link['kind'] = 'flow';
      if (plain[2] !== undefined) kind = 'dependency';
      else if (plain[4] !== undefined) kind = 'emphasis';
      else if (plain[5] !== undefined) kind = 'invisible';
      let label: string | null = null;
      const save = pos;
      skipWs();
      const pipe = /^\|([^|]*)\|/u.exec(text.slice(pos));
      if (pipe !== null) {
        label = stripQuotes(pipe[1] ?? '');
        pos += pipe[0].length;
      } else {
        pos = save;
      }
      return { kind, label, bidirectional: plain[1] === '<' };
    };

    const addEdges = (sources: readonly NodeDraft[], targets: readonly NodeDraft[], link: Link): void => {
      if (link.kind === 'invisible') return;
      let kind: EdgeKind = link.kind;
      let label = link.label === null ? null : cleanText(link.label);
      if (label !== null) {
        const prefix = /^\[([A-Za-z]+)\]\s*/u.exec(label);
        const mapped = prefix === null ? undefined : EDGE_KIND_BY_PREFIX.get((prefix[1] ?? '').toLowerCase());
        if (prefix !== null && mapped !== undefined) {
          kind = mapped;
          label = label.slice(prefix[0].length);
        }
        if (label === '') label = null;
        else if (label.length > MAX_EDGE_LABEL) label = truncateAtWord(label, MAX_EDGE_LABEL);
      }
      for (const source of sources) {
        for (const target of targets) {
          edges.push({ from: source.id, to: target.id, kind, label });
          if (link.bidirectional) edges.push({ from: target.id, to: source.id, kind, label });
        }
      }
    };

    let current = parseGroup();
    if (current === null) {
      issue(`cannot parse statement '${text.slice(0, 60)}'`, line);
      return;
    }
    for (;;) {
      skipWs();
      if (pos >= text.length) break;
      const link = parseLink();
      if (link === null) {
        issue(`unexpected '${text.slice(pos, pos + 24)}'`, line);
        return;
      }
      const next = parseGroup();
      if (next === null) {
        issue('edge has no target node', line);
        return;
      }
      addEdges(current, next, link);
      current = next;
    }
  };

  const lines = source.replace(/\r\n?/gu, '\n').split('\n');
  let sawHeader = false;
  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    for (const statement of splitStatements(stripComment(lines[index] ?? ''))) {
      if (!sawHeader) {
        const header = HEADER.exec(statement);
        if (header === null) {
          issue(`only Mermaid 'flowchart' diagrams are supported (found '${statement.slice(0, 40)}')`, lineNo);
          return { spec: null, issues };
        }
        const dir = (header[1] ?? 'TB').toUpperCase();
        direction = dir === 'LR' || dir === 'RL' ? 'LR' : 'TB';
        sawHeader = true;
        continue;
      }
      if (/^subgraph\b/u.test(statement)) {
        const rest = statement.slice('subgraph'.length).trim();
        let id: string;
        let label: string;
        const withLabel = /^([A-Za-z0-9_]+)\s*\[\s*(.*?)\s*\]$/u.exec(rest);
        if (withLabel !== null) {
          id = sanitizeId(withLabel[1] ?? 'group');
          label = cleanText(stripQuotes(withLabel[2] ?? ''));
        } else if (/^"[^"]*"$/u.test(rest)) {
          label = cleanText(stripQuotes(rest));
          id = slugId(label);
        } else if (ID.test(rest) && ID.exec(rest)?.[0] === rest) {
          id = sanitizeId(rest);
          label = rest;
        } else {
          label = cleanText(rest);
          id = slugId(label);
        }
        label = label.replace(/^\[(?:Boundary|Node)\]\s*/iu, '');
        if (label === '') label = id;
        if (groupStack.length > 0) issue(`subgraph '${id}' is nested; groups must not nest (VISUAL_GRAMMAR §3.3)`, lineNo);
        if (!groups.some((group) => group.id === id)) groups.push({ id, label: truncateAtWord(label, MAX_GROUP_LABEL) });
        groupStack.push(id);
        continue;
      }
      if (statement === 'end') {
        if (groupStack.pop() === undefined) issue("'end' without an open subgraph", lineNo);
        continue;
      }
      if (IGNORED_STATEMENT.test(statement)) continue;
      parseChain(statement, lineNo);
    }
  }
  if (!sawHeader) {
    issue('empty Mermaid block', null);
    return { spec: null, issues };
  }
  if (groupStack.length > 0) issue(`subgraph '${groupStack.join(', ')}' is not closed with 'end'`, null);

  const candidate = {
    direction: direction ?? 'TB',
    nodes: [...nodes.values()].map((node) => {
      const kind = node.kind ?? node.shapeKind ?? 'node';
      return {
        id: node.id,
        kind,
        label: node.label ?? node.id,
        ...(node.sub === null ? {} : { sub: node.sub }),
        ...(node.group === null ? {} : { group: node.group }),
        emphasis: false,
      };
    }),
    edges: edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      ...(edge.label === null ? {} : { label: edge.label }),
    })),
    groups: groups.map((group) => ({ id: group.id, label: group.label })),
  };
  const parsed = DiagramSpecSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const problem of parsed.error.issues) {
      issue(`${problem.path.join('.') || 'diagram'}: ${problem.message}`, null);
    }
    return { spec: null, issues };
  }
  return { spec: parsed.data, issues };
}
