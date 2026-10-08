/**
 * Part and volume maps (PartMap.astro, VolumeMap.astro): the links that
 * cross the map's boundary, grouped by part, and the one-line readings the
 * idle readout gives of them. Every value is derived from the library model.
 */

export interface FlowChapter {
  readonly n: number;
  readonly short: string;
  readonly prereqs: readonly number[];
  readonly unlocks: readonly number[];
}

export interface FlowPart {
  readonly n: number;
  readonly numeral: string;
  readonly chapters: readonly number[];
}

export interface FlowGroup {
  readonly numeral: string;
  readonly items: readonly { readonly n: number; readonly via: readonly number[] }[];
}

export interface Flow {
  /** Outside chapter → the inside chapters that list it as a prerequisite. */
  readonly inbound: ReadonlyMap<number, readonly number[]>;
  /** Outside chapter → the inside chapters it lists as prerequisites. */
  readonly outbound: ReadonlyMap<number, readonly number[]>;
  readonly inGroups: readonly FlowGroup[];
  readonly outGroups: readonly FlowGroup[];
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Direct links crossing the boundary of `own`, grouped by the part of the outside chapter. */
export function crossingLinks(own: readonly FlowChapter[], parts: readonly FlowPart[]): Flow {
  const ownSet = new Set(own.map((chapter) => chapter.n));
  const partOf = new Map(parts.flatMap((part) => part.chapters.map((n) => [n, part] as const)));
  const inbound = new Map<number, number[]>();
  const outbound = new Map<number, number[]>();
  for (const chapter of own) {
    for (const p of chapter.prereqs) if (!ownSet.has(p)) inbound.set(p, [...(inbound.get(p) ?? []), chapter.n]);
    for (const u of chapter.unlocks) if (!ownSet.has(u)) outbound.set(u, [...(outbound.get(u) ?? []), chapter.n]);
  }
  const grouped = (links: ReadonlyMap<number, readonly number[]>): FlowGroup[] => {
    const groups = new Map<number, { numeral: string; items: { n: number; via: readonly number[] }[] }>();
    for (const [n, via] of [...links].sort((a, b) => a[0] - b[0])) {
      const part = partOf.get(n);
      if (part === undefined) continue;
      const group = groups.get(part.n) ?? { numeral: part.numeral, items: [] };
      group.items.push({ n, via });
      groups.set(part.n, group);
    }
    return [...groups.values()];
  };
  return { inbound, outbound, inGroups: grouped(inbound), outGroups: grouped(outbound) };
}

function partRange(groups: readonly FlowGroup[]): string {
  const first = groups[0]?.numeral;
  const last = groups.at(-1)?.numeral;
  if (first === undefined || last === undefined) return '';
  return first === last ? `Part ${first}` : `Parts ${first}–${last}`;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${String(count)} ${count === 1 ? one : many}`;
}

/**
 * The idle readout's reading of the flow, e.g. "Builds on 7 earlier chapters
 * in Parts I–II, most on 05 Minimal Transformer (4 here). Unlocks 30 in
 * Parts III–XI; 05 Minimal Transformer reaches furthest (13)."
 */
export function flowSentence(flow: Flow, chapters: ReadonlyMap<number, FlowChapter>): string {
  const name = (n: number): string => `${pad2(n)} ${chapters.get(n)?.short ?? ''}`.trim();
  const sentences: string[] = [];
  if (flow.inbound.size === 0) {
    sentences.push('Builds on no earlier chapter.');
  } else {
    const [top, via] = [...flow.inbound].sort((a, b) => b[1].length - a[1].length || a[0] - b[0])[0] ?? [0, []];
    sentences.push(
      `Builds on ${plural(flow.inbound.size, 'earlier chapter')} in ${partRange(flow.inGroups)}, most on ${name(top)} (${String(via.length)} here).`,
    );
  }
  if (flow.outbound.size === 0) {
    sentences.push('No later chapter lists it yet.');
  } else {
    const reach = new Map<number, number>();
    for (const via of flow.outbound.values()) for (const n of via) reach.set(n, (reach.get(n) ?? 0) + 1);
    const [top, count] = [...reach].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? [0, 0];
    sentences.push(
      `Unlocks ${plural(flow.outbound.size, 'later chapter')} in ${partRange(flow.outGroups)}; ${name(top)} reaches furthest (${String(count)}).`,
    );
  }
  return sentences.join(' ');
}
