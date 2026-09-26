/**
 * The 3D brain hero (components/home/BrainHero.astro, lib/brain3d.ts).
 *
 * A transparent glass brain rendered with WebGL straight onto the page: two
 * folded hemispheres, cerebellum and brainstem, drawn with a Fresnel glass
 * shader so every gyrus and sulcus reads as a contour on clear glass (back
 * faces first, faintly, so the far hemisphere shows through). Inside it, the
 * book: chapters as glowing neurons, glossary concepts around them, declared
 * prerequisites as fibres carrying signals.
 *
 * - Follows the story (client story.ts, `hx:part` events): a part turns its
 *   region to the reader, lights its chapters and concepts, and draws its
 *   prerequisites in (blue) and out (coral) to the other regions; the
 *   readout names the regions it draws on and feeds. Part 0 is the whole
 *   brain, rocking slowly.
 * - Drag to orbit (with inertia). Point at a neuron (or arrow keys on the
 *   focused canvas): its fibres light, its concepts glow, a tag names it in
 *   place; click or Enter opens the chapter.
 * - Light and dark themes (ink on paper / light on night), switching live.
 * - Renders only while on screen; disposed on page change. Reduced motion:
 *   no auto-rotation or signals; dragging still works. No WebGL: returns
 *   false and the SVG brain stays.
 */
import * as THREE from 'three';
import { z } from 'zod';
import { brainMeshes, type MeshArrays } from '../lib/brain-mesh.ts';
import { GLOW, INK } from '../lib/brain3d.ts';
import type { PageContext } from './page.ts';
import { BEAD_FRAGMENT, BEAD_VERTEX, GLASS_FRAGMENT, GLASS_VERTEX, isNight } from './three-shaders.ts';

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
const IslandSchema = z.object({
  regions: z.array(z.object({ n: z.number(), label: z.string(), domain: z.string(), p: Vec3 })),
  neurons: z.array(z.object({ n: z.number(), title: z.string(), url: z.string(), part: z.number(), region: z.string(), domain: z.string(), written: z.boolean(), concepts: z.number(), p: Vec3 })),
  concepts: z.array(z.object({ chapter: z.number(), term: z.string(), domain: z.string(), p: Vec3 })),
  fibres: z.array(z.object({ from: z.number(), to: z.number(), c: Vec3 })),
});

const SEGMENTS = 18;
const MAX_PULSES = 36;
const pad = (n: number): string => String(n).padStart(2, '0');

