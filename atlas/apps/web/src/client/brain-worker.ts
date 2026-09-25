/**
 * Builds the brain's cortex meshes off the main thread (lib/brain-mesh.ts)
 * and hands the buffers back without copying.
 */
import { brainMeshes } from '../lib/brain-mesh.ts';

self.addEventListener('message', (event: MessageEvent<{ small: boolean }>) => {
  const meshes = brainMeshes(event.data.small);
  self.postMessage(
    meshes,
    { transfer: meshes.flatMap((mesh) => [mesh.position.buffer, mesh.normal.buffer, mesh.index.buffer]) },
  );
});
