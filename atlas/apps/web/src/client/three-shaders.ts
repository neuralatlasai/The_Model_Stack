/**
 * Shaders for the home page's 3D brain (brain3d.ts):
 *
 *   cortex  Wrapped key/fill shading on an opaque ivory or slate form.
 *           uDark retains a deeper shadow range at night. The region of the
 *           part in view is tinted gently (uFocus, uFocusK, uGlow).
 *   bead    points as lit glass beads on paper (sphere shading + highlight
 *           inside a faint halo), with coloured, non-additive cores at night.
 * Both custom shaders convert linear working colours to the renderer's
 * output colour space, as Three's built-in line material already does.
 */
export const GLASS_VERTEX = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vP = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const GLASS_FRAGMENT = /* glsl */ `
  uniform vec3 uRim;
  uniform vec3 uBody;
  uniform vec3 uLight;
  uniform float uOpacity;
  uniform float uFill;
  uniform float uPorcelain;
  uniform float uDark;
  uniform float uCrease;
  uniform vec3 uFocus;
  uniform float uFocusK;
  uniform vec3 uGlow;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(vV);
    float facing = abs(dot(n, v));
    float fres = pow(1.0 - facing, 2.4);
    vec3 l = normalize(uLight);
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 42.0);
    float diff = max(dot(n, l), 0.0);
    // uFill > 0 gives the glass a solid, softly lit body (a form on a halftone field)
    vec3 body = uBody * mix(1.0, 0.86 + 0.18 * diff, uFill);
    vec3 col = mix(body, uRim, clamp(fres * 1.15, 0.0, 1.0)) + vec3(spec) * 0.6;
    float a = (0.03 + fres * 0.78 + spec * 0.45 + diff * 0.025) * uOpacity;
    a = max(a, uFill * uOpacity);
    // porcelain (paper theme): an opaque, sculpted ivory form — wrapped key
    // light, soft fill, sky/ground ambient, creases darkened where the normal
    // turns fastest on screen, a warm translucent edge instead of an ink rim
    if (uPorcelain > 0.5) {
      float wrap = clamp((dot(n, l) + 0.24) / 1.24, 0.0, 1.0);
      float fill = max(dot(n, normalize(vec3(0.75, 0.15, 0.55))), 0.0);
      float sky = 0.5 + 0.5 * n.y;
      float crease = clamp(length(fwidth(n)) * uCrease, 0.0, 1.0);
      vec3 shadow = mix(vec3(0.51, 0.49, 0.45), vec3(0.29, 0.34, 0.37), uDark);
      vec3 shade = mix(shadow, vec3(1.0, 0.995, 0.975), wrap);
      shade += vec3(0.04, 0.038, 0.034) * fill + vec3(0.03) * sky;
      shade *= 1.0 - mix(0.28, 0.30, uDark) * crease;
      shade *= 1.0 - 0.12 * fres;
      shade += vec3(0.055, 0.055, 0.035) * fres;
      float sheen = pow(max(dot(reflect(-l, n), v), 0.0), 28.0) * mix(0.07, 0.05, uDark);
      col = uBody * shade + vec3(sheen);
      // Grazing light defines the warm charcoal silhouette at night while
      // leaving the neural atlas as the focal layer.
      vec3 nightBody = uBody * (0.28 + 0.65 * wrap + 0.16 * fill) * (1.0 - 0.30 * crease);
      vec3 edgeLight = uRim * pow(1.0 - facing, 3.8) * (0.22 + 0.20 * sky);
      col = mix(col, nightBody + edgeLight + vec3(sheen * 0.25), uDark);
      a = uOpacity;
    }
    // the part in view: its region glows softly in the part's colour
    float fd = length(vP - uFocus);
    float glow = uFocusK * exp(-fd * fd / 0.16);
    if (uPorcelain > 0.5) {
      col = mix(col, uGlow, glow * 0.16);
    } else {
      col += uGlow * glow * 0.165;
      a = max(a, glow * 0.3 * uOpacity);
    }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
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
    vec3 night = vColor * (0.56 + 0.44 * glow + core * 0.18);
    float aNight = (glow * 0.45 + core * 0.5) * vAlpha;
    float r = d / 0.3;
    float bead = 1.0 - smoothstep(0.92, 1.0, r);
    float nz = sqrt(max(0.0, 1.0 - r * r));
    float spec = smoothstep(0.16, 0.0, length(gl_PointCoord - vec2(0.4, 0.38)));
    vec3 paper = mix(vColor * (0.45 + 0.6 * nz) + vec3(spec) * 0.75, vColor, 1.0 - bead);
    float aPaper = max(bead, (1.0 - smoothstep(0.3, 0.5, d)) * 0.16) * vAlpha;
    gl_FragColor = vec4(mix(night, paper, uPaper), mix(aNight, aPaper, uPaper));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** True when the page is in the dark theme (explicit choice, else the system preference). */
export function isNight(doc: Document): boolean {
  const theme = doc.documentElement.dataset['theme'];
  return theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}
