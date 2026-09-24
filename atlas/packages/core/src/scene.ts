/**
 * Laid-out geometry for graph-shaped figures (diagram, cycle, concept map,
 * local neighbourhood graph). Produced at compile time by @atlas/visual's
 * layout engine; consumed by SVG renderers. Coordinates are in SVG user units
 * with the origin at the top-left; renderers must not re-layout.
 */
import type { EdgeKind, NodeKind } from './visual-spec.ts';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface SceneNode {
  readonly id: string;
  readonly kind: NodeKind;
  readonly label: string;
  /** Monospace sub-label (shape, bytes, version), or null. */
  readonly sub: string | null;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly emphasis: boolean;
  readonly group: string | null;
  /** When the node represents an atlas node (concept graphs), its URL; else null. */
  readonly href: string | null;
}

export interface SceneEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly kind: EdgeKind;
  readonly label: string | null;
  /** Polyline or orthogonal route; renderers draw it with rounded joins. At least two points. */
  readonly points: readonly Point[];
  readonly labelAt: Point | null;
}

export interface SceneGroup {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Scene {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly SceneNode[];
  readonly edges: readonly SceneEdge[];
  readonly groups: readonly SceneGroup[];
}
