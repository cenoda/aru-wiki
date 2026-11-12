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
  AdditiveBlending, BufferGeometry, CanvasTexture, Color, Fog, Group, LineBasicMaterial, LineLoop, NormalBlending,
  type PerspectiveCamera, Sprite, SpriteMaterial, Vector2, Vector3,
} from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import SpriteText from 'three-spritetext';
import themeUrl from '../data/runtime/theme-khaenriah.json?url';
import snapshotsUrl from '../data/runtime/snapshots-khaenriah.json?url';
import { ReportBox } from './ReportBox';
import { versions } from './data';
import {
  idOf, KIND_LABEL, nameOf, type PageLink, type PageNode, revisionUrl, snapshotAt, type Snapshots, type Theme, withParticle,
} from './lore';
import { VersionPicker } from './VersionPicker';
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
const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;

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
    halo.addColorStop(0, rgba(night ? 0.55 : 0.35));
    halo.addColorStop(0.25, rgba(night ? 0.22 : 0.14));
    halo.addColorStop(0.6, rgba(night ? 0.06 : 0.04));
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
    const r = S * 0.13;
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
const starColour = (n: PageNode, sky: Palette) => (n.hub ? sky.hub : sky[n.kind]);
/** Ring opacity on the plane (inner rings fainter); a little stronger on the pale day sky. */
const ringOpacity = (k: number, sky: Palette) => (k > 1 ? 0.2 : 0.1) * (sky.night ? 1 : 1.6);
/** Names are smaller on portrait screens (their size is relative to the view height). */
const labelScale = (el: HTMLElement) => Math.min(1, (el.clientWidth / Math.max(1, el.clientHeight)) * 1.3);

/** Each star, name and line eases toward a target brightness (and colour, for lines). */
interface StarParts {
  node: PageNode; star: SpriteMaterial; starTarget: number; label: SpriteText; named: boolean; target: number;
  /** label height before the screen-shape factor */
  baseHeight: number;
}
interface LineParts { mat: LineMaterial; target: number; color: Color }

/** What the current version, selection and theme ask of each star and line. */
interface Look {
  inFocus: (id: string) => boolean;
  selected: string | null;
  focused: boolean;
  sky: Palette;
}
const starTargetOf = (id: string, look: Look) => (look.inFocus(id) ? 1 : 0.2);
function lineLook(l: PageLink, look: Look, out: LineParts) {
  const s = idOf(l.source), t = idOf(l.target), w = strength(l);
  const touching = s === look.selected || t === look.selected;
  out.color.set(touching ? look.sky.lineHot : look.sky.line);
  out.target = !look.focused ? 0.15 + 0.55 * w
    : touching ? 0.55 + 0.45 * w
      : look.inFocus(s) && look.inFocus(t) ? 0.12 + 0.4 * w : 0.04;
}

