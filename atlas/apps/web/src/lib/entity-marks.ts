/**
 * Marks and footprints shared by the Systems and Labs views (index and object
 * pages), so a system or lab carries the same monogram and the same measure
 * everywhere it appears.
 *
 *   marks      monograms of the recorded names, unique within their set
 *              (lib/monogram.ts); systems drop their vendor prefix
 *   footprint  sections of written chapters that draw on it: a coverage row's
 *              "Sections" count or, for a chapter that only lists a system
 *              among its implementations, the sections that list it — at
 *              least one per chapter
 */
import type { LabRow, SystemRow } from './entity-model.ts';
import { monograms } from './monogram.ts';

/** Vendor prefixes a system's mark leaves out ("NVIDIA NCCL" → "NCCL"). */
export const SYSTEM_VENDORS: readonly string[] = ['NVIDIA', 'AMD', 'Intel', 'Google', 'Microsoft', 'Apple', 'PyTorch', 'MosaicML', 'ROCm'];

export function systemMarks(systems: readonly SystemRow[]): Map<string, string> {
  const marks = monograms(
    systems.map((system) => system.name),
    { vendors: SYSTEM_VENDORS },
  );
  return new Map(systems.map((system, index) => [system.key, marks[index] ?? system.name.slice(0, 2)]));
}

export function labMarks(labs: readonly LabRow[]): Map<string, string> {
  const marks = monograms(labs.map((lab) => lab.name));
  return new Map(labs.map((lab, index) => [lab.key, marks[index] ?? lab.name.slice(0, 2)]));
}

export function systemFootprint(system: SystemRow): number {
  return system.chapters.reduce((sum, n) => {
    const rows = system.uses.filter((use) => use.ch === n);
    const counted = rows.length > 0 ? rows.reduce((total, use) => total + use.count, 0) : (system.listedIn[String(n)]?.length ?? 0);
    return sum + Math.max(1, counted);
  }, 0);
}
