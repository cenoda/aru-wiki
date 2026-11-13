// The 3D chart's many stars and lines drawn in a few draw calls instead of one per object, so the
// chart stays smooth on phones at ~1,400 stars (src/WikiGraph3D.tsx).
// - StarField: every star but the centre one as camera-facing quads in one instanced mesh. Looks like
//   the sprites it replaces: same textures, size in chart units, fog, per-star brightness.
// - Strands: many lines merged into one fat-line mesh (three's LineSegments2). Each line keeps its own
//   colour, brightness, width and visibility, read from a small data texture the shader looks up by
//   line number, so changing a line's look rewrites a few floats instead of the geometry. The light
//   that runs along the chart's lines is computed in the shader from a time uniform.
import {
  AdditiveBlending, Color, DataTexture, FloatType, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, NearestFilter,
  NormalBlending, PlaneGeometry, RGBAFormat, ShaderMaterial, type Texture, UniformsLib, UniformsUtils, Vector2,
} from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

// ---------- stars ----------

const STAR_VERTEX = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aCenter;
attribute float aScale;
attribute float aCell;
attribute float aOpacity;
varying vec2 vUv;
varying float vOpacity;
void main() {
  vOpacity = aOpacity;
  vUv = vec2((uv.x + aCell) / CELLS, uv.y);
  vec4 mvPosition = modelViewMatrix * vec4(aCenter, 1.0);
  mvPosition.xy += position.xy * aScale;
  // a hidden star (later version, or faded out) is moved off screen: no pixels drawn for it
  gl_Position = aOpacity > 0.0 ? projectionMatrix * mvPosition : vec4(2.0, 2.0, 2.0, 1.0);
  #include <fog_vertex>
}`;
// the same steps as three's sprite shader: texture times brightness, output colour space, then fog
const STAR_FRAGMENT = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform sampler2D map;
varying vec2 vUv;
varying float vOpacity;
void main() {
  vec4 c = texture2D(map, vUv);
  gl_FragColor = vec4(c.rgb, c.a * vOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/**
 * Stars as instanced quads. `cells` star pictures sit side by side in one atlas texture; each star
 * picks one. Sizes are the quad's side in chart units (like a sprite's scale).
 */
export class StarField {
  readonly mesh: Mesh<InstancedBufferGeometry, ShaderMaterial>;
  private readonly opacity: InstancedBufferAttribute;
  private dirty = false;

  constructor(centers: Float32Array, sizes: Float32Array, cells: Float32Array, cellCount: number, atlas: Texture, additive: boolean) {
    const plane = new PlaneGeometry(1, 1);
    const geo = new InstancedBufferGeometry();
    geo.index = plane.index;
    geo.setAttribute('position', plane.getAttribute('position'));
    geo.setAttribute('uv', plane.getAttribute('uv'));
    geo.setAttribute('aCenter', new InstancedBufferAttribute(centers, 3));
    geo.setAttribute('aScale', new InstancedBufferAttribute(sizes, 1));
    geo.setAttribute('aCell', new InstancedBufferAttribute(cells, 1));
    this.opacity = new InstancedBufferAttribute(new Float32Array(sizes.length), 1);
    geo.setAttribute('aOpacity', this.opacity);
    geo.instanceCount = sizes.length;
    const mat = new ShaderMaterial({
      uniforms: UniformsUtils.merge([UniformsLib.fog, { map: { value: null } }]),
      vertexShader: STAR_VERTEX, fragmentShader: STAR_FRAGMENT, defines: { CELLS: cellCount.toFixed(1) },
      transparent: true, depthWrite: false, fog: true,
    });
    mat.uniforms.map.value = atlas;
    this.mesh = new Mesh(geo, mat);
    this.mesh.frustumCulled = false; // the stars spread over the whole chart; one bounding box would not help
    this.mesh.raycast = () => {}; // stars are picked on screen (WikiGraph3D), not by ray
    this.setLook(atlas, additive);
  }

  setLook(atlas: Texture, additive: boolean) {
    const mat = this.mesh.material;
    if (mat.uniforms.map.value !== atlas) (mat.uniforms.map.value as Texture | null)?.dispose();
    mat.uniforms.map.value = atlas;
    mat.blending = additive ? AdditiveBlending : NormalBlending;
    mat.needsUpdate = true;
  }

  setOpacity(i: number, v: number) {
    const a = this.opacity.array as Float32Array;
    if (a[i] !== v) { a[i] = v; this.dirty = true; }
  }

  /** upload changed brightness (once per frame at most) */
  flush() {
    if (this.dirty) { this.opacity.needsUpdate = true; this.dirty = false; }
  }

  dispose() {
    (this.mesh.material.uniforms.map.value as Texture | null)?.dispose();
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
  }
}

// ---------- lines ----------

/** texels per row of the line data texture (two texels per line) */
const TEX_W = 1024;

/**
 * three's fat-line shader, changed so each line reads its look from the data texture:
 * texel 2i: colour (rgb) and brightness (a); texel 2i+1: width in px, glint phase.
 * Story lines (default): colour × a brightness that is higher at both ends and has a slow glint of
 * light running along the line. Tails (TAIL): the colour fades into the sky toward the line's far end.
 * `instanceInfo` per segment: line number, and where the segment starts and ends along its line (0..1).
 */
function strandShader(shader: { vertexShader: string; fragmentShader: string; uniforms: Record<string, { value: unknown }> }, uniforms: Record<string, { value: unknown }>) {
  Object.assign(shader.uniforms, uniforms);
  const must = (src: string, from: string, to: string) => {
    if (!src.includes(from)) throw new Error(`strand shader: "${from}" not found (three.js changed?)`);
    return src.replace(from, to);
  };
  let v = shader.vertexShader;
  v = `attribute vec4 instanceInfo;
