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
import { versions } from './data';
import { VersionPicker } from './VersionPicker';
import './site.css';
import './focus.css';
import './wiki3d.css';

interface PageNode { id: string; ko: string | null; kind: 'character' | 'lore'; hub: boolean; units: number; theme_units: number; revealed: number; x?: number; y?: number; z?: number; fx?: number; fy?: number; fz?: number }
interface PageLink { source: string | PageNode; target: string | PageNode; shared: number; revealed: number }
interface Theme { page: string; nodes: PageNode[]; links: PageLink[] }

const idOf = (end: string | PageNode) => (typeof end === 'string' ? end : end.id);
const nameOf = (n: PageNode) => n.ko ?? n.id;
const KIND_LABEL = { character: '인물', lore: '로어' } as const;
/** 와/과 by whether the last Hangul syllable has a final consonant. */
const withParticle = (word: string) => {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return c >= 0 && c < 11172 && c % 28 !== 0 ? '과' : '와';
};

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

const starTextures = new Map<string, CanvasTexture>();
/**
 * A star drawn on a canvas instead of a lit sphere: a crisp round core inside a soft halo.
 * The theme page also gets four thin rays. Night stars have a white-hot centre; day stars an ink rim.
 */
function starTexture(color: string, night: boolean, rays: boolean) {
  const key = `${color}|${night}|${rays}`;
  const cached = starTextures.get(key);
  if (cached) return cached;
  const S = 128, c = document.createElement('canvas');
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
  const tex = new CanvasTexture(c);
  starTextures.set(key, tex);
  return tex;
}

/** Each star, name and line eases toward a target brightness (and colour, for lines). */
interface StarParts { star: SpriteMaterial; starTarget: number; label: SpriteText; named: boolean; target: number }
interface LineParts { mat: LineMaterial; target: number; color: Color }

