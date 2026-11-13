// The whole wiki as a star chart (not the final arrangement): every page with an article is a star,
// with Teyvat at the centre. Two pages are joined when they appear in the same story units
// (scripts/build-runtime-data.mjs keeps a spanning tree plus each page's two strongest ties).
//
// Ecliptic layout: the stars spread over one plane around the centre page and only drift a little
// above or below it, so the chart reads like a map yet still has depth when turned. Height follows
// the version a page was revealed in: earlier pages sit a little below the plane, later ones above.
// Lines keep a fixed pixel width at any zoom; brightness and width follow how many stories two
// pages share, and distance fog dims what is far from the camera. The busiest pages are named in
// full, the rest faintly where there is room. Stars, names and lines ease between brightness levels.
// Night sky in the dark site theme, a pale day sky in the light one.
// The scene renders only while the reader interacts, and the version picker hides later pages.
import ForceGraph3D, { type ForceGraph3DInstance } from '3d-force-graph';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending, BackSide, BufferGeometry, Euler, Mesh, MeshBasicMaterial, RepeatWrapping, SphereGeometry, Line, LineDashedMaterial, Float32BufferAttribute, Matrix4, Points, PointsMaterial, CanvasTexture, Color, Fog, Group, NormalBlending,
  type PerspectiveCamera, Sprite, SpriteMaterial, Vector2, Vector3,
} from 'three';
import { heightOf, LAYOUT_VERSION, layoutChart, timeSpan } from './chartLayout';
import { StarField, type StrandShape, Strands } from './wiki3dGpu';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import SpriteText from 'three-spritetext';
import themeUrl from '../data/runtime/chart.json?url';
import snapshotsUrl from '../data/runtime/snapshots-khaenriah.json?url';
import pagesUrl from '../data/runtime/pages.json?url';
import { ReportBox } from './ReportBox';
import { useLinker } from './Linked';
import { Search } from './Search';
import { articleKeyFromUrl, articleUrl, isArticleUrl, isRecentKey, pathNameOf, RECENT_KEY, resolvePage } from './route';
import { Logo } from './Logo';
import { BY_SA_3, BY_SA_4, Lic, LicensePageLink, SourceCredit } from './license';
import { versions } from './data';
import {
  idOf, KIND_LABEL, nameOf, type PageLink, type PageNode, articleAt, loadPageData, type PageData, snapshotAt, type Snapshots, type Theme,
} from './lore';
import { VersionPicker } from './VersionPicker';
import { inflateChart, perfStars } from './wiki3dPerf';
import { ThemeToggle, useTheme } from './theme';
import { rich, WikiArticle } from './WikiArticle';
import './site.css';
import './focus.css';
import './wiki3d.css';

// 최근 바뀜 (`/wiki/특수:최근바뀜`) opens in the article slot; its code and list load only when it opens
const RecentChanges = lazy(() => import('./RecentChanges'));

interface Palette {
  hub: string; character: string; lore: string; line: string; lineHot: string; label: string; ecliptic: string;
  /** fog colour: the middle of the stage background */
  sky: string;
  night: boolean;
}
const NIGHT: Palette = {
  hub: '#f2a074', character: '#c4a6f5', lore: '#e3cd9c', line: '#9fb2e0', lineHot: '#f3d9a4',
  label: '#ece5d8', ecliptic: '#7f93c8', sky: '#151a37', night: true,
};
const DAY: Palette = {
  hub: '#cf5f33', character: '#7b52c7', lore: '#a07a34', line: '#56648f', lineHot: '#b8792a',
  label: '#262a36', ecliptic: '#7a87ad', sky: '#eef1f8', night: false,
};

const LABEL_FONT = '"IBM Plex Sans KR"';
/** The site font, then the system Korean fonts, so a fallback is at least one whole font. */
const LABEL_FONT_STACK = `${LABEL_FONT}, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
/** Names always shown for the theme page and this many of the busiest pages. */
const NAMED = 14;
/** Other names appear when the camera is closer than this. */
const NAME_DISTANCE = 160;

/** 0..1 by shared stories, on a log scale (2 shared ≈ 0, the theme's busiest tie = 1). */
let maxShared = 2;
const strength = (l: PageLink) => Math.log(l.shared / 2 + 1) / Math.log(maxShared / 2 + 1);

const starCanvases = new Map<string, HTMLCanvasElement>();
/**
 * A star drawn on a canvas instead of a lit sphere: a crisp round core inside a soft halo.
 * The theme page also gets four thin rays. Night stars have a white-hot centre; day stars an ink rim.
 * Canvases are shared. The centre star is a sprite with its own texture; the others share one
 * atlas of the two star kinds (src/wiki3dGpu.ts StarField).
 */
function starCanvas(color: string, night: boolean, rays: boolean) {
  const key = `${color}|${night}|${rays}`;
  let c = starCanvases.get(key);
  if (!c) {
    c = document.createElement('canvas');
    const S = 128;
    c.width = c.height = S;
    const ctx = c.getContext('2d')!;
    const m = S / 2;
    const rgb = new Color(color);
    const rgba = (a: number) => `rgba(${Math.round(rgb.r * 255)},${Math.round(rgb.g * 255)},${Math.round(rgb.b * 255)},${a})`;
    const halo = ctx.createRadialGradient(m, m, 0, m, m, m);
    halo.addColorStop(0, rgba(night ? 0.4 : 0.3));
    halo.addColorStop(0.25, rgba(night ? 0.12 : 0.1));
    halo.addColorStop(0.6, rgba(night ? 0.02 : 0.02));
    halo.addColorStop(1, rgba(0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, S, S);
    if (rays) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const g = ctx.createLinearGradient(m - dx * m, m - dy * m, m + dx * m, m + dy * m);
        g.addColorStop(0, rgba(0)); g.addColorStop(0.5, rgba(night ? 0.9 : 0.7)); g.addColorStop(1, rgba(0));
        ctx.fillStyle = g;
        ctx.fillRect(dx ? 0 : m - 1.5, dy ? 0 : m - 1.5, dx ? S : 3, dy ? S : 3);
      }
    }
    const r = S * 0.17;
    ctx.beginPath();
    ctx.arc(m, m, r, 0, Math.PI * 2);
    if (night) {
      const core = ctx.createRadialGradient(m, m, 0, m, m, r);
      core.addColorStop(0, '#ffffff'); core.addColorStop(0.45, color); core.addColorStop(1, color);
      ctx.fillStyle = core;
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(30,34,50,.55)';
      ctx.stroke();
    }
    starCanvases.set(key, c);
  }
  return c;
}
const starTexture = (color: string, night: boolean, rays: boolean) => new CanvasTexture(starCanvas(color, night, rays));
/**
 * A soft nebula cloud drawn once on a canvas: fractal value noise (wisps) inside a round falloff,
 * tinted. Pure decoration behind the chart; it carries no data.
 */
function nebulaTexture(seed: number, tint: string) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  let st = seed;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  // value noise on a few octaves
  const G = 17, grids = [0, 1, 2, 3, 4].map(() => Array.from({ length: G * G }, rnd));
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (g: number[], x: number, y: number) => {
    const xi = Math.floor(x) % (G - 1), yi = Math.floor(y) % (G - 1), xf = smooth(x - Math.floor(x)), yf = smooth(y - Math.floor(y));
    const v = (i: number, j: number) => g[(yi + j) * G + xi + i];
    return (v(0, 0) * (1 - xf) + v(1, 0) * xf) * (1 - yf) + (v(0, 1) * (1 - xf) + v(1, 1) * xf) * yf;
  };
  const img = ctx.createImageData(S, S);
  const col = new Color(tint);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let n = 0, amp = 0.5, f = 2 / S * 2;
      for (let o = 0; o < 5; o++) { n += amp * noise(grids[o], x * f * (o + 1) * 1.7, y * f * (o + 1) * 1.7); amp *= 0.5; }
      const dx = x / S - 0.5, dy = y / S - 0.5;
      const fall = Math.max(0, 1 - Math.hypot(dx, dy) * 2);
      const a = Math.max(0, n - 0.38) * 2.2 * fall * fall;
      const i = (y * S + x) * 4;
      img.data[i] = col.r * 255; img.data[i + 1] = col.g * 255; img.data[i + 2] = col.b * 255;
      img.data[i + 3] = Math.min(255, a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return new CanvasTexture(c);
}

/**
 * Background clouds: direction from the chart's centre, size, tint, noise seed. Night sky: coloured
 * nebulae (added light). Day sky: pale watercolour clouds. Most sit behind the chart as first seen
 * (-z), the rest around it so a turned chart still has some. Fixed seeds: the sky is the same each visit.
 */
type Cloud = { dir: [number, number, number]; size: number; tint: string; seed: number };
function clouds(count: number, tints: string[], seed: number, behind: number): Cloud[] {
  let st = seed;
  const rnd = () => ((st = (st * 48271) % 2147483647) / 2147483647);
  return Array.from({ length: count }, (_, i) => {
    const back = i < behind;
    const dir: [number, number, number] = back
      ? [(rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.1, -1]
      : (() => { const a = rnd() * Math.PI * 2; return [Math.cos(a), (rnd() - 0.5) * 0.8, Math.sin(a) * 0.9 + 0.2] as [number, number, number]; })();
    return { dir, size: 1300 + rnd() * 1500, tint: tints[i % tints.length], seed: 7 + i * 31 + seed };
  });
}
const NEBULAE = clouds(15, ['#6f5bd6', '#3f7fc4', '#b0549c', '#3f9fa8', '#c27a4a', '#5a6ad0', '#7a4fb8', '#d0648a'], 1, 9);
const DAY_CLOUDS = clouds(10, ['#f4c7ae', '#b9cff5', '#d9c6f2', '#f6e1a8', '#bfe3df'], 5, 6);
/**
 * The Milky Way as an equirectangular picture for a sky sphere. Built like the real one looks:
 * a bright bulge at the core and a thinner disc, ragged edges (warped), a diffuse glow around it,
 * the band itself mottled into small star clouds, broken by blotchy dark dust rifts, and sprinkled
 * with tens of thousands of faint pinpoint stars. Noise is the same size in both directions (no
 * streaks along the band) and wraps round in longitude. Drawn once in the browser; pure decoration.
 */
function milkyWayTexture() {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  let st = 4242;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  // octave o has 8·2^o cells round the sky and half as many pole to pole: square cells
  const grids = [0, 1, 2, 3, 4, 5, 6].map((o) => {
    const gx = 8 * 2 ** o, gy = gx / 2;
    return { gx, gy, v: Float32Array.from({ length: gx * (gy + 1) }, rnd) };
  });
  const sm = (t: number) => t * t * (3 - 2 * t);
  const fbm = (u: number, v: number, from: number, to: number) => {
    let n = 0, amp = 1, tot = 0;
    for (let o = from; o <= to; o++) {
      const g = grids[o], x = u * g.gx, y = v * g.gy;
      const x0 = Math.floor(x), y0 = Math.min(g.gy - 1, Math.floor(y)), fx = sm(x - x0), fy = sm(y - y0);
      const i0 = y0 * g.gx, i1 = (y0 + 1) * g.gx, a = x0 % g.gx, b = (x0 + 1) % g.gx;
      n += amp * ((g.v[i0 + a] * (1 - fx) + g.v[i0 + b] * fx) * (1 - fy) + (g.v[i1 + a] * (1 - fx) + g.v[i1 + b] * fx) * fy);
      tot += amp; amp *= 0.55;
    }
    return n / tot;
  };
  const step = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const img = ctx.createImageData(W, H);
  const edge = new Color('#cdd8ff'), mid = new Color('#f4f1ea'), bulge = new Color('#ffe2b8'), col = new Color();
  const widthAt = (lon: number) => { const core = Math.exp(-((lon / 0.75) ** 2)); return { core, w: 0.075 + 0.11 * core }; };
  for (let y = 0; y < H; y++) {
    const v = y / H, lat = (v - 0.5) * Math.PI;
    if (Math.abs(lat) > 0.75) continue;
    for (let x = 0; x < W; x++) {
      const u = x / W, lon = (u - 0.5) * Math.PI * 2;
      const { core, w } = widthAt(lon);
      const warped = lat + 0.07 * (fbm(u, v, 1, 3) - 0.5) * (1 + core);
      const disc = Math.exp(-((warped / w) ** 2));
      const glow = 0.28 * Math.exp(-((warped / (w * 2.6)) ** 2));
      const clouds = 0.5 + 0.9 * step(0.3, 0.8, fbm(u, v, 3, 6)); // small star clouds
      const rift = step(0.5, 0.66, fbm(u + 0.37, v, 2, 5)) * Math.exp(-((warped / (w * 0.75)) ** 2));
      let a = (disc * clouds + glow) * (0.3 + 0.7 * core) * (1 - 0.85 * rift);
      a = Math.min(1, a * 0.9);
      col.copy(edge).lerp(mid, disc).lerp(bulge, core * disc * 0.8);
      const i = (y * W + x) * 4;
      img.data[i] = col.r * 255; img.data[i + 1] = col.g * 255; img.data[i + 2] = col.b * 255;
      img.data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // faint pinpoint stars, crowded where the band is (the brighter stars are the Points layers)
  for (let k = 0; k < 14000; k++) {
    const u = rnd(), lon = (u - 0.5) * Math.PI * 2;
    const { core, w } = widthAt(lon);
    if (rnd() > 0.35 + 0.65 * core) continue;
    const g = Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    const lat = g * w * 0.8;
    const y = (lat / Math.PI + 0.5) * H, x = u * W;
    const b = rnd();
    ctx.fillStyle = `rgba(255,${240 + Math.round(15 * b)},${225 + Math.round(30 * b)},${(0.1 + 0.3 * b * b).toFixed(2)})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