uniform highp sampler2D lineData;
uniform float strandTime;
uniform vec3 skyColor;
varying float vStrandAlpha;
varying float vStrandU;
varying float vStrandHead;
${v}`;
  v = must(v, 'void main() {', `void main() {
  int li = int(instanceInfo.x + 0.5) * 2;
  vec4 look = texelFetch(lineData, ivec2(li % ${TEX_W}, li / ${TEX_W}), 0);
  vec4 shape = texelFetch(lineData, ivec2((li + 1) % ${TEX_W}, (li + 1) / ${TEX_W}), 0);
  float strandU = position.y < 0.5 ? instanceInfo.y : instanceInfo.z;
  float strandWidth = shape.x;
  vStrandAlpha = look.a;
  vStrandU = strandU;
  #ifdef TAIL
    vec3 strandColor = mix(skyColor, look.rgb, 1.0 - strandU);
  #else
    vec3 strandColor = look.rgb;
    // where the running glint is on this line now (it runs past both ends, then comes round again)
    vStrandHead = mod(strandTime * 0.09 + shape.y, 1.6) - 0.3;
  #endif
`);
  v = must(v, 'vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;', 'vColor.xyz = strandColor;');
  v = must(v, 'offset *= linewidth;', 'offset *= strandWidth;');
  // a hidden line is moved off screen: no pixels drawn for it
  v = must(v, 'gl_Position = clip;', 'gl_Position = vStrandAlpha > 0.001 ? clip : vec4(2.0, 2.0, 2.0, 1.0);');
  shader.vertexShader = v;
  let f = `varying float vStrandAlpha;\nvarying float vStrandU;\nvarying float vStrandHead;\n${shader.fragmentShader}`;
  f = must(f, 'float alpha = opacity;', 'float alpha = opacity * vStrandAlpha;');
  // story lines: brighter where the line meets its stars, softer in the middle, plus the glint
  // (per pixel, so a line drawn with few segments still has a round glint)
  f = must(f, '#include <color_fragment>', `#include <color_fragment>
  #ifndef TAIL
    float ends = 0.5 + 0.5 * pow(abs(2.0 * vStrandU - 1.0), 1.6);
    float glint = exp(-pow((vStrandU - vStrandHead) / 0.07, 2.0)) * 0.7;
    diffuseColor.rgb *= min(1.25, ends + glint);
  #endif`);
  shader.fragmentShader = f;
}

