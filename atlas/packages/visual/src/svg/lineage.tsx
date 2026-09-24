/**
 * Lineage (VISUAL_GRAMMAR §5.7, UI_UX §21): a vertical dated rail. Year in
 * mono, work in serif, relation in small-caps sans, and a relation glyph on
 * the rail drawn in CSS (crisp at any zoom, recoloured by the token layer):
 *
 *   conceptual ancestor ○ hollow ring       engineering optimization ◆ filled lozenge
 *   alternative branch  ⟂ ring off a spur    superseded approach ⊘ struck ring (entry recedes)
 *   current frontier    ● domain disc with a halo
 *
 * A key under the rail names the glyphs that occur. Entries are keyed
 * `data-vg-key="<work>"` for live-instrument states.
 */
import type { JSX } from 'preact';
import { isCitationKey, LINEAGE_RELATIONS, paperUrl, type LineageRelation, type LineageSpec } from '@atlas/core';
import { cls, litClass, NO_STATE, type StateView } from './util.ts';

export const RELATION_GLYPH: Readonly<Record<LineageRelation, string>> = {
  'conceptual ancestor': '○',
  'engineering optimization': '◆',
  'alternative branch': '⟂',
  'superseded approach': '⊘',
  'current frontier': '●',
};

function relationSlug(relation: LineageRelation): string {
  return relation.split(' ')[0] ?? 'other';
}

export interface LineageViewProps {
  readonly spec: LineageSpec;
  /** Resolves an atlas node id to its URL; entries without a resolvable node are not linked. */
  readonly nodeHref?: ((id: string) => string | null) | undefined;
  readonly state?: StateView;
}

export function LineageView({ spec, nodeHref, state = NO_STATE }: LineageViewProps): JSX.Element {
  const used = LINEAGE_RELATIONS.filter((relation) => spec.entries.some((entry) => entry.relation === relation));
  return (
    <div class="vg-lineage-wrap">
      <ol class="vg-lineage">
        {spec.entries.map((entry, index) => {
          const href = entry.node === undefined || nodeHref === undefined ? null : nodeHref(entry.node);
          const previous = spec.entries[index - 1];
          const sameYear = previous !== undefined && String(previous.year) === String(entry.year);
          return (
            <li class={cls('vg-lineage__entry', `vg-lineage__entry--${relationSlug(entry.relation)}`, litClass(state, entry.work))} data-vg-key={entry.work} key={`${index}:${entry.work}`}>
              <span class={cls('vg-lineage__year', sameYear && 'vg-lineage__year--repeat')}>{entry.year}</span>
              <span class={cls('vg-lineage__mark', `vg-mark--${relationSlug(entry.relation)}`)} aria-hidden="true" />
              <div class="vg-lineage__body">
                <p class="vg-lineage__line">
                  <span class="vg-lineage__work">{href === null ? entry.work : <a href={href}>{entry.work}</a>}</span>
                  {entry.cite !== undefined && isCitationKey(entry.cite) && (
                    <a class="vg-lineage__cite" href={paperUrl(entry.cite)} data-cite={entry.cite}>
                      {entry.cite}
                    </a>
                  )}
                </p>
                <p class="vg-lineage__relation">{entry.relation}</p>
                {entry.note !== undefined && <p class="vg-lineage__note">{entry.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {used.length > 1 && (
        <ul class="vg-lineage__key" aria-label="Relation key">
          {used.map((relation) => (
            <li key={relation}>
              <span class={cls('vg-lineage__mark', `vg-mark--${relationSlug(relation)}`)} aria-hidden="true" />
              {relation}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