export function initBrain3D(ctx: PageContext, fig: HTMLElement, reduced: boolean): boolean {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const host = fig.querySelector<HTMLElement>('[data-brain3d-host]');
  const labelsLayer = fig.querySelector<HTMLElement>('[data-brain3d-labels]');
  const parsed = IslandSchema.safeParse(JSON.parse(fig.querySelector('[data-brain3d]')?.textContent ?? 'null'));
  if (host === null || labelsLayer === null || !parsed.success) return false;
  const data = parsed.data;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return false;
  }
  const small = window.matchMedia('(max-width: 640px)').matches;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'hb3-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'A three-dimensional glass brain: the chapters of the book as neurons. Drag to turn it; arrow keys step through chapters; Enter opens one.');
  host.prepend(canvas);
  fig.classList.add('is-3d');

  const disposables: { dispose(): void }[] = [renderer];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 0.3, 4.45);
  camera.lookAt(0, -0.08, 0);
  const brain = new THREE.Group();
  brain.rotation.set(0.12, -0.3, 0);
  scene.add(brain);

  // ── glass cortex ──────────────────────────────────────────────────────────
  const glass = (side: THREE.Side, opacity: number): THREE.ShaderMaterial => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uRim: { value: new THREE.Color() },
        uBody: { value: new THREE.Color() },
        uLight: { value: new THREE.Vector3(-0.5, 0.8, 0.6) },
        uOpacity: { value: opacity },
        uFill: { value: 0 },
      },
      vertexShader: GLASS_VERTEX,
      fragmentShader: GLASS_FRAGMENT,
      side,
      transparent: true,
      depthWrite: false,
    });
    disposables.push(m);
    return m;
  };
  const glassBack = glass(THREE.BackSide, 0.42);
  const glassFront = glass(THREE.FrontSide, 1);
  const setGlass = (k: number): void => {
    (glassBack.uniforms as { uOpacity: { value: number } }).uOpacity.value = 0.42 * k;
    (glassFront.uniforms as { uOpacity: { value: number } }).uOpacity.value = k;
  };
  const addGlass = (geo: THREE.BufferGeometry, transform?: (mesh: THREE.Mesh) => void): void => {
    for (const [material, order] of [[glassBack, 0], [glassFront, 1]] as const) {
      const mesh = new THREE.Mesh(geo, material);
      mesh.renderOrder = order;
      transform?.(mesh);
      brain.add(mesh);
    }
  };
  // The cortex is built off the main thread (brain-worker.ts, ~0.2 s) while
  // the neurons and fibres already draw; the glass condenses in when it lands.
  let cortexAt = -1;
  const addCortex = (meshes: readonly MeshArrays[]): void => {
    if (ctl.disposed) return;
    for (const mesh of meshes) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(mesh.position, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(mesh.normal, 3));
      geo.setIndex(new THREE.BufferAttribute(mesh.index, 1));
      disposables.push(geo);
      addGlass(geo);
    }
    cortexAt = performance.now();
  };
  const buildHere = (): void => {
    addCortex(brainMeshes(small));
  };
  try {
    const worker = new Worker(new URL('./brain-worker.ts', import.meta.url), { type: 'module' });
    ctl.defer(() => {
      worker.terminate();
    });
    worker.addEventListener('message', (event: MessageEvent<MeshArrays[]>) => {
      addCortex(event.data);
      worker.terminate();
    }, { signal });
    worker.addEventListener('error', buildHere, { signal });
    worker.postMessage({ small });
  } catch {
    buildHere();
  }
  const stemGeo = new THREE.CylinderGeometry(0.075, 0.11, 0.42, 48, 6, true);
  disposables.push(stemGeo);
  addGlass(stemGeo, (mesh) => {
    mesh.position.set(0.2, -0.6, 0);
    mesh.rotation.z = 0.32;
  });

  // soft contact shadow / glow under the brain (a shape, not a frame)
  const shadowCanvas = doc.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const g2 = shadowCanvas.getContext('2d');
  if (g2 !== null) {
    const grad = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 256, 256);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shadowGeo = new THREE.PlaneGeometry(2.3, 1.1);
  disposables.push(shadowTex, shadowMat, shadowGeo);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.05, -0.86, 0);
  shadow.renderOrder = -1;
  scene.add(shadow);

  // ── neural layer ──────────────────────────────────────────────────────────
  const glowMaterials: THREE.ShaderMaterial[] = [];
  const pointsOf = (count: number, order: number): { geo: THREE.BufferGeometry; pos: Float32Array; col: Float32Array; size: Float32Array; alpha: Float32Array } => {
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
      uniforms: { uPixelRatio: { value: renderer.getPixelRatio() }, uNear: { value: 3.4 }, uFar: { value: 5.6 }, uPaper: { value: 1 }, uScale: { value: 4.4 } },
      vertexShader: BEAD_VERTEX,
      fragmentShader: BEAD_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    glowMaterials.push(material);
    const points = new THREE.Points(geo, material);
    points.renderOrder = order;
    points.frustumCulled = false;
    brain.add(points);
    disposables.push(geo, material);
    return { geo, pos, col, size, alpha };
  };

  const neurons = data.neurons;
  const indexOf = new Map(neurons.map((neuron, i) => [neuron.n, i]));
  const N = pointsOf(neurons.length, 4);
  const baseSize = neurons.map((neuron) => (neuron.written ? 30 : 15));
  const baseAlpha = neurons.map((neuron) => (neuron.written ? 1 : 0.6));
  neurons.forEach((neuron, i) => {
    N.pos.set(neuron.p, i * 3);
    N.size[i] = baseSize[i] ?? 15;
    N.alpha[i] = baseAlpha[i] ?? 0.6;
  });
  const C = pointsOf(data.concepts.length, 3);
  data.concepts.forEach((concept, i) => {
    C.pos.set(concept.p, i * 3);
    C.size[i] = 8;
    C.alpha[i] = 0.85;
  });

  // fibres: quadratic curves in segments, RGBA per vertex
  const fibres = data.fibres.filter((fibre) => indexOf.has(fibre.from) && indexOf.has(fibre.to));
  const curve = (i: number, t: number): [number, number, number] => {
    const fibre = fibres[i];
    const a = neurons[indexOf.get(fibre?.from ?? 0) ?? 0]?.p ?? [0, 0, 0];
    const b = neurons[indexOf.get(fibre?.to ?? 0) ?? 0]?.p ?? [0, 0, 0];
    const c = fibre?.c ?? [0, 0, 0];
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]];
  };
  const lineGeo = new THREE.BufferGeometry();
  const linePos = new Float32Array(fibres.length * SEGMENTS * 6);
  const lineCol = new Float32Array(fibres.length * SEGMENTS * 8);
  fibres.forEach((_, i) => {
    for (let s = 0; s < SEGMENTS; s += 1) linePos.set([...curve(i, s / SEGMENTS), ...curve(i, (s + 1) / SEGMENTS)], (i * SEGMENTS + s) * 6);
  });
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 4));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false });
  disposables.push(lineGeo, lineMat);
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  lines.renderOrder = 2;
  lines.frustumCulled = false;
  brain.add(lines);

  const P = pointsOf(MAX_PULSES, 5);
  const pulses: { fibre: number; reverse: boolean; start: number; dur: number }[] = [];
  const spawn = (fibre: number, reverse = false, delay = 0): void => {
    if (reduced || pulses.length >= MAX_PULSES) return;
    pulses.push({ fibre, reverse, start: performance.now() + delay, dur: 1100 + Math.random() * 700 });
    const edge = fibres[fibre];
    if (edge !== undefined) fig.dispatchEvent(new CustomEvent('hx:signal', { detail: { from: edge.from, to: edge.to }, bubbles: true }));
  };

  // ── theme: ink on paper, or light on night ────────────────────────────────
  let night = false;
  let palette: Readonly<Record<string, string>> = INK;
  const tint = (domain: string): THREE.Color => new THREE.Color(palette[domain] ?? palette['foundations'] ?? '#888888');
  const IN = new THREE.Color();
  const OUT = new THREE.Color();
  let active: number | null = null;
  let focusPart: number | null = null;
  const partOf = (n: number): number => neurons[indexOf.get(n) ?? -1]?.part ?? 0;
  const paintFibres = (): void => {
    fibres.forEach((fibre, i) => {
      let c = tint(neurons[indexOf.get(fibre.from) ?? 0]?.domain ?? '');
      let a = active === null && focusPart === null ? 0.2 : 0.035;
      if (active === null && focusPart !== null) {
        const fromIn = partOf(fibre.from) === focusPart;
        const toIn = partOf(fibre.to) === focusPart;
        if (toIn && !fromIn) {
          c = IN;
          a = 0.85;
        } else if (fromIn && !toIn) {
          c = OUT;
          a = 0.85;
        } else if (fromIn && toIn) a = 0.7;
      }
      if (active !== null && fibre.to === active) {
        c = IN;
        a = 0.95;
      }
      if (active !== null && fibre.from === active) {
        c = OUT;
        a = 0.95;
      }
      for (let v = 0; v < SEGMENTS * 2; v += 1) lineCol.set([c.r, c.g, c.b, a], (i * SEGMENTS * 2 + v) * 4);
    });
    lineGeo.getAttribute('color').needsUpdate = true;
  };
  const applyTheme = (): void => {
    night = isNight(doc);
    palette = night ? GLOW : INK;
    for (const m of [glassBack, glassFront]) {
      const u = m.uniforms as { uRim: { value: THREE.Color }; uBody: { value: THREE.Color } };
      u.uRim.value.set(night ? 0x9cc8ff : 0x23466f);
      u.uBody.value.set(night ? 0x141b26 : 0xfbf7ee);
    }
    (glassFront.uniforms as { uFill: { value: number } }).uFill.value = night ? 0.72 : 0.9;
    for (const m of glowMaterials) {
      (m.uniforms as { uPaper: { value: number } }).uPaper.value = night ? 0 : 1;
      m.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
    lineMat.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
    lineMat.needsUpdate = true;
    shadowMat.color.set(night ? 0x7fb2ff : 0x1b1814);
    shadowMat.opacity = night ? 0.14 : 0.3;
    IN.set(night ? 0x7fc0ff : 0x1f5fa8);
    OUT.set(night ? 0xff9a7a : 0xc2412b);
    neurons.forEach((neuron, i) => {
      const c = tint(neuron.domain);
      N.col.set([c.r, c.g, c.b], i * 3);
    });
    data.concepts.forEach((concept, i) => {
      const c = tint(concept.domain);
      C.col.set([c.r, c.g, c.b], i * 3);
    });
    N.geo.getAttribute('aColor').needsUpdate = true;
    C.geo.getAttribute('aColor').needsUpdate = true;
    paintFibres();
  };
  applyTheme();
  ctl.observe(new MutationObserver(applyTheme)).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── labels and tag (HTML over the canvas) ─────────────────────────────────
  const regionLabels = data.regions.map((region) => {
    const el = doc.createElement('span');
    el.className = 'hb3-region';
    el.textContent = region.label;
    labelsLayer.append(el);
    return { el, n: region.n, p: new THREE.Vector3(...region.p) };
  });
  const tag = doc.createElement('span');
  tag.className = 'hb3-tag';
  labelsLayer.append(tag);
  ctl.defer(() => {
    labelsLayer.replaceChildren();
  });

  // ── readout ───────────────────────────────────────────────────────────────
  const readout = fig.querySelector('[data-brain-readout]');
  const slots = { k: readout?.querySelector('[data-k]') ?? null, t: readout?.querySelector('[data-t]') ?? null, m: readout?.querySelector('[data-m]') ?? null };
  let idle = { k: slots.k?.textContent ?? '', t: slots.t?.textContent ?? '', m: slots.m?.textContent ?? '' };

  const activate = (n: number | null, fire: boolean): void => {
    active = n;
    paintFibres();
    const linked = new Set<number>();
    for (const fibre of fibres) {
      if (fibre.to === n) linked.add(fibre.from);
      if (fibre.from === n) linked.add(fibre.to);
    }
    const inPart = (chapter: number): boolean => focusPart === null || partOf(chapter) === focusPart;
    neurons.forEach((neuron, i) => {
      const on = neuron.n === n;
      if (n === null) {
        N.size[i] = (baseSize[i] ?? 15) * (focusPart !== null && inPart(neuron.n) ? 1.45 : 1);
        N.alpha[i] = inPart(neuron.n) ? Math.min(1, (baseAlpha[i] ?? 0.6) + 0.2) : (baseAlpha[i] ?? 0.6) * 0.32;
        return;
      }
      N.size[i] = (baseSize[i] ?? 15) * (on ? 2 : linked.has(neuron.n) ? 1.35 : 1);
      N.alpha[i] = on || linked.has(neuron.n) ? Math.min(1, (baseAlpha[i] ?? 0.6) + (on ? 0.4 : 0)) : (baseAlpha[i] ?? 0.6) * 0.45;
    });
    data.concepts.forEach((concept, i) => {
      if (n === null) {
        C.size[i] = focusPart !== null && inPart(concept.chapter) ? 10 : 8;
        C.alpha[i] = inPart(concept.chapter) ? 0.9 : 0.14;
        return;
      }
      C.size[i] = concept.chapter === n ? 13 : 8;
      C.alpha[i] = concept.chapter === n ? 1 : 0.28;
    });
    for (const attr of ['aSize', 'aAlpha'] as const) {
      N.geo.getAttribute(attr).needsUpdate = true;
      C.geo.getAttribute(attr).needsUpdate = true;
    }
    const neuron = n === null ? undefined : neurons[indexOf.get(n) ?? -1];
    if (neuron === undefined) {
      if (slots.k !== null) slots.k.textContent = idle.k;
      if (slots.t !== null) slots.t.textContent = idle.t;
      if (slots.m !== null) slots.m.textContent = idle.m;
      tag.classList.remove('is-on');
      return;
    }
    const ins = fibres.filter((fibre) => fibre.to === neuron.n).length;
    const outs = fibres.filter((fibre) => fibre.from === neuron.n).length;
    const names = data.concepts.filter((concept) => concept.chapter === neuron.n).map((concept) => concept.term);
    if (slots.k !== null) slots.k.textContent = `Chapter ${pad(neuron.n)} · ${neuron.region} · ${neuron.written ? 'written' : 'planned'}`;
    if (slots.t !== null) slots.t.textContent = neuron.title;
    if (slots.m !== null) {
      const links = `builds on ${String(ins)} · unlocks ${String(outs)}`;
      slots.m.textContent = names.length > 0 ? `${links} · ${String(names.length)} concepts: ${names.slice(0, 5).join(', ')}${names.length > 5 ? '…' : ''}` : `${links} · ${neuron.written ? 'no glossary terms owned' : 'manuscript planned'}`;
    }
    tag.textContent = `${pad(neuron.n)} · ${neuron.title.length > 40 ? `${neuron.title.slice(0, 38)}…` : neuron.title}`;
    tag.classList.add('is-on');
    if (fire) {
      fibres.forEach((fibre, i) => {
        if (fibre.to === neuron.n) spawn(i, false, Math.random() * 300);
        if (fibre.from === neuron.n) spawn(i, false, 350 + Math.random() * 300);
      });
    }
  };

  // ── the story: focus one part (region) at a time ──────────────────────────
  const regionAt = new Map(data.regions.map((region) => [region.n, region]));
  const labelOf = (part: number): string => regionAt.get(part)?.label ?? '';
  /** The regions a part draws on and the regions it feeds, strongest first. */
  const correlations = (part: number): string => {
    const tally = (pick: (fibre: (typeof fibres)[number]) => number | null): string[] => {
      const counts = new Map<number, number>();
      for (const fibre of fibres) {
        const other = pick(fibre);
        if (other !== null && other !== part) counts.set(other, (counts.get(other) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => labelOf(n));
    };
    const from = tally((fibre) => (partOf(fibre.to) === part ? partOf(fibre.from) : null));
    const to = tally((fibre) => (partOf(fibre.from) === part ? partOf(fibre.to) : null));
    return [from.length > 0 ? `draws on ${from.join(' · ')}` : '', to.length > 0 ? `feeds ${to.join(' · ')}` : ''].filter((text) => text !== '').join('   ·   ');
  };
  let targetYaw = brain.rotation.y;
  let targetPitch = brain.rotation.x;
  const focus = (part: number | null, k: string, t: string): void => {
    focusPart = part;
    const region = part === null ? undefined : regionAt.get(part);
    if (region !== undefined) {
      targetYaw = Math.atan2(-region.p[0], region.p[2]) * 0.85;
      targetPitch = 0.1 + region.p[1] * 0.35;
    }
    idle = { k, t, m: part === null ? '' : correlations(part) };
    if (active === null) activate(null, false);
    else paintFibres();
    if (part !== null) {
      fibres.forEach((fibre, i) => {
        if (partOf(fibre.to) === part && partOf(fibre.from) !== part) spawn(i, false, Math.random() * 500);
        else if (partOf(fibre.from) === part && partOf(fibre.to) !== part) spawn(i, false, 400 + Math.random() * 500);
      });
    }
  };
  fig.addEventListener('hx:chapter', (event) => {
    const n = (event as CustomEvent<number | null>).detail;
    activate(typeof n === 'number' ? n : null, typeof n === 'number');
  }, { signal });
  fig.addEventListener('hx:part', (event) => {
    const detail = (event as CustomEvent<{ part: number; k: string; t: string }>).detail;
    focus(detail.part > 0 ? detail.part : null, detail.k, detail.t);
  }, { signal });

  // ── interaction ───────────────────────────────────────────────────────────
  const baseYaw = brain.rotation.y;
  let offset = 0;
  let pitch = brain.rotation.x;
  let phase = 0;
  let velocity = 0;
  let dragging = false;
  let moved = 0;
  let last: { x: number; y: number } | null = null;
  let engagedUntil = 0;
  const screen = new THREE.Vector3();
  const world = new THREE.Vector3();
  const project = (p: readonly [number, number, number] | THREE.Vector3): { x: number; y: number; z: number } => {
    if (p instanceof THREE.Vector3) screen.copy(p);
    else screen.set(p[0], p[1], p[2]);
    brain.localToWorld(screen);
    screen.project(camera);
    const rect = canvas.getBoundingClientRect();
    return { x: (screen.x * 0.5 + 0.5) * rect.width, y: (-screen.y * 0.5 + 0.5) * rect.height, z: screen.z };
  };
  const pick = (clientX: number, clientY: number): number | null => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: number | null = null;
    let bestScore = Infinity;
    for (const neuron of neurons) {
      const s = project(neuron.p);
      const d = Math.hypot(s.x - x, s.y - y);
      const score = d + s.z * 6;
      if (d < 18 && score < bestScore) {
        bestScore = score;
        best = neuron.n;
      }
    }
    return best;
  };
  const open = (n: number | null): void => {
    const url = n === null ? undefined : neurons[indexOf.get(n) ?? -1]?.url;
    if (url !== undefined) window.location.assign(url);
  };
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = 0;
    last = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    engagedUntil = performance.now() + 4000;
  }, { signal });
  canvas.addEventListener('pointermove', (event) => {
    engagedUntil = performance.now() + 4000;
    if (dragging && last !== null) {
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      offset += dx * 0.007;
      pitch = Math.max(-0.45, Math.min(0.6, pitch + dy * 0.004));
      velocity = dx * 0.007;
      last = { x: event.clientX, y: event.clientY };
      return;
    }
    const n = pick(event.clientX, event.clientY);
    canvas.style.cursor = n === null ? 'grab' : 'pointer';
    if (n !== active && n !== null) activate(n, true);
  }, { signal });
  canvas.addEventListener('pointerup', (event) => {
    dragging = false;
    last = null;
    if (moved < 6) open(pick(event.clientX, event.clientY));
  }, { signal });
  canvas.addEventListener('pointerleave', () => {
    if (!dragging) activate(null, false);
  }, { signal });
  const order = neurons.map((neuron) => neuron.n);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      open(active);
      return;
    }
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    engagedUntil = performance.now() + 8000;
    const at = active === null ? -1 : order.indexOf(active);
    activate(order[(at + step + order.length) % order.length] ?? null, true);
  }, { signal });

  // ── frame loop (only while visible) ───────────────────────────────────────
  let visible = true;
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
  })).observe(fig);
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') kick();
  }, { signal });
  const resize = (): void => {
    const rect = host.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
    // the brain's size on screen follows the canvas height (fixed vertical
    // field of view); the beads follow it too, so they stay small beside it
    const k = Math.min(1.1, Math.max(0.3, rect.height / 560)) * 0.7;
    for (const material of glowMaterials) (material.uniforms as { uScale: { value: number } }).uScale.value = 4.4 * k;
  };
  ctl.observe(new ResizeObserver(resize)).observe(host);
  resize();

  const writtenNs = neurons.filter((neuron) => neuron.written).map((neuron) => neuron.n);
  const everyFibre = fibres.map((fibre, i) => ({ fibre, i }));
  const live = everyFibre.filter(({ fibre }) => writtenNs.includes(fibre.from) || writtenNs.includes(fibre.to));
  // emergence: neurons and concepts fly in and assemble, the glass condenses, fibres grow last
  let introStart = -1;
  let intro = reduced ? 1 : 0;
  const assemble = (k: number): void => {
    const spread = 1 + (1 - k) * 1.1;
    neurons.forEach((neuron, i) => { N.pos.set([neuron.p[0] * spread, neuron.p[1] * spread, neuron.p[2] * spread], i * 3); });
    data.concepts.forEach((concept, i) => { C.pos.set([concept.p[0] * spread, concept.p[1] * spread, concept.p[2] * spread], i * 3); });
    N.geo.getAttribute('position').needsUpdate = true;
    C.geo.getAttribute('position').needsUpdate = true;
    lineMat.opacity = k * k;
    brain.scale.setScalar(0.9 + 0.1 * k);
    labelsLayer.style.opacity = String(k);
  };
  assemble(intro);
  let aim = baseYaw;
  let aimPitch = pitch;
  let nextAmbient = 0;
  function frame(now: number): void {
    raf = 0;
    if (!visible || doc.visibilityState !== 'visible') return;
    const dt = Math.min(0.05, (now - then) / 1000);
    then = now;
    const engaged = now < engagedUntil;
    if (intro < 1) {
      if (introStart < 0) introStart = now;
      const t = Math.min(1, (now - introStart) / 1000);
      intro = 1 - (1 - t) ** 3;
      assemble(intro);
    }
    if (!dragging) {
      velocity *= 0.94;
      offset += velocity;
      // ease a dragged brain back toward the three-quarter view it rocks around
      if (!engaged) offset *= 1 - Math.min(1, dt * 0.6);
    }
    if (!reduced) phase += dt * (engaged ? 0.08 : 0.3);
    const desired = focusPart === null ? baseYaw + Math.sin(phase) * 0.5 : targetYaw + Math.sin(phase) * 0.07;
    const turn = Math.atan2(Math.sin(desired - aim), Math.cos(desired - aim));
    aim += turn * (reduced ? 1 : Math.min(1, dt * 2.2));
    aimPitch += ((focusPart === null ? pitch : targetPitch) - aimPitch) * (reduced ? 1 : Math.min(1, dt * 2.2));
    brain.rotation.y = aim + offset;
    brain.rotation.x = aimPitch + (reduced ? 0 : Math.sin(now / 2600) * 0.025);
    setGlass(cortexAt < 0 ? 0 : reduced ? 1 : Math.min(1, (now - cortexAt) / 450));

    if (!reduced && now > nextAmbient && live.length > 0) {
      const focused = focusPart === null ? [] : everyFibre.filter(({ fibre }) => partOf(fibre.from) === focusPart || partOf(fibre.to) === focusPart);
      const pool = focused.length > 0 && Math.random() < 0.75 ? focused : live;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      if (chosen !== undefined) spawn(chosen.i, Math.random() < 0.2);
      nextAmbient = now + 260;
    }

    for (let i = 0; i < MAX_PULSES; i += 1) {
      const pulse = pulses[i];
      const t = pulse === undefined ? -1 : (now - pulse.start) / pulse.dur;
      if (pulse === undefined || t < 0) {
        P.alpha[i] = 0;
        continue;
      }
      const fibre = fibres[pulse.fibre];
      P.pos.set(curve(pulse.fibre, pulse.reverse ? 1 - Math.min(1, t) : Math.min(1, t)), i * 3);
      const c = tint(neurons[indexOf.get(pulse.reverse ? (fibre?.to ?? 0) : (fibre?.from ?? 0)) ?? 0]?.domain ?? '');
      P.col.set([c.r, c.g, c.b], i * 3);
      P.size[i] = 22;
      P.alpha[i] = Math.min(1, t * 5, (1 - t) * 5);
    }
    for (let i = pulses.length - 1; i >= 0; i -= 1) if ((now - (pulses[i]?.start ?? 0)) / (pulses[i]?.dur ?? 1) >= 1) pulses.splice(i, 1);
    for (const attr of ['position', 'aColor', 'aSize', 'aAlpha'] as const) P.geo.getAttribute(attr).needsUpdate = true;

    const centre = camera.position.distanceTo(brain.position);
    for (const label of regionLabels) {
      const s = project(label.p);
      world.copy(label.p);
      brain.localToWorld(world);
      const nearer = centre - camera.position.distanceTo(world);
      label.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -50%)`;
      const depth = Math.max(0, Math.min(0.9, 0.2 + nearer * 2.4));
      const on = focusPart !== null && label.n === focusPart;
      label.el.classList.toggle('is-on', on);
      label.el.style.opacity = String(on ? 1 : focusPart === null ? depth : depth * 0.35);
    }
    const current = active === null ? undefined : neurons[indexOf.get(active) ?? -1];
    if (current !== undefined) {
      const s = project(current.p);
      const width = tag.offsetWidth;
      const room = canvas.clientWidth;
      const x = s.x + 14 + width > room - 4 ? s.x - 14 - width : s.x + 14;
      tag.style.transform = `translate(${Math.max(0, x).toFixed(1)}px, ${(s.y - 24).toFixed(1)}px)`;
    }

    renderer.render(scene, camera);
    kick();
  }
  kick();

  ctl.defer(() => {
    cancelAnimationFrame(raf);
    for (const item of disposables) item.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    fig.classList.remove('is-3d');
  });
  return true;
}