/** One line of a Strands set: its points (a polyline), width in px and glint phase. */
export interface StrandShape { points: number[]; width: number; phase?: number }

/**
 * Many polylines in one mesh. Set each line's colour and brightness with setLook(i, ...); a line
 * with brightness 0 is not drawn.
 */
export class Strands {
  readonly mesh: LineSegments2;
  readonly material: LineMaterial;
  private readonly data: Float32Array;
  private readonly texture: DataTexture;
  private dirty = false;
  private readonly uniforms: { lineData: { value: DataTexture }; strandTime: { value: number }; skyColor: { value: Color } };

  constructor(shapes: StrandShape[], resolution: Vector2, opts: { tail?: boolean; fog?: boolean }) {
    let segs = 0;
    for (const s of shapes) segs += Math.max(0, s.points.length / 3 - 1);
    const pos = new Float32Array(segs * 6);
    const info = new Float32Array(segs * 4);
    let k = 0;
    shapes.forEach((s, i) => {
      const n = s.points.length / 3 - 1;
      for (let j = 0; j < n; j++, k++) {
        for (let c = 0; c < 6; c++) pos[k * 6 + c] = s.points[j * 3 + c];
        info[k * 4] = i; info[k * 4 + 1] = j / n; info[k * 4 + 2] = (j + 1) / n;
      }
    });
    const geo = new LineSegmentsGeometry();
    // only the body of each segment, no round end caps: the lines are one or two pixels wide, where
    // caps do not show, and they were two thirds of the triangles
    geo.setIndex([2, 4, 3, 4, 5, 3]);
    geo.setPositions(pos);
    geo.setAttribute('instanceInfo', new InstancedBufferAttribute(info, 4));
    const rows = Math.max(1, Math.ceil((shapes.length * 2) / TEX_W));
    this.data = new Float32Array(TEX_W * rows * 4);
    shapes.forEach((s, i) => { this.data[(i * 2 + 1) * 4] = s.width; this.data[(i * 2 + 1) * 4 + 1] = s.phase ?? 0; });
    this.texture = new DataTexture(this.data, TEX_W, rows, RGBAFormat, FloatType);
    this.texture.magFilter = this.texture.minFilter = NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.needsUpdate = true;
    this.uniforms = { lineData: { value: this.texture }, strandTime: { value: 0 }, skyColor: { value: new Color() } };
    const mat = new LineMaterial({ color: 0xffffff, vertexColors: true, linewidth: 1, transparent: true, depthWrite: false });
    mat.fog = !!opts.fog;
    if (opts.tail) mat.defines.TAIL = '';
    mat.resolution.copy(resolution);
    mat.onBeforeCompile = (shader) => strandShader(shader, this.uniforms);
    this.material = mat;
    this.mesh = new LineSegments2(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.raycast = () => {}; // lines are not clickable
  }

  /** a line's colour and brightness (0 hides it) */
  setLook(i: number, color: Color, alpha: number) {
    const d = this.data, o = i * 8;
    if (d[o] === color.r && d[o + 1] === color.g && d[o + 2] === color.b && d[o + 3] === alpha) return;
    d[o] = color.r; d[o + 1] = color.g; d[o + 2] = color.b; d[o + 3] = alpha;
    this.dirty = true;
  }

  /** the sky colour tails fade into */
  setSky(c: Color | string) { this.uniforms.skyColor.value.set(c); }

  /** time in seconds for the running glint */
  setTime(t: number) { this.uniforms.strandTime.value = t; }

  setResolution(r: Vector2) { this.material.resolution.copy(r); }

  /** upload changed looks (once per frame at most) */
  flush() {
    if (this.dirty) { this.texture.needsUpdate = true; this.dirty = false; }
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
