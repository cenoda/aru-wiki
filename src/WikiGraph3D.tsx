// Stage-2 preview: the Khaenri'ah lore theme as a 3D graph, to see its shape. The layout is a plain
// force layout and is not the final arrangement. Pages are nodes; two pages are linked when they
// appear in the same story units (scripts/build-runtime-data.mjs). The scene renders only while the
// reader interacts, and the version picker hides pages and links revealed later.
import ForceGraph3D, { type ForceGraph3DInstance } from '3d-force-graph';
import { forceX, forceY, forceZ } from 'd3-force-3d';
import { useEffect, useMemo, useRef, useState } from 'react';
import SpriteText from 'three-spritetext';
import themeUrl from '../data/runtime/theme-khaenriah.json?url';
import { versions } from './data';
import { VersionPicker } from './VersionPicker';
import './site.css';
import './focus.css';
import './wiki3d.css';

interface PageNode { id: string; ko: string | null; kind: 'character' | 'lore'; hub: boolean; units: number; revealed: number; x?: number; y?: number; z?: number; fx?: number; fy?: number; fz?: number }
interface PageLink { source: string | PageNode; target: string | PageNode; shared: number; revealed: number }
interface Theme { page: string; nodes: PageNode[]; links: PageLink[] }

const idOf = (end: string | PageNode) => (typeof end === 'string' ? end : end.id);
const nameOf = (n: PageNode) => n.ko ?? n.id;
const KIND_LABEL = { character: '인물', lore: '로어' } as const;

