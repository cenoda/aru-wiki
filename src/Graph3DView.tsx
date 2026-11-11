// 3D act map: acts as nodes on a vertical time axis (one floor per version), PREREQUISITE edges
// between them. The layout is computed before the first frame and the scene only renders while
// the reader is touching it, so an idle page costs nothing (design.md §2, 3D 그래프).
import ForceGraph3D, { type ForceGraph3DInstance } from '3d-force-graph';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { actGraph, displayName, type Quest, type QuestType, TYPE_LABEL, versionOrder, versions } from './data';
import { sharedVersion } from './settings';
import { VersionPicker } from './VersionPicker';
import './site.css';
import './focus.css';
import './graph3d.css';

interface ActNode { id: string; quest: Quest; order: number; x?: number; y?: number; z?: number; fy?: number }
interface ActLink { source: string | ActNode; target: string | ActNode; revealed: number }

/** Height of one version floor. */
const FLOOR = 9;
/** Frames slower than this, most of the time while moving, mean 3D is not usable here. */
const SLOW_FRAME_MS = 50;

const idOf = (end: string | ActNode) => (typeof end === 'string' ? end : end.id);

// ---------- static graph (the data is loaded before this module is imported) ----------
const { acts, edges } = actGraph();
const orderOf = (q: Quest) => versionOrder.get(q.first_version ?? '') ?? 0;
const lastOrder = versions.length - 1;
const nodes: ActNode[] = acts.map((q) => ({ id: q.id, quest: q, order: orderOf(q), fy: (lastOrder / 2 - orderOf(q)) * FLOOR }));
const nodeById = new Map(nodes.map((n) => [n.id, n]));
const links: ActLink[] = edges.map((e) => ({ source: e.source, target: e.target, revealed: e.revealed }));
const near = new Map<string, Set<string>>();
for (const e of edges) {
  (near.get(e.source) ?? near.set(e.source, new Set()).get(e.source)!).add(e.target);
  (near.get(e.target) ?? near.set(e.target, new Set()).get(e.target)!).add(e.source);
}
const before = Map.groupBy(edges, (e) => e.target);
const after = Map.groupBy(edges, (e) => e.source);

/** The selected act and the acts one or two steps from it among the visible ones. */
function neighbourhood(id: string, shown: (id: string) => boolean) {
  const one = [...(near.get(id) ?? [])].filter(shown);
  const two = new Set(one.flatMap((n) => [...(near.get(n) ?? [])]).filter((n) => n !== id && shown(n)));
  return { one: new Set(one), two };
}

const TYPE_VAR: Record<QuestType, string> = { ARCHON: '--archon', STORY: '--story', WORLD: '--world', EVENT: '--event' };

export interface Graph3DProps {
  /** No hardware acceleration: the reader chose 3D anyway, so draw a lighter scene. */
  low?: boolean;
  /** Called once when frames stay slow while the reader moves the scene. */
  onSlow?: () => void;
  /** Open an act in the 2D view. */
  onOpen2D: (actId: string) => void;
  /** Act to select at start (`?act=`). */
  initialAct?: string | null;
  /** The 3D/2D switch, placed in the header. */
  toggle?: ReactNode;
}

