/**
 * Typed seam around elkjs. The bundled build runs in-process on Node (a fake
 * worker), so compile-time layout needs no worker threads or network.
 *
 * elkjs ships CommonJS with an `export default` declaration; under NodeNext the
 * default import may surface either the constructor or the module object, so
 * the constructor is resolved structurally once.
 */
import ElkModule from 'elkjs/lib/elk.bundled.js';
import type { ELK, ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api.js';

type ElkConstructor = new () => ELK;

function resolveConstructor(moduleValue: unknown): ElkConstructor {
  if (typeof moduleValue === 'function') return moduleValue as ElkConstructor;
  if (typeof moduleValue === 'object' && moduleValue !== null && 'default' in moduleValue) {
    const inner: unknown = moduleValue.default;
    if (typeof inner === 'function') return inner as ElkConstructor;
  }
  throw new TypeError('elkjs: could not resolve the ELK constructor');
}

let instance: ELK | null = null;

/** Lazily constructed shared ELK instance (layout calls are independent and stateless). */
export function elk(): ELK {
  instance ??= new (resolveConstructor(ElkModule))();
  return instance;
}

export type { ElkExtendedEdge, ElkNode };