/** a small round dot with a soft edge, so background stars are round, not square */
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}
/** star colours by how common they look: blue-white, white, pale yellow, orange, red */
const STAR_TINTS: [string, number][] = [['#cfe0ff', 0.3], ['#ffffff', 0.3], ['#fff1c8', 0.2], ['#ffc78f', 0.12], ['#ff9a7a', 0.08]];
/**
 * The Milky Way's frame: its band lies in the local xz plane with its core along local +x (where the
 * sphere's picture has its middle). Placed so the core sits behind the chart as first seen (-z) and
 * the band crosses the view diagonally.
 */
const GALAXY = (() => {
  const core = new Vector3(0, 0.1, -1).normalize();
  const up = new Vector3(0.7, 0.7, 0.07).normalize(); // the band's normal, at right angles to the core direction
  up.sub(core.clone().multiplyScalar(up.dot(core))).normalize();
  return new Euler().setFromRotationMatrix(new Matrix4().makeBasis(core, up, core.clone().cross(up)));
})();

const starColour = (n: PageNode, sky: Palette) => (n.hub ? sky.hub : sky[n.kind]);
/** Names are smaller on portrait screens (their size is relative to the view height). */
const labelScale = (el: HTMLElement) => Math.min(1, (el.clientWidth / Math.max(1, el.clientHeight)) * 1.3);

/** Each star, name and line eases toward a target brightness (and colour, for lines). */
interface StarParts {
  node: PageNode;
  /** the star's place in the StarField, or -1 for the centre star (a sprite of its own) */
  idx: number;
  /** star radius and picture size in chart units */
  r: number; size: number;
  /** star brightness now and wanted */
  star: number; starTarget: number;
  /** the name, made when first shown; its brightness now and wanted */
  label: SpriteText | null; labelOpacity: number; target: number;
  named: boolean;
  /** label height before the screen-shape factor */
  baseHeight: number;
  /** the name's width over its height */
  aspect: number;
  /** where the name was placed on screen at the last relabel (px), for picking */
  box: [number, number, number, number] | null;
}
interface LineParts {
  /** the line's number in the merged Strands mesh */
  idx: number;
  opacity: number; target: number;
  /** wanted and current colour */
  color: Color; cur: Color;
  /** false while the chosen version hides the line */
  visible: boolean;
}
/** chart.json with the layout the data build made ahead of time (scripts/build-runtime-data.mjs) */
type Chart = Theme & { layout?: { version?: number; lastOrder: number; portrait: number[]; landscape: number[] } };

/** What the current version, selection and theme ask of each star and line. */
interface Look {
  inFocus: (id: string) => boolean;
  /** pages the picked star mentions or is mentioned by (dotted lines) */
  refd: (id: string) => boolean;
  selected: string | null;
  focused: boolean;
  sky: Palette;
}
/**
 * How much a line may show while nothing is picked (0..1): lines outside the chart's spanning tree
 * and lines that run far up the time axis stay faint, so the resting chart is a few clear
 * constellations instead of a web. A picked star brings its own lines back in full.
 */
const calm = new WeakMap<PageLink, number>();
const starTargetOf = (id: string, look: Look) => (look.inFocus(id) ? 1 : look.refd(id) ? 0.55 : 0.2);
function lineLook(l: PageLink, look: Look, out: LineParts) {
  const s = idOf(l.source), t = idOf(l.target), w = strength(l);
  const touching = s === look.selected || t === look.selected;
  out.color.set(touching ? look.sky.lineHot : look.sky.line);
  out.target = !look.focused ? (0.15 + 0.55 * w) * (calm.get(l) ?? 1)
    : touching ? 0.55 + 0.45 * w
      : look.inFocus(s) && look.inFocus(t) ? 0.12 + 0.4 * w : 0.04;
}

type P3 = { x: number; y: number; z: number };
/**
 * Lines without corners: every star gets one direction (the main axis of the directions to its
 * neighbours), and every line leaves and enters a star along that direction. So two lines meeting at
 * a star always continue into each other smoothly, and lines leaving on the same side merge like
 * strands. Each line is a cubic curve whose handles follow the two stars' directions.
 */
const CURVE_STEPS = 24;
function axisOf(at: P3, others: P3[]): Vector3 {
  // principal axis of the unit directions (sign-free: d and -d count alike), by power iteration
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const o of others) {
    const d = new Vector3(o.x - at.x, o.y - at.y, o.z - at.z);
    if (d.lengthSq() < 1e-6) continue;
    d.normalize();
    const v = [d.x, d.y, d.z];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m[i * 3 + j] += v[i] * v[j];
  }
  let x = new Vector3(1, 0.3, 0.2).normalize();
  for (let k = 0; k < 30; k++) {
    const nx = new Vector3(m[0] * x.x + m[1] * x.y + m[2] * x.z, m[3] * x.x + m[4] * x.y + m[5] * x.z, m[6] * x.x + m[7] * x.y + m[8] * x.z);
    if (nx.lengthSq() < 1e-12) break;
    x = nx.normalize();
  }
  return x;
}
/** segments for a line of this length: about one per 7 chart units, 6 to CURVE_STEPS */
const stepsFor = (a: P3, b: P3) => Math.min(CURVE_STEPS, Math.max(6, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / 7)));
function smoothCurve(a: P3, b: P3, ta: Vector3 | undefined, tb: Vector3 | undefined, steps = CURVE_STEPS) {
  const d = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
  const len = d.length() || 1;
  const handle = (t: Vector3 | undefined) => {
    if (!t) return d.clone().multiplyScalar(1 / 3);
    const s = t.dot(d) >= 0 ? 1 : -1;
    return t.clone().multiplyScalar(s * len * 0.38);
  };
  const ha = handle(ta), hb = handle(tb);
  const c1 = { x: a.x + ha.x, y: a.y + ha.y, z: a.z + ha.z };
  const c2 = { x: b.x - hb.x, y: b.y - hb.y, z: b.z - hb.z };
  const out: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
    out.push(w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x, w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y, w0 * a.z + w1 * c1.z + w2 * c2.z + w3 * b.z);
  }
  return out;
}

/** The address of the chart (`null`), or of an article page by its address name, at a version. */
const urlFor = (name: string | null, order: number) => articleUrl(name, versions[order]?.id ?? '');
/** Whether this browser can draw WebGL at all; without it the chart is replaced by a notice. */
const canDraw3D = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch { return false; }
};
const versionFromUrl = () => {
  const v = new URLSearchParams(location.search).get('v');
  const hit = v ? versions.find((x) => x.id === v) : undefined;
  return hit ? hit.order : null;
};