export default function WikiGraph3D() {
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraph3DInstance<PageNode, PageLink> | null>(null);
  const wake = useRef<() => void>(() => {});
  const stars = useRef(new Map<string, StarParts>());
  const lines = useRef(new Map<PageLink, LineParts>());
  const relabel = useRef<() => void>(() => {});
  /** Ease every name toward its target opacity, rendering until they arrive. */
  const fade = useRef<() => void>(() => {});
  const [theme, setTheme] = useState<Theme | null>(null);
  const [failed, setFailed] = useState(false);
  const [vIdx, setVIdx] = useState(versions.length - 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [night, setNight] = useState(prefersDark);
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

  useEffect(() => { if (selected && !shown(selected)) setSelected(null); }, [selected, shown]);

  // ---------- scene ----------
  useEffect(() => {
    if (!theme || !index) return;
    const el = host.current!;
    const g = new ForceGraph3D(el, { controlType: 'orbit', rendererConfig: { antialias: true, powerPreference: 'high-performance' } }) as unknown as ForceGraph3DInstance<PageNode, PageLink>;
    graph.current = g;
    const resolution = new Vector2(el.clientWidth, el.clientHeight);
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const lastOrder = versions.length - 1;
    const height = (n: PageNode) => (n.hub ? 0 : ((n.revealed - lastOrder / 2) / lastOrder) * 36);

    g.backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeLabel(() => '')
      .nodeThreeObject((n) => {
        const named = index.named.has(n.id);
        // size by importance, like star magnitudes: the theme's main pages stand out, minor ones are specks
        const imp = index.importance(n);
        const r = n.hub ? 4.6 : 0.5 + 3.4 * imp ** 0.8;
        const group = new Group();
        const star = new SpriteMaterial({
          map: starTexture(n.hub ? sky.hub : sky[n.kind], sky.night, n.hub),
          blending: sky.night ? AdditiveBlending : NormalBlending, depthWrite: false, transparent: true,
        });
        const sprite = new Sprite(star);
        sprite.scale.setScalar(r * (n.hub ? 12 : 11));
        group.add(sprite);
        // names keep one size on screen at any zoom (sizeAttenuation off): readable far away,
        // never huge up close, and zooming in only spreads them apart
        const k = Math.min(1, (el.clientWidth / Math.max(1, el.clientHeight)) * 1.3); // portrait: smaller
        const label = new SpriteText(nameOf(n), (n.hub ? 0.042 : 0.022 + 0.012 * imp) * k, sky.label);
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
        stars.current.set(n.id, { star, starTarget: 1, label, named, target: 0 });
        return group;
      })
      .linkThreeObject((l) => {
        const w = strength(l);
        const mat = new LineMaterial({ color: sky.line, linewidth: 0.6 + 1.6 * w, transparent: true, opacity: 0, depthWrite: false });
        mat.fog = true;
        mat.resolution.copy(resolution);
        lines.current.set(l, { mat, target: 0.15 + 0.55 * w, color: new Color(sky.line) });
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
      .onEngineStop(() => { if (!fitted) { fitted = true; setTimeout(afterLayout, 30); } })
      // the theme page is the sun of the chart
      .graphData({ nodes: theme.nodes.map((n) => (n.hub ? { ...n, fx: 0, fy: 0, fz: 0 } : { ...n })), links: theme.links.map((l) => ({ ...l })) });

    // ecliptic: a strong pull to each page's height, a gentle one to the middle in the plane
    g.d3Force('y', forceY<PageNode>((n) => height(n)).strength(0.9) as never)
      .d3Force('x', forceX(0).strength(0.03) as never)
      .d3Force('z', forceZ(0).strength(0.03) as never);
    (g.d3Force('charge') as unknown as { strength(s: number): void }).strength(-90);
    (g.d3Force('link') as unknown as { distance(f: (l: PageLink) => number): void }).distance((l) => 18 + 30 * (1 - strength(l)));

    let fitted = false;
    const afterLayout = () => {
      const list = g.graphData().nodes;
      const radii = list.map((n) => Math.hypot(n.x ?? 0, n.z ?? 0)).sort((a, b) => a - b);
      const r90 = radii[Math.floor(radii.length * 0.9)];
      // faint rings on the plane, like an ecliptic chart
      for (const k of [0.35, 0.7, 1.05]) {
        const pts: Vector3[] = [];
        for (let i = 0; i < 128; i++) { const a = (i / 128) * Math.PI * 2; pts.push(new Vector3(Math.cos(a) * r90 * k, 0, Math.sin(a) * r90 * k)); }
        const ring = new LineLoop(new BufferGeometry().setFromPoints(pts), new LineBasicMaterial({ color: sky.ecliptic, transparent: true, opacity: (k > 1 ? 0.2 : 0.1) * (sky.night ? 1 : 1.6), depthWrite: false }));
        ring.raycast = () => {};
        g.scene().add(ring);
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
    const fog = new Fog(sky.sky, 100, 400);
    g.scene().fog = fog;

    // ---------- render only while the reader is interacting ----------
    let idle: number | undefined;
    let running = true;
    const sleep = () => { g.pauseAnimation(); running = false; };
    const wakeUp = () => {
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
    fade.current = () => { if (!fading) fading = requestAnimationFrame(step); };
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
    const ro = new ResizeObserver(() => {
      g.width(el.clientWidth).height(el.clientHeight);
      resolution.set(el.clientWidth, el.clientHeight);
      for (const l of lines.current.values()) l.mat.resolution.copy(resolution);
      wakeUp();
    });
    ro.observe(el);
    wakeUp();
    return () => {
      ro.disconnect();
      clearTimeout(idle);
      cancelAnimationFrame(fading);
      controls.removeEventListener('change', onMove);
      for (const ev of events) el.removeEventListener(ev, wakeUp);
      g._destructor();
      el.replaceChildren();
      graph.current = null;
      stars.current.clear();
      lines.current.clear();
    };
  }, [theme, index, sky]);

  // ---------- version, selection, brightness and names ----------
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    const inFocus = (id: string) => !focus || id === selected || focus.one.has(id) || focus.two.has(id);
    g.nodeVisibility((n) => shown(n.id))
      .linkVisibility((l) => l.revealed <= vIdx && shown(idOf(l.source)) && shown(idOf(l.target)))
      .onNodeClick((n) => setSelected((cur) => (cur === n.id ? null : n.id)))
      .onBackgroundClick(() => setSelected(null));
    for (const [id, s] of stars.current) s.starTarget = inFocus(id) ? 1 : 0.2;
    const hot = new Color(sky.lineHot), cool = new Color(sky.line);
    for (const [l, p] of lines.current) {
      const s = idOf(l.source), t = idOf(l.target), w = strength(l);
      const touching = s === selected || t === selected;
      p.color.copy(touching ? hot : cool);
      p.target = !focus ? 0.15 + 0.55 * w : touching ? 0.55 + 0.45 * w : inFocus(s) && inFocus(t) ? 0.12 + 0.4 * w : 0.04;
    }
    // names: brightest stars, the selection's neighbourhood, the hovered star, anything close to the camera
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
    wake.current();
  }, [shown, vIdx, focus, selected, hovered, sky]);

  const sel = selected && index ? index.byId.get(selected)! : null;
  const hubNode = theme && index ? index.byId.get(theme.page) : undefined;
  const themeName = hubNode ? nameOf(hubNode) : '테마';
  const neighbours = sel && focus ? [...focus.one].map((id) => index!.byId.get(id)!).sort((a, b) => b.theme_units - a.theme_units) : [];

  return (
    <div className={`site graph-page w3d${night ? ' night' : ' day'}`}>
      <div className="wrap"><header>
        <a className="logo" href="./">aru.wiki</a>
        <div className="legend" aria-label="범례">
          <span style={{ ['--c' as string]: sky.hub }}><i />테마</span>
          <span style={{ ['--c' as string]: sky.character }}><i />인물</span>
          <span style={{ ['--c' as string]: sky.lore }}><i />로어</span>
          <span className="hint">미리보기 · 별 크기는 {themeName} 이야기에 얼마나 나오는지 · 선은 함께 나오는 이야기가 많을수록 밝고 굵음 · 면 아래가 이른 버전</span>
        </div>
        <nav><VersionPicker order={vIdx} onChange={setVIdx} /></nav>
      </header></div>
      <div className="w3d-stage" ref={host}>
        {!theme && <p className="w3d-status">{failed ? '테마 데이터를 불러오지 못했습니다.' : '불러오는 중…'}</p>}
      </div>
      {sel && (
        <aside className="w3d-card" aria-live="polite">
          <p className="w3d-type">{sel.hub ? '테마' : KIND_LABEL[sel.kind]} · {versions[sel.revealed]?.id}부터</p>
          <h2>{nameOf(sel)}</h2>
          <p className="w3d-meta">{sel.hub ? `이야기 ${sel.units}개` : `${themeName}${withParticle(themeName)} 함께 나오는 이야기 ${sel.theme_units}개 · 전체 ${sel.units}개`}</p>
          {neighbours.length > 0 && (
            <ul className="w3d-near">
              {neighbours.map((n) => <li key={n.id}><button type="button" onClick={() => setSelected(n.id)}>{nameOf(n)}</button></li>)}
            </ul>
          )}
          <button type="button" className="w3d-close" aria-label="닫기" onClick={() => setSelected(null)}>×</button>
        </aside>
      )}
    </div>
  );
}
