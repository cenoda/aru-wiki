// Stage-2 preview: the Khaenri'ah lore theme as a star chart, to see its shape (not the final
// arrangement). Pages are stars; two pages are joined when they appear in the same story units
// (scripts/build-runtime-data.mjs keeps a spanning tree plus each page's two strongest ties).
//
// Ecliptic layout: the stars spread over one plane around the theme page and only drift a little
// above or below it, so the chart reads like a map yet still has depth when turned. Height follows
// the version a page was revealed in: earlier pages sit a little below the plane, later ones above.
// Lines keep a fixed pixel width at any zoom; brightness and width follow how many stories two
// pages share, and distance fog dims what is far from the camera. The busiest pages are named in
// full, the rest faintly where there is room. Stars, names and lines ease between brightness levels.
// Night sky in the dark site theme, a pale day sky in the light one.
// The scene renders only while the reader interacts, and the version picker hides later pages.
import ForceGraph3D, { type ForceGraph3DInstance } from '3d-force-graph';
import { forceX, forceY, forceZ } from 'd3-force-3d';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending, BackSide, BufferGeometry, Euler, Mesh, MeshBasicMaterial, RepeatWrapping, SphereGeometry, Line, LineDashedMaterial, Float32BufferAttribute, Matrix4, Points, PointsMaterial, CanvasTexture, Color, Fog, Group, NormalBlending,
  type PerspectiveCamera, Sprite, SpriteMaterial, Vector2, Vector3,
} from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import SpriteText from 'three-spritetext';
import themeUrl from '../data/runtime/theme-khaenriah.json?url';
import snapshotsUrl from '../data/runtime/snapshots-khaenriah.json?url';
import { ReportBox } from './ReportBox';
import { useLinker } from './Linked';
import { Search } from './Search';
import { articleKeyFromUrl, articleUrl, isArticleUrl, pathNameOf, resolvePage } from './route';
import { Logo } from './Logo';
import { versions } from './data';
import {
  idOf, KIND_LABEL, nameOf, type PageLink, type PageNode, revisionUrl, snapshotAt, type Snapshots, type Theme, withParticle,
} from './lore';
import { VersionPicker } from './VersionPicker';
import { ThemeToggle, useTheme } from './theme';
import { WikiArticle } from './WikiArticle';
import './site.css';
import './focus.css';
import './wiki3d.css';

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
 * Canvases are shared; each sprite gets its own texture, because three-forcegraph disposes a
 * removed node's texture and a shared one would be disposed under every other star.
 */
function starTexture(color: string, night: boolean, rays: boolean) {
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
  return new CanvasTexture(c);
}
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
 * The Milky Way as an equirectangular picture for a sky sphere: a soft band along the equator,
 * wider and warmer toward a core, broken into clouds by noise, with a dark dust lane down its middle.
 * Drawn once in the browser (no image file); pure decoration.
 */
