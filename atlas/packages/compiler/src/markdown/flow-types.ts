/**
 * Shared shapes for the block converters. `FlowConverter` is passed down so
 * that typed-block modules can convert nested content without importing the
 * main converter (no import cycles).
 */
import type { Block } from '@atlas/core';
import type { RootContent } from 'mdast';
import type { FlowEnv } from './state.ts';

export type FlowConverter = (nodes: readonly RootContent[], env: FlowEnv) => Block[];

/** Result of a converter that may consume following siblings (equation tags, complexity lines, experiment lists). */
export interface Consumed<T> {
  readonly value: T;
  /** Number of FOLLOWING sibling nodes consumed in addition to the current one. */
  readonly extra: number;
}
