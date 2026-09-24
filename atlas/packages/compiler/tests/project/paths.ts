/**
 * Locations of the real inputs used by the project-layer tests. The docs and
 * the reference stack are read, never written.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** atlas/ */
export const ATLAS_ROOT = path.resolve(here, '../../../..');
/** The_Model_Stack/docs */
export const DOCS_DIR = path.resolve(ATLAS_ROOT, '../docs');
/** The_Model_Stack/Instruction/AI_REFERENCE_STACK.md (read-only) */
export const REFERENCE_STACK = path.resolve(ATLAS_ROOT, '../Instruction/AI_REFERENCE_STACK.md');
/** Fixed timestamp so bundle output is reproducible in tests. */
export const FIXED_COMPILED_AT = '2026-09-23T00:00:00.000Z';
