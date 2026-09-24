/**
 * Typed blockquotes (CONTENT_CONTRACT §5). A blockquote whose first paragraph
 * opens with a strong label is a typed research object:
 *
 *   > **Definition — <term>.** …
 *   > **Claim [<LABEL> · <source>; <source>].** …
 *   > **Assumption.** … · *sensitivity:* …
 *   > **Observation [<LABEL>].** …
 *   > **Proposition 14.1.** …            (also Theorem / Lemma / Corollary)
 *   > **Failure mode — <name>.** *Symptom:* … *Cause:* … *Detection:* … *Mitigation:* …
 *   > **Open question.** … · *what evidence would settle it:* …
 *   > **Historical note.** / **Caveat.** / **Warning.** / **Further reading.** …
 *   > **Implementation note [<impl id> · <version>].** …
 *
 * Anything else is a plain `QuoteBlock`. A typed label that fails its grammar
 * (e.g. an unknown evidence label) degrades to a quote plus a diagnostic.
 */
import {
  isCitationKey,
  isEvidenceLabel,
  isImplId,
  objectAnchor,
  termAnchor,
  type Block,
  type ClaimSource,
  type Inline,
  type NoteVariant,
} from '@atlas/core';
import type { Blockquote, PhrasingContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { FlowConverter } from '../flow-types.ts';
import { convertPhrasing } from '../inline.ts';
import { splitByMarkers, splitTopLevel, trimInline, type InlineMarker } from '../inline-utils.ts';
import { slugify } from '../slug.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';

const OBJECT_NUMBER = String.raw`(?:\d+|[A-Z])\.\d+[a-z]?`;

const PROPOSITION_VARIANTS: Readonly<Record<string, 'proposition' | 'theorem' | 'lemma' | 'corollary'>> = {
  Proposition: 'proposition',
  Theorem: 'theorem',
  Lemma: 'lemma',
  Corollary: 'corollary',
};

const NOTE_VARIANTS: readonly (readonly [RegExp, NoteVariant])[] = [
  [/^Historical note\.?$/iu, 'historical'],
  [/^Caveat\.?$/iu, 'caveat'],
  [/^Warning\.?$/iu, 'warning'],
  [/^Further reading\.?$/iu, 'further-reading'],
];

/** Text after the leading strong label of the quote's first paragraph, plus any further paragraphs. */
function quoteContent(node: Blockquote, rest: readonly PhrasingContent[], st: CompileState): Inline[] {
  const out: Inline[] = [...convertPhrasing(rest, st)];
  for (const extra of node.children.slice(1)) {
    if (extra.type === 'paragraph') {
      out.push({ kind: 'break' }, { kind: 'break' }, ...convertPhrasing(extra.children, st));
    } else {
      st.report('block-malformed', `typed blockquote carries a ${extra.type} after its first paragraph; kept as text`, st.lineOf(extra));
      out.push({ kind: 'break' }, { kind: 'text', value: toString(extra) });
    }
  }
  return trimInline(out);
}

function classifySource(raw: string, st: CompileState, line: number | null): ClaimSource {
  const keyMatch = /^(P\d{2}|R\d+\.\d+)(?![\d.]\d|\d)/u.exec(raw)?.[1];
  if (keyMatch !== undefined && isCitationKey(keyMatch)) {
    if (keyMatch.startsWith('R') && !st.ctx.hasCitation(keyMatch)) {
      st.reportOnce(`cite:${keyMatch}`, 'citation-unresolved', `citation ${keyMatch} has no record in any references.md`, line);
    }
    return { raw, type: keyMatch.startsWith('P') ? 'paper' : 'reference', key: keyMatch };
  }
  if (/^OD:/iu.test(raw)) return { raw, type: 'official-doc', key: null };
  if (/^DERIVED:/iu.test(raw)) return { raw, type: 'derived', key: null };
  return { raw, type: 'other', key: null };
}

const FAILURE_MARKERS: readonly InlineMarker<'symptom' | 'cause' | 'detection' | 'mitigation'>[] = [
  { key: 'symptom', styled: /^Symptoms?:?$/iu, text: /(?<=^|\s)Symptoms?:/u },
  { key: 'cause', styled: /^Causes?:?$/iu, text: /(?<=^|[.;]\s+)Causes?:/u },
  { key: 'detection', styled: /^Detection:?$/iu, text: /(?<=^|[.;]\s+)Detection:/u },
  { key: 'mitigation', styled: /^Mitigations?:?$/iu, text: /(?<=^|[.;]\s+)Mitigations?:/u },
];

const SENSITIVITY_MARKER: readonly InlineMarker<'sensitivity'>[] = [
  { key: 'sensitivity', styled: /^sensitivity:?$/iu, text: /·\s*sensitivity:/iu },
];

const SETTLE_MARKER: readonly InlineMarker<'settle'>[] = [
  { key: 'settle', styled: /^what evidence would settle it:?$/iu, text: /·\s*what evidence would settle it:/iu },
];

function partOf<K extends string>(parts: readonly { key: K; content: Inline[] }[], key: K): Inline[] | null {
  const hit = parts.find((part) => part.key === key);
  return hit === undefined || hit.content.length === 0 ? null : hit.content;
}

/** Converts one blockquote. Proposition proofs are attached by the caller (they follow the quote). */
export function convertBlockquote(node: Blockquote, st: CompileState, env: FlowEnv, flow: FlowConverter): Block {
  const plain = (): Block => ({ kind: 'quote', anchor: null, depth: depthOf('quote', env), blocks: flow(node.children, env) });
  const first = node.children[0];
  if (first?.type !== 'paragraph') return plain();
  const lead = first.children[0];
  if (lead?.type !== 'strong') return plain();
  const label = toString(lead).replace(/\s+/gu, ' ').trim();
  const rest = first.children.slice(1);
  const line = st.lineOf(node);

  const definition = /^Definition\s*[—–-]\s*(.+?)\s*\.?$/u.exec(label);
  if (definition !== null) {
    const term = definition[1] ?? '';
    const termSlug = slugify(term) || 'term';
    return {
      kind: 'definition',
      anchor: st.anchors.claim(termAnchor(termSlug)),
      depth: depthOf('definition', env),
      term,
      termSlug,
      content: quoteContent(node, rest, st),
    };
  }

  const claim = /^Claim\s*\[([^\]]*)\]\s*\.?$/u.exec(label);
  if (claim !== null) {
    const inside = claim[1] ?? '';
    const dot = inside.indexOf('·');
    const labelText = (dot === -1 ? inside : inside.slice(0, dot)).trim();
    const sourceText = dot === -1 ? '' : inside.slice(dot + 1).trim();
    if (!isEvidenceLabel(labelText)) {
      st.report('block-malformed', `claim label "${labelText}" is not an evidence label; rendered as a quote`, line);
      return plain();
    }
    const sources = splitTopLevel(sourceText, new Set([';', ',']))
      .map((raw) => raw.trim())
      .filter((raw) => raw !== '')
      .map((raw) => classifySource(raw, st, line));
    st.counters.claim += 1;
    return {
      kind: 'claim',
      anchor: st.anchors.claim(`claim-${st.counters.claim}`),
      depth: depthOf('claim', env),
      label: labelText,
      sources,
      content: quoteContent(node, rest, st),
    };
  }

  if (/^Assumptions?\.?$/iu.test(label)) {
    const split = splitByMarkers(quoteContent(node, rest, st), SENSITIVITY_MARKER);
    return {
      kind: 'assumption',
      anchor: null,
      depth: depthOf('assumption', env),
      content: split.prefix,
      sensitivity: partOf(split.parts, 'sensitivity'),
    };
  }

  const observation = /^Observation\s*(?:\[([^\]]*)\])?\s*\.?$/u.exec(label);
  if (observation !== null) {
    const raw = (observation[1] ?? '').trim();
    const evidence = raw === '' ? null : raw;
    if (evidence !== null && !isEvidenceLabel(evidence)) {
      st.report('block-malformed', `observation label "${evidence}" is not an evidence label`, line);
    }
    return {
      kind: 'observation',
      anchor: null,
      depth: depthOf('observation', env),
      label: evidence !== null && isEvidenceLabel(evidence) ? evidence : null,
      content: quoteContent(node, rest, st),
    };
  }

  const proposition = new RegExp(String.raw`^(Proposition|Theorem|Lemma|Corollary)(?:\s+(${OBJECT_NUMBER}))?\s*\.?$`, 'u').exec(label);
  if (proposition !== null) {
    const variant = PROPOSITION_VARIANTS[proposition[1] ?? 'Proposition'] ?? 'proposition';
    const number = proposition[2] ?? null;
    return {
      kind: 'proposition',
      anchor: number === null ? null : st.anchors.claim(objectAnchor('prop', number)),
      depth: depthOf('proposition', env),
      variant,
      number,
      content: quoteContent(node, rest, st),
      proof: null,
    };
  }

  const failure = /^Failure mode\s*[—–:-]\s*(.+?)\s*\.?$/u.exec(label);
  if (failure !== null) {
    const name = failure[1] ?? '';
    const split = splitByMarkers(quoteContent(node, rest, st), FAILURE_MARKERS);
    const symptom = partOf(split.parts, 'symptom');
    const cause = partOf(split.parts, 'cause');
    const detection = partOf(split.parts, 'detection');
    const mitigation = partOf(split.parts, 'mitigation');
    const missing = [
      symptom === null ? 'Symptom' : null,
      cause === null ? 'Cause' : null,
      detection === null ? 'Detection' : null,
      mitigation === null ? 'Mitigation' : null,
    ].filter((item): item is string => item !== null);
    if (missing.length > 0) st.report('block-malformed', `failure mode "${name}" lacks ${missing.join(', ')}`, line);
    return {
      kind: 'failure-mode',
      anchor: st.anchors.claim(`fm-${slugify(name) || 'failure'}`),
      depth: depthOf('failure-mode', env),
      name,
      symptom,
      cause,
      detection,
      mitigation,
    };
  }

  if (/^Open questions?\.?$/iu.test(label)) {
    const split = splitByMarkers(quoteContent(node, rest, st), SETTLE_MARKER);
    st.counters.openQuestion += 1;
    return {
      kind: 'open-question',
      anchor: st.anchors.claim(`oq-${st.counters.openQuestion}`),
      depth: depthOf('open-question', env),
      content: split.prefix,
      settle: partOf(split.parts, 'settle'),
    };
  }

  const implementation = /^Implementation note\s*(?:\[([\s\S]*)\])?\s*\.?$/u.exec(label);
  if (implementation !== null) {
    const inside = (implementation[1] ?? '').trim();
    const dot = inside.indexOf('·');
    const head = (dot === -1 ? inside : inside.slice(0, dot)).trim();
    const impl = isImplId(head) ? head : null;
    let version: string | null = null;
    if (impl !== null) version = dot === -1 ? null : inside.slice(dot + 1).trim() || null;
    else if (inside !== '') version = inside;
    return {
      kind: 'note',
      anchor: null,
      depth: depthOf('note', env),
      variant: 'implementation',
      content: quoteContent(node, rest, st),
      impl,
      version,
    };
  }

  for (const [pattern, variant] of NOTE_VARIANTS) {
    if (pattern.test(label)) {
      return {
        kind: 'note',
        anchor: null,
        depth: depthOf('note', env),
        variant,
        content: quoteContent(node, rest, st),
        impl: null,
        version: null,
      };
    }
  }
  return plain();
}
