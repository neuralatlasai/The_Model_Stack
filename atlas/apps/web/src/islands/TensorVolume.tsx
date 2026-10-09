import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { TensorFlowSpec } from '@atlas/core';

/** A spatial companion to the authored shape trace; symbolic axes are not to scale. */
export default function TensorVolume({ spec }: { readonly spec: TensorFlowSpec }): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const reset = useRef<(() => void) | null>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const step = spec.steps[index] ?? spec.steps[0];
  const axes = (step?.shape.match(/\[([^\]]*)\]/u)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    const target = host.current;
    if (target === null) return undefined;
    let cancelled = false;
    let dispose: (() => void) | null = null;
    setReady(false);
    const mount = async (): Promise<void> => {
      const [T, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/addons/controls/OrbitControls.js'),
      ]);
      if (cancelled) return;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try {
        renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        setUnavailable(true);
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.setClearColor(0, 0);
      const canvas = renderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute(
        'aria-label',
        `Three-dimensional tensor ${step?.shape ?? ''}. Drag to rotate; use arrow keys to turn.`,
      );
      target.append(canvas);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(34, 1, 0.1, 40);
      camera.position.set(5.4, 3.8, 6.8);
      const controls = new OrbitControls(camera, canvas);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.target.set(0, 0.2, 0);
      controls.minPolarAngle = 0.25;
      controls.maxPolarAngle = Math.PI * 0.72;
      controls.update();
      const ambient = new T.HemisphereLight(0xf2f6ff, 0x425142, 2.6);
      scene.add(ambient);
      const key = new T.DirectionalLight(0xffffff, 4);
      key.position.set(-3, 7, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.bias = -0.001;
      scene.add(key);
      const rim = new T.DirectionalLight(0x9cbfda, 2.5);
      rim.position.set(4, 2, -5);
      scene.add(rim);
      const volume = new T.Group();
      scene.add(volume);
      const palette = [0x548f80, 0x6b8eae, 0xb28d5d] as const;
      const rank = axes.length;
      const layers = rank > 3 ? 3 : 1;
      // Stable schematic extents make axis permutations change the volume.
      // These illustrative counts are not numerical manuscript dimensions.
      const extent = (axis: string | undefined): number => {
        if (axis === undefined) return 1;
        let hash = 0;
        for (const character of axis) hash += character.codePointAt(0) ?? 0;
        return 3 + (hash % 3);
      };
      const nx = extent(axes.at(-1));
      const ny = extent(axes.at(-2));
      const nz = extent(axes.at(-3));
      const geometry = new T.BoxGeometry(0.27, 0.27, 0.27);
      const materials: InstanceType<typeof T.MeshStandardMaterial>[] = [];
      for (let batch = 0; batch < layers; batch += 1) {
        const material = new T.MeshStandardMaterial({
          color: palette[batch] ?? palette[0],
          roughness: 0.3,
          metalness: 0.14,
        });
        materials.push(material);
        for (let x = 0; x < nx; x += 1) {
          for (let y = 0; y < ny; y += 1) {
            for (let z = 0; z < nz; z += 1) {
              const cell = new T.Mesh(geometry, material);
              cell.position.set(
                (x - (nx - 1) / 2) * 0.31 + (batch - (layers - 1) / 2) * 1.9,
                y * 0.31,
                (z - (nz - 1) / 2) * 0.31,
              );
              cell.castShadow = true;
              cell.receiveShadow = true;
              volume.add(cell);
            }
          }
        }
      }
      const floorGeometry = new T.PlaneGeometry(18, 18);
      const floorMaterial = new T.ShadowMaterial({ opacity: 0.16 });
      const floor = new T.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.18;
      floor.receiveShadow = true;
      scene.add(floor);
      const draw = (): void => {
        renderer.render(scene, camera);
      };
      controls.addEventListener('change', draw);
      const resize = new ResizeObserver(() => {
        const width = target.clientWidth;
        const height = target.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
        draw();
      });
      resize.observe(target);
      const onKey = (event: KeyboardEvent): void => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        volume.rotation.y += event.key === 'ArrowLeft' ? -0.15 : event.key === 'ArrowRight' ? 0.15 : 0;
        volume.rotation.x += event.key === 'ArrowUp' ? -0.15 : event.key === 'ArrowDown' ? 0.15 : 0;
        draw();
      };
      canvas.addEventListener('keydown', onKey);
      reset.current = () => {
        volume.rotation.set(0, 0, 0);
        controls.reset();
        draw();
      };
      controls.saveState();
      setReady(true);
      dispose = () => {
        resize.disconnect();
        controls.dispose();
        canvas.removeEventListener('keydown', onKey);
        for (const material of materials) material.dispose();
        geometry.dispose();
        floorGeometry.dispose();
        floorMaterial.dispose();
        renderer.dispose();
        canvas.remove();
        reset.current = null;
      };
    };
    void mount().catch(() => {
      if (!cancelled) setUnavailable(true);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [index, spec]);

  return (
    <section class="tv" aria-label="Tensor in three dimensions">
      <header class="tv-head">
        <span>Spatial tensor view</span>
        <span>3D · drag to rotate</span>
      </header>
      <div class="tv-stages" role="group" aria-label="Trace step">
        {spec.steps.map((item, n) => (
          <button
            type="button"
            aria-pressed={index === n}
            onClick={() => {
              setIndex(n);
            }}
            key={n}
          >
            <span>{String(n + 1).padStart(2, '0')}</span> {item.label ?? item.shape}
          </button>
        ))}
      </div>
      <div class="tv-canvas" ref={host}>
        {!ready && (
          <p class="tv-status">
            {unavailable ? 'The complete tensor trace is available below.' : 'Loading spatial view…'}
          </p>
        )}
      </div>
      <div class="tv-readout" aria-live="polite">
        <code>{step?.shape}</code>
        <span>{step?.op ?? 'Input tensor'}</span>
      </div>
      <dl class="tv-axes">
        {axes.map((axis) => (
          <div key={axis}>
            <dt>{axis}</dt>
            <dd>{spec.dims[axis] ?? 'tensor dimension'}</dd>
          </div>
        ))}
      </dl>
      <footer class="tv-foot">
        <span>Symbolic dimensions; illustrative cell counts. Full shapes and costs below.</span>
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            reset.current?.();
          }}
        >
          Reset view
        </button>
      </footer>
    </section>
  );
}
