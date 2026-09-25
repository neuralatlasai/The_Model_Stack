/**
 * Home § 04 as a 3D index galaxy: every one of the site's searchable objects
 * is a particle, in seven spiral arms by kind (the book, figures, equations,
 * algorithms and experiments, failure modes, terms, sources). When the
 * section's query changes, its real results light up, rise, and send beams
 * to the query above the core, as if the search were being run in front of
 * the reader. Slow rotation; drag to turn. Renders only while on screen;
 * disposed on page change. No WebGL: returns false (the result list stands).
 */
import * as THREE from 'three';
import { z } from 'zod';
import { GLOW, INK, prng } from '../lib/brain3d.ts';
import type { PageContext } from './page.ts';
import { BEAD_FRAGMENT, BEAD_VERTEX, isNight } from './three-shaders.ts';

const IslandSchema = z.object({
  arms: z.string(),
  labels: z.array(z.object({ label: z.string(), domain: z.string(), count: z.number() })),
  queries: z.array(z.array(z.number())),
  hits: z.array(z.array(z.object({ kind: z.string(), title: z.string(), url: z.string() }))),
});

const BEAMS = 8;

export function initGalaxy3D(ctx: PageContext, panel: HTMLElement, reduced: boolean): boolean {
  const { doc, ctl } = ctx;
  const signal = ctl.signal;
  const host = panel.querySelector<HTMLElement>('[data-galaxy-host]');
  const layer = panel.querySelector<HTMLElement>('[data-galaxy-labels]');
  const parsed = IslandSchema.safeParse(JSON.parse(panel.querySelector('[data-galaxy]')?.textContent ?? 'null'));
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
  canvas.className = 'hy-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Every searchable object in the book as a galaxy of particles; the current query lights its results.');
  host.prepend(canvas);
  panel.classList.add('is-3d');

  const disposables: { dispose(): void }[] = [renderer];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(0, 2.45, 4.35);
  camera.lookAt(0, -0.12, 0);
  const galaxy = new THREE.Group();
  scene.add(galaxy);

  // ── particles: spiral arms by kind ─────────────────────────────────────────
  const count = data.arms.length;
  const armOf = Array.from(data.arms, (ch) => Number(ch));
  const armTotals = data.labels.map((_, a) => armOf.filter((x) => x === a).length);
  const seen = armTotals.map(() => 0);
  const rand = prng(11);
  const home = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const a = armOf[i] ?? 0;
    const r = seen[a] ?? 0;
    seen[a] = r + 1;
    const t = (r + 0.5) / Math.max(1, armTotals[a] ?? 1);
    const radius = 0.22 + 1.5 * t ** 0.85;
    const angle = (a / data.labels.length) * Math.PI * 2 + t * 2.4 + (rand() - 0.5) * 0.34 * (1 - 0.45 * t);
    const spread = (rand() - 0.5) * 0.1 * (1 - 0.5 * t);
    home.set([Math.cos(angle) * radius + spread, (rand() - 0.5) * 0.09 * (1.2 - t), Math.sin(angle) * radius + spread], i * 3);
  }

  const beadMaterial = (): THREE.ShaderMaterial => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: renderer.getPixelRatio() }, uNear: { value: 2.6 }, uFar: { value: 5.4 }, uPaper: { value: 1 }, uScale: { value: 3.9 } },
      vertexShader: BEAD_VERTEX,
      fragmentShader: BEAD_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    disposables.push(m);
    return m;
  };
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(home);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const pointsMat = beadMaterial();
  const points = new THREE.Points(geo, pointsMat);
  points.frustumCulled = false;
  galaxy.add(points);
  disposables.push(geo);

  // the query: a bright node above the core, beams down to the results
  const QUERY = new THREE.Vector3(0, 0.78, 0);
  const qGeo = new THREE.BufferGeometry();
  qGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([QUERY.x, QUERY.y, QUERY.z, 0, 0, 0]), 3));
  qGeo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(6), 3));
  qGeo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array([34, 40]), 1));
  qGeo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array([1, 0.9]), 1));
  const qMat = beadMaterial();
  const qPoints = new THREE.Points(qGeo, qMat);
  qPoints.frustumCulled = false;
  qPoints.renderOrder = 3;
  scene.add(qPoints);
  disposables.push(qGeo);

  const beamGeo = new THREE.BufferGeometry();
  const beamPos = new Float32Array(BEAMS * 6);
  beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPos, 3));
  const beamMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0, depthTest: false });
  disposables.push(beamGeo, beamMat);
  const beams = new THREE.LineSegments(beamGeo, beamMat);
  beams.frustumCulled = false;
  beams.renderOrder = 2;
  scene.add(beams);

  // ── theme ─────────────────────────────────────────────────────────────────
  let night = false;
  const armColour: THREE.Color[] = [];
  const applyTheme = (): void => {
    night = isNight(doc);
    const palette = night ? GLOW : INK;
    armColour.length = 0;
    for (const label of data.labels) armColour.push(new THREE.Color(palette[label.domain] ?? '#888888'));
    for (let i = 0; i < count; i += 1) {
      const c = armColour[armOf[i] ?? 0] ?? new THREE.Color('#888888');
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.getAttribute('aColor').needsUpdate = true;
    const accent = new THREE.Color(night ? 0xff9a7a : 0x8b1a1a);
    const q = qGeo.getAttribute('aColor');
    q.setXYZ(0, accent.r, accent.g, accent.b);
    const core = new THREE.Color(night ? 0xfff3dc : 0x6d5c47);
    q.setXYZ(1, core.r, core.g, core.b);
    q.needsUpdate = true;
    beamMat.color.set(night ? 0xff9a7a : 0x8b1a1a);
    for (const m of [pointsMat, qMat]) {
      (m.uniforms as { uPaper: { value: number } }).uPaper.value = night ? 0 : 1;
      m.blending = night ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
  };
  applyTheme();
  ctl.observe(new MutationObserver(applyTheme)).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── arm labels ────────────────────────────────────────────────────────────
  const armLabels = data.labels.map((label, a) => {
    const el = doc.createElement('span');
    el.className = 'hy-arm';
    el.innerHTML = '';
    const name = doc.createElement('b');
    name.textContent = label.label;
    const n = doc.createElement('span');
    n.textContent = String(label.count);
    el.append(name, ' ', n);
    layer.append(el);
    const angle = (a / data.labels.length) * Math.PI * 2 + 2.4 + 0.12;
    return { el, p: new THREE.Vector3(Math.cos(angle) * 1.6, 0, Math.sin(angle) * 1.6) };
  });
  const queryEl = doc.createElement('span');
  queryEl.className = 'hy-q';
  const queryText = doc.createElement('span');
  const caret = doc.createElement('i');
  queryEl.append(queryText, caret);
  layer.append(queryEl);
  const source = panel.querySelector('[data-query]');
  let hitEls: HTMLAnchorElement[] = [];
  ctl.defer(() => {
    layer.replaceChildren();
  });

  // ── the query: its results light up, rise, and are named in place ─────────
  let active: readonly number[] = data.queries[0] ?? [];
  let changedAt = performance.now();
  const setQuery = (index: number): void => {
    active = data.queries[index] ?? [];
    changedAt = performance.now();
    for (const el of hitEls) el.remove();
    hitEls = (data.hits[index] ?? []).map((hit) => {
      const a = doc.createElement('a');
      a.className = 'hy-hit';
      a.href = hit.url;
      const kind = doc.createElement('b');
      kind.textContent = hit.kind;
      const title = doc.createElement('span');
      title.textContent = hit.title;
      a.append(kind, title);
      layer.append(a);
      return a;
    });
  };
  setQuery(0);
  panel.addEventListener('hx:query', (event) => {
    const n = (event as CustomEvent<number>).detail;
    if (typeof n === 'number') setQuery(n);
  }, { signal });

  // ── interaction and loop ──────────────────────────────────────────────────
  let yaw = 0;
  let dragging = false;
  let lastX = 0;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  }, { signal });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    yaw += (event.clientX - lastX) * 0.008;
    lastX = event.clientX;
  }, { signal });
  canvas.addEventListener('pointerup', () => {
    dragging = false;
  }, { signal });

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

  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  const project = (p: THREE.Vector3, local = true): { x: number; y: number; z: number } => {
    w.copy(p);
    if (local) galaxy.localToWorld(w);
    const z = w.z;
    w.project(camera);
    const rect = canvas.getBoundingClientRect();
    return { x: (w.x * 0.5 + 0.5) * rect.width, y: (-w.y * 0.5 + 0.5) * rect.height, z };
  };
  let introStart = -1;
  function frame(now: number): void {
    raf = 0;
    if (!visible || doc.visibilityState !== 'visible') return;
    const dt = Math.min(0.05, (now - then) / 1000);
    then = now;
    if (introStart < 0) introStart = now;
    const intro = reduced ? 1 : 1 - (1 - Math.min(1, (now - introStart) / 1100)) ** 3;
    if (!reduced && !dragging) yaw += dt * 0.07;
    galaxy.rotation.y = yaw;
    galaxy.scale.setScalar(0.6 + 0.4 * intro);

    // results rise out of the disc and swell; everything else dims
    const k = Math.min(1, (now - changedAt) / 700);
    const lit = new Set(active);
    for (let i = 0; i < count; i += 1) {
      const on = lit.has(i);
      const lift = on ? 0.22 * k : 0;
      pos[i * 3 + 1] = (home[i * 3 + 1] ?? 0) + lift;
      size[i] = on ? 12 + 16 * k : 6.5;
      alpha[i] = (on ? 1 : lit.size > 0 ? 0.55 : 0.8) * intro;
    }
    for (const attr of ['position', 'aSize', 'aAlpha'] as const) geo.getAttribute(attr).needsUpdate = true;

    // beams from the query to each result, drawn in as the results rise
    let b = 0;
    for (const i of active.slice(0, BEAMS)) {
      v.set(pos[i * 3] ?? 0, pos[i * 3 + 1] ?? 0, pos[i * 3 + 2] ?? 0);
      galaxy.localToWorld(v);
      const t = Math.min(1, k * 1.2);
      beamPos.set([QUERY.x, QUERY.y, QUERY.z, QUERY.x + (v.x - QUERY.x) * t, QUERY.y + (v.y - QUERY.y) * t, QUERY.z + (v.z - QUERY.z) * t], b * 6);
      b += 1;
    }
    for (; b < BEAMS; b += 1) beamPos.fill(0, b * 6, b * 6 + 6);
    beamGeo.getAttribute('position').needsUpdate = true;
    beamMat.opacity = active.length > 0 ? 0.7 * k * intro : 0;
    const qa = qGeo.getAttribute('aAlpha');
    qa.setX(0, intro * (0.75 + 0.25 * Math.sin(now / 260)));
    qa.setX(1, 0.9 * intro);
    qa.needsUpdate = true;

    const q = project(QUERY, false);
    queryText.textContent = source?.textContent ?? '';
    queryEl.style.transform = `translate(${q.x.toFixed(1)}px, ${(q.y - 30).toFixed(1)}px) translate(-50%, -100%)`;
    queryEl.style.opacity = String(intro);
    const placed = active.slice(0, hitEls.length).map((i, h) => {
      v.set(pos[i * 3] ?? 0, pos[i * 3 + 1] ?? 0, pos[i * 3 + 2] ?? 0);
      const s = project(v);
      return { h, x: s.x, y: s.y };
    });
    placed.sort((a, b) => a.y - b.y);
    const rect = canvas.getBoundingClientRect();
    for (let j = 1; j < placed.length; j += 1) {
      const prev = placed[j - 1];
      const cur = placed[j];
      if (prev !== undefined && cur !== undefined && cur.y - prev.y < 40) cur.y = prev.y + 40;
    }
    for (const p of placed) {
      const el = hitEls[p.h];
      if (el === undefined) continue;
      const width = el.offsetWidth;
      const right = p.x + 14 + width <= rect.width - 4 || p.x - 14 - width < 4;
      el.classList.toggle('is-left', !right);
      const left = right ? Math.min(p.x + 14, rect.width - 4 - width) : Math.max(4, p.x - 14 - width);
      el.style.transform = `translate(${left.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(0, -50%)`;
      el.style.opacity = String(Math.max(0, Math.min(1, (k - 0.35) * 2.5)) * intro);
    }
    for (const label of armLabels) {
      const s = project(label.p);
      const half = label.el.offsetWidth / 2;
      const x = Math.max(half + 4, Math.min(canvas.clientWidth - half - 4, s.x));
      label.el.style.transform = `translate(${x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -50%)`;
      label.el.style.opacity = String(Math.max(0.25, Math.min(1, 0.6 + s.z * 0.35)) * intro);
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