export default function WikiGraph3D() {
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraph3DInstance<PageNode, PageLink> | null>(null);
  const wake = useRef<() => void>(() => {});
  const stars = useRef(new Map<string, StarParts>());
  const lines = useRef(new Map<PageLink, LineParts>());
  const relabel = useRef<() => void>(() => {});
  /** Run relabel once on the next frame (after three-forcegraph has created new objects). */
  const relabelSoon = useRef<() => void>(() => {});
  /** Ease every star, name and line toward its target, rendering until they arrive. */
  const fade = useRef<() => void>(() => {});
  /** Recolour the scene for a new sky without rebuilding it. */
  const applySky = useRef<(sky: Palette) => void>(() => {});
  /** Move the glowing "present" floor to a version's height. */
  const placeNow = useRef<(order: number) => void>(() => {});
  /** Show the dotted lines of lone pages for the chosen version. */
  const showTethers = useRef<() => void>(() => {});
  /** Show the dotted reference lines of the picked star. */
  const showRefs = useRef<() => void>(() => {});
  /** Recolour, dim and show the tails of one-sided stars. */
  const paintTails = useRef<() => void>(() => {});
  /** Show the stars and lines of the chosen version. */
  const applyShown = useRef<() => void>(() => {});
  /** Make a star's name (names are made when first shown). */
  const makeLabel = useRef<(s: StarParts) => SpriteText | null>(() => null);
  /** the laid-out stars (with x, y, z) once the scene is built */
  const laid = useRef<PageNode[]>([]);
  // The card sits in the fixed page, so its height limit has to leave out the header; on phones the header wraps
  // to several lines and the card's top (with "자세히 보기") used to slide under it with nothing left to scroll.
  const headBox = useRef<HTMLDivElement>(null);
  const [headH, setHeadH] = useState(0);
  useEffect(() => {
    const el = headBox.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [failed, setFailed] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshots | null>(null);
  /** pages outside the theme that have an article (whole-wiki run): searched, linked and opened, not drawn */
  const [extra, setExtra] = useState<PageNode[]>([]);
  const allNodes = useMemo(() => (theme ? [...theme.nodes, ...extra.filter((n) => !theme.nodes.some((t) => t.id === n.id))] : []), [theme, extra]);
  const allById = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);
  const [vIdx, setVIdx] = useState(() => versionFromUrl() ?? versions.length - 1);
  const [selected, setSelected] = useState<string | null>(null);
  /** the article open over the chart as the address names it (`/wiki/<name>`, old `?page=`), or null for the chart */
  const [article, setArticle] = useState<string | null>(articleKeyFromUrl);
  /** the page id of that article once the theme is loaded (an unknown name stays as written) */
  const page = useMemo(() => (article && theme ? resolvePage(article, allNodes) ?? article : article), [article, theme, allNodes]);
  const pageNow = useRef(page);
  pageNow.current = page;
  /** a page's address: by its Korean name when it has one */
  const nameFor = (id: string) => pathNameOf(id, allById); // called after render

  // ---------- article pages: the address follows the open page and the version ----------
  // Opening a page pushes a history entry, so the browser's back button returns to the chart (or the
  // previous page) with the chart still in place. Version changes replace the current entry.
  const vNow = useRef(vIdx);
  vNow.current = vIdx;
  /** Article pages opened in a row, and whether that row began on the chart (not from a link). */
  const trail = () => (history.state as { aruDepth?: number; fromChart?: boolean } | null) ?? {};
  const openArticle = (page: string) => {
    const t = trail();
    const depth = t.aruDepth ?? 0;
    history.pushState({ aruDepth: depth + 1, fromChart: depth > 0 ? !!t.fromChart : article === null }, '', urlFor(nameFor(page), vNow.current));
    setArticle(page);
  };
  const closeArticle = () => {
    if (page && !isRecentKey(page)) setSelected(page); // back on the chart, the page's star stays picked
    const t = trail();
    if (t.fromChart && t.aruDepth) history.go(-t.aruDepth); // return to the chart's own entry
    else { history.pushState(null, '', urlFor(null, vNow.current)); setArticle(null); } // came in by a link
  };
  useEffect(() => {
    const onPop = () => {
      const key = articleKeyFromUrl();
      setArticle((cur) => { if (cur && !key && !isRecentKey(cur)) setSelected(pageNow.current); return key; });
      const v = versionFromUrl();
      if (v !== null) setVIdx(v);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    // also turns an old `?page=` link, or a page's other name, into the short address by its Korean name
    if (new URLSearchParams(location.search).has('v') || isArticleUrl()) history.replaceState(history.state, '', urlFor(page && nameFor(page), vIdx));
  }, [vIdx, page, theme, allById]);
  const [hovered, setHovered] = useState<string | null>(null);
  const night = useTheme() === 'dark';
  const [gl] = useState(canDraw3D);
  // bumped when the browser takes the WebGL context away (iPadOS does this to a tab sent to the
  // background and often never gives it back): the 3D scene is then built again from scratch
  const [glEpoch, setGlEpoch] = useState(0);
  /** the view (camera and orbit centre) to put back after such a rebuild, so the reader keeps their place */
  const keepView = useRef<{ pos: [number, number, number]; at: [number, number, number] } | null>(null);
  const sky = night ? NIGHT : DAY;

  useEffect(() => {
    fetch(themeUrl).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(async (t: Theme) => {
      const many = perfStars(); // testing only (dev server or a VITE_PERF3D build)
      if (many) t = inflateChart(t, many);
      maxShared = Math.max(2, ...t.links.map((l) => l.shared));
      // The web font comes in unicode-range slices, fetched only for characters on the page. Names
      // drawn on a canvas do not trigger that, so a glyph whose slice is missing falls back to
      // another font (mixed letters in one word). Load the slices for every name first.
      const text = t.nodes.map(nameOf).join('');
      const fonts = Promise.all(['500', '600'].map((w) => document.fonts.load(`${w} 16px ${LABEL_FONT}`, text)));
      await Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
      setTheme(t);
    }, () => setFailed(true));
  }, []);

  useEffect(() => {
    fetch(pagesUrl).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(setExtra, () => {});
  }, []);
  // the cards' text loads beside the chart and is not needed to draw it
  useEffect(() => {
    fetch(snapshotsUrl).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(setSnapshots, () => setSnapshots({}));
  }, []);

  const index = useMemo(() => {
    if (!theme) return null;
    const byId = new Map(theme.nodes.map((n) => [n.id, n]));
    const near = new Map<string, { id: string; revealed: number }[]>();
    for (const l of theme.links) {
      const s = idOf(l.source), t = idOf(l.target);
      (near.get(s) ?? near.set(s, []).get(s)!).push({ id: t, revealed: l.revealed });
      (near.get(t) ?? near.set(t, []).get(t)!).push({ id: s, revealed: l.revealed });
    }
    // importance = how many stories a page is in, on a log scale (Paimon is in most; a log keeps the
    // pages behind her from all shrinking to specks)
    const byImportance = [...theme.nodes].sort((a, b) => Number(b.hub) - Number(a.hub) || b.units - a.units);
    const named = new Set(byImportance.slice(0, NAMED + 1).map((n) => n.id));
    const top = Math.max(1, ...theme.nodes.filter((n) => !n.hub).map((n) => n.units));
    const importance = (n: PageNode) => (n.hub ? 1 : Math.min(1, Math.log(n.units + 1) / Math.log(top + 1)) ** 2);
    // the spanning tree by shared stories: the lines that stay clear while nothing is picked
    const tree = new Set<string>();
    const root = new Map(theme.nodes.map((n) => [n.id, n.id]));
    const find = (x: string) => { while (root.get(x) !== x) x = root.get(x)!; return x; };
    for (const l of [...theme.links].sort((a, b) => b.shared - a.shared)) {
      const a = find(idOf(l.source)), b = find(idOf(l.target));
      if (a !== b) { root.set(a, b); tree.add(`${idOf(l.source)}|${idOf(l.target)}`); }
    }
    const refNear = new Map<string, Set<string>>();
    for (const [a, b] of theme.refs ?? []) {
      (refNear.get(a) ?? refNear.set(a, new Set()).get(a)!).add(b);
      (refNear.get(b) ?? refNear.set(b, new Set()).get(b)!).add(a);
    }
    return { byId, near, refNear, named, importance, tree: tree as Set<string | PageLink> };
  }, [theme]);

  const shown = useMemo(() => (id: string) => (index?.byId.get(id)?.revealed ?? Infinity) <= vIdx, [index, vIdx]);
  const shownNow = useRef(shown);
  shownNow.current = shown;
  const focus = useMemo(() => {
    if (!selected || !index) return null;
    const step = (id: string) => (index.near.get(id) ?? []).filter((e) => e.revealed <= vIdx && shown(e.id)).map((e) => e.id);
    const one = new Set(step(selected));
    const two = new Set([...one].flatMap(step).filter((id) => id !== selected && !one.has(id)));
    return { one, two };
  }, [selected, index, vIdx, shown]);
  const look = useMemo<Look>(() => ({
    inFocus: (id) => !focus || id === selected || focus.one.has(id) || focus.two.has(id),
    refd: (id) => !!selected && !!index?.refNear.get(selected)?.has(id),
    selected, focused: !!focus, sky,
  }), [focus, selected, sky, index]);
  /** The latest look and theme colours, for objects three-forcegraph creates later. */
  const lookNow = useRef(look);
  lookNow.current = look;

  useEffect(() => { if (selected && !shown(selected)) setSelected(null); }, [selected, shown]);

  // ---------- scene (built once per theme; versions, selection and sky only restyle it) ----------
  useEffect(() => {
    if (!theme || !index || !gl) return;
    const el = host.current!;
    const g = new ForceGraph3D(el, { controlType: 'orbit', rendererConfig: { antialias: true, powerPreference: 'high-performance' } }) as unknown as ForceGraph3DInstance<PageNode, PageLink>;
    graph.current = g;
    let disposed = false;
    const resolution = new Vector2(el.clientWidth, el.clientHeight);
    // touch screens (phones, tablets) draw at most 1.5 device pixels per CSS pixel: a 3x phone screen
    // has four times the pixels of 1.5x for little visible gain, and every one is shaded each frame
    const coarse = matchMedia('(pointer: coarse)').matches;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    const lastOrder = versions.length - 1;
    const portrait = el.clientWidth < el.clientHeight;
    /** the time axis: earlier versions low, later high (src/chartLayout.js) */
    const TIME_SPAN = timeSpan(theme.nodes.length, portrait);
    const heightAt = (order: number) => heightOf(order, lastOrder, TIME_SPAN);

    // The graph library is only the stage here (renderer, camera, orbit controls, render loop). The
    // stars and lines are drawn by this component in a few merged meshes (src/wiki3dGpu.ts), and the
    // layout comes from the data build (chart.json `layout`) or src/chartLayout.js.
    g.backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .enablePointerInteraction(false) // stars are picked on screen below; no ray casts every frame
      .cooldownTicks(0)
      .graphData({ nodes: [], links: [] });

    let layoutTimer: number | undefined;
    const versionRings: { order: number; line: Line2; mat: LineMaterial }[] = [];
    let nowRing: { line: Line2; mat: LineMaterial } | null = null;
    let list: PageNode[] = [];
    let linkList: PageLink[] = [];
    /** each star's direction for corner-free lines, from the layout (which stays still) */
    let axisCache: Map<string, Vector3> | null = null;
    const axes = () => {
      if (axisCache) return axisCache;
      const near = new Map<string, PageNode[]>();
      for (const l of linkList) {
        const s = l.source as PageNode, t = l.target as PageNode;
        (near.get(s.id) ?? near.set(s.id, []).get(s.id)!).push(t);
        (near.get(t.id) ?? near.set(t.id, []).get(t.id)!).push(s);
      }
      const at = new Map(list.map((n) => [n.id, n]));
      axisCache = new Map([...near].map(([id, ns]) => [id, axisOf(at.get(id) as P3, ns as P3[])]));
      return axisCache;
    };
    let field: StarField | null = null;
    let hubSprite: Sprite | null = null;
    let strands: Strands | null = null;
    let tailStrands: Strands | null = null;
    const labelGroup = new Group();
    labelGroup.matrixAutoUpdate = false; // names do not move; their matrices are set once
    g.scene().add(labelGroup);
    const tethers: { id: string; line: Line<BufferGeometry, LineDashedMaterial> }[] = [];
    let refLines: { line: Line2; mat: LineMaterial; both: boolean }[] = [];
    const refsOf = new Map<string, [string, string, number][]>();
    for (const r of theme.refs ?? []) for (const id of [r[0], r[1]]) (refsOf.get(id) ?? refsOf.set(id, []).get(id)!).push(r);
    const tails: { id: string; idx: number }[] = [];
    /** tails take the line colour, fading to the sky; dim with their star, hidden with it */
    paintTails.current = () => {
      if (!tailStrands) return;
      const look = lookNow.current;
      const line = new Color(look.sky.line);
      tailStrands.setSky(look.sky.sky);
      for (const t of tails) {
        const a = !shownNow.current(t.id) ? 0 : look.focused ? (look.inFocus(t.id) ? 0.55 : 0.05) : 0.45;
        tailStrands.setLook(t.idx, line, a);
      }
      tailStrands.flush();
      wakeUp();
    };
    // references (one page mentions the other in its prose, no shared-story line): faint dotted
    // curves, drawn only around the picked star, so they are built for it when it is picked
    showRefs.current = () => {
      for (const r of refLines) { g.scene().remove(r.line); r.line.geometry.dispose(); r.mat.dispose(); }
      refLines = [];
      const look = lookNow.current;
      if (look.selected && list.length) {
        const at = new Map(list.map((n) => [n.id, n]));
        for (const [from, to, both] of refsOf.get(look.selected) ?? []) {
          const s = at.get(from), t = at.get(to);
          if (!s || !t || !shownNow.current(from) || !shownNow.current(to)) continue;
          const geo = new LineGeometry();
          geo.setPositions(smoothCurve(s as P3, t as P3, axes().get(from), axes().get(to)));
          const mat = new LineMaterial({ color: look.sky.line, linewidth: 0.8, dashed: true, dashSize: 2.2, gapSize: 3.2,
            transparent: true, opacity: both ? 0.4 : 0.28, depthWrite: false });
          mat.resolution.copy(resolution);
          const line = new Line2(geo, mat);
          line.computeLineDistances();
          line.raycast = () => {};
          g.scene().add(line);
          refLines.push({ line, mat, both: !!both });
        }
      }
      wakeUp();
    };
    showTethers.current = () => { for (const t of tethers) t.line.visible = shownNow.current(t.id); wakeUp(); };
    /** Show the stars and lines of the chosen version, hide the rest (no fade, like before). */
    applyShown.current = () => {
      const shown = shownNow.current;
      for (const [l, p] of lines.current) {
        p.visible = l.revealed <= vNow.current && shown(idOf(l.source)) && shown(idOf(l.target));
        strands?.setLook(p.idx, p.cur, p.visible ? p.opacity : 0);
      }
      for (const s of stars.current.values()) paintStar(s);
      strands?.flush();
      field?.flush();
      wakeUp();
    };
    /** a star's brightness and its name's, as they are now */
    const paintStar = (s: StarParts) => {
      const on = shownNow.current(s.node.id);
      if (s.idx >= 0) field?.setOpacity(s.idx, on ? s.star : 0);
      else if (hubSprite) { hubSprite.visible = on; hubSprite.material.opacity = s.star; }
      if (s.label) {
        s.label.material.opacity = s.labelOpacity;
        s.label.visible = on && s.labelOpacity > 0.005;
      }
    };
    /** a page name's width over its height as three-spritetext draws it (90 px text, the padding below) */
    const measure = document.createElement('canvas').getContext('2d')!;
    const aspectOf = (text: string, weight: string) => {
      measure.font = `${weight} 90px ${LABEL_FONT_STACK}`;
      return Math.floor(measure.measureText(text).width + 27) / 144;
    };
    /** Names are made when first shown (most never are on a small screen): each is a canvas texture. */
    makeLabel.current = (s: StarParts) => {
      if (s.label || disposed) return s.label;
      const n = s.node;
      // made empty, then filled: each property set redraws the canvas, and an empty one is cheap
      const label = new SpriteText('', s.baseHeight * labelScale(el), lookNow.current.sky.label);
      label.fontFace = LABEL_FONT_STACK;
      label.fontWeight = n.hub ? '600' : '500'; // index.html loads 400–600
      // Hangul reaches past the font-size box; without room the tops and bottoms are cut off
      label.padding = [label.textHeight * 0.15, label.textHeight * 0.3];
      label.text = nameOf(n);
      label.material.depthWrite = false;
      // names keep one size on screen at any zoom (sizeAttenuation off): readable far away,
      // never huge up close, and zooming in only spreads them apart
      label.material.sizeAttenuation = false;
      label.material.fog = false; // names keep their own brightness levels
      label.material.opacity = s.labelOpacity;
      label.center.set(0.5, -0.1); // sit just above the star
      label.position.set(n.x ?? 0, (n.y ?? 0) + s.r, n.z ?? 0);
      label.renderOrder = 2; // over the stars and lines
      label.raycast = () => {};
      label.matrixAutoUpdate = false;
      label.updateMatrix();
      label.visible = false;
      labelGroup.add(label);
      s.label = label;
      return label;
    };
    const atlasFor = (sky0: Palette) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 128;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(starCanvas(sky0.character, sky0.night, false), 0, 0);
      ctx.drawImage(starCanvas(sky0.lore, sky0.night, false), 128, 0);
      return new CanvasTexture(c);
    };

    const build = () => {
      if (disposed) return;
      // ---- layout: from the data build when it matches this chart and screen shape, else here ----
      const t0 = performance.now();
      const pre = (theme as Chart).layout;
      let pos = pre && pre.version === LAYOUT_VERSION && pre.lastOrder === lastOrder ? pre[portrait ? 'portrait' : 'landscape'] : null;
      if (!pos || pos.length !== theme.nodes.length * 3) {
        pos = layoutChart(theme, lastOrder, portrait);
        performance.measure('w3d-layout', { start: t0 }); // only when the data build's layout does not fit
      }
      list = theme.nodes.map((n, i) => ({ ...n, x: pos[i * 3], y: pos[i * 3 + 1], z: pos[i * 3 + 2] }));
      const at = new Map(list.map((n) => [n.id, n]));
      linkList = theme.links.filter((l) => at.has(idOf(l.source)) && at.has(idOf(l.target)))
        .map((l) => ({ ...l, source: at.get(idOf(l.source))!, target: at.get(idOf(l.target))! }));
      laid.current = list;
      const sky0 = lookNow.current.sky;

      // ---- stars: one instanced mesh; the centre star a sprite of its own (it has rays) ----
      // size by importance, like star magnitudes: the main pages stand out, minor ones are specks
      const others = list.filter((n) => !n.hub).sort((a, b) => index.importance(a) - index.importance(b)); // big ones drawn last
      const centers = new Float32Array(others.length * 3), sizes = new Float32Array(others.length), cells = new Float32Array(others.length);
      const partsOf = (n: PageNode, idx: number) => {
        const imp = index.importance(n);
        const r = n.hub ? 4.6 : 1.1 + 3.2 * imp ** 0.8;
        const parts: StarParts = {
          node: n, idx, r, size: r * (n.hub ? 11 : 7.5), star: 0, starTarget: starTargetOf(n.id, lookNow.current),
          label: null, labelOpacity: 0, target: 0, named: index.named.has(n.id),
          baseHeight: n.hub ? 0.042 : 0.022 + 0.012 * imp, aspect: aspectOf(nameOf(n), n.hub ? '600' : '500'), box: null,
        };
        parts.star = parts.starTarget;
        stars.current.set(n.id, parts);
        return parts;
      };
      others.forEach((n, i) => {
        const p = partsOf(n, i);
        centers[i * 3] = n.x ?? 0; centers[i * 3 + 1] = n.y ?? 0; centers[i * 3 + 2] = n.z ?? 0;
        sizes[i] = p.size;
        cells[i] = n.kind === 'character' ? 0 : 1;
      });
      field = new StarField(centers, sizes, cells, 2, atlasFor(sky0), sky0.night);
      field.mesh.renderOrder = 1; // over the lines
      g.scene().add(field.mesh);
      for (const n of list) {
        if (!n.hub) continue;
        const p = partsOf(n, -1);
        const mat = new SpriteMaterial({
          map: starTexture(starColour(n, sky0), sky0.night, true),
          blending: sky0.night ? AdditiveBlending : NormalBlending, depthWrite: false, transparent: true,
        });
        hubSprite = new Sprite(mat);
        hubSprite.scale.setScalar(p.size);
        hubSprite.position.set(n.x ?? 0, n.y ?? 0, n.z ?? 0);
        hubSprite.renderOrder = 1;
        hubSprite.raycast = () => {};
        g.scene().add(hubSprite);
      }

      // ---- story lines: one merged mesh ----
      strands = new Strands(linkList.map((l, i) => ({
        points: smoothCurve(l.source as P3, l.target as P3, axes().get(idOf(l.source)), axes().get(idOf(l.target)), stepsFor(l.source as P3, l.target as P3)),
        width: 0.5 + 0.8 * strength(l), phase: (i * 0.618) % 1,
      })), resolution, { fog: true });
      g.scene().add(strands.mesh);
      // lines that climb far up the axis, or are not in the spanning tree, rest faint
      linkList.forEach((l, i) => {
        const s = l.source as PageNode, t = l.target as PageNode;
        const climb = Math.min(1, Math.abs((s.y ?? 0) - (t.y ?? 0)) / (TIME_SPAN * 0.45));
        calm.set(l, (index.tree.has(l) || index.tree.has(`${idOf(l.source)}|${idOf(l.target)}`) ? 1 : 0.35) * (1 - 0.75 * climb));
        const parts: LineParts = { idx: i, opacity: 0, target: 0, color: new Color(), cur: new Color(), visible: true };
        lineLook(l, lookNow.current, parts);
        parts.cur.copy(parts.color);
        lines.current.set(l, parts);
      });

      // Horizontal celestial rings at each major version's height in 3D space (plus one horizon ring
      // at the chosen version), so perspective matches the stars and nothing crowds the left edge.
      const radii = list.map((n) => Math.hypot(n.x ?? 0, n.z ?? 0)).sort((a, b) => a - b);
      const r90 = radii[Math.floor(radii.length * 0.9)];
      const ringR = Math.max(120, r90 * 1.08);
      const ringPos = (y: number, r: number) => {
        const segs = 96, pts: number[] = [];
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          pts.push(Math.cos(a) * r, y, Math.sin(a) * r);
        }
        return pts;
      };
      const addRing = (y: number, color: string, linewidth: number, opacity: number) => {
        const geo = new LineGeometry();
        geo.setPositions(ringPos(y, ringR));
        const mat = new LineMaterial({ color, linewidth, transparent: true, opacity, depthWrite: false });
        mat.fog = true;
        mat.resolution.copy(resolution);
        const line = new Line2(geo, mat);
        line.raycast = () => {};
        g.scene().add(line);
        return { line, mat };
      };
      for (const v of versions) {
        if (!/\.0$|^Luna I$/.test(v.id)) continue;
        const { line, mat } = addRing(heightAt(v.order), lookNow.current.sky.line, 0.75, v.order <= vNow.current ? 0.11 : 0.03);
        versionRings.push({ order: v.order, line, mat });
      }
      nowRing = addRing(0, lookNow.current.sky.night ? '#f2a074' : '#cf5f33', 1.15, lookNow.current.sky.night ? 0.34 : 0.28);
      nowRing.line.position.y = heightAt(vNow.current);
      placeNow.current = (order: number) => {
        for (const r of versionRings) r.mat.opacity = r.order <= order ? 0.11 : 0.03;
        if (nowRing) nowRing.line.position.y = heightAt(order);
        wakeUp();
      };
      // a page that shares no story with any other has no line; a faint dotted one to the centre star
      // keeps it from floating alone (it says "in this chart", not "shares stories")
      const hubPos = new Vector3();
      for (const n of list) if (n.hub) hubPos.set(n.x ?? 0, n.y ?? 0, n.z ?? 0);
      for (const n of list) {
        if (n.hub || index.near.has(n.id)) continue;
        const c = smoothCurve(hubPos, { x: n.x ?? 0, y: n.y ?? 0, z: n.z ?? 0 }, axes().get(theme.page), undefined);
        const geo = new BufferGeometry().setFromPoints(Array.from({ length: c.length / 3 }, (_, i) => new Vector3(c[i * 3], c[i * 3 + 1], c[i * 3 + 2])));
        const loose = new Line(geo, new LineDashedMaterial({ color: lookNow.current.sky.line, dashSize: 3, gapSize: 4, transparent: true, opacity: 0.35, depthWrite: false }));
        loose.computeLineDistances();
        loose.raycast = () => {};
        g.scene().add(loose);
        tethers.push({ id: n.id, line: loose });
      }
      showTethers.current();
      showRefs.current();
      // A star whose lines all leave on one side would end them in a point, like a brush tip: give it
      // a short tail on the empty side, along its direction, fading into the sky, so the strand seems
      // to pass through the star. All tails are one merged mesh.
      const tailNear = new Map<string, PageNode[]>();
      for (const l of linkList) {
        const s = l.source as PageNode, t = l.target as PageNode;
        (tailNear.get(s.id) ?? tailNear.set(s.id, []).get(s.id)!).push(t);
        (tailNear.get(t.id) ?? tailNear.set(t.id, []).get(t.id)!).push(s);
      }
      const tailShapes: StrandShape[] = [];
      for (const [id, ns] of tailNear) {
        const n = at.get(id), axis = axes().get(id);
        if (!n || !axis) continue;
        let plus = 0, minus = 0, dist = 0;
        for (const o of ns) {
          const d = new Vector3((o.x ?? 0) - (n.x ?? 0), (o.y ?? 0) - (n.y ?? 0), (o.z ?? 0) - (n.z ?? 0));
          dist += d.length();
          if (d.dot(axis) >= 0) plus++; else minus++;
        }
        if (plus && minus) continue;
        const dir = axis.clone().multiplyScalar(plus ? -1 : 1);
        const len = Math.min(34, Math.max(10, (dist / ns.length) * 0.3));
        const points: number[] = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const k = i / steps;
          points.push((n.x ?? 0) + dir.x * len * k, (n.y ?? 0) + dir.y * len * k, (n.z ?? 0) + dir.z * len * k);
        }
        tails.push({ id, idx: tailShapes.length });
        tailShapes.push({ points, width: 0.7 });
      }
      if (tailShapes.length) {
        tailStrands = new Strands(tailShapes, resolution, { tail: true });
        g.scene().add(tailStrands.mesh);
      }
      paintTails.current();
      applyShown.current();
      fade.current();
      // frame what is there: move the camera until the stars (but the far few) fill the screen in both directions
      const camera = g.camera() as PerspectiveCamera;
      const tilt = ((portrait ? 12 : 20) * Math.PI) / 180;
      const linked = list.filter((n) => index.near.has(n.id));
      const ys = linked.map((n) => n.y ?? 0);
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const p = new Vector3();
      let dist = r90 * 2.5;
      // look at (0, cy, 0) so the rotation axis passes through 티바트 and the centre of the orbital rings
      const tx = 0, tz = 0;
      const place = () => {
        camera.position.set(tx, cy + Math.sin(tilt) * dist, tz + Math.cos(tilt) * dist);
        camera.lookAt(tx, cy, tz);
        camera.updateMatrixWorld();
      };
      const q = (a: number[], f: number) => a[Math.floor((a.length - 1) * f)];
      for (let i = 0; i < 16; i++) {
        place();
        const sx: number[] = [], sy: number[] = [];
        for (const n of linked) { p.set(n.x ?? 0, n.y ?? 0, n.z ?? 0).project(camera); sx.push(p.x); sy.push(p.y); }
        sx.sort((a, b) => a - b); sy.sort((a, b) => a - b);
        const cut = portrait ? 0.035 : 0.005;
        const [x0, x1, y0, y1] = [q(sx, cut), q(sx, 1 - cut), q(sy, cut), q(sy, 1 - cut)];
        dist *= Math.max(Math.abs(x0) / 0.84, Math.abs(x1) / 0.84, Math.abs(y0) / 0.82, Math.abs(y1) / 0.82);
      }
      place();
      g.cameraPosition({ x: tx, y: cy + Math.sin(tilt) * dist, z: tz + Math.cos(tilt) * dist }, { x: tx, y: cy, z: tz }, 0);
      // zoom limits: allow zooming out comfortably past the initial view (background stars start at 2800),
      // and in to about a star's neighbourhood
      {
        const c = g.controls() as { minDistance: number; maxDistance: number };
        c.maxDistance = Math.min(Math.max(dist * 3.0, 2000), 2600);
        c.minDistance = Math.max(60, dist * 0.3);
      }
      // on first view the chart turns slowly into place once (about 40 degrees, easing out), then rests;
      // any touch stops it, and readers who ask for less motion get the still view
      const back = keepView.current;
      keepView.current = null;
      if (back) {
        // rebuilt after the tab came back from the background: the reader's own view, no opening turn
        g.cameraPosition({ x: back.pos[0], y: back.pos[1], z: back.pos[2] }, { x: back.at[0], y: back.at[1], z: back.at[2] }, 0);
      } else if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const flat = Math.cos(tilt) * dist, camY = cy + Math.sin(tilt) * dist;
        const swing = (40 * Math.PI) / 180, span = 9000;
        let t0 = 0, stopped = false;
        const stop = () => { stopped = true; };
        el.addEventListener('pointerdown', stop, { once: true });
        el.addEventListener('wheel', stop, { once: true, passive: true });
        const turn = (t: number) => {
          if (stopped || disposed) return;
          t0 ||= t;
          const k = Math.min(1, (t - t0) / span), a = -swing * (1 - k) ** 3;
          camera.position.set(tx + Math.sin(a) * flat, camY, tz + Math.cos(a) * flat);
          camera.lookAt(tx, cy, tz);
          moved();
          wakeUp();
          if (k < 1) requestAnimationFrame(turn);
        };
        camera.position.set(tx + Math.sin(-swing) * flat, camY, tz + Math.cos(-swing) * flat);
        requestAnimationFrame(turn);
      }
      moved(); // fog distances and names for the first view
      wakeUp();
      performance.measure('w3d-build', { start: t0 });
      el.dataset.ready = ''; // built (scripts/dev/perf3d.mjs waits for this)
    };
    // a moment after the start, so the page (header, search) shows first, and after the graph
    // library's first update (which sets up the camera)
    layoutTimer = window.setTimeout(build, 30);

    // distance fog toward the sky colour: far stars and lines recede (distances follow the camera)
    const fog = new Fog(lookNow.current.sky.sky, 100, 400);
    g.scene().fog = fog;
    // background stars far behind the chart (decoration, not data): three sizes, five colours, and
    // many more along the Milky Way's band. They turn with the view and give it depth.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    const tint = () => { let r = rnd(); for (const [c, w] of STAR_TINTS) { if ((r -= w) <= 0) return new Color(c); } return new Color('#ffffff'); };
    const galaxy = new Matrix4().makeRotationFromEuler(GALAXY);
    const dot = dotTexture();
    const night0 = lookNow.current.sky.night;
    const layer = (count: number, inBand: number, size: number, opacity: number) => {
      const pos: number[] = [], col: number[] = [];
      for (let i = 0; i < count; i++) {
        const R = 2800 + rnd() * 1600;
        const v = new Vector3();
        if (i < inBand) {
          const a = rnd() * Math.PI * 2, lat = gauss() * 0.12;
          v.set(Math.cos(a) * Math.cos(lat), Math.sin(lat), Math.sin(a) * Math.cos(lat)).applyMatrix4(galaxy);
        } else {
          const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, c = Math.sqrt(1 - u * u);
          v.set(Math.cos(a) * c, u, Math.sin(a) * c);
        }
        v.multiplyScalar(R);
        pos.push(v.x, v.y, v.z);
        const c = tint().multiplyScalar(0.55 + 0.45 * rnd());
        col.push(c.r, c.g, c.b);
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new Float32BufferAttribute(col, 3));
      const pts = new Points(geo, new PointsMaterial({ size, map: dot, vertexColors: true, sizeAttenuation: false, transparent: true,
        opacity, depthWrite: false, fog: false, blending: AdditiveBlending }));
      pts.raycast = () => {};
      pts.visible = night0;
      g.scene().add(pts);
      return pts;
    };
    const skyStars = [layer(2600, 1500, 2.2, 0.7), layer(520, 220, 3.4, 0.85), layer(70, 20, 5.5, 1)];
    // day sky: a few faint ink specks instead
    const dayDust = layer(500, 0, 2, 0.16);
    dayDust.material.blending = NormalBlending; dayDust.material.vertexColors = false; dayDust.material.color.set('#7a87ad');
    dayDust.visible = !night0;
    // the Milky Way: a sky sphere around everything, seen from inside (made with the night sky, below)
    let milky: Mesh<SphereGeometry, MeshBasicMaterial> | null = null;
    // nebulae (night) and pale clouds (day) far behind the chart, among the background stars; faint so
    // the stars stay first. Only the current sky's set is visible.
    const cloudSprite = (nb: Cloud, day: boolean) => {
      const mat = new SpriteMaterial({ map: nebulaTexture(nb.seed, nb.tint), transparent: true, depthWrite: false, fog: false,
        blending: day ? NormalBlending : AdditiveBlending, opacity: day ? 0.9 : 0.45 });
      const sp = new Sprite(mat);
      const d = new Vector3(...nb.dir).normalize().multiplyScalar(3200 + (nb.seed % 7) * 90);
      sp.position.copy(d);
      sp.scale.setScalar(nb.size * 1.45);
      sp.renderOrder = -2;
      sp.raycast = () => {};
      g.scene().add(sp);
      return sp;
    };
    // Each sky's pictures are drawn when that sky is first shown (the Milky Way alone takes a good
    // part of a second on a phone), not both at the start.
    let nebulae: Sprite[] = [], dayClouds: Sprite[] = [];
    const skyParts = (night: boolean) => {
      if (night && !milky) {
        milky = new Mesh(new SphereGeometry(5500, 64, 32), new MeshBasicMaterial({ map: milkyWayTexture(), side: BackSide,
          transparent: true, opacity: 0.3, depthWrite: false, fog: false, blending: AdditiveBlending }));
        milky.rotation.copy(GALAXY);
        milky.renderOrder = -3;
        milky.raycast = () => {};
        g.scene().add(milky);
        nebulae = NEBULAE.map((nb) => cloudSprite(nb, false));
      }
      if (!night && !dayClouds.length) dayClouds = DAY_CLOUDS.map((nb) => cloudSprite(nb, true));
      for (const nb of nebulae) nb.visible = night;
      for (const c of dayClouds) c.visible = !night;
      if (milky) milky.visible = night;
    };
    skyParts(night0);
    // Line brightness changes along each line: brighter where it meets its stars, softer in the
    // middle, with a slow glint of light running along it (in the line shader, src/wiki3dGpu.ts). It
    // moves only while the chart is drawn (the scene sleeps when the reader stops), so a still chart
    // costs nothing.
    const flowStart = performance.now();
    g.scene().onBeforeRender = () => { strands?.setTime((performance.now() - flowStart) / 1000); };

    applySky.current = (s) => {
      fog.color.set(s.sky);
      field?.setLook(atlasFor(s), s.night);
      if (hubSprite) {
        const hub = [...stars.current.values()].find((p) => p.idx < 0)!;
        hubSprite.material.map?.dispose();
        hubSprite.material.map = starTexture(starColour(hub.node, s), s.night, true);
        hubSprite.material.blending = s.night ? AdditiveBlending : NormalBlending;
        hubSprite.material.needsUpdate = true;
      }
      for (const p of stars.current.values()) if (p.label) p.label.color = s.label;
      for (const t of tethers) t.line.material.color.set(s.line);
      for (const r of refLines) r.mat.color.set(s.line);
      for (const r of versionRings) r.mat.color.set(s.line);
      if (nowRing) {
        nowRing.mat.color.set(s.night ? '#f2a074' : '#cf5f33');
        nowRing.mat.opacity = s.night ? 0.34 : 0.28;
      }
      paintTails.current();
      skyParts(s.night);
      for (const p of skyStars) p.visible = s.night;
      dayDust.visible = !s.night;
      wakeUp();
    };

    // ---------- render only while the reader is interacting ----------
    let idle: number | undefined;
    let running = true;
    const sleep = () => { g.pauseAnimation(); running = false; };
    const wakeUp = () => {
      if (disposed) return;
      if (!running) { g.resumeAnimation(); running = true; }
      clearTimeout(idle);
      idle = window.setTimeout(sleep, 1500);
    };
    wake.current = wakeUp;
    let fading = 0, last = 0;
    const step = (t: number) => {
      const dt = last ? Math.min(64, t - last) : 16;
      last = t;
      let moving = false;
      const k = Math.min(1, dt / 90); // ~0.2 s to settle
      const ease = (from: number, target: number) => {
        const d = target - from;
        if (Math.abs(d) < 0.01) return target;
        moving = true;
        return from + d * k;
      };
      for (const s of stars.current.values()) {
        const a = s.labelOpacity, b = s.star;
        s.labelOpacity = ease(a, s.target);
        s.star = ease(b, s.starTarget);
        if (a !== s.labelOpacity || b !== s.star) paintStar(s);
      }
      for (const l of lines.current.values()) {
        const a = l.opacity;
        l.opacity = ease(a, l.target);
        const c = l.cur, tc = l.color;
        let recolour = false;
        if (!c.equals(tc)) {
          recolour = true;
          if (Math.abs(c.r - tc.r) + Math.abs(c.g - tc.g) + Math.abs(c.b - tc.b) < 0.01) c.copy(tc);
          else { c.lerp(tc, k); moving = true; }
        }
        if (strands && (recolour || a !== l.opacity)) strands.setLook(l.idx, c, l.visible ? l.opacity : 0);
      }
      field?.flush();
      strands?.flush();
      if (moving) { wakeUp(); fading = requestAnimationFrame(step); } else { fading = 0; last = 0; }
    };
    fade.current = () => { if (!fading && !disposed) { wakeUp(); fading = requestAnimationFrame(step); } };
    let relabelFrame = 0;
    relabelSoon.current = () => {
      if (!relabelFrame && !disposed) relabelFrame = requestAnimationFrame(() => { relabelFrame = 0; relabel.current(); });
    };
    const events = ['pointerdown', 'pointermove', 'wheel', 'touchstart'] as const;
    for (const ev of events) el.addEventListener(ev, wakeUp, { passive: true });

    // ---------- picking stars on screen (a tap, a click, the mouse over a star) ----------
    // A star is hit inside its square picture (halo included), like the sprites it replaced; a shown
    // name is hit inside its box. The nearest hit wins.
    const pv = new Vector3();
    const pickAt = (clientX: number, clientY: number): string | null => {
      const camera = g.camera() as PerspectiveCamera;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left, py = clientY - rect.top, H = el.clientHeight, W = el.clientWidth;
      const p11 = camera.projectionMatrix.elements[5];
      camera.updateMatrixWorld();
      let best: string | null = null, bestDepth = Infinity;
      for (const s of stars.current.values()) {
        const n = s.node;
        if (!shownNow.current(n.id)) continue;
        pv.set(n.x ?? 0, n.y ?? 0, n.z ?? 0).applyMatrix4(camera.matrixWorldInverse);
        const depth = -pv.z;
        if (depth <= camera.near || depth >= bestDepth) continue;
        pv.applyMatrix4(camera.projectionMatrix);
        const sx = (pv.x + 1) / 2 * W, sy = (1 - pv.y) / 2 * H;
        const half = (s.size / 2) * p11 * (H / 2) / depth;
        const onStar = Math.abs(px - sx) <= half && Math.abs(py - sy) <= half;
        const b = s.label?.visible ? s.box : null;
        const onName = !!b && px >= b[0] && px <= b[2] && py >= b[1] && py <= b[3];
        if (onStar || onName) { best = n.id; bestDepth = depth; }
      }
      return best;
    };
    let press: { x: number; y: number } | null = null;
    let pointers = 0;
    const onDown = (e: PointerEvent) => {
      pointers++;
      press = pointers === 1 ? { x: e.clientX, y: e.clientY } : null; // a pinch is not a tap
    };
    const onUp = (e: PointerEvent) => {
      pointers = Math.max(0, pointers - 1);
      const p = press;
      press = null;
      if (!p || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) return; // a drag turned the chart
      const id = pickAt(e.clientX, e.clientY);
      if (id) setSelected((cur) => (cur === id ? null : id));
      else setSelected(null);
    };
    const onCancel = () => { pointers = Math.max(0, pointers - 1); press = null; };
    let hoverFrame = 0, hoverAt: [number, number] | null = null, hoverId: string | null = null;
    const onHover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      hoverAt = [e.clientX, e.clientY];
      if (!hoverFrame) hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        const id = hoverAt ? pickAt(...hoverAt) : null;
        if (id === hoverId) return;
        hoverId = id;
        el.style.cursor = id ? 'pointer' : '';
        setHovered(id);
      });
    };
    const onLeave = () => { hoverAt = null; if (hoverId) { hoverId = null; el.style.cursor = ''; setHovered(null); } };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('pointermove', onHover);
    el.addEventListener('pointerleave', onLeave);

    const controls = g.controls() as { addEventListener(type: string, fn: () => void): void; removeEventListener(type: string, fn: () => void): void };
    /** the view moved: fog distances and the names follow */
    const moved = () => {
      const d = g.camera().position.length();
      fog.near = d * 0.7;
      fog.far = d * 2.3;
      relabel.current();
    };
    // inertia: a turn or pan keeps gliding a moment after the finger lifts, then slows to a stop
    // ('change' keeps firing while it glides, and onMove keeps the render loop awake till it ends)
    Object.assign(g.controls(), { enableDamping: true, dampingFactor: 0.08 });
    // the controls report every pointer move, often several per frame: follow once per frame
    let moveFrame = 0;
    const onMove = () => {
      wakeUp();
      const d = g.camera().position.length();
      fog.near = d * 0.7;
      fog.far = d * 2.3;
      if (!moveFrame && !disposed) moveFrame = requestAnimationFrame(() => { moveFrame = 0; relabel.current(); });
    };
    controls.addEventListener('change', onMove);
    let lastScale = labelScale(el);
    const ro = new ResizeObserver(() => {
      g.width(el.clientWidth).height(el.clientHeight);
      resolution.set(el.clientWidth, el.clientHeight);
      strands?.setResolution(resolution);
      tailStrands?.setResolution(resolution);
      for (const r of refLines) r.mat.resolution.copy(resolution);
      for (const r of versionRings) r.mat.resolution.copy(resolution);
      nowRing?.mat.resolution.copy(resolution);
      // a turned phone changes the screen shape: resize the names to match
      const scale = labelScale(el);
      if (Math.abs(scale - lastScale) > 0.01) {
        lastScale = scale;
        for (const p of stars.current.values()) {
          if (!p.label) continue;
          p.label.textHeight = p.baseHeight * scale;
          p.label.padding = [p.label.textHeight * 0.15, p.label.textHeight * 0.3];
        }
      }
      relabelSoon.current();
      wakeUp();
    });
    ro.observe(el);

    // ---------- back from the background (iPad/iPhone): build the scene again ----------
    // WebKit (Safari, and Chrome on iPad, which is WebKit too) may take the GPU away from a hidden tab.
    // Sometimes it says so (webglcontextlost); often it does not: the context still reports itself
    // alive but nothing new reaches the screen, and the chart stays frozen. Navigating away and back
    // (a fresh canvas) always fixes it, so after the tab was hidden for a while, do the same: rebuild.
    // Wait a moment first: right after the tab shows again the GPU may not be ready, and a context
    // made then can be born dead.
    const canvas = g.renderer().domElement;
    let lost = false, hiddenAt = document.visibilityState === 'hidden' ? performance.now() : 0, again = 0;
    const rebuild = () => {
      if (disposed) return;
      const cam = g.camera(), c = g.controls() as { target?: { x: number; y: number; z: number } };
      const at = c.target ?? { x: 0, y: 0, z: 0 };
      if (el.dataset.ready !== undefined) keepView.current = { pos: [cam.position.x, cam.position.y, cam.position.z], at: [at.x, at.y, at.z] };
      setGlEpoch((n) => n + 1);
    };
    const rebuildSoon = () => {
      clearTimeout(again);
      again = window.setTimeout(() => {
        if (document.visibilityState === 'visible') rebuild();
      }, 400);
    };
    const onLost = (e: Event) => {
      e.preventDefault(); // lets the browser give the context back (webglcontextrestored) if it can
      lost = true;
      if (document.visibilityState === 'visible') rebuildSoon();
    };
    const onRestored = () => { lost = false; };
    const onVisible = () => {
      if (document.visibilityState === 'hidden') { onHide(); return; }
      const away = hiddenAt ? performance.now() - hiddenAt : 0;
      hiddenAt = 0;
      if (lost || g.renderer().getContext().isContextLost() || away > 1000) rebuildSoon();
      else wakeUp();
    };
    const onHide = () => { hiddenAt ||= performance.now(); clearTimeout(again); };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) { hiddenAt ||= 1; onVisible(); } };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onPageShow);

    wakeUp();
    return () => {
      disposed = true;
      clearTimeout(again);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onPageShow);
      ro.disconnect();
      clearTimeout(idle);
      clearTimeout(layoutTimer);
      cancelAnimationFrame(fading);
      cancelAnimationFrame(relabelFrame);
      cancelAnimationFrame(moveFrame);
      cancelAnimationFrame(hoverFrame);
      controls.removeEventListener('change', onMove);
      for (const ev of events) el.removeEventListener(ev, wakeUp);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('pointermove', onHover);
      el.removeEventListener('pointerleave', onLeave);
      for (const r of versionRings) { r.line.geometry.dispose(); r.mat.dispose(); }
      if (nowRing) { nowRing.line.geometry.dispose(); nowRing.mat.dispose(); }
      delete el.dataset.ready;
      for (const t of tethers) { t.line.geometry.dispose(); t.line.material.dispose(); }
      for (const r of refLines) { r.line.geometry.dispose(); r.mat.dispose(); }
      field?.dispose();
      strands?.dispose();
      tailStrands?.dispose();
      if (hubSprite) { hubSprite.material.map?.dispose(); hubSprite.material.dispose(); }
      for (const p of stars.current.values()) if (p.label) { p.label.material.map?.dispose(); p.label.material.dispose(); }
      paintTails.current = () => {};
      showRefs.current = () => {};
      showTethers.current = () => {};
      applyShown.current = () => {};
      placeNow.current = () => {};
      makeLabel.current = () => null;
      for (const p of [...skyStars, dayDust]) { p.geometry.dispose(); p.material.dispose(); }
      dot.dispose();
      if (milky) { milky.geometry.dispose(); milky.material.map?.dispose(); milky.material.dispose(); }
      for (const nb of [...nebulae, ...dayClouds]) { nb.material.map?.dispose(); nb.material.dispose(); }
      g.scene().onBeforeRender = () => {};
      const r = g.renderer();
      g._destructor();
      try { r.forceContextLoss(); } catch { /* already lost */ } // hand the GPU context back now; WebKit allows only a few per page
      el.replaceChildren();
      el.style.cursor = '';
      graph.current = null;
      laid.current = [];
      stars.current.clear();
      lines.current.clear();
      wake.current = fade.current = relabelSoon.current = () => {};
      applySky.current = () => {};
    };
  }, [theme, index, gl, glEpoch]);

  // ---------- sky: recolour in place (keeps layout, camera and selection) ----------
  const firstSky = useRef(true);
  useEffect(() => {
    if (firstSky.current) { firstSky.current = false; return; }
    applySky.current(sky);
  }, [sky]);

  // ---------- version: which stars and lines exist ----------
  useEffect(() => {
    if (!graph.current) return;
    applyShown.current();
    placeNow.current(vIdx);
    showTethers.current();
    showRefs.current();
    paintTails.current();
    relabelSoon.current();
    wake.current();
  }, [theme, shown, vIdx, glEpoch]);

  // ---------- selection and sky: brightness and colour targets ----------
  useEffect(() => {
    for (const [id, s] of stars.current) s.starTarget = starTargetOf(id, look);
    for (const [l, p] of lines.current) lineLook(l, look, p);
    fade.current();
    showRefs.current();
    paintTails.current();
  }, [theme, look, glEpoch]);

  // ---------- names: brightest stars, the selection's neighbourhood, the hovered star, what is close ----------
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    const { inFocus } = look;
    // candidates in priority order (fixed until the selection, hover or version changes); a name that
    // would overlap one already placed stays hidden
    const rank = (n: PageNode, s: StarParts) =>
      n.hub ? 0 : n.id === selected ? 1 : n.id === hovered ? 2 : focus?.one.has(n.id) ? 3 : s.named ? 4 : 5;
    let want: { n: PageNode; s: StarParts; r: number }[] | null = null;
    let wantFrom: PageNode[] | null = null;
    const candidates = () => {
      const nodes = laid.current;
      if (want && wantFrom === nodes) return want;
      want = [];
      wantFrom = nodes;
      for (const n of nodes) {
        const s = stars.current.get(n.id);
        if (!s || !shown(n.id)) continue;
        // every visible page is a candidate; rank decides who gets the room
        if (focus && !inFocus(n.id) && n.id !== hovered) continue;
        want.push({ n, s, r: rank(n, s) });
      }
      want.sort((a, b) => a.r - b.r || b.n.units - a.n.units);
      return want;
    };
    const v = new Vector3(), cam = new Vector3();
    const CELL = 64; // px: placed name boxes are kept in a grid, so a check looks only at its neighbours
    relabel.current = () => {
      const camera = g.camera() as PerspectiveCamera;
      const el = host.current;
      if (!el) return;
      const W = el.clientWidth, H = el.clientHeight;
      const p11 = camera.projectionMatrix.elements[5]; // 1 / tan(fov / 2)
      const scale = labelScale(el);
      cam.copy(camera.position);
      camera.updateMatrixWorld();
      for (const s of stars.current.values()) { s.target = 0; s.box = null; }
      const grid = new Map<number, [number, number, number, number][]>();
      const cells = (b: [number, number, number, number], f: (key: number) => boolean | void) => {
        const x0 = Math.floor(b[0] / CELL), x1 = Math.floor(b[2] / CELL), y0 = Math.floor(b[1] / CELL), y1 = Math.floor(b[3] / CELL);
        for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) if (f((cx + 1000) * 4096 + cy + 1000)) return true;
        return false;
      };
      for (const { n, s, r } of candidates()) {
        v.set(n.x ?? 0, n.y ?? 0, n.z ?? 0).project(camera);
        if (v.z > 1) continue; // behind the camera
        const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        if (x < -W || x > 2 * W || y < -H || y > 2 * H) continue; // far off screen
        // the name's size on screen, as three-spritetext draws it (padding included)
        const th = s.baseHeight * scale * 1.6;
        const w = th * s.aspect * p11 * H / 2 * 1.12, h = th * p11 * H / 2; // a little wide: glyphs overhang
        const gap = 5; // px between names
        const box: [number, number, number, number] = [x - w / 2 - gap, y - h * 1.15 - gap, x + w / 2 + gap, y - h * 0.05 + gap];
        if (cells(box, (k) => grid.get(k)?.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]))) continue;
        cells(box, (k) => { (grid.get(k) ?? grid.set(k, []).get(k)!).push(box); });
        s.box = box;
        const close = cam.distanceTo(v.set(n.x ?? 0, n.y ?? 0, n.z ?? 0)) < NAME_DISTANCE;
        // full brightness for the busiest pages, the selection and its neighbours; the rest faint
        s.target = r <= 4 ? 1 : close ? 0.75 : focus?.two.has(n.id) ? 0.5 : 0.42;
        if (!s.label) makeLabel.current(s);
      }
      fade.current();
    };
    relabel.current();
  }, [theme, shown, look, focus, selected, hovered, glEpoch]);

  const sel = selected && index ? index.byId.get(selected)! : null;
  const hubNode = theme && index ? index.byId.get(theme.page) : undefined;
  const themeName = hubNode ? nameOf(hubNode) : '테마';
  // the latest snapshot written for the chosen version or before it
  const snap = sel && snapshots ? snapshotAt(snapshots[sel.id], vIdx) : null;
  const hrefOf = (p: string) => urlFor(pathNameOf(p, allById), vIdx);
  // a page with no snapshot (outside the Khaenri'ah theme) shows its article's lead on the card instead
  const [cardData, setCardData] = useState<{ id: string; data: PageData } | null>(null);
  const needLead = !!sel && !!snapshots && !snap;
  useEffect(() => {
    if (!needLead || !sel || cardData?.id === sel.id) return;
    let live = true;
    loadPageData(sel.id).then((data) => { if (live) setCardData({ id: sel.id, data }); }, () => {});
    return () => { live = false; };
  }, [needLead, sel, cardData]);
  const leadArt = needLead && cardData?.id === sel!.id ? articleAt(cardData.data.articles, vIdx) : null;
  const lead = leadArt?.lead ?? leadArt?.sections[0]?.p[0] ?? null;
  const link = useLinker(theme?.nodes, vIdx, sel?.id ?? null, hrefOf, openArticle);
  const cardSeen = new Set<string>();
  const neighbours = sel && focus ? [...focus.one].map((id) => index!.byId.get(id)!).sort((a, b) => b.units - a.units) : [];

  return (
    <div className={`site graph-page w3d${night ? ' night' : ' day'}`} style={{ ['--w3d-head' as string]: `${headH}px` }}>
      <div className="wrap" ref={headBox}><header>
        <a className="logo" href="/"><Logo />aru.wiki</a>
        {article ? (
          <button type="button" className="w3d-back" onClick={closeArticle}>← 3D 위키</button>
        ) : !gl ? null : <div className="legend" aria-label="범례">
          <span style={{ ['--c' as string]: sky.hub }}><i />{themeName}</span>
          <span style={{ ['--c' as string]: sky.character }}><i />인물</span>
          <span style={{ ['--c' as string]: sky.lore }}><i />로어</span>
          <span className="hint">미리보기 · 별 크기는 나오는 이야기 수 · 선은 함께 나오는 이야기가 많을수록 밝고 굵음 · 아래가 이른 버전 · 왼쪽 눈금이 버전</span>
        </div>}
        <nav>
          {theme && gl && <Search nodes={allNodes} vIdx={vIdx} hrefOf={hrefOf} onOpen={openArticle} />}
          <a href={urlFor(RECENT_KEY, vIdx)} onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            if (!isRecentKey(article)) openArticle(RECENT_KEY);
          }}>최근 바뀜</a>
          <a className="band" href="/?view=quests">임무 지도</a>
          <VersionPicker order={vIdx} onChange={setVIdx} />
          <ThemeToggle />
        </nav>
      </header></div>
      {article && theme && index && (isRecentKey(article) ? (
        <Suspense fallback={<p className="w3d-status">불러오는 중…</p>}>
          <RecentChanges vIdx={vIdx} byId={allById} hrefOf={hrefOf} onOpen={openArticle} />
        </Suspense>
      ) : (
        <WikiArticle page={page!} theme={theme} nodes={allNodes} byId={allById} snapshots={snapshots} vIdx={vIdx}
          hrefOf={hrefOf} onOpen={openArticle} />
      ))}
      {article && !theme && <p className="w3d-status">{failed ? '지도 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
      {/* the chart stays mounted (camera and selection kept) but hidden behind an open article */}
      <div className={`w3d-stage${article ? ' behind' : ''}`} ref={host} aria-hidden={article ? true : undefined}>
        {!theme && <p className="w3d-status">{failed ? '지도 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
        {theme && !gl && (
          // Without WebGL there is no chart: the front page is just the search box, like an encyclopedia's portal.
          <div className="w3d-portal">
            <p className="w3d-portal-logo"><Logo />aru.wiki</p>
            <p className="w3d-portal-sub">원신 이야기 위키</p>
            <Search big autoFocus nodes={allNodes} vIdx={vIdx} hrefOf={hrefOf} onOpen={openArticle} />
            <p className="w3d-portal-note">이 브라우저에서는 3D 지도를 그릴 수 없어(WebGL을 쓸 수 없음) 검색 화면을 보여 줍니다. <a href={hrefOf(theme.page)} onClick={(e) => { e.preventDefault(); openArticle(theme.page); }}>{themeName}</a> 문서에서 시작해도 됩니다.</p>
            <p className="w3d-portal-note">문서의 글은 Fandom 원신 위키(<Lic l={BY_SA_3} />)의 글을 번역·요약해 고쳐 쓴 것이고 <Lic l={BY_SA_4} />으로 배포합니다. 원문과 판은 문서마다 적혀 있습니다. <LicensePageLink /></p>
          </div>
        )}
      </div>
      {theme && gl && !article && <p className="w3d-license"><LicensePageLink>출처·라이선스</LicensePageLink></p>}
      {sel && !article && (
        <aside className="w3d-card" aria-live="polite">
          <p className="w3d-type">{KIND_LABEL[sel.kind]} · {versions[sel.revealed]?.id}부터</p>
          <h2>{nameOf(sel)}</h2>
          <a className="w3d-more" href={hrefOf(sel.id)} onClick={(e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            openArticle(sel.id);
          }}>자세히 보기 →</a>
          {snapshots && (snap ? (
            <section className="w3d-snap">
              <p className="w3d-snap-head">
                <span className="tag neutral" title="위키 글을 바탕으로 기계가 쓰고, 다른 회사 모델이 근거와 대조했습니다. 사람은 아직 확인하지 않았습니다.">미검수</span>
                {' '}{versions[snap.from]?.id} 때의 위키 기준
              </p>
              {snap.summary && <p className="w3d-summary">{link(snap.summary.t, cardSeen)}</p>}
              <ul className="w3d-points">{snap.bullets.map((b, i) => <li key={i}>{link(b.t, cardSeen)}</li>)}</ul>
              <SourceCredit className="w3d-src" sources={snap.sources.map((x) => ({ kind: 'wiki' as const, ...x }))} what="요약·번역했습니다." />
            </section>
          ) : lead && leadArt ? (
            <section className="w3d-snap">
              <p className="w3d-snap-head">
                <span className="tag neutral" title="위키 글을 바탕으로 기계가 쓰고, 다른 회사 모델이 근거와 대조했습니다. 사람은 아직 확인하지 않았습니다.">미검수</span>
                {' '}{versions[leadArt.from]?.id} 때의 자료 기준 · 문서 첫 문단
              </p>
              <p className="w3d-summary">{rich(lead.s.map((x) => x.t).join(' '), link, cardSeen)}</p>
              <SourceCredit className="w3d-src" sources={lead.r.map((r) => leadArt.sources[r])} what="번역·요약해 고쳐 썼습니다."
                extra={lead.r.some((r) => leadArt.sources[r]?.kind !== 'wiki') && ' 게임 대사와 웹 출처는 문서의 각주에 있습니다.'} />
            </section>
          ) : <p className="w3d-meta w3d-snap-none">{cardData?.id === sel.id ? '이 버전까지의 요약이 아직 없습니다.' : '불러오는 중…'}</p>)}
          <p className="w3d-meta">나오는 이야기 {sel.units}개</p>
          {neighbours.length > 0 && (
            <ul className="w3d-near">
              {neighbours.map((n) => <li key={n.id}><button type="button" onClick={() => setSelected(n.id)}>{nameOf(n)}</button></li>)}
            </ul>
          )}
          <ReportBox key={sel.id} nodeId={sel.id} version={versions[vIdx]?.id ?? ''} />
          <button type="button" className="w3d-close" aria-label="닫기" onClick={() => setSelected(null)}>×</button>
        </aside>
      )}
    </div>
  );
}
