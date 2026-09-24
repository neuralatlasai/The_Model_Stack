/**
 * MiniSearch index build (UI_UX §32: deterministic lexical retrieval). The
 * client must load the serialised index with the very same options, so both
 * sides derive them from core's `SEARCH_INDEX_OPTIONS`.
 */
import { SEARCH_INDEX_OPTIONS, type SearchDoc } from '@atlas/core';
import MiniSearch, { type Options } from 'minisearch';

/** Mutable copy of the shared options in MiniSearch's own option type. */
export function searchIndexOptions(): Options<SearchDoc> {
  return {
    idField: SEARCH_INDEX_OPTIONS.idField,
    fields: [...SEARCH_INDEX_OPTIONS.fields],
    storeFields: [...SEARCH_INDEX_OPTIONS.storeFields],
    searchOptions: {
      boost: { ...SEARCH_INDEX_OPTIONS.searchOptions.boost },
      prefix: SEARCH_INDEX_OPTIONS.searchOptions.prefix,
      fuzzy: SEARCH_INDEX_OPTIONS.searchOptions.fuzzy,
    },
  };
}

/** Builds and serialises the index. Insertion order is the docs order, so the output is deterministic. */
export function buildSearchIndex(docs: readonly SearchDoc[]): string {
  const index = new MiniSearch<SearchDoc>(searchIndexOptions());
  index.addAll(docs);
  return JSON.stringify(index);
}

/** Loads a serialised index (tests and tooling; the web client does the same with core's options). */
export function loadSearchIndex(json: string): MiniSearch<SearchDoc> {
  return MiniSearch.loadJSON<SearchDoc>(json, searchIndexOptions());
}