/** The address of the chart, or of an article page, at a version. */
const urlFor = (page: string | null, order: number) => {
  const q = new URLSearchParams();
  if (page) q.set('page', page);
  q.set('v', versions[order]?.id ?? '');
  return `${location.pathname}?${q}`;
};
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
  const [theme, setTheme] = useState<Theme | null>(null);
  const [failed, setFailed] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshots | null>(null);
  const [vIdx, setVIdx] = useState(() => versionFromUrl() ?? versions.length - 1);
  const [selected, setSelected] = useState<string | null>(null);
  /** the article page open over the chart (URL ?page=), or null for the chart */
  const [article, setArticle] = useState<string | null>(() => new URLSearchParams(location.search).get('page'));

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
    history.pushState({ aruDepth: depth + 1, fromChart: depth > 0 ? !!t.fromChart : article === null }, '', urlFor(page, vNow.current));
    setArticle(page);
  };
  const closeArticle = () => {
    if (article) setSelected(article); // back on the chart, the page's star stays picked
    const t = trail();
    if (t.fromChart && t.aruDepth) history.go(-t.aruDepth); // return to the chart's own entry
    else { history.pushState(null, '', urlFor(null, vNow.current)); setArticle(null); } // came in by a link
  };
  useEffect(() => {
    const onPop = () => {
      const q = new URLSearchParams(location.search);
      const page = q.get('page');
      setArticle((cur) => { if (cur && !page) setSelected(cur); return page; });
      const v = versionFromUrl();
      if (v !== null) setVIdx(v);
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (new URLSearchParams(location.search).has('v') || article) history.replaceState(history.state, '', urlFor(article, vIdx));
  }, [vIdx, article]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [night, setNight] = useState(prefersDark);
  const [gl] = useState(canDraw3D);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setNight(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
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
    return { byId, near, named, importance };
  }, [theme]);

  const shown = useMemo(() => (id: string) => (index?.byId.get(id)?.revealed ?? Infinity) <= vIdx, [index, vIdx]);
  const focus = useMemo(() => {
    if (!selected || !index) return null;
    const step = (id: string) => (index.near.get(id) ?? []).filter((e) => e.revealed <= vIdx && shown(e.id)).map((e) => e.id);
    const one = new Set(step(selected));
    const two = new Set([...one].flatMap(step).filter((id) => id !== selected && !one.has(id)));
    return { one, two };
  }, [selected, index, vIdx, shown]);
  const look = useMemo<Look>(() => ({
    inFocus: (id) => !focus || id === selected || focus.one.has(id) || focus.two.has(id),
    selected, focused: !!focus, sky,
  }), [focus, selected, sky]);
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
    const height = (n: PageNode) => (n.hub ? 0 : ((n.revealed - lastOrder / 2) / lastOrder) * 36);

    g.backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeLabel(() => '')
      .nodeThreeObject((n) => {
        const sky0 = lookNow.current.sky;
        const named = index.named.has(n.id);
        // size by importance, like star magnitudes: the theme's main pages stand out, minor ones are specks
        const imp = index.importance(n);
        const r = n.hub ? 4.6 : 0.5 + 3.4 * imp ** 0.8;
        const group = new Group();
        const star = new SpriteMaterial({
          map: starTexture(starColour(n, sky0), sky0.night, n.hub),
          blending: sky0.night ? AdditiveBlending : NormalBlending, depthWrite: false, transparent: true,
        });
        const sprite = new Sprite(star);
        sprite.scale.setScalar(r * (n.hub ? 12 : 11));
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
        const parts: LineParts = { mat: null as unknown as LineMaterial, target: 0, color: new Color() };
        lineLook(l, lookNow.current, parts);
        const mat = new LineMaterial({ color: parts.color, linewidth: 0.6 + 1.6 * w, transparent: true, opacity: 0, depthWrite: false });
        mat.fog = true;
        mat.resolution.copy(resolution);
        parts.mat = mat;
        lines.current.set(l, parts);
        fade.current();
        const line = new Line2(new LineGeometry(), mat);
        line.raycast = () => {}; // lines are not clickable
        return line;
      })
      .linkPositionUpdate((obj, { start, end }) => {
        const geo = (obj as Line2).geometry as LineGeometry;
        geo.setPositions([start.x, start.y, start.z, end.x, end.y, end.z]);
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

    // ecliptic: a strong pull to each page's height, a gentle one to the middle in the plane
    g.d3Force('y', forceY<PageNode>((n) => height(n)).strength(0.9) as never)
      .d3Force('x', forceX(0).strength(0.03) as never)
      .d3Force('z', forceZ(0).strength(0.03) as never);
    (g.d3Force('charge') as unknown as { strength(s: number): void }).strength(-90);
    (g.d3Force('link') as unknown as { distance(f: (l: PageLink) => number): void }).distance((l) => 18 + 30 * (1 - strength(l)));

    let fitted = false;
    let layoutTimer: number | undefined;
    const rings: { line: LineLoop<BufferGeometry, LineBasicMaterial>; k: number }[] = [];
    const afterLayout = () => {
      if (disposed) return;
      const list = g.graphData().nodes;
      const radii = list.map((n) => Math.hypot(n.x ?? 0, n.z ?? 0)).sort((a, b) => a - b);
      const r90 = radii[Math.floor(radii.length * 0.9)];
      // faint rings on the plane, like an ecliptic chart
      const sky0 = lookNow.current.sky;
      for (const k of [0.35, 0.7, 1.05]) {
        const pts: Vector3[] = [];
        for (let i = 0; i < 128; i++) { const a = (i / 128) * Math.PI * 2; pts.push(new Vector3(Math.cos(a) * r90 * k, 0, Math.sin(a) * r90 * k)); }
        const ring = new LineLoop(new BufferGeometry().setFromPoints(pts), new LineBasicMaterial({ color: sky0.ecliptic, transparent: true, opacity: ringOpacity(k, sky0), depthWrite: false }));
        ring.raycast = () => {};
        g.scene().add(ring);
        rings.push({ line: ring, k });
      }
      const cam = g.camera() as { fov?: number; aspect?: number };
      const half = Math.tan(((cam.fov ?? 50) * Math.PI) / 360);
      const aspect = cam.aspect ?? 1;
      // portrait phones: frame the inner chart and let the rim run off the sides (pinch to see more)
      const dist = ((aspect < 1 ? r90 * 0.7 : r90) + 16) / (half * Math.min(1, aspect)) * 0.95;
      const tilt = (32 * Math.PI) / 180; // look down on the plane
      g.cameraPosition({ x: 0, y: Math.sin(tilt) * dist, z: Math.cos(tilt) * dist }, { x: 0, y: 0, z: 0 }, 0);
      onMove(); // fog distances and names for the first view
      wakeUp();
    };
    // distance fog toward the sky colour: far stars and lines recede (distances follow the camera)
    const fog = new Fog(lookNow.current.sky.sky, 100, 400);
    g.scene().fog = fog;

    applySky.current = (s) => {
      fog.color.set(s.sky);
      for (const p of stars.current.values()) {
        p.star.map?.dispose();
        p.star.map = starTexture(starColour(p.node, s), s.night, p.node.hub);
        p.star.blending = s.night ? AdditiveBlending : NormalBlending;
        p.star.needsUpdate = true;
        p.label.color = s.label;
      }
      for (const r of rings) { r.line.material.color.set(s.ecliptic); r.line.material.opacity = ringOpacity(r.k, s); }
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
      relabel.current();
    };
    controls.addEventListener('change', onMove);
    let lastScale = labelScale(el);
    const ro = new ResizeObserver(() => {
      g.width(el.clientWidth).height(el.clientHeight);
      resolution.set(el.clientWidth, el.clientHeight);
      for (const l of lines.current.values()) l.mat.resolution.copy(resolution);
      // a turned phone changes the screen shape: resize the names to match
      const scale = labelScale(el);
      if (Math.abs(scale - lastScale) > 0.01) {
        lastScale = scale;
        for (const p of stars.current.values()) {
          p.label.textHeight = p.baseHeight * scale;
          p.label.padding = [p.label.textHeight * 0.15, p.label.textHeight * 0.3];
        }
      }
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
      for (const r of rings) { r.line.geometry.dispose(); r.line.material.dispose(); }
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
    relabelSoon.current();
    wake.current();
  }, [theme, shown, vIdx]);

  // ---------- selection and sky: brightness and colour targets ----------
  useEffect(() => {
    for (const [id, s] of stars.current) s.starTarget = starTargetOf(id, look);
    for (const [l, p] of lines.current) lineLook(l, look, p);
    fade.current();
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
  const neighbours = sel && focus ? [...focus.one].map((id) => index!.byId.get(id)!).sort((a, b) => b.theme_units - a.theme_units) : [];

  return (
    <div className={`site graph-page w3d${night ? ' night' : ' day'}`}>
      <div className="wrap"><header>
        <a className="logo" href="./">aru.wiki</a>
        {article ? (
          <button type="button" className="w3d-back" onClick={closeArticle}>← 3D 지도</button>
        ) : <div className="legend" aria-label="범례">
          <span style={{ ['--c' as string]: sky.hub }}><i />테마</span>
          <span style={{ ['--c' as string]: sky.character }}><i />인물</span>
          <span style={{ ['--c' as string]: sky.lore }}><i />로어</span>
          <span className="hint">미리보기 · 별 크기는 {themeName} 이야기에 얼마나 나오는지 · 선은 함께 나오는 이야기가 많을수록 밝고 굵음 · 면 아래가 이른 버전</span>
        </div>}
        <nav>
          <a className="band" href="?view=quests">임무 지도</a>
          <VersionPicker order={vIdx} onChange={setVIdx} />
        </nav>
      </header></div>
      {article && theme && index && (
        <WikiArticle page={article} theme={theme} byId={index.byId} snapshots={snapshots} vIdx={vIdx}
          hrefOf={(p) => urlFor(p, vIdx)} onOpen={openArticle} />
      )}
      {article && !theme && <p className="w3d-status">{failed ? '테마 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
      {/* the chart stays mounted (camera and selection kept) but hidden behind an open article */}
      <div className={`w3d-stage${article ? ' behind' : ''}`} ref={host} aria-hidden={article ? true : undefined}>
        {!theme && <p className="w3d-status">{failed ? '테마 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
        {theme && !gl && (
          <div className="w3d-status w3d-nogl">
            <p>이 브라우저에서는 3D 화면을 그릴 수 없습니다(WebGL을 쓸 수 없음).</p>
            <p><a href="?view=quests">임무 지도</a>를 보거나, 아래 문서를 바로 열 수 있습니다.</p>
            <ul>{[...theme.nodes].sort((a, b) => Number(b.hub) - Number(a.hub) || b.theme_units - a.theme_units)
              .filter((n) => n.revealed <= vIdx)
              .map((n) => <li key={n.id}><a href={urlFor(n.id, vIdx)} onClick={(e) => { e.preventDefault(); openArticle(n.id); }}>{nameOf(n)}</a></li>)}</ul>
          </div>
        )}
      </div>
      {sel && !article && (
        <aside className="w3d-card" aria-live="polite">
          <p className="w3d-type">{sel.hub ? '테마' : KIND_LABEL[sel.kind]} · {versions[sel.revealed]?.id}부터</p>
          <h2>{nameOf(sel)}</h2>
          <a className="w3d-more" href={urlFor(sel.id, vIdx)} onClick={(e) => {
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
              {snap.summary && <p className="w3d-summary">{snap.summary.t}</p>}
              <ul className="w3d-points">{snap.bullets.map((b, i) => <li key={i}>{b.t}</li>)}</ul>
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