export default function WikiGraph3D() {
  const host = useRef<HTMLDivElement>(null);
  const graph = useRef<ForceGraph3DInstance<PageNode, PageLink> | null>(null);
  const wake = useRef<() => void>(() => {});
  const [theme, setTheme] = useState<Theme | null>(null);
  const [failed, setFailed] = useState(false);
  const [vIdx, setVIdx] = useState(versions.length - 1);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(themeUrl).then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then(setTheme, () => setFailed(true));
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
    return { byId, near };
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
    if (!theme) return;
    const el = host.current!;
    const css = getComputedStyle(el);
    const ink = css.getPropertyValue('--text').trim() || '#262a36';
    const g = new ForceGraph3D(el, { controlType: 'orbit', rendererConfig: { antialias: true, powerPreference: 'high-performance' } }) as unknown as ForceGraph3DInstance<PageNode, PageLink>;
    graph.current = g;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 2));
    g.backgroundColor('rgba(0,0,0,0)')
      .showNavInfo(false)
      .enableNodeDrag(false)
      .nodeRelSize(2.4)
      .nodeVal((n) => (n.hub ? 14 : 1 + Math.sqrt(n.units) / 2))
      .nodeLabel(() => '')
      .nodeThreeObjectExtend(true)
      .nodeThreeObject((n) => {
        const label = new SpriteText(nameOf(n), n.hub ? 9 : 4.6, ink);
        label.fontFace = '"IBM Plex Sans KR", "Pretendard", "Noto Sans KR", sans-serif';
        label.fontWeight = n.hub ? '700' : '500';
        label.position.y = (n.hub ? 13 : 6) + Math.sqrt(n.units) / 3;
        return label;
      })
      .linkWidth(0)
      .linkOpacity(0.35)
      .d3VelocityDecay(0.3)
      .warmupTicks(400)
      .cooldownTicks(0)
      .onEngineStop(() => { if (!fitted) { fitted = true; fitAll(); } })
      // the theme page sits in the middle; a gentle pull keeps pages without links nearby
      .graphData({ nodes: theme.nodes.map((n) => (n.hub ? { ...n, fx: 0, fy: 0, fz: 0 } : { ...n })), links: theme.links.map((l) => ({ ...l })) });
    g.d3Force('x', forceX(0).strength(0.04) as never).d3Force('y', forceY(0).strength(0.04) as never).d3Force('z', forceZ(0).strength(0.04) as never);
    let fitted = false;
    /** Frame every page from the node positions (zoomToFit reads the meshes, which lag a frame). */
    const fitAll = () => {
      const list = g.graphData().nodes;
      // 90th percentile radius: a stray page at the rim should not shrink the rest (phones especially)
      const radii = list.map((n) => Math.hypot(n.x ?? 0, n.y ?? 0, n.z ?? 0)).sort((a, b) => a - b);
      const r = radii[Math.floor(radii.length * 0.9)] + 12;
      const cam = g.camera() as { fov?: number; aspect?: number };
      const half = Math.tan(((cam.fov ?? 50) * Math.PI) / 360);
      const aspect = Math.min(1, cam.aspect ?? 1);
      const dist = r / (half * aspect);
      g.cameraPosition({ x: 0, y: dist * 0.25, z: dist * 0.97 }, { x: 0, y: 0, z: 0 }, 0);
      wakeUp();
    };

    let idle: number | undefined;
    let running = true;
    const sleep = () => { g.pauseAnimation(); running = false; };
    const wakeUp = () => {
      if (!running) { g.resumeAnimation(); running = true; }
      clearTimeout(idle);
      idle = window.setTimeout(sleep, 1500);
    };
    wake.current = wakeUp;
    const events = ['pointerdown', 'pointermove', 'wheel', 'touchstart'] as const;
    for (const ev of events) el.addEventListener(ev, wakeUp, { passive: true });
    const ro = new ResizeObserver(() => { g.width(el.clientWidth).height(el.clientHeight); wakeUp(); });
    ro.observe(el);
    wakeUp();
    return () => {
      ro.disconnect();
      clearTimeout(idle);
      for (const ev of events) el.removeEventListener(ev, wakeUp);
      g._destructor();
      el.replaceChildren();
      graph.current = null;
    };
  }, [theme]);

  // ---------- version, selection, colours ----------
  useEffect(() => {
    const g = graph.current;
    if (!g || !host.current) return;
    const css = getComputedStyle(host.current);
    const v = (name: string) => css.getPropertyValue(name).trim();
    const colour = (n: PageNode) => (n.hub ? v('--event') : n.kind === 'character' ? v('--story') : v('--archon'));
    const dim = v('--line'), ink = v('--muted'), accent = v('--gold');
    const inFocus = (id: string) => !focus || id === selected || focus.one.has(id) || focus.two.has(id);
    g.nodeVisibility((n) => shown(n.id))
      .linkVisibility((l) => l.revealed <= vIdx && shown(idOf(l.source)) && shown(idOf(l.target)))
      .nodeColor((n) => (inFocus(n.id) ? colour(n) : dim))
      .linkColor((l) => {
        const s = idOf(l.source), t = idOf(l.target);
        if (!focus) return ink;
        return s === selected || t === selected ? accent : inFocus(s) && inFocus(t) ? ink : dim;
      })
      .onNodeClick((n) => setSelected((cur) => (cur === n.id ? null : n.id)))
      .onBackgroundClick(() => setSelected(null));
    // labels: fade the ones outside the selection
    for (const n of g.graphData().nodes) {
      const obj = (n as PageNode & { __threeObj?: { children: { material?: { opacity: number; transparent: boolean } }[] } }).__threeObj;
      const label = obj?.children.find((c) => c instanceof SpriteText);
      if (label?.material) { label.material.transparent = true; label.material.opacity = inFocus(n.id) ? 1 : 0.18; }
    }
    wake.current();
  }, [shown, vIdx, focus, selected]);

  const sel = selected && index ? index.byId.get(selected)! : null;
  const neighbours = sel && focus ? [...focus.one].map((id) => index!.byId.get(id)!).sort((a, b) => b.units - a.units) : [];

  return (
    <div className="site graph-page w3d">
      <div className="wrap"><header>
        <a className="logo" href="./">aru.wiki</a>
        <div className="legend" aria-label="범례">
          <span style={{ ['--c' as string]: 'var(--event)' }}><i />테마</span>
          <span style={{ ['--c' as string]: 'var(--story)' }}><i />인물</span>
          <span style={{ ['--c' as string]: 'var(--archon)' }}><i />로어</span>
          <span className="hint">미리보기 · 배치는 확정이 아닙니다 · 같은 이야기에 함께 나오는 문서끼리 연결</span>
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
          <p className="w3d-meta">함께 나오는 이야기 {sel.units}개</p>
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
