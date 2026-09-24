/**
 * Inline content of the research AST. Produced by the compiler from mdast;
 * rendered by the web app. Raw HTML never survives into this tree: text such
 * as `<bos>` in prose is a `text` node and is escaped on output.
 */
import type { EvidenceLabel } from './evidence.ts';
import type { CitationKey, NodeId } from './ids.ts';

export type LinkTarget =
  /** A link into the atlas, resolved from a relative `.md` path to a node (and optional anchor). */
  | { readonly type: 'node'; readonly nodeId: NodeId; readonly anchor: string | null; readonly href: string }
  | { readonly type: 'external'; readonly href: string }
  /** A relative link whose target is planned but has no manuscript yet (renders muted, not broken). */
  | { readonly type: 'planned'; readonly nodeId: NodeId; readonly href: string }
  /** Could not be resolved; the compiler also emits a diagnostic. Rendered as plain text. */
  | { readonly type: 'unresolved'; readonly raw: string };

/** Textual cross-references recognised in prose ("Eq. 5.4", "Algorithm 5.2", "Figure 5.1", "Experiment 5.3"). */
export type XRefKind = 'equation' | 'algorithm' | 'figure' | 'experiment' | 'proposition';

export interface XRefTarget {
  readonly nodeId: NodeId;
  readonly anchor: string;
  readonly href: string;
}

export type Inline =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'emphasis'; readonly children: readonly Inline[] }
  | { readonly kind: 'strong'; readonly children: readonly Inline[] }
  | { readonly kind: 'delete'; readonly children: readonly Inline[] }
  | { readonly kind: 'code'; readonly value: string }
  /** Inline math, pre-rendered by KaTeX (HTML+MathML) at compile time. `html` is trusted compiler output. */
  | { readonly kind: 'math'; readonly tex: string; readonly html: string }
  | { readonly kind: 'link'; readonly target: LinkTarget; readonly children: readonly Inline[] }
  /** A citation token (`P01`, `R5.13`) resolved against the reference registry; opens the paper inspector. */
  | { readonly kind: 'cite'; readonly key: CitationKey; readonly resolved: boolean }
  /** An evidence label token in prose, rendered as a quiet semantic marker. */
  | { readonly kind: 'label'; readonly label: EvidenceLabel }
  | {
      readonly kind: 'xref';
      readonly ref: XRefKind;
      readonly number: string;
      readonly text: string;
      readonly target: XRefTarget | null;
    }
  | { readonly kind: 'break' };

export type InlineKind = Inline['kind'];

/** Plain-text projection of inline content (search index, alt text, titles). */
export function inlineToText(nodes: readonly Inline[]): string {
  let out = '';
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
      case 'code':
        out += node.value;
        break;
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
        out += inlineToText(node.children);
        break;
      case 'math':
        out += node.tex;
        break;
      case 'cite':
        out += node.key;
        break;
      case 'label':
        out += node.label;
        break;
      case 'xref':
        out += node.text;
        break;
      case 'break':
        out += ' ';
        break;
      default:
        assertNever(node);
    }
  }
  return out;
}

/** Exhaustiveness guard for discriminated unions. */
export function assertNever(value: never): never {
  throw new TypeError(`Unhandled variant: ${JSON.stringify(value)}`);
}