function milkyWayTexture() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  let st = 4242;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  // value noise that wraps around in longitude (no seam where the picture's ends meet)
  const octaves = [0, 1, 2, 3, 4, 5].map((o) => {
    const gx = 6 * 2 ** o, gy = 4 * 2 ** o;
    return { gx, gy, v: Array.from({ length: gx * (gy + 1) }, rnd) };
  });
  const sm = (t: number) => t * t * (3 - 2 * t);
  const noise = (u: number, v: number) => {
    let n = 0, amp = 0.5, tot = 0;
    for (const o of octaves) {
      const x = u * o.gx, y = v * o.gy;
      const x0 = Math.floor(x), y0 = Math.min(o.gy - 1, Math.floor(y)), fx = sm(x - x0), fy = sm(y - y0);
      const at = (i: number, j: number) => o.v[(y0 + j) * o.gx + ((x0 + i) % o.gx)];
      n += amp * ((at(0, 0) * (1 - fx) + at(1, 0) * fx) * (1 - fy) + (at(0, 1) * (1 - fx) + at(1, 1) * fx) * fy);
      tot += amp; amp *= 0.55;
    }
    return n / tot;
  };
  const img = ctx.createImageData(W, H);
  const cool = new Color('#93a6ff'), warm = new Color('#ffdcb8'), col = new Color();
  for (let y = 0; y < H; y++) {
    const lat = (y / H - 0.5) * Math.PI;
    if (Math.abs(lat) > 0.7) continue;
    for (let x = 0; x < W; x++) {
      const u = x / W, lon = (u - 0.5) * Math.PI * 2;
      const core = Math.exp(-((lon / 0.9) ** 2));
      const width = 0.11 + 0.08 * core + 0.05 * (noise(u, 0.3) - 0.5);
      const band = Math.exp(-((lat / width) ** 2));
      const cloud = noise(u, y / H);
      const lane = Math.exp(-(((lat - 0.025 * Math.sin(lon * 3)) / (0.022 + 0.02 * core)) ** 2)) * (0.4 + 0.6 * noise(u, 0.8));
      let a = band * (0.25 + 0.75 * core) * Math.max(0, cloud * 1.6 - 0.35) * (1 - 0.85 * lane);
      a = Math.min(1, a * 1.3);
      col.copy(cool).lerp(warm, Math.min(1, core * 0.9 + band * 0.2));
      const i = (y * W + x) * 4;
      img.data[i] = col.r * 255; img.data[i + 1] = col.g * 255; img.data[i + 2] = col.b * 255;
      img.data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
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
  node: PageNode; star: SpriteMaterial; starTarget: number; label: SpriteText; named: boolean; target: number;
  /** label height before the screen-shape factor */
  baseHeight: number;
}
interface LineParts { mat: LineMaterial; target: number; color: Color; line?: Line2; phase: number }

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
function smoothCurve(a: P3, b: P3, ta: Vector3 | undefined, tb: Vector3 | undefined) {
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
  for (let i = 0; i <= CURVE_STEPS; i++) {
    const t = i / CURVE_STEPS, u = 1 - t;
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
  /** the time ruler drawn over the left edge of the chart */
  const rulerBox = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [failed, setFailed] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshots | null>(null);
  const [vIdx, setVIdx] = useState(() => versionFromUrl() ?? versions.length - 1);
  const [selected, setSelected] = useState<string | null>(null);
  /** the article open over the chart as the address names it (`/wiki/<name>`, old `?page=`), or null for the chart */
  const [article, setArticle] = useState<string | null>(articleKeyFromUrl);
  /** the page id of that article once the theme is loaded (an unknown name stays as written) */
  const page = useMemo(() => (article && theme ? resolvePage(article, theme.nodes) ?? article : article), [article, theme]);
  const pageNow = useRef(page);
  pageNow.current = page;
  /** a page's address: by its Korean name when it has one */
  const nameFor = (id: string) => pathNameOf(id, index?.byId); // called after render, when index is set

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
    if (page) setSelected(page); // back on the chart, the page's star stays picked
    const t = trail();
    if (t.fromChart && t.aruDepth) history.go(-t.aruDepth); // return to the chart's own entry
    else { history.pushState(null, '', urlFor(null, vNow.current)); setArticle(null); } // came in by a link
  };
  useEffect(() => {
    const onPop = () => {
      const key = articleKeyFromUrl();
      setArticle((cur) => { if (cur && !key) setSelected(pageNow.current); return key; });
      const v = versionFromUrl();
      if (v !== null) setVIdx(v);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    // also turns an old `?page=` link, or a page's other name, into the short address by its Korean name
    if (new URLSearchParams(location.search).has('v') || isArticleUrl()) history.replaceState(history.state, '', urlFor(page && nameFor(page), vIdx));
  }, [vIdx, page, theme]);
  const [hovered, setHovered] = useState<string | null>(null);
  const night = useTheme() === 'dark';
  const [gl] = useState(canDraw3D);
  const sky = night ? NIGHT : DAY;

  useEffect(() => {
    fetch(themeUrl).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(async (t: Theme) => {
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
    // importance = how much of the theme's story a page is part of (units shared with the theme page)
    const byImportance = [...theme.nodes].sort((a, b) => Number(b.hub) - Number(a.hub) || b.theme_units - a.theme_units || b.units - a.units);
    const named = new Set(byImportance.slice(0, NAMED + 1).map((n) => n.id));
    const top = Math.max(1, ...theme.nodes.filter((n) => !n.hub).map((n) => n.theme_units));
    const importance = (n: PageNode) => (n.hub ? 1 : Math.min(1, n.theme_units / top));
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
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const lastOrder = versions.length - 1;
    /** the time axis: earlier versions low, later high, over TIME_SPAN units (the plane is ~470 wide) */
    // portrait screens get a taller axis so the chart fills their height (set when the scene is built)
    const TIME_SPAN = el.clientWidth < el.clientHeight ? 330 : 170;
    const heightOf = (order: number) => ((order - lastOrder / 2) / lastOrder) * TIME_SPAN;
    const height = (n: PageNode) => (n.hub ? 0 : heightOf(n.revealed));

    g.backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeLabel(() => '')
      .nodeThreeObject((n) => {
        const sky0 = lookNow.current.sky;
        const named = index.named.has(n.id);
        // size by importance, like star magnitudes: the theme's main pages stand out, minor ones are specks
        const imp = index.importance(n);
        const r = n.hub ? 4.6 : 1.1 + 3.2 * imp ** 0.8;
        const group = new Group();
        const star = new SpriteMaterial({
          map: starTexture(starColour(n, sky0), sky0.night, n.hub),
          blending: sky0.night ? AdditiveBlending : NormalBlending, depthWrite: false, transparent: true,
        });
        const sprite = new Sprite(star);
        sprite.scale.setScalar(r * (n.hub ? 11 : 7.5));
        group.add(sprite);
        // names keep one size on screen at any zoom (sizeAttenuation off): readable far away,
        // never huge up close, and zooming in only spreads them apart
        const baseHeight = n.hub ? 0.042 : 0.022 + 0.012 * imp;
        const label = new SpriteText(nameOf(n), baseHeight * labelScale(el), sky0.label);
        label.fontFace = LABEL_FONT_STACK;
        label.fontWeight = n.hub ? '600' : '500'; // index.html loads 400–600
        // Hangul reaches past the font-size box; without room the tops and bottoms are cut off
        label.padding = [label.textHeight * 0.15, label.textHeight * 0.3];
        label.material.depthWrite = false;
        label.material.sizeAttenuation = false;
        label.material.fog = false; // names keep their own brightness levels
        label.center.set(0.5, -0.1); // sit just above the star
        label.position.y = r;
        group.add(label);
        label.material.opacity = 0;
        label.visible = false;
        // a star revealed later (version picker) starts from the current look, not full brightness
        const starTarget = starTargetOf(n.id, lookNow.current);
        star.opacity = starTarget;
        stars.current.set(n.id, { node: n, star, starTarget, label, named, target: 0, baseHeight });
        relabelSoon.current();
        return group;
      })
      .linkThreeObject((l) => {
        const w = strength(l);
        const parts: LineParts = { mat: null as unknown as LineMaterial, target: 0, color: new Color(), phase: (lines.current.size * 0.618) % 1 };
        lineLook(l, lookNow.current, parts);
        const mat = new LineMaterial({ color: parts.color, vertexColors: true, linewidth: 0.5 + 0.8 * w, transparent: true, opacity: 0, depthWrite: false });
        mat.fog = true;
        mat.resolution.copy(resolution);
        parts.mat = mat;
        lines.current.set(l, parts);
        fade.current();
        const line = new Line2(new LineGeometry(), mat);
        parts.line = line;
        line.raycast = () => {}; // lines are not clickable
        return line;
      })
      .linkPositionUpdate((obj, { start, end }, link) => {
        const geo = (obj as Line2).geometry as LineGeometry;
        const l = link as PageLink;
        const ax = axes();
        geo.setPositions(smoothCurve(start, end, ax.get(idOf(l.source)), ax.get(idOf(l.target))));
        return true;
      })
      .d3VelocityDecay(0.3)
      .warmupTicks(500)
      .cooldownTicks(0)
      .onNodeHover((n) => setHovered(n?.id ?? null))
      .onNodeClick((n) => setSelected((cur) => (cur === n.id ? null : n.id)))
      .onBackgroundClick(() => setSelected(null))
      .onEngineStop(() => { if (!fitted) { fitted = true; layoutTimer = window.setTimeout(afterLayout, 30); } })
      // the theme page is the sun of the chart
      .graphData({ nodes: theme.nodes.map((n) => (n.hub ? { ...n, fx: 0, fy: 0, fz: 0 } : { ...n })), links: theme.links.map((l) => ({ ...l })) });

    // pages with no lines are pulled in instead of drifting to the rim
    const pull = (n: PageNode) => (index.near.has(n.id) ? 0.03 : 0.25);
    // ecliptic: a strong pull to each page's height, a gentle one to the middle in the plane
    g.d3Force('y', forceY<PageNode>((n) => height(n)).strength(0.9) as never)
      .d3Force('x', forceX(0).strength(pull as never) as never)
      .d3Force('z', forceZ(0).strength(pull as never) as never);
    (g.d3Force('charge') as unknown as { strength(s: number): void }).strength(-90);
    (g.d3Force('link') as unknown as { distance(f: (l: PageLink) => number): void }).distance((l) => 18 + 30 * (1 - strength(l)));

    let fitted = false;
    let layoutTimer: number | undefined;
    let placeRuler = () => {};
    /** where the time pillar stands on the chart's plane (set once the camera is placed) */
    let pillar: { x: number; z: number } | null = null;
    /** each star's direction for corner-free lines, from the layout (which stays still once settled) */
    let axisCache: Map<string, Vector3> | null = null;
    const axes = () => {
      if (axisCache) return axisCache;
      const data = g.graphData();
      const at = new Map(data.nodes.map((n) => [n.id, n]));
      const near = new Map<string, PageNode[]>();
      for (const l of data.links) {
        const s = typeof l.source === 'string' ? at.get(l.source) : l.source, t = typeof l.target === 'string' ? at.get(l.target) : l.target;
        if (!s || !t || s.x === undefined || t.x === undefined) return new Map<string, Vector3>(); // not laid out yet
        (near.get(s.id) ?? near.set(s.id, []).get(s.id)!).push(t);
        (near.get(t.id) ?? near.set(t.id, []).get(t.id)!).push(s);
      }
      axisCache = new Map([...near].map(([id, ns]) => [id, axisOf(at.get(id) as P3, ns as P3[])]));
      return axisCache;
    };
    const tethers: { id: string; line: Line<BufferGeometry, LineDashedMaterial> }[] = [];
    const refLines: { from: string; to: string; both: boolean; line: Line2; mat: LineMaterial }[] = [];
    const tails: { id: string; line: Line2; mat: LineMaterial; fade: number[] }[] = [];
    /** tails take the line colour, fading to the sky; dim with their star, hidden with it */
    paintTails.current = () => {
      const look = lookNow.current;
      const line = new Color(look.sky.line), sky = new Color(look.sky.sky);
      for (const t of tails) {
        const cols: number[] = [];
        for (let i = 0; i < t.fade.length; i += 3) {
          const c = sky.clone().lerp(line, t.fade[i]);
          cols.push(c.r, c.g, c.b);
        }
        (t.line.geometry as LineGeometry).setColors(cols);
        t.line.visible = shownNow.current(t.id);
        t.mat.opacity = look.focused ? (look.inFocus(t.id) ? 0.55 : 0.05) : 0.45;
      }
      wakeUp();
    };
    showRefs.current = () => {
      const look = lookNow.current;
      for (const r of refLines) {
        const on = !!look.selected && (r.from === look.selected || r.to === look.selected) && shownNow.current(r.from) && shownNow.current(r.to);
        r.line.visible = on;
        r.mat.opacity = on ? (r.both ? 0.4 : 0.28) : 0;
      }
      wakeUp();
    };
    showTethers.current = () => { for (const t of tethers) t.line.visible = shownNow.current(t.id); wakeUp(); };
    /** Screen room kept for the time ruler at the left edge: the chart is drawn shifted right by half of it. */
    const RULER_W = 64;
    const leaveRoom = () => {
      const camera = g.camera() as PerspectiveCamera;
      const W = el.clientWidth, H = el.clientHeight;
      camera.setViewOffset(W, H, -RULER_W / 2, 0, W, H);
      camera.updateProjectionMatrix();
    };
    const afterLayout = () => {
      if (disposed) return;
      const list = g.graphData().nodes;
      const radii = list.map((n) => Math.hypot(n.x ?? 0, n.z ?? 0)).sort((a, b) => a - b);
      const r90 = radii[Math.floor(radii.length * 0.9)];
      // The time axis as a pillar standing in the chart's space, at its left as first seen: a vertical
      // line with a small ring round it at each major version, drawn as page vectors (SVG) from the
      // 3D points every frame. So it leans and its rings tilt with the view like the stars do, while
      // the text stays crisp. The part up to the chosen version glows.
      const box = rulerBox.current;
      if (box) {
        const NS = 'http://www.w3.org/2000/svg';
        const mk = <K extends keyof SVGElementTagNameMap>(tag: K, cls: string) => {
          const e = document.createElementNS(NS, tag); e.setAttribute('class', cls); return e;
        };
        box.replaceChildren();
        const svg = mk('svg', 'w3d-pillar');
        const tube = mk('line', 'w3d-tube'), rail = mk('line', 'w3d-rail'), lit = mk('line', 'w3d-lit');
        const nowRing = mk('path', 'w3d-now-ring'), nowText = mk('text', 'w3d-now-text');
        svg.append(tube, rail, lit);
        const ticks = versions.filter((v) => /\.0$|^Luna I$/.test(v.id)).map((v) => {
          const ring = mk('path', 'w3d-ring'), text = mk('text', 'w3d-ring-text');
          text.textContent = v.id === 'Luna I' ? '6.0' : v.id;
          svg.append(ring, text);
          return { ring, text, h: heightOf(v.order) };
        });
        svg.append(nowRing, nowText);
        box.append(svg);
        const pt = new Vector3();
        const RING = 7; // ring radius in chart units
        placeRuler = () => {
          if (!pillar) return;
          const camera = g.camera() as PerspectiveCamera;
          camera.updateMatrixWorld();
          const top = el.offsetTop, W = el.clientWidth, H = el.clientHeight;
          svg.setAttribute('width', String(W)); svg.setAttribute('height', String(top + H));
          const at = (x: number, y: number, z: number): [number, number, boolean] => {
            pt.set(x, y, z).project(camera);
            return [((pt.x + 1) / 2) * W, top + ((1 - pt.y) / 2) * H, pt.z < 1];
          };
          let ringRight = 0;
          const ringPath = (h: number, r: number) => {
            let d = '';
            ringRight = -Infinity;
            for (let i = 0; i <= 32; i++) {
              const a = (i / 32) * Math.PI * 2;
              const [x, y] = at(pillar!.x + Math.cos(a) * r, h, pillar!.z + Math.sin(a) * r);
              d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
              ringRight = Math.max(ringRight, x);
            }
            return d;
          };
          const line = (e: SVGElement, a: [number, number, boolean], b: [number, number, boolean]) => {
            e.setAttribute('x1', a[0].toFixed(1)); e.setAttribute('y1', a[1].toFixed(1));
            e.setAttribute('x2', b[0].toFixed(1)); e.setAttribute('y2', b[1].toFixed(1));
          };
          const low = at(pillar.x, heightOf(0), pillar.z), high = at(pillar.x, heightOf(lastOrder) + 6, pillar.z);
          const nowH = heightOf(vNow.current), now = at(pillar.x, nowH, pillar.z);
          line(tube, low, high); line(rail, low, high); line(lit, low, now);
          nowRing.setAttribute('d', ringPath(nowH, RING * 1.5));
          nowText.setAttribute('x', (ringRight + 6).toFixed(1)); nowText.setAttribute('y', (now[1] + 4).toFixed(1));
          nowText.textContent = `${versions[vNow.current]?.id ?? ''}까지`;
          // rings from the bottom up; a label that would crowd the last shown one or the marker is hidden
          let last = Infinity;
          for (const t of ticks) {
            t.ring.setAttribute('d', ringPath(t.h, RING));
            t.ring.setAttribute('data-past', String(t.h <= nowH));
            const c = at(pillar.x, t.h, pillar.z);
            t.text.setAttribute('x', (ringRight + 5).toFixed(1)); t.text.setAttribute('y', (c[1] + 4).toFixed(1));
            const room = Math.abs(c[1] - last) >= 16 && Math.abs(c[1] - now[1]) >= 15;
            t.text.style.opacity = room ? '' : '0';
            if (room) last = c[1];
          }
          // the pillar behind the camera, or seen end-on from straight above: hide it
          box.style.opacity = !low[2] || !high[2] || Math.hypot(low[0] - high[0], low[1] - high[1]) < 80 ? '0' : '';
        };
      }
      placeNow.current = () => { placeRuler(); wakeUp(); };
      // a page of the theme that shares no story with any other has no line; a faint dotted one to the
      // theme star keeps it from floating alone (it says "in this theme", not "shares stories")
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
      // references (one page mentions the other in its prose, no shared-story line): faint dotted
      // curves, shown only around the picked star; there are hundreds, too many to draw at rest
      const at = new Map(list.map((n) => [n.id, n]));
      for (const [from, to, both] of theme.refs ?? []) {
        const s = at.get(from), t = at.get(to);
        if (!s || !t) continue;
        const geo = new LineGeometry();
        geo.setPositions(smoothCurve(s as P3, t as P3, axes().get(from), axes().get(to)));
        const mat = new LineMaterial({ color: lookNow.current.sky.line, linewidth: 0.8, dashed: true, dashSize: 2.2, gapSize: 3.2,
          transparent: true, opacity: 0, depthWrite: false });
        mat.resolution.copy(resolution);
        const line = new Line2(geo, mat);
        line.computeLineDistances();
        line.raycast = () => {};
        line.visible = false;
        g.scene().add(line);
        refLines.push({ from, to, both: !!both, line, mat });
      }
      showRefs.current();
      // A star whose lines all leave on one side would end them in a point, like a brush tip: give it
      // a short tail on the empty side, along its direction, fading into the sky, so the strand seems
      // to pass through the star.
      const tailNear = new Map<string, PageNode[]>();
      for (const l of g.graphData().links) {
        const s = l.source as PageNode, t = l.target as PageNode;
        (tailNear.get(s.id) ?? tailNear.set(s.id, []).get(s.id)!).push(t);
        (tailNear.get(t.id) ?? tailNear.set(t.id, []).get(t.id)!).push(s);
      }
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
        const pos: number[] = [], col: number[] = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const k = i / steps;
          pos.push((n.x ?? 0) + dir.x * len * k, (n.y ?? 0) + dir.y * len * k, (n.z ?? 0) + dir.z * len * k);
          col.push(1 - k, 1 - k, 1 - k); // fades toward the sky (mixed in the shader below)
        }
        const geo = new LineGeometry();
        geo.setPositions(pos);
        geo.setColors(col);
        const mat = new LineMaterial({ color: 0xffffff, vertexColors: true, linewidth: 0.7, transparent: true, opacity: 0, depthWrite: false });
        mat.resolution.copy(resolution);
        const line = new Line2(geo, mat);
        line.raycast = () => {};
        g.scene().add(line);
        tails.push({ id, line, mat, fade: col });
      }
      paintTails.current();
      // lines that climb far up the axis, or are not in the spanning tree, rest faint
      for (const l of g.graphData().links) {
        const s = l.source as PageNode, t = l.target as PageNode;
        const climb = Math.min(1, Math.abs((s.y ?? 0) - (t.y ?? 0)) / (TIME_SPAN * 0.45));
        calm.set(l, (index.tree.has(l) || index.tree.has(`${idOf(l.source)}|${idOf(l.target)}`) ? 1 : 0.35) * (1 - 0.75 * climb));
      }
      for (const [l, p] of lines.current) lineLook(l, lookNow.current, p);
      fade.current();
      // frame what is there: move the camera until the stars (but the far few) fill the screen in both directions
      const camera = g.camera() as PerspectiveCamera;
      leaveRoom();
      const portrait = el.clientWidth < el.clientHeight;
      const tilt = ((portrait ? 12 : 20) * Math.PI) / 180;
      const linked = list.filter((n) => index.near.has(n.id));
      const ys = linked.map((n) => n.y ?? 0);
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const p = new Vector3();
      let dist = r90 * 2.5;
      for (let i = 0; i < 6; i++) {
        camera.position.set(0, cy + Math.sin(tilt) * dist, Math.cos(tilt) * dist);
        camera.lookAt(0, cy, 0);
        camera.updateMatrixWorld();
        const ax: number[] = [], ay: number[] = [];
        for (const n of linked) { p.set(n.x ?? 0, n.y ?? 0, n.z ?? 0).project(camera); ax.push(Math.abs(p.x)); ay.push(Math.abs(p.y)); }
        ax.sort((a, b) => a - b); ay.sort((a, b) => a - b);
        const q = (a: number[]) => a[Math.floor(a.length * (portrait ? 0.93 : 0.97))];
        dist *= Math.max(q(ax) / (0.9 * (1 - RULER_W / el.clientWidth)), q(ay) / 0.82);
      }
      g.cameraPosition({ x: 0, y: cy + Math.sin(tilt) * dist, z: Math.cos(tilt) * dist }, { x: 0, y: cy, z: 0 }, 0);
      {
        // the time pillar stands where the left margin meets the chart's depth in this first view
        const cam = g.camera() as PerspectiveCamera;
        cam.position.set(0, cy + Math.sin(tilt) * dist, Math.cos(tilt) * dist);
        cam.lookAt(0, cy, 0);
        cam.updateMatrixWorld();
        // move it right until both ends are inside the margin (it leans with perspective)
        let px = 40;
        for (let i = 0; i < 8; i++) {
          const ray = new Vector3((px / el.clientWidth) * 2 - 1, 0, 0.5).unproject(cam).sub(cam.position).normalize();
          const p = cam.position.clone().add(ray.multiplyScalar(dist));
          pillar = { x: p.x, z: p.z };
          const xs = [heightOf(0), heightOf(lastOrder) + 6].map((h) => {
            const v = new Vector3(p.x, h, p.z).project(cam);
            return ((v.x + 1) / 2) * el.clientWidth;
          });
          const short = 30 - Math.min(...xs);
          if (short <= 1) break;
          px += short;
        }
        placeRuler();
      }
      // on first view the chart turns slowly into place once (about 40 degrees, easing out), then rests;
      // any touch stops it, and readers who ask for less motion get the still view
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
          camera.position.set(Math.sin(a) * flat, camY, Math.cos(a) * flat);
          camera.lookAt(0, cy, 0);
          onMove();
          wakeUp();
          if (k < 1) requestAnimationFrame(turn);
        };
        camera.position.set(Math.sin(-swing) * flat, camY, Math.cos(-swing) * flat);
        requestAnimationFrame(turn);
      }
      onMove(); // fog distances and names for the first view
      wakeUp();
    };
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
        const R = 1600 + rnd() * 1400;
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
    // the Milky Way: a sky sphere around everything, seen from inside
    const milky = new Mesh(new SphereGeometry(4200, 64, 32), new MeshBasicMaterial({ map: milkyWayTexture(), side: BackSide,
      transparent: true, opacity: 0.42, depthWrite: false, fog: false, blending: AdditiveBlending }));
    milky.rotation.copy(GALAXY);
    milky.renderOrder = -3;
    milky.raycast = () => {};
    milky.visible = night0;
    g.scene().add(milky);
    // nebulae (night) and pale clouds (day) far behind the chart, among the background stars; faint so
    // the stars stay first. Only the current sky's set is visible.
    const cloudSprite = (nb: Cloud, day: boolean) => {
      const mat = new SpriteMaterial({ map: nebulaTexture(nb.seed, nb.tint), transparent: true, depthWrite: false, fog: false,
        blending: day ? NormalBlending : AdditiveBlending, opacity: day ? 0.9 : 0.45 });
      const sp = new Sprite(mat);
      sp.visible = day !== night0;
      const d = new Vector3(...nb.dir).normalize().multiplyScalar(2200 + (nb.seed % 7) * 60);
      sp.position.copy(d);
      sp.scale.setScalar(nb.size);
      sp.renderOrder = -2;
      sp.raycast = () => {};
      g.scene().add(sp);
      return sp;
    };
    const nebulae = NEBULAE.map((nb) => cloudSprite(nb, false));
    // Line brightness changes along each line: brighter where it meets its stars, softer in the
    // middle, with a slow glint of light running along it. It moves only while the chart is drawn
    // (the scene sleeps when the reader stops), so a still chart costs nothing.
    const flowStart = performance.now();
    type ColorAttr = { data: { array: Float32Array; needsUpdate: boolean } };
    g.scene().onBeforeRender = () => {
      const t = (performance.now() - flowStart) / 1000;
      for (const p of lines.current.values()) {
        const geo = p.line?.geometry as LineGeometry | undefined;
        const start = geo?.getAttribute('instanceStart');
        if (!geo || !start) continue;
        const segs = start.count;
        let cs = geo.getAttribute('instanceColorStart') as unknown as ColorAttr | undefined;
        if (!cs || cs.data.array.length !== segs * 6) {
          geo.setColors(new Array((segs + 1) * 3).fill(1));
          cs = geo.getAttribute('instanceColorStart') as unknown as ColorAttr;
        }
        const arr = cs.data.array;
        const head = ((t * 0.09 + p.phase) % 1.6) - 0.3; // the glint runs past both ends, then comes round again
        const bright = (u: number) => {
          const ends = 0.5 + 0.5 * Math.abs(2 * u - 1) ** 1.6;
          const glint = Math.exp(-(((u - head) / 0.07) ** 2)) * 0.7;
          return Math.min(1.25, ends + glint);
        };
        for (let i = 0; i < segs; i++) {
          const a = bright(i / segs), b = bright((i + 1) / segs);
          arr[i * 6] = arr[i * 6 + 1] = arr[i * 6 + 2] = a;
          arr[i * 6 + 3] = arr[i * 6 + 4] = arr[i * 6 + 5] = b;
        }
        cs.data.needsUpdate = true;
      }
    };
    const dayClouds = DAY_CLOUDS.map((nb) => cloudSprite(nb, true));

    applySky.current = (s) => {
      fog.color.set(s.sky);
      for (const p of stars.current.values()) {
        p.star.map?.dispose();
        p.star.map = starTexture(starColour(p.node, s), s.night, p.node.hub);
        p.star.blending = s.night ? AdditiveBlending : NormalBlending;
        p.star.needsUpdate = true;
        p.label.color = s.label;
      }
      for (const t of tethers) t.line.material.color.set(s.line);
      for (const r of refLines) r.mat.color.set(s.line);
      paintTails.current();
      for (const nb of nebulae) nb.visible = s.night;
      for (const c of dayClouds) c.visible = !s.night;
      for (const p of skyStars) p.visible = s.night;
      milky.visible = s.night;
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
      const ease = (m: { opacity: number }, target: number) => {
        const d = target - m.opacity;
        if (Math.abs(d) < 0.01) m.opacity = target; else { m.opacity += d * k; moving = true; }
      };
      for (const s of stars.current.values()) {
        ease(s.label.material, s.target);
        s.label.visible = s.label.material.opacity > 0.005;
        ease(s.star, s.starTarget);
      }
      for (const l of lines.current.values()) {
        ease(l.mat, l.target);
        const c = l.mat.color, t = l.color;
        if (Math.abs(c.r - t.r) + Math.abs(c.g - t.g) + Math.abs(c.b - t.b) < 0.01) c.copy(t);
        else { c.lerp(t, k); moving = true; }
      }
      if (moving) { wakeUp(); fading = requestAnimationFrame(step); } else { fading = 0; last = 0; }
    };
    fade.current = () => { if (!fading && !disposed) fading = requestAnimationFrame(step); };
    let relabelFrame = 0;
    relabelSoon.current = () => {
      if (!relabelFrame && !disposed) relabelFrame = requestAnimationFrame(() => { relabelFrame = 0; relabel.current(); });
    };
    const events = ['pointerdown', 'pointermove', 'wheel', 'touchstart'] as const;
    for (const ev of events) el.addEventListener(ev, wakeUp, { passive: true });
    const controls = g.controls() as { addEventListener(type: string, fn: () => void): void; removeEventListener(type: string, fn: () => void): void };
    const onMove = () => {
      const d = g.camera().position.length();
      fog.near = d * 0.7;
      fog.far = d * 2.3;
      placeRuler();
      relabel.current();
    };
    controls.addEventListener('change', onMove);
    let lastScale = labelScale(el);
    const ro = new ResizeObserver(() => {
      g.width(el.clientWidth).height(el.clientHeight);
      resolution.set(el.clientWidth, el.clientHeight);
      for (const l of lines.current.values()) l.mat.resolution.copy(resolution);
      for (const r of refLines) r.mat.resolution.copy(resolution);
      for (const t of tails) t.mat.resolution.copy(resolution);
      // a turned phone changes the screen shape: resize the names to match
      const scale = labelScale(el);
      if (Math.abs(scale - lastScale) > 0.01) {
        lastScale = scale;
        for (const p of stars.current.values()) {
          p.label.textHeight = p.baseHeight * scale;
          p.label.padding = [p.label.textHeight * 0.15, p.label.textHeight * 0.3];
        }
      }
      leaveRoom();
      placeRuler();
      relabelSoon.current();
      wakeUp();
    });
    ro.observe(el);
    wakeUp();
    return () => {
      disposed = true;
      ro.disconnect();
      clearTimeout(idle);
      clearTimeout(layoutTimer);
      cancelAnimationFrame(fading);
      cancelAnimationFrame(relabelFrame);
      controls.removeEventListener('change', onMove);
      for (const ev of events) el.removeEventListener(ev, wakeUp);
      rulerBox.current?.replaceChildren();
      for (const t of tethers) { t.line.geometry.dispose(); t.line.material.dispose(); }
      for (const r of refLines) { r.line.geometry.dispose(); r.mat.dispose(); }
      for (const t of tails) { t.line.geometry.dispose(); t.mat.dispose(); }
      paintTails.current = () => {};
      showRefs.current = () => {};
      showTethers.current = () => {};
      placeNow.current = () => {};
      for (const p of [...skyStars, dayDust]) { p.geometry.dispose(); p.material.dispose(); }
      dot.dispose();
      milky.geometry.dispose(); milky.material.map?.dispose(); milky.material.dispose();
      for (const nb of [...nebulae, ...dayClouds]) { nb.material.map?.dispose(); nb.material.dispose(); }
      g.scene().onBeforeRender = () => {};
      g._destructor();
      el.replaceChildren();
      graph.current = null;
      stars.current.clear();
      lines.current.clear();
      wake.current = fade.current = relabelSoon.current = () => {};
      applySky.current = () => {};
    };
  }, [theme, index, gl]);

  // ---------- sky: recolour in place (keeps layout, camera and selection) ----------
  const firstSky = useRef(true);
  useEffect(() => {
    if (firstSky.current) { firstSky.current = false; return; }
    applySky.current(sky);
  }, [sky]);

  // ---------- version: which stars and lines exist ----------
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    g.nodeVisibility((n) => shown(n.id))
      .linkVisibility((l) => l.revealed <= vIdx && shown(idOf(l.source)) && shown(idOf(l.target)));
    placeNow.current(vIdx);
    showTethers.current();
    showRefs.current();
    paintTails.current();
    relabelSoon.current();
    wake.current();
  }, [theme, shown, vIdx]);

  // ---------- selection and sky: brightness and colour targets ----------
  useEffect(() => {
    for (const [id, s] of stars.current) s.starTarget = starTargetOf(id, look);
    for (const [l, p] of lines.current) lineLook(l, look, p);
    fade.current();
    showRefs.current();
    paintTails.current();
  }, [theme, look]);

  // ---------- names: brightest stars, the selection's neighbourhood, the hovered star, what is close ----------
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    const { inFocus } = look;
    relabel.current = () => {
      const camera = g.camera() as PerspectiveCamera;
      const el = host.current;
      if (!el) return;
      const W = el.clientWidth, H = el.clientHeight;
      const p11 = camera.projectionMatrix.elements[5]; // 1 / tan(fov / 2)
      // candidates in priority order; a name that would overlap one already placed stays hidden
      const rank = (n: PageNode, s: StarParts) =>
        n.hub ? 0 : n.id === selected ? 1 : n.id === hovered ? 2 : focus?.one.has(n.id) ? 3 : s.named ? 4 : 5;
      const want: { n: PageNode; s: StarParts; r: number }[] = [];
      for (const n of g.graphData().nodes) {
        const s = stars.current.get(n.id);
        if (!s) continue;
        s.target = 0;
        if (!shown(n.id)) continue;
        // every visible page is a candidate; rank decides who gets the room
        if (focus && !inFocus(n.id) && n.id !== hovered) continue;
        want.push({ n, s, r: rank(n, s) });
      }
      want.sort((a, b) => a.r - b.r || b.n.theme_units - a.n.theme_units || b.n.units - a.n.units);
      const placed: [number, number, number, number][] = [];
      const v = new Vector3();
      for (const { n, s, r } of want) {
        v.set(n.x ?? 0, n.y ?? 0, n.z ?? 0).project(camera);
        if (v.z > 1) continue; // behind the camera
        const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
        const w = s.label.scale.x * p11 * H / 2 * 1.12, h = s.label.scale.y * p11 * H / 2; // a little wide: glyphs overhang
        const gap = 5; // px between names
        const box: [number, number, number, number] = [x - w / 2 - gap, y - h * 1.15 - gap, x + w / 2 + gap, y - h * 0.05 + gap];
        if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        placed.push(box);
        const close = camera.position.distanceTo(new Vector3(n.x ?? 0, n.y ?? 0, n.z ?? 0)) < NAME_DISTANCE;
        // full brightness for the busiest pages, the selection and its neighbours; the rest faint
        s.target = r <= 4 ? 1 : close ? 0.75 : focus?.two.has(n.id) ? 0.5 : 0.42;
      }
      fade.current();
    };
    relabel.current();
  }, [theme, shown, look, focus, selected, hovered]);

  const sel = selected && index ? index.byId.get(selected)! : null;
  const hubNode = theme && index ? index.byId.get(theme.page) : undefined;
  const themeName = hubNode ? nameOf(hubNode) : '테마';
  // the latest snapshot written for the chosen version or before it
  const snap = sel && snapshots ? snapshotAt(snapshots[sel.id], vIdx) : null;
  const hrefOf = (p: string) => urlFor(pathNameOf(p, index?.byId), vIdx);
  const link = useLinker(theme?.nodes, vIdx, sel?.id ?? null, hrefOf, openArticle);
  const cardSeen = new Set<string>();
  const neighbours = sel && focus ? [...focus.one].map((id) => index!.byId.get(id)!).sort((a, b) => b.theme_units - a.theme_units) : [];

  return (
    <div className={`site graph-page w3d${night ? ' night' : ' day'}`}>
      <div className="wrap"><header>
        <a className="logo" href="/"><Logo />aru.wiki</a>
        {article ? (
          <button type="button" className="w3d-back" onClick={closeArticle}>← 3D 위키</button>
        ) : !gl ? null : <div className="legend" aria-label="범례">
          <span style={{ ['--c' as string]: sky.hub }}><i />테마</span>
          <span style={{ ['--c' as string]: sky.character }}><i />인물</span>
          <span style={{ ['--c' as string]: sky.lore }}><i />로어</span>
          <span className="hint">미리보기 · 별 크기는 {themeName} 이야기에 얼마나 나오는지 · 선은 함께 나오는 이야기가 많을수록 밝고 굵음 · 아래가 이른 버전 · 왼쪽 눈금이 버전</span>
        </div>}
        <nav>
          {theme && gl && <Search nodes={theme.nodes} vIdx={vIdx} hrefOf={hrefOf} onOpen={openArticle} />}
          <a className="band" href="/?view=quests">임무 지도</a>
          <VersionPicker order={vIdx} onChange={setVIdx} />
          <ThemeToggle />
        </nav>
      </header></div>
      {article && theme && index && (
        <WikiArticle page={page!} theme={theme} byId={index.byId} snapshots={snapshots} vIdx={vIdx}
          hrefOf={hrefOf} onOpen={openArticle} />
      )}
      {article && !theme && <p className="w3d-status">{failed ? '테마 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
      {/* the chart stays mounted (camera and selection kept) but hidden behind an open article */}
      <div className={`w3d-stage${article ? ' behind' : ''}`} ref={host} aria-hidden={article ? true : undefined}>
        {!theme && <p className="w3d-status">{failed ? '테마 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
        {theme && !gl && (
          // Without WebGL there is no chart: the front page is just the search box, like an encyclopedia's portal.
          <div className="w3d-portal">
            <p className="w3d-portal-logo"><Logo />aru.wiki</p>
            <p className="w3d-portal-sub">원신 이야기 위키 · {themeName} 테마</p>
            <Search big autoFocus nodes={theme.nodes} vIdx={vIdx} hrefOf={hrefOf} onOpen={openArticle} />
            <p className="w3d-portal-note">이 브라우저에서는 3D 지도를 그릴 수 없어(WebGL을 쓸 수 없음) 검색 화면을 보여 줍니다. <a href={hrefOf(theme.page)} onClick={(e) => { e.preventDefault(); openArticle(theme.page); }}>{themeName}</a> 문서에서 시작해도 됩니다.</p>
          </div>
        )}
      </div>
      {gl && <div className={`w3d-ruler${article ? ' behind' : ''}`} ref={rulerBox} aria-hidden="true" />}
      {sel && !article && (
        <aside className="w3d-card" aria-live="polite">
          <p className="w3d-type">{sel.hub ? '테마' : KIND_LABEL[sel.kind]} · {versions[sel.revealed]?.id}부터</p>
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
              <p className="w3d-src">
                출처: {snap.sources.filter((x, i, a) => a.findIndex((y) => y.revision === x.revision) === i).map((x, i) => (
                  <span key={x.revision}>{i > 0 && ', '}<a href={revisionUrl(x.page, x.revision)} target="_blank" rel="noreferrer">{x.page}</a> ({x.date} 판)</span>
                ))}. Fandom 원신 위키(CC BY-SA 3.0)의 글을 요약·번역했습니다.
              </p>
            </section>
          ) : <p className="w3d-meta w3d-snap-none">이 버전까지의 요약이 아직 없습니다.</p>)}
          <p className="w3d-meta">{sel.hub ? `이야기 ${sel.units}개` : `${themeName}${withParticle(themeName)} 함께 나오는 이야기 ${sel.theme_units}개 · 전체 ${sel.units}개`}</p>
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
