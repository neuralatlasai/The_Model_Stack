/**
 * Shaders shared by the home page's 3D objects (brain3d.ts, globe3d.ts):
 *
 *   glass   Fresnel glass — nearly clear where the surface faces the viewer,
 *           dense at grazing angles, with a specular glint; drawn back faces
 *           first (faint), then front faces
 *   bead    points as lit glass beads on paper (sphere shading + highlight
 *           inside a faint halo) or as additive glows at night (uPaper 0)
 */
export const GLASS_VERTEX = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const GLASS_FRAGMENT = /* glsl */ `
  uniform vec3 uRim;
  uniform vec3 uBody;
  uniform vec3 uLight;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vV);
    float facing = abs(dot(n, v));
    float fres = pow(1.0 - facing, 2.4);
    vec3 l = normalize(uLight);
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 42.0);
    float diff = max(dot(n, l), 0.0);
    vec3 col = mix(uBody, uRim, clamp(fres * 1.15, 0.0, 1.0)) + vec3(spec) * 0.6;
    float a = (0.03 + fres * 0.78 + spec * 0.45 + diff * 0.025) * uOpacity;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

export const BEAD_VERTEX = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  uniform float uNear;
  uniform float uFar;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = clamp((-mv.z - uNear) / (uFar - uNear), 0.0, 1.0);
    vAlpha = aAlpha * mix(1.0, 0.32, depth);
    vColor = aColor;
    gl_PointSize = aSize * uPixelRatio * (uScale / -mv.z);
  }
`;

export const BEAD_FRAGMENT = /* glsl */ `
  uniform float uPaper;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.2);
    float core = smoothstep(0.22, 0.0, d);
    vec3 night = vColor * glow + vec3(core) * 0.9;
    float aNight = (glow * 0.85 + core) * vAlpha;
    float r = d / 0.3;
    float bead = 1.0 - smoothstep(0.92, 1.0, r);
    float nz = sqrt(max(0.0, 1.0 - r * r));
    float spec = smoothstep(0.16, 0.0, length(gl_PointCoord - vec2(0.4, 0.38)));
    vec3 paper = mix(vColor * (0.45 + 0.6 * nz) + vec3(spec) * 0.75, vColor, 1.0 - bead);
    float aPaper = max(bead, (1.0 - smoothstep(0.3, 0.5, d)) * 0.16) * vAlpha;
    gl_FragColor = vec4(mix(night, paper, uPaper), mix(aNight, aPaper, uPaper));
  }
`;

/** True when the page is in the dark theme (explicit choice, else the system preference). */
export function isNight(doc: Document): boolean {
  const theme = doc.documentElement.dataset['theme'];
  return theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/** Small flat dots (the globe's land), fading with depth so the far side reads through the glass. */
export const DOT_VERTEX = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uNear;
  uniform float uFar;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = clamp((-mv.z - uNear) / (uFar - uNear), 0.0, 1.0);
    vAlpha = mix(1.0, 0.05, depth);
    gl_PointSize = uSize * uPixelRatio;
  }
`;

export const DOT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.32, 0.5, d)) * uOpacity * vAlpha);
  }
`;

/** Arc lines with per-vertex RGBA that fade where they pass behind the globe. */
export const ARC_VERTEX = /* glsl */ `
  attribute vec4 aColor;
  uniform float uCentre;
  varying vec4 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float behind = smoothstep(-0.15, 0.55, -mv.z - uCentre);
    vColor = vec4(aColor.rgb, aColor.a * mix(1.0, 0.1, behind));
  }
`;

export const ARC_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec4 vColor;
  void main() {
    gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
  }
`;
