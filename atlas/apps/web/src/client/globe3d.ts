/**
 * Home § 02 as a transparent globe (lib/globe.ts): a glass sphere with a
 * graticule, every chapter on its surface (one meridian band per part), and
 * every declared prerequisite as a great-circle arc above it.
 *
 * - The focused chapter (the section's tabs; they cycle on their own) turns
 *   to face the reader; its incoming arcs light blue (builds on), outgoing
 *   coral (unlocks), and signals run both ways along them.
 * - Drag to spin (it eases back to the focus); hover a chapter to name it;
 *   click opens it. Renders only while on screen; disposed on page change.
 * - No WebGL: returns false and the drawn diagram stays.
 */
import * as THREE from 'three';
import { z } from 'zod';
import { GLOW, INK } from '../lib/brain3d.ts';
import { arcPoint, globeNodes, onSphere } from '../lib/globe.ts';
import type { PageContext } from './page.ts';
import { ARC_FRAGMENT, ARC_VERTEX, BEAD_FRAGMENT, BEAD_VERTEX, DOT_FRAGMENT, DOT_VERTEX, GLASS_FRAGMENT, GLASS_VERTEX, isNight } from './three-shaders.ts';

const IslandSchema = z.object({
  chapters: z.array(z.object({ n: z.number(), title: z.string(), url: z.string(), part: z.number(), domain: z.string(), written: z.boolean() })),
  edges: z.array(z.tuple([z.number(), z.number()])),
  parts: z.array(z.object({ n: z.number(), label: z.string() })),
  focus: z.array(z.number()),
  land: z.array(z.number()),
});

const SEG = 28;
const MAX_PULSES = 40;
const pad = (n: number): string => String(n).padStart(2, '0');