export default function Graph3DView({ low = false, onSlow, onOpen2D, initialAct = null, toggle }: Graph3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraph3DInstance<ActNode, ActLink> | null>(null);
  const wake = useRef<() => void>(() => {});
  /** Frame the acts that pass the filter; set once the scene exists. */
  const fit = useRef<(keep: (n: ActNode) => boolean, ms: number) => void>(() => {});
  /** Fly to an act; set once the scene exists. */
  const flyTo = useRef<(id: string) => void>(() => {});
  const ready = useRef(false);
  const latest = useRef<{ selected: string | null; shown: (id: string) => boolean }>({ selected: null, shown: () => true });
  const [vIdx, setVIdxState] = useState(() => sharedVersion.get());
  const setVIdx = (v: number) => { sharedVersion.set(v); setVIdxState(v); };
  const [selected, setSelected] = useState<string | null>(() => (initialAct && nodeById.has(initialAct) ? initialAct : null));

  const shown = useMemo(() => (id: string) => (nodeById.get(id)?.order ?? Infinity) <= vIdx, [vIdx]);
  const focus = useMemo(() => (selected ? neighbourhood(selected, shown) : null), [selected, shown]);

  // A selected act that the chosen version has not released yet is deselected (no spoilers).
  useEffect(() => { if (selected && !shown(selected)) setSelected(null); }, [selected, shown]);

  // ---------- create the scene once ----------
  useEffect(() => {
    const el = host.current!;
    const g = new ForceGraph3D(el, { controlType: 'orbit', rendererConfig: { antialias: !low, powerPreference: 'high-performance' } }) as unknown as ForceGraph3DInstance<ActNode, ActLink>;
    graph.current = g;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, low ? 1 : 2));
    g.backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeId('id')
      .nodeRelSize(3)
      .nodeResolution(low ? 6 : 12)
      .nodeVal((n) => (n.quest.quest_type === 'ARCHON' ? 2.2 : 1))
      .nodeLabel((n) => `${displayName(n.quest)} · ${n.quest.first_version ?? '?'}`)
      .linkDirectionalArrowLength(low ? 0 : 3)
      .linkDirectionalArrowRelPos(1)
      .linkWidth(0)
      .warmupTicks(300) // lay out before the first frame: no animated settling
      .cooldownTicks(0)
      // positions exist only after the warm-up, which runs on the first frame
      .onEngineStop(() => {
        if (ready.current) return;
        ready.current = true;
        const { selected: sel, shown: vis } = latest.current;
        if (sel) flyTo.current(sel); else fitAll((n) => vis(n.id), 0);
      })
      .graphData({ nodes, links });
    /** Frame the acts, from the node positions (zoomToFit reads the meshes, which lag a frame). */
    const fitAll = (keep: (n: ActNode) => boolean, ms: number) => {
      const list = nodes.filter(keep);
      if (!list.length) return;
      const xs = list.map((n) => n.x ?? 0), ys = list.map((n) => n.y ?? 0), zs = list.map((n) => n.z ?? 0);
      // 3rd–97th percentile: a few far-flung event chains should not shrink everything else
      const box = (v: number[]) => { const o = [...v].sort((a, b) => a - b); return [o[Math.floor(o.length * 0.03)], o[Math.ceil(o.length * 0.97) - 1]] as const; };
      const [x0, x1] = box(xs), [y0, y1] = box(ys), [z0, z1] = box(zs);
      const cam = g.camera() as { fov?: number; aspect?: number };
      const half = Math.tan(((cam.fov ?? 50) * Math.PI) / 360);
      const aspect = cam.aspect ?? el.clientWidth / Math.max(1, el.clientHeight);
      const dist = Math.max(60, Math.max((y1 - y0) / 2 / half, (x1 - x0) / 2 / (half * aspect)) * 1.05 + (z1 - z0) / 4);
      const c = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 };
      // a little from above, so one version floor still reads as a plane, not a line
      g.cameraPosition({ x: c.x, y: c.y + dist * 0.35, z: c.z + dist * 0.94 }, c, ms);
      wakeFor(ms);
    };
    fit.current = fitAll;
    flyTo.current = (id) => {
      const n = nodeById.get(id);
      if (!n || n.x === undefined) return;
      const d = 160;
      const r = Math.hypot(n.x, n.z ?? 0) || 1;
      g.cameraPosition({ x: n.x * (1 + d / r), y: (n.y ?? 0) + 30, z: (n.z ?? 0) * (1 + d / r) || d }, { x: n.x, y: n.y ?? 0, z: n.z ?? 0 }, 600);
      wakeFor(600);
    };

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
    /** Keep drawing through a camera transition of `ms`. */
    const wakeFor = (ms: number) => { wakeUp(); clearTimeout(idle); idle = window.setTimeout(sleep, ms + 1500); };
    const events = ['pointerdown', 'pointermove', 'wheel', 'touchstart'] as const;
    for (const ev of events) el.addEventListener(ev, wakeUp, { passive: true });
    wakeUp();

    // ---------- measured slowness (no device specs) ----------
    let frames: number[] = [];
    let last = 0, raf = 0, reported = false;
    const sample = (t: number) => {
      if (running && last) frames.push(t - last);
      last = running ? t : 0;
      if (!reported && frames.length >= 40) {
        const sorted = [...frames].sort((a, b) => a - b);
        if (sorted[Math.floor(sorted.length / 2)] > SLOW_FRAME_MS) { reported = true; onSlow?.(); }
        frames = [];
      }
      raf = requestAnimationFrame(sample);
    };
    if (onSlow) raf = requestAnimationFrame(sample);

    const onResize = () => {
      g.width(el.clientWidth).height(el.clientHeight);
      wakeUp();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      for (const ev of events) el.removeEventListener(ev, wakeUp);
      g._destructor();
      el.replaceChildren();
      graph.current = null;
      ready.current = false;
    };
    // the scene is built once per mount; `low` and `onSlow` do not change while mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- version, selection and colours ----------
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    // theme colours live on .site (light and dark)
    const css = getComputedStyle(host.current!);
    const cssVar = (name: string) => css.getPropertyValue(name).trim();
    const colour = (t: QuestType) => cssVar(TYPE_VAR[t]);
    const dim = cssVar('--line') || '#888';
    const ink = cssVar('--muted') || '#999';
    const accent = cssVar('--gold') || '#b08a45';
    const inFocus = (id: string) => !focus || id === selected || focus.one.has(id) || focus.two.has(id);
    g.nodeVisibility((n) => shown(n.id))
      .linkVisibility((l) => shown(idOf(l.source)) && shown(idOf(l.target)) && l.revealed <= vIdx)
      .nodeColor((n) => (inFocus(n.id) ? colour(n.quest.quest_type) : dim))
      .linkColor((l) => {
        const s = idOf(l.source), t = idOf(l.target);
        if (!focus) return ink;
        return s === selected || t === selected ? accent : inFocus(s) && inFocus(t) ? ink : dim;
      })
      .linkOpacity(focus ? 0.55 : 0.35)
      .onNodeClick((n) => setSelected((cur) => (cur === n.id ? null : n.id)))
      .onBackgroundClick(() => setSelected(null));
    wake.current();
  }, [shown, vIdx, focus, selected]);

  latest.current = { selected, shown };
  // Bring a newly selected act to the middle of the view.
  useEffect(() => { if (ready.current && selected) flyTo.current(selected); }, [selected]);
  // A new version: frame what it reveals, unless the reader is looking at one act.
  useEffect(() => {
    const sel = latest.current.selected;
    // a selected act this version hides is about to be deselected: frame the version instead
    if (ready.current && (!sel || !shown(sel))) fit.current((n) => shown(n.id), 500);
  }, [shown]);

  const sel = selected ? nodeById.get(selected)!.quest : null;
  const count = (list: { source: string; target: string }[] | undefined, end: 'source' | 'target') =>
    (list ?? []).filter((e) => shown(e[end])).length;

  return (
    <div className={`site graph-page g3d${low ? ' low' : ''}`}>
      <div className="wrap"><header>
        <a className="logo" href="./">aru.wiki</a>
        <div className="legend" aria-label="범례">
          <span className="t-archon"><i />마신</span><span className="t-story"><i />전설</span>
          <span className="t-world"><i />월드</span><span className="t-event"><i />이벤트</span>
          <span className="hint">끌어서 회전 · 휠/두 손가락으로 확대 · 위가 이른 버전</span>
        </div>
        <nav>{toggle}<VersionPicker order={vIdx} onChange={setVIdx} /></nav>
      </header></div>
      <div className="g3d-stage" ref={host} />
      {low && <p className="g3d-note">브라우저의 하드웨어 가속이 꺼져 있어 느릴 수 있습니다. 가볍게 그리는 중입니다.</p>}
      {sel && (
        <aside className="g3d-card" aria-live="polite">
          <p className="g3d-type">{TYPE_LABEL[sel.quest_type]} · {sel.first_version}</p>
          <h2>{displayName(sel)}</h2>
          <p className="g3d-links">앞선 막 {count(before.get(sel.id), 'source')}개 · 이어지는 막 {count(after.get(sel.id), 'target')}개</p>
          <div className="g3d-actions">
            <button type="button" className="band" onClick={() => onOpen2D(sel.id)}>2D에서 자세히 보기</button>
            <button type="button" className="g3d-close" aria-label="닫기" onClick={() => setSelected(null)}>×</button>
          </div>
        </aside>
      )}
    </div>
  );
}