export function initGlobe3D(ctx: PageContext, panel: HTMLElement, reduced: boolean): boolean {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const host = panel.querySelector<HTMLElement>('[data-globe-host]');
  const layer = panel.querySelector<HTMLElement>('[data-globe-labels]');
  const cap = panel.querySelector<HTMLElement>('[data-globe-cap]');
  const parsed = IslandSchema.safeParse(JSON.parse(panel.querySelector('[data-globe]')?.textContent ?? 'null'));
  if (host === null || layer === null || !parsed.success) return false;
  const data = parsed.data;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return false;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hg-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'A transparent globe of all 66 chapters with their prerequisite links as arcs. Drag to spin it; click a chapter to open it.');
  host.prepend(canvas);
  panel.classList.add('is-3d');

  const disposables: { dispose(): void }[] = [renderer];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0.15, 5.1);
  camera.lookAt(0, 0, 0);
  const globe = new THREE.Group();
  scene.add(globe);

  // ── glass sphere and graticule ────────────────────────────────────────────
  const glass = (side: THREE.Side, opacity: number): THREE.ShaderMaterial => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uRim: { value: new THREE.Color() }, uBody: { value: new THREE.Color() }, uLight: { value: new THREE.Vector3(-0.5, 0.8, 0.6) }, uOpacity: { value: opacity } },
      vertexShader: GLASS_VERTEX,
      fragmentShader: GLASS_FRAGMENT,
      side,
      transparent: true,
      depthWrite: false,
    });
    disposables.push(m);
    return m;
  };
  const sphereGeo = new THREE.SphereGeometry(1, 96, 64);
  disposables.push(sphereGeo);
  const glassMats = [glass(THREE.BackSide, 0.35), glass(THREE.FrontSide, 0.8)];
  const glassBase = [0.35, 0.8];
  glassMats.forEach((material, order) => {
    const mesh = new THREE.Mesh(sphereGeo, material);
    mesh.renderOrder = order;
    globe.add(mesh);
  });
  const grid: number[] = [];
  const ring = (fn: (t: number) => readonly [number, number, number], steps: number): void => {
    for (let i = 0; i < steps; i += 1) grid.push(...fn(i / steps), ...fn((i + 1) / steps));
  };
  for (let lat = -60; lat <= 60; lat += 20) {
    const phi = (lat * Math.PI) / 180;
    ring((t) => [Math.cos(phi) * Math.sin(t * 2 * Math.PI) * 1.001, Math.sin(phi) * 1.001, Math.cos(phi) * Math.cos(t * 2 * Math.PI) * 1.001], 96);
  }
  for (let k = 0; k < 12; k += 1) {
    const lon = (k / 12) * 2 * Math.PI;
    ring((t) => {
      const phi = (t - 0.5) * Math.PI;
      return [Math.cos(phi) * Math.sin(lon) * 1.001, Math.sin(phi) * 1.001, Math.cos(phi) * Math.cos(lon) * 1.001];
    }, 64);
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  const gridMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.14, depthWrite: false });
  disposables.push(gridGeo, gridMat);
  const gridLines = new THREE.LineSegments(gridGeo, gridMat);
  gridLines.renderOrder = 2;
  globe.add(gridLines);

  // the real Earth: land as dots on the glass
  const landPos = new Float32Array(data.land.length * 1.5);
  for (let i = 0; i + 1 < data.land.length; i += 2) landPos.set(onSphere(data.land[i] ?? 0, data.land[i + 1] ?? 0, 1.003), (i / 2) * 3);
  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute('position', new THREE.BufferAttribute(landPos, 3));
  const landMat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: renderer.getPixelRatio() }, uSize: { value: 2.2 }, uNear: { value: 4.1 }, uFar: { value: 6.1 }, uColor: { value: new THREE.Color() }, uOpacity: { value: 0.6 } },
    vertexShader: DOT_VERTEX,
    fragmentShader: DOT_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  disposables.push(landGeo, landMat);
  const landDots = new THREE.Points(landGeo, landMat);
  landDots.renderOrder = 2;
  globe.add(landDots);

  // ── chapters and arcs ─────────────────────────────────────────────────────
  const nodes = globeNodes(data.chapters);
  const at = new Map(nodes.map((node, i) => [node.n, i]));
  const edges = data.edges.filter(([from, to]) => at.has(from) && at.has(to));
  const nodeOf = (n: number): (typeof nodes)[number] | undefined => nodes[at.get(n) ?? -1];

  const beadMaterials: THREE.ShaderMaterial[] = [];
  const beads = (count: number, order: number): { geo: THREE.BufferGeometry; pos: Float32Array; col: Float32Array; size: Float32Array; alpha: Float32Array } => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const alpha = new Float32Array(count);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: renderer.getPixelRatio() }, uNear: { value: 4.1 }, uFar: { value: 6.1 }, uPaper: { value: 1 }, uScale: { value: 5.1 } },
      vertexShader: BEAD_VERTEX,
      fragmentShader: BEAD_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    beadMaterials.push(material);
    const points = new THREE.Points(geo, material);
    points.renderOrder = order;
    points.frustumCulled = false;
    globe.add(points);
    disposables.push(geo, material);
    return { geo, pos, col, size, alpha };
  };
  const B = beads(nodes.length, 5);
  nodes.forEach((node, i) => { B.pos.set(node.p, i * 3); });

  const arcGeo = new THREE.BufferGeometry();
  const arcPos = new Float32Array(edges.length * SEG * 6);
  const arcCol = new Float32Array(edges.length * SEG * 8);
  edges.forEach(([from, to], i) => {
    const a = nodeOf(from)?.p ?? [0, 0, 1];
    const b = nodeOf(to)?.p ?? [0, 0, 1];
    for (let s = 0; s < SEG; s += 1) arcPos.set([...arcPoint(a, b, s / SEG), ...arcPoint(a, b, (s + 1) / SEG)], (i * SEG + s) * 6);
  });
  arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
  arcGeo.setAttribute('aColor', new THREE.BufferAttribute(arcCol, 4));
  const arcMat = new THREE.ShaderMaterial({
    uniforms: { uCentre: { value: 5.1 }, uOpacity: { value: 1 } },
    vertexShader: ARC_VERTEX,
    fragmentShader: ARC_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  disposables.push(arcGeo, arcMat);
  const arcs = new THREE.LineSegments(arcGeo, arcMat);
  arcs.renderOrder = 3;
  arcs.frustumCulled = false;
  globe.add(arcs);

  const S = beads(MAX_PULSES, 6);
  const pulses: { edge: number; start: number; dur: number }[] = [];
  const spawn = (edge: number, delay = 0): void => {
    if (reduced || pulses.length >= MAX_PULSES) return;
    pulses.push({ edge, start: performance.now() + delay, dur: 1300 + Math.random() * 600 });
  };

  // ── theme ─────────────────────────────────────────────────────────────────
  let night = false;
  let palette: Readonly<Record<string, string>> = INK;
  const tint = (domain: string): THREE.Color => new THREE.Color(palette[domain] ?? palette['foundations'] ?? '#888888');
  const IN = new THREE.Color();
  const OUT = new THREE.Color();
  let focus = data.focus[0] ?? nodes[0]?.n ?? 1;
  const paint = (): void => {
    edges.forEach(([from, to], i) => {
      let c = tint(nodeOf(from)?.domain ?? '');
      let a = 0.035;
      if (to === focus) {
        c = IN;
        a = 0.95;
      } else if (from === focus) {
        c = OUT;
        a = 0.95;
      }
      for (let v = 0; v < SEG * 2; v += 1) arcCol.set([c.r, c.g, c.b, a], (i * SEG * 2 + v) * 4);
    });
    arcGeo.getAttribute('aColor').needsUpdate = true;
    const linked = new Set(edges.flatMap(([from, to]) => (to === focus ? [from] : from === focus ? [to] : [])));
    nodes.forEach((node, i) => {
      const c = tint(node.domain);
      B.col.set([c.r, c.g, c.b], i * 3);
      const on = node.n === focus;
      B.size[i] = (node.written ? 16 : 9) * (on ? 1.9 : linked.has(node.n) ? 1.35 : 1);
      B.alpha[i] = on || linked.has(node.n) ? 1 : node.written ? 0.7 : 0.4;
    });
    for (const attr of ['aColor', 'aSize', 'aAlpha'] as const) B.geo.getAttribute(attr).needsUpdate = true;
  };
  const applyTheme = (): void => {
    night = isNight(doc);
    palette = night ? GLOW : INK;
    for (const m of glassMats) {
      const u = m.uniforms as { uRim: { value: THREE.Color }; uBody: { value: THREE.Color } };
      u.uRim.value.set(night ? 0x9cc8ff : 0x23466f);
      u.uBody.value.set(night ? 0x0f1722 : 0xe4ecf6);
    }
    gridMat.color.set(night ? 0x9cc8ff : 0x23466f);
    gridMat.opacity = 0.08;
    (landMat.uniforms as { uColor: { value: THREE.Color }; uOpacity: { value: number } }).uColor.value.set(night ? 0x9cc8ff : 0x4f7aa8);
    (landMat.uniforms as { uOpacity: { value: number } }).uOpacity.value = night ? 0.5 : 0.55;
    for (const m of beadMaterials) {
      (m.uniforms as { uPaper: { value: number } }).uPaper.value = night ? 0 : 1;
      m.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
    arcMat.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
    arcMat.needsUpdate = true;
    IN.set(night ? 0x7fc0ff : 0x1f5fa8);
    OUT.set(night ? 0xff9a7a : 0xc2412b);
    paint();
  };
  applyTheme();
  ctl.observe(new MutationObserver(applyTheme)).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── labels ────────────────────────────────────────────────────────────────
  const numberLabels = nodes.map((node) => {
    const el = doc.createElement('span');
    el.className = 'hg-num';
    el.textContent = pad(node.n);
    layer.append(el);
    return el;
  });
  const tag = doc.createElement('span');
  tag.className = 'hg-tag';
  layer.append(tag);
  ctl.defer(() => {
    layer.replaceChildren();
  });

  // ── focus: turn the globe to face it ──────────────────────────────────────
  let hovered: number | null = null;
  let targetYaw = 0;
  let targetPitch = 0;
  const setFocus = (n: number): void => {
    const node = nodeOf(n);
    if (node === undefined) return;
    focus = n;
    targetYaw = -node.lon;
    targetPitch = node.lat * 0.75;
    paint();
    const ins = edges.filter(([, to]) => to === n).length;
    const outs = edges.filter(([from]) => from === n).length;
    if (cap !== null) cap.textContent = `Chapter ${pad(n)} · ${node.title} — builds on ${String(ins)} · unlocks ${String(outs)}`;
    edges.forEach(([from, to], i) => {
      if (to === n) spawn(i, Math.random() * 400);
      if (from === n) spawn(i, 500 + Math.random() * 400);
    });
  };
  panel.addEventListener('hx:focus', (event) => {
    const n = (event as CustomEvent<number>).detail;
    if (typeof n === 'number') setFocus(n);
  }, { signal });

  // ── interaction ───────────────────────────────────────────────────────────
  let yaw = 0;
  let pitch = 0;
  let dragYaw = 0;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let releasedAt = 0;
  const v = new THREE.Vector3();
  const project = (p: readonly [number, number, number] | THREE.Vector3): { x: number; y: number; front: number } => {
    if (p instanceof THREE.Vector3) v.copy(p);
    else v.set(p[0], p[1], p[2]);
    globe.localToWorld(v);
    const front = v.z; // > 0 faces the camera
    v.project(camera);
    const rect = canvas.getBoundingClientRect();
    return { x: (v.x * 0.5 + 0.5) * rect.width, y: (-v.y * 0.5 + 0.5) * rect.height, front };
  };
  const pick = (clientX: number, clientY: number): number | null => {
    const rect = canvas.getBoundingClientRect();
    let best: number | null = null;
    let bestD = 16;
    for (const node of nodes) {
      const s = project(node.p);
      if (s.front < -0.1) continue;
      const d = Math.hypot(s.x - (clientX - rect.left), s.y - (clientY - rect.top));
      if (d < bestD) {
        bestD = d;
        best = node.n;
      }
    }
    return best;
  };
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = 0;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  }, { signal });
  canvas.addEventListener('pointermove', (event) => {
    if (dragging) {
      const dx = event.clientX - lastX;
      moved += Math.abs(dx);
      dragYaw += dx * 0.008;
      lastX = event.clientX;
      return;
    }
    hovered = pick(event.clientX, event.clientY);
    canvas.style.cursor = hovered === null ? 'grab' : 'pointer';
  }, { signal });
  canvas.addEventListener('pointerup', (event) => {
    dragging = false;
    releasedAt = performance.now();
    if (moved < 6) {
      const n = pick(event.clientX, event.clientY);
      const url = n === null ? undefined : nodeOf(n)?.url;
      if (url !== undefined) window.location.assign(url);
    }
  }, { signal });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
  }, { signal });

  // ── frame loop ────────────────────────────────────────────────────────────
  let visible = false;
  let raf = 0;
  let then = performance.now();
  const kick = (): void => {
    if (raf === 0 && !ctl.disposed) {
      then = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  ctl.observe(new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) kick();
  })).observe(panel);
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') kick();
  }, { signal });
  const resize = (): void => {
    const rect = host.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  ctl.observe(new ResizeObserver(resize)).observe(host);
  resize();
  setFocus(focus);
  yaw = targetYaw;
  pitch = targetPitch;

  // emergence: the world fades in, then its connections draw on one after another
  let introStart = -1;
  let intro = reduced ? 1 : 0;
  const totalVertices = edges.length * SEG * 2;
  const emerge = (k: number): void => {
    glassMats.forEach((m, i) => {
      (m.uniforms as { uOpacity: { value: number } }).uOpacity.value = (glassBase[i] ?? 1) * Math.min(1, k * 1.6);
    });
    (landMat.uniforms as { uOpacity: { value: number } }).uOpacity.value = (night ? 0.5 : 0.55) * Math.min(1, k * 1.4);
    gridMat.opacity = 0.08 * Math.min(1, k * 1.6);
    arcGeo.setDrawRange(0, Math.floor(totalVertices * Math.max(0, (k - 0.25) / 0.75)));
    globe.scale.setScalar(0.9 + 0.1 * k);
    layer.style.opacity = String(Math.max(0, (k - 0.5) * 2));
  };
  emerge(intro);
  let nextAmbient = 0;
  function frame(now: number): void {
    raf = 0;
    if (!visible || doc.visibilityState !== 'visible') return;
    const dt = Math.min(0.05, (now - then) / 1000);
    then = now;
    if (intro < 1) {
      if (introStart < 0) introStart = now;
      const t = Math.min(1, (now - introStart) / 1300);
      intro = 1 - (1 - t) ** 3;
      emerge(intro);
    }
    // ease toward the focus; a drag offsets it and relaxes back after a pause
    let delta = targetYaw - yaw;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    yaw += delta * Math.min(1, dt * 2.2);
    pitch += (targetPitch - pitch) * Math.min(1, dt * 2.2);
    if (!dragging && now - releasedAt > 2500) dragYaw *= 1 - Math.min(1, dt * 1.4);
    const sway = reduced ? 0 : Math.sin(now / 3200) * 0.12;
    globe.rotation.set(pitch, yaw + dragYaw + sway, 0, 'XYZ');

    if (!reduced && now > nextAmbient) {
      const linked = edges.map((edge, i) => ({ edge, i })).filter(({ edge }) => edge[0] === focus || edge[1] === focus);
      const pool = linked.length > 0 && Math.random() < 0.7 ? linked : edges.map((edge, i) => ({ edge, i }));
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      if (chosen !== undefined) spawn(chosen.i);
      nextAmbient = now + 220;
    }
    for (let i = 0; i < MAX_PULSES; i += 1) {
      const pulse = pulses[i];
      const t = pulse === undefined ? -1 : (now - pulse.start) / pulse.dur;
      const edge = pulse === undefined ? undefined : edges[pulse.edge];
      if (pulse === undefined || edge === undefined || t < 0) {
        S.alpha[i] = 0;
        continue;
      }
      const a = nodeOf(edge[0])?.p ?? [0, 0, 1];
      const b = nodeOf(edge[1])?.p ?? [0, 0, 1];
      S.pos.set(arcPoint(a, b, Math.min(1, t)), i * 3);
      const c = edge[1] === focus ? IN : edge[0] === focus ? OUT : tint(nodeOf(edge[0])?.domain ?? '');
      S.col.set([c.r, c.g, c.b], i * 3);
      S.size[i] = 16;
      S.alpha[i] = Math.min(1, t * 5, (1 - t) * 5);
    }
    for (let i = pulses.length - 1; i >= 0; i -= 1) if ((now - (pulses[i]?.start ?? 0)) / (pulses[i]?.dur ?? 1) >= 1) pulses.splice(i, 1);
    for (const attr of ['position', 'aColor', 'aSize', 'aAlpha'] as const) S.geo.getAttribute(attr).needsUpdate = true;

    const linked = new Set(edges.flatMap(([from, to]) => (to === focus ? [from] : from === focus ? [to] : [])));
    nodes.forEach((node, i) => {
      const el = numberLabels[i];
      if (el === undefined) return;
      const show = node.n === focus || linked.has(node.n);
      const s = project(node.p);
      el.style.transform = `translate(${(s.x + 9).toFixed(1)}px, ${(s.y - 8).toFixed(1)}px)`;
      el.style.opacity = show && s.front > -0.05 ? String(Math.min(1, 0.35 + s.front)) : '0';
    });
    const named = hovered ?? focus;
    const node = nodeOf(named);
    if (node !== undefined) {
      const s = project(node.p);
      tag.textContent = `${pad(node.n)} · ${node.title}`;
      const width = tag.offsetWidth;
      const room = canvas.clientWidth;
      const x = s.x + 14 + width > room - 4 ? s.x - 14 - width : s.x + 14;
      tag.style.transform = `translate(${Math.max(0, x).toFixed(1)}px, ${(s.y + 10).toFixed(1)}px)`;
      tag.style.opacity = s.front > -0.05 ? '1' : '0';
    }

    renderer.render(scene, camera);
    kick();
  }

  ctl.defer(() => {
    cancelAnimationFrame(raf);
    for (const item of disposables) item.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    panel.classList.remove('is-3d');
  });
  return true;
}
