import {
  applyNodeChanges, type Edge, Handle, type Node, type NodeChange, type NodeProps, Position,
  MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  actGraph, displayName, type Quest, recommendedGraph, type RecommendedEdge, TIER_RANK, type QuestType, questById, quests, REGION_KO, TYPE_LABEL,
  type Version, versionOrder, versions,
} from './data';
import { recommendationGist, recommendationLead } from './recText';
import ELK from 'elkjs/lib/elk.bundled.js';
import './site.css';
import './focus.css';

// ---------- static graph data ----------
const { acts, edges: actEdges } = actGraph();
const questsByAct = Map.groupBy(quests.filter((q) => q.level === 'QUEST' && q.act), (q) => q.act!);
const before = new Map<string, string[]>();
const after = new Map<string, string[]>();
for (const e of actEdges) {
  (before.get(e.target) ?? before.set(e.target, []).get(e.target)!).push(e.source);
  (after.get(e.source) ?? after.set(e.source, []).get(e.source)!).push(e.target);
}
const requiredBefore = (target: string, source: string) => {
  const stack = [target], seen = new Set(stack);
  while (stack.length) {
    for (const p of before.get(stack.pop()!) ?? []) {
      if (p === source) return true;
      if (!seen.has(p)) { seen.add(p); stack.push(p); }
    }
  }
  return false;
};
// Recommended (not required) order, shown only in a focused act's branch. A recommendation
// the game already enforces says nothing new and is dropped.
const recIn = Map.groupBy(
  recommendedGraph().filter((e) => questById.get(e.source)?.level === 'ACT' && questById.get(e.target)?.level === 'ACT'
    && !requiredBefore(e.target, e.source)),
  (e) => e.target);
const START_ACT = 'act_the_outlander_who_caught_the_wind';
const TYPE_RANK: Record<QuestType, number> = { ARCHON: 0, STORY: 1, WORLD: 2, EVENT: 3 };
const vOrder = (q: Quest) => versionOrder.get(q.first_version ?? '') ?? 0;
const typeClass = (q: Quest) => `t-${q.quest_type.toLowerCase()}`;
const region = (q: Quest) => REGION_KO[q.region ?? ''];

// ---------- atlas layout: one row per era (1.x … Luna … 7.x), one column per version ----------
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
function eraOf(v: Version) {
  const m = /^(\d+)\.(\d+)$/.exec(v.id);
  if (m) return { era: `${m[1]}.x`, col: Number(m[2]) };
  const [name, num] = v.id.split(' ');
  return { era: name, col: (ROMAN[num] ?? 1) - 1 };
}
const CARD_W = 236, CARD_H = 40, STEP_X = 276, STEP_Y = 54, HEAD = 64, ERA_GAP = 90, VER_GAP = 30;

// Within a version, acts follow prerequisite order (Kahn), ties by type then name.
const topoIndex = (() => {
  const indeg = new Map(acts.map((a) => [a.id, 0]));
  for (const e of actEdges) indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  const key = (q: Quest) => [vOrder(q), TYPE_RANK[q.quest_type], displayName(q)] as const;
  const cmp = (a: Quest, b: Quest) => {
    const [x, y] = [key(a), key(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2]);
  };
  let ready = acts.filter((a) => !indeg.get(a.id));
  const out = new Map<string, number>();
  while (ready.length) {
    ready.sort(cmp);
    const a = ready.shift()!;
    out.set(a.id, out.size);
    for (const t of after.get(a.id) ?? []) {
      indeg.set(t, indeg.get(t)! - 1);
      if (indeg.get(t) === 0) ready.push(questById.get(t)!);
    }
  }
  for (const a of acts) if (!out.has(a.id)) out.set(a.id, out.size); // cycles, if the data ever has one
  return out;
})();

/**
 * Storylines ("lines" on a metro map): each act continues the line of one prerequisite of the
 * same quest type whose line has not continued yet (Archon → Archon, a character's Act I → Act II).
 * Links along a line are drawn as straight horizontal track; every other prerequisite is a
 * cross link, shown only for the focused act.
 */
const lines = (() => {
  const lineOf = new Map<string, number>();
  const tail: string[] = [];
  const ordered = [...acts].sort((a, b) => topoIndex.get(a.id)! - topoIndex.get(b.id)!);
  for (const a of ordered) {
    let best: Quest | null = null, bestScore = -1;
    for (const pid of before.get(a.id) ?? []) {
      const p = questById.get(pid)!;
      if (p.quest_type !== a.quest_type || tail[lineOf.get(pid)!] !== pid) continue;
      const score = (p.region === a.region ? 2 : 0) + vOrder(p) / 1000;
      if (score > bestScore) { best = p; bestScore = score; }
    }
    const line = best ? lineOf.get(best.id)! : tail.length;
    lineOf.set(a.id, line);
    tail[line] = a.id;
  }
  // A line that runs on into the next era row is not drawn as track (it would cut across the map).
  const versionById = new Map(versions.map((v) => [v.id, v]));
  const era = (id: string) => eraOf(versionById.get(questById.get(id)!.first_version ?? '')!).era;
  const trackEdges = new Set(actEdges
    .filter((e) => lineOf.get(e.source) === lineOf.get(e.target) && era(e.source) === era(e.target))
    .map((e) => e.id));
  return { lineOf, trackEdges };
})();

/**
 * One row per era; inside a row every storyline keeps one height (its slot), so its track is a
 * horizontal line. A version column is as wide as the longest run of one line in that version.
 */
const atlas = (() => {
  const eras: { name: string; versions: Version[] }[] = [];
  for (const v of versions) {
    const { era } = eraOf(v);
    if (eras.at(-1)?.name !== era) eras.push({ name: era, versions: [] });
    eras.at(-1)!.versions.push(v);
  }
  const pos = new Map<string, { x: number; y: number }>();
  const labels: { id: string; text: string; x: number; y: number; kind: 'era' | 'ver' }[] = [];
  const byTopo = (a: Quest, b: Quest) => topoIndex.get(a.id)! - topoIndex.get(b.id)!;
  let y = 0;
  for (const era of eras) {
    labels.push({ id: `era-${era.name}`, text: era.name, x: -230, y: y + HEAD - 10, kind: 'era' });
    // x of every act in this era
    const xOf = new Map<string, number>();
    let x = 0;
    for (const v of era.versions) {
      labels.push({ id: `ver-${v.id}`, text: v.id, x, y, kind: 'ver' });
      const inVer = acts.filter((a) => a.first_version === v.id).sort(byTopo);
      const perLine = Map.groupBy(inVer, (a) => lines.lineOf.get(a.id)!);
      let width = 1;
      for (const run of perLine.values()) {
        run.forEach((a, i) => xOf.set(a.id, x + i * STEP_X));
        width = Math.max(width, run.length);
      }
      x += width * STEP_X + VER_GAP;
    }
    // pack the era's storylines into slots: Archon first, then by where they start
    const eraActs = [...xOf.keys()].map((id) => questById.get(id)!);
    const spans = [...Map.groupBy(eraActs, (a) => lines.lineOf.get(a.id)!).values()].map((run) => ({
      run,
      start: Math.min(...run.map((a) => xOf.get(a.id)!)),
      end: Math.max(...run.map((a) => xOf.get(a.id)!)) + CARD_W,
      archon: run[0].quest_type === 'ARCHON',
    })).sort((a, b) => Number(b.archon) - Number(a.archon) || a.start - b.start);
    const slotEnds: number[] = [];
    for (const s of spans) {
      let slot = slotEnds.findIndex((end) => end + 30 <= s.start);
      if (slot === -1) slot = slotEnds.length;
      slotEnds[slot] = s.end;
      for (const a of s.run) pos.set(a.id, { x: xOf.get(a.id)!, y: y + HEAD + slot * STEP_Y });
    }
    y += HEAD + slotEnds.length * STEP_Y + ERA_GAP;
  }
  return { pos, labels };
})();

/**
 * The focused act's branch: every act needed to reach it, its own storyline onward,
 * and the acts it unlocks directly on other storylines.
 */
function branchOf(focus: string, visible: (q: Quest) => boolean) {
  const ok = (id: string) => visible(questById.get(id)!);
  const out = new Set([focus]);
  for (const r of recIn.get(focus) ?? []) if (ok(r.source)) out.add(r.source);
  const up = [focus];
  while (up.length) for (const p of before.get(up.pop()!) ?? []) if (ok(p) && !out.has(p)) { out.add(p); up.push(p); }
  const line = lines.lineOf.get(focus);
  const down = [focus];
  while (down.length) {
    const v = down.pop()!;
    for (const c of after.get(v) ?? []) {
      if (!ok(c) || out.has(c)) continue;
      if (lines.lineOf.get(c) === line) { out.add(c); down.push(c); }
      else if (v === focus) out.add(c);
    }
  }
  return out;
}

const elk = new ELK();
async function layoutBranch(ids: Set<string>, focus: string) {
  const list = [...ids].sort((a, b) => topoIndex.get(a)! - topoIndex.get(b)!);
  const res = await elk.layout({
    id: 'branch',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '70', 'elk.spacing.nodeNode': '16',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: list.map((id) => ({ id, width: CARD_W, height: CARD_H })),
    edges: [
      ...actEdges.filter((e) => ids.has(e.source) && ids.has(e.target)).map((e) => ({
        id: e.id, sources: [e.source], targets: [e.target],
        ...(lines.lineOf.get(e.source) === lines.lineOf.get(e.target)
          ? { layoutOptions: { 'elk.layered.priority.straightness': '20' } } : {}),
      })),
      // recommended sources sit left of the act like its prerequisites
      ...(recIn.get(focus) ?? []).filter((r) => ids.has(r.source)).map((r) => ({ id: r.id, sources: [r.source], targets: [focus] })),
    ],
  });
  // Re-anchor so the focused act keeps its atlas position: the branch unfolds around it.
  const f = res.children!.find((c) => c.id === focus)!;
  const home = atlas.pos.get(focus)!;
  return new Map(res.children!.map((c) => [c.id, { x: home.x + c.x! - f.x!, y: home.y + c.y! - f.y! }]));
}

const actFromUrl = () => {
  const a = new URLSearchParams(location.search).get('act');
  return a && questById.get(a)?.level === 'ACT' ? a : null;
};

function Logo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 7.5l1.2 3.3 3.3 1.2-3.3 1.2L12 16.5l-1.2-3.3L7.5 12l3.3-1.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function FocusView() {
  return <ReactFlowProvider><Atlas /></ReactFlowProvider>;
}

function Atlas() {
  const [focus, setFocus] = useState<string | null>(actFromUrl);
  const [vIdx, setVIdx] = useState(versions.length - 1);
  const [query, setQuery] = useState('');
  const flow = useReactFlow();
  const zoom = useStore((s) => s.transform[2]);
  const visible = useCallback((q: Quest) => vOrder(q) <= vIdx, [vIdx]);

  useEffect(() => {
    const onPop = () => setFocus(actFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const select = useCallback((id: string | null) => {
    if (id === focus) return;
    window.history.pushState(null, '', id ? `?act=${id}` : './');
    setFocus(id);
    setQuery('');
  }, [focus]);

  // A focused act that is not released in the chosen version is deselected (back to the atlas).
  useEffect(() => {
    if (focus && !visible(questById.get(focus)!)) {
      window.history.replaceState(null, '', './');
      setFocus(null);
    }
  }, [focus, visible]);

  const neighbours = useMemo(() => {
    if (!focus) return null;
    const keep = (ids: string[] = []) => ids.filter((id) => visible(questById.get(id)!));
    return {
      before: keep(before.get(focus)), after: keep(after.get(focus)),
      recommended: (recIn.get(focus) ?? []).filter((r) => visible(questById.get(r.source)!))
        .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]),
    };
  }, [focus, visible]);

  // ---------- branch of the focused act, laid out on its own ----------
  const branch = useMemo(() => (focus ? branchOf(focus, visible) : null), [focus, visible]);
  // The layout is tagged with the branch it was made for, so a stale one is never used
  // while the next branch is still being laid out.
  const [layout, setLayout] = useState<{ branch: Set<string>; pos: Map<string, { x: number; y: number }> } | null>(null);
  useEffect(() => {
    let live = true;
    if (branch) layoutBranch(branch, focus!).then((pos) => { if (live) setLayout({ branch, pos }); });
    return () => { live = false; };
  }, [branch, focus]);
  const branchPos = layout && layout.branch === branch ? layout.pos : null;
  const inBranch = !!focus && !!branchPos;

  // ---------- nodes: atlas positions, or branch positions while an act is focused ----------
  const [nodes, setNodes] = useState<Node[]>([]);
  useEffect(() => {
    if (focus && !branchPos) return; // wait for the branch layout, keep the current frame
    const actNodes: Node[] = acts.filter(visible)
      .filter((a) => !inBranch || branch!.has(a.id))
      .map((a) => ({
        id: a.id, type: 'act', width: CARD_W, height: CARD_H,
        position: (inBranch ? branchPos!.get(a.id) : atlas.pos.get(a.id))!,
        data: { quest: a, state: a.id === focus ? 'focus' : '', showVersion: inBranch },
      }));
    const labelNodes: Node[] = inBranch ? [] : atlas.labels
      .filter((l) => l.kind === 'era' || versionOrder.get(l.text)! <= vIdx)
      .map((l) => ({ id: l.id, type: 'label', position: { x: l.x, y: l.y }, draggable: false, selectable: false, data: l }));
    setNodes([...labelNodes, ...actNodes]);
  }, [visible, focus, vIdx, branch, branchPos, inBranch]);

  // Atlas: storyline track only. Branch: every link inside the branch (track solid, cross dashed).
  const edges: Edge[] = useMemo(() => actEdges
    .filter((e) => visible(questById.get(e.source)!) && visible(questById.get(e.target)!))
    .flatMap((e): Edge[] => {
      const track = lines.trackEdges.has(e.id) || lines.lineOf.get(e.source) === lines.lineOf.get(e.target);
      if (inBranch ? !(branch!.has(e.source) && branch!.has(e.target)) : !lines.trackEdges.has(e.id)) return [];
      const hot = e.source === focus || e.target === focus;
      return [{
        id: e.id, source: e.source, target: e.target,
        type: inBranch ? 'default' : 'straight',
        className: `${typeClass(questById.get(e.target)!)} ${track ? 'track' : 'cross'}${hot ? ' hot' : ''}`,
        markerEnd: { type: MarkerType.ArrowClosed, width: inBranch ? 14 : 11, height: inBranch ? 14 : 11, color: 'var(--arrow)' },
      }];
    }).concat(inBranch ? (recIn.get(focus!) ?? []).filter((r) => branch!.has(r.source)).map((r) => ({
      id: r.id, source: r.source, target: r.target, type: 'default',
      className: `rec ${r.tier}`,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: 'var(--rec)' },
    })) : []), [focus, visible, inBranch, branch]);

  // ---------- camera ----------
  // Frame the branch in the space the info card does not cover. Under 1100px the card is a
  // bottom sheet, so that space is the band above it. Wider screens keep the card on the left.
  const frameBranch = useCallback((duration: number) => {
    if (!focus || !branchPos) return;
    const stage = document.querySelector('.stage')!.getBoundingClientRect();
    const info = document.querySelector('.site .info')?.getBoundingClientRect();
    const legend = document.querySelector('.site .legend')?.getBoundingClientRect();
    const sheet = stage.width < 1100;
    const freeLeft = sheet ? 16 : (info ? info.right - stage.left + 16 : 392);
    const freeTop = sheet ? Math.max(16, legend ? legend.bottom - stage.top + 10 : 96) : 16;
    const freeBottom = sheet ? (info ? stage.bottom - info.top + 12 : 20) : (legend ? stage.bottom - legend.top + 12 : 88);
    const availW = Math.max(180, stage.width - freeLeft - 16);
    const availH = Math.max(160, stage.height - freeTop - freeBottom);
    const pts = [...branchPos.values()];
    const f = branchPos.get(focus)!;
    // elk layer pitch: card width plus spacing.nodeNodeBetweenLayers (70).
    const LAYER = CARD_W + 70;
    const PAD = 12;
    const PREFER_Z = 0.92;
    // Two columns of prerequisites plus the next act. Below this, labels get hard to read,
    // so a longer chain stays off to the left where it can be dragged into view.
    const MIN_Z = 0.64;
    const spanOf = (group: { x: number; y: number }[]) => {
      const minX = Math.min(...group.map((p) => p.x));
      const maxX = Math.max(...group.map((p) => p.x + CARD_W));
      const minY = Math.min(...group.map((p) => p.y));
      const maxY = Math.max(...group.map((p) => p.y + CARD_H));
      return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
    };
    const around = (layersLeft: number) => pts.filter((p) => p.x >= f.x - layersLeft * LAYER - 48 && p.x <= f.x + LAYER + 48);
    const zoomFor = (box: { w: number; h: number }) =>
      Math.min(PREFER_Z, (availW - PAD * 2) / box.w, (availH - PAD * 2) / box.h);
    let group = around(2);
    let z = zoomFor(spanOf(group));
    if (z < MIN_Z) {
      group = around(1);
      z = zoomFor(spanOf(group));
    }
    z = Math.max(0.64, Math.min(PREFER_Z, z));
    const box = spanOf(group);
    let tx = freeLeft + (availW - box.w * z) / 2 - box.minX * z;
    let ty = freeTop + (availH - box.h * z) / 2 - box.minY * z;
    const clamp = () => {
      if (box.minX * z + tx < freeLeft + PAD) tx += freeLeft + PAD - (box.minX * z + tx);
      if (box.maxX * z + tx > freeLeft + availW - PAD) tx -= box.maxX * z + tx - (freeLeft + availW - PAD);
      if (box.minY * z + ty < freeTop + PAD) ty += freeTop + PAD - (box.minY * z + ty);
      if (box.maxY * z + ty > freeTop + availH - PAD) ty -= box.maxY * z + ty - (freeTop + availH - PAD);
    };
    clamp();
    // Don't leave a card sliced by the side panel or the screen edge. Hide it fully
    // when pulling it in would shrink the act the reader opened past a readable size.
    const edge = freeLeft;
    const peekRight = Math.max(edge, ...pts.map((p) => {
      const left = p.x * z + tx;
      const right = (p.x + CARD_W) * z + tx;
      return left < edge - 1 && right > edge + 4 ? right : edge;
    }));
    if (peekRight > edge) {
      const wider = pts.filter((p) => {
        const left = p.x * z + tx;
        const right = (p.x + CARD_W) * z + tx;
        const chosen = p.x >= box.minX - 1 && p.x + CARD_W <= box.maxX + 1;
        return chosen || (left < edge - 1 && right > edge + 4);
      });
      const wz = zoomFor(spanOf(wider));
      if (wz >= MIN_Z) {
        group = wider;
        z = wz;
        const next = spanOf(group);
        tx = freeLeft + (availW - next.w * z) / 2 - next.minX * z;
        ty = freeTop + (availH - next.h * z) / 2 - next.minY * z;
        box.minX = next.minX; box.maxX = next.maxX; box.minY = next.minY; box.maxY = next.maxY;
        clamp();
      } else {
        const nextTx = tx - (peekRight - edge);
        const leftAfter = box.minX * z + nextTx;
        const rightAfter = box.maxX * z + nextTx;
        if (leftAfter >= freeLeft + PAD && rightAfter <= freeLeft + availW - PAD) tx = nextTx;
      }
    }
    flow.setViewport({ x: tx, y: ty, zoom: z }, { duration });
  }, [focus, branchPos, flow]);

  // Atlas at reading zoom with an act's card near the left edge (first visit: the first Archon act).
  const frameAtlasAt = useCallback((id: string, duration: number) => {
    const p = atlas.pos.get(id)!;
    const stage = document.querySelector('.stage')!.getBoundingClientRect();
    const z = 0.9;
    flow.setViewport({ x: Math.min(260, stage.width * 0.25) - p.x * z, y: 24 + HEAD * z - p.y * z, zoom: z }, { duration });
  }, [flow]);

  const fitAll = useCallback(() => flow.fitView({ padding: 0.04, duration: 500 }), [flow]);

  const lastFocus = useRef<string | null>(null);
  const firstFrame = useRef(true);
  const wantFit = useRef(false);
  useEffect(() => {
    if (focus && !branchPos) return;
    const t = setTimeout(() => {
      if (focus) frameBranch(firstFrame.current ? 0 : 550);
      else if (wantFit.current) fitAll();
      else {
        // back to where the reader was, unless that act is hidden in the chosen version
        const back = lastFocus.current && visible(questById.get(lastFocus.current)!) ? lastFocus.current : START_ACT;
        frameAtlasAt(back, firstFrame.current ? 0 : 500);
      }
      wantFit.current = false;
      firstFrame.current = false;
      lastFocus.current = focus;
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, branchPos]);

  // Refit when the window changes, or when the info card grows (the reason text opens).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const refit = () => { clearTimeout(t); t = setTimeout(() => { if (focus) frameBranch(0); }, 150); };
    window.addEventListener('resize', refit);
    const card = document.querySelector('.site .info');
    const watch = new ResizeObserver(refit);
    if (card) watch.observe(card);
    return () => { window.removeEventListener('resize', refit); watch.disconnect(); clearTimeout(t); };
  }, [frameBranch, focus]);

  const onNodesChange = useCallback((c: NodeChange[]) => setNodes((ns) => applyNodeChanges(c, ns)), []);

  const results = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    return quests.filter((q) => visible(q) && (q.level === 'ACT' || q.act)
      && ((q.names.ko ?? '').toLowerCase().includes(s) || q.names.en.toLowerCase().includes(s)))
      .sort((a, b) => Number(a.level === 'QUEST') - Number(b.level === 'QUEST') || vOrder(a) - vOrder(b))
      .slice(0, 10)
      .map((q) => ({ q, target: q.level === 'ACT' ? q : questById.get(q.act!)! }));
  }, [query, visible]);

  const sel = focus ? questById.get(focus)! : null;
  const zoomClass = zoom < 0.45 ? 'far' : zoom < 0.75 ? 'mid' : 'near';

  return (
    <div className="site graph-page">
      <div className="wrap">
        <header>
          <a className="logo" href="./" onClick={(e) => { e.preventDefault(); select(null); }}><Logo />aru.wiki</a>
          <form className="find" onSubmit={(e) => { e.preventDefault(); if (results[0]) select(results[0].target.id); }}>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="막·임무 이름 검색" />
            {results.length > 0 && (
              <ul>
                {results.map(({ q, target }) => (
                  <li key={q.id}><button type="button" className={typeClass(target)} onClick={() => select(target.id)}>
                    <i className="dot" />
                    <span className="hit">{displayName(q)}{q !== target && <em>{displayName(target)} 막</em>}</span>
                    <small>{q.first_version}</small>
                  </button></li>
                ))}
              </ul>
            )}
          </form>
          <nav>
            <select value={vIdx} onChange={(e) => setVIdx(+e.target.value)} aria-label="공개 버전">
              {versions.map((x) => <option key={x.id} value={x.order}>{x.id}까지 공개</option>).reverse()}
            </select>
          </nav>
        </header>
      </div>

      <main className={`stage ${zoomClass}${focus ? ' focusing' : ''}`}>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
          onNodeClick={(_, n) => { if (n.type === 'act') select(n.id === focus ? null : n.id); }}
          onPaneClick={() => select(null)}
          nodesConnectable={false} minZoom={0.08} maxZoom={2} proOptions={{ hideAttribution: true }}
          onlyRenderVisibleElements
        />

        {sel && neighbours && (
          <aside className={`info ${typeClass(sel)}`}>
            <div className="tags">
              <span className="tag">{TYPE_LABEL[sel.quest_type]}</span>
              {region(sel) && <span className="tag neutral">{region(sel)}</span>}
              <span className="tag neutral">{sel.first_version}</span>
              {!sel.replayable && <span className="badge">다시 플레이 불가</span>}
            </div>
            <div className="name">{displayName(sel)}</div>
            <div className="en">{sel.names.en}</div>
            <div className="meta">임무 {questsByAct.get(sel.id)?.length ?? 0}개 · 필수 선행 {neighbours.before.length} · 다음 {neighbours.after.length}</div>
            <div className="jumps">
              {neighbours.before.map((id) => <Jump key={id} id={id} dir="before" go={select} />)}
              {neighbours.after.map((id) => <Jump key={id} id={id} dir="after" go={select} />)}
            </div>
            {neighbours.recommended.length > 0 && (
              <Recs edges={neighbours.recommended} targetName={displayName(sel)} go={select} />
            )}
          </aside>
        )}

        <div className="legend" aria-label="범례">
          <span className="t-archon"><i />마신</span><span className="t-story"><i />전설</span>
          <span className="t-world"><i />월드</span><span className="t-event"><i />이벤트</span>
          <span className="ln solid">같은 이야기 흐름</span><span className="ln dashed">다른 흐름에서 오는 선행</span>
          {focus && <span className="ln rec">권장 순서 (필수 아님)</span>}
          <span className="hint">왼쪽 → 오른쪽으로 진행 · 막을 누르면 갈래 보기 · 끌어서 이동</span>
        </div>
        <div className="controls">
          {!focus && zoom < 0.45 ? (
            <button className="secondary" onClick={() => {
              const st = document.querySelector('.stage')!.getBoundingClientRect();
              const c = flow.screenToFlowPosition({ x: st.left + st.width / 2, y: st.top + st.height / 2 });
              flow.setCenter(c.x, c.y, { zoom: 0.9, duration: 450 });
            }}>읽기 크기로</button>
          ) : (
            <button className="secondary" onClick={() => { if (focus) { wantFit.current = true; select(null); } else fitAll(); }}>전체 보기</button>
          )}
        </div>
      </main>
    </div>
  );
}

function Jump({ id, dir, go }: { id: string; dir: 'before' | 'after'; go: (id: string) => void }) {
  const q = questById.get(id)!;
  const name = displayName(q);
  return (
    <button className={`jump ${typeClass(q)}`} onClick={() => go(id)} title={name}>
      {dir === 'before' && <span className="arrow">←</span>}
      <span className="label">{name}</span>
      {dir === 'after' && <span className="arrow">→</span>}
    </button>
  );
}

// Recommended acts as a short list. The long verdict stays behind one control, and the
// unreviewed mark is shown once for the whole list.
function Recs({ edges, targetName, go }: { edges: RecommendedEdge[]; targetName: string; go: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const items = edges.map((edge) => {
    const q = questById.get(edge.source)!;
    const name = displayName(q);
    return { edge, q, name, gist: recommendationGist(edge.reason_ko, name) };
  });
  const lead = recommendationLead(items.map((it) => ({ name: it.name, reason: it.edge.reason_ko })), targetName);
  const llm = edges.some((e) => e.basis === 'llm');
  const strong = edges.some((e) => e.tier === 'strong');
  return (
    <section className="recs">
      <div className="recs-head">
        <h3>먼저 하면 좋은 이야기</h3>
        {llm && <span className="tag neutral" title="LLM 판정 후 다른 회사 모델이 검증했습니다. 사람 검수 전입니다.">미검수</span>}
      </div>
      {lead && <p className="recs-lead">{lead}</p>}
      <ul className="rec-list">
        {items.map(({ edge, q, name, gist }) => (
          <li key={edge.id} className={`rec-${edge.tier}`}>
            <button type="button" className={`rec-jump ${typeClass(q)}`} onClick={() => go(edge.source)}>
              <span className="rec-title">{name}</span>
              <span className="rec-meta">{q.first_version}{!q.replayable && ' · 다시 플레이 불가'}</span>
            </button>
            <p className="rec-gist">{gist}</p>
          </li>
        ))}
      </ul>
      <button type="button" className="rec-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? '이유 접기' : '이유 전문 보기'}
      </button>
      {open && (
        <div className="rec-full">
          {strong && <span className="badge">스포일러 주의</span>}
          {items.map(({ edge, name }) => (
            <div key={edge.id}>
              <strong>{name}</strong>
              {edge.tier !== 'strong' && <span className="tag neutral">{edge.tier === 'medium' ? '배경 이해' : '참고'}</span>}
              <p>{edge.reason_ko}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------- node renderers ----------
type ActData = { quest: Quest; state: '' | 'focus'; showVersion: boolean };
const ActNode = memo(({ data }: NodeProps<Node<ActData>>) => (
  <div className={`card-node ${typeClass(data.quest)} ${data.state}`} title={data.quest.names.ko ? `${data.quest.names.ko} (${data.quest.names.en})` : data.quest.names.en}>
    <Handle type="target" position={Position.Left} />
    <span className="name">{displayName(data.quest)}</span>
    {data.showVersion && <span className="ver">{data.quest.first_version}</span>}
    <Handle type="source" position={Position.Right} />
  </div>
));
type LabelData = { text: string; kind: 'era' | 'ver' };
const LabelNode = memo(({ data }: NodeProps<Node<LabelData>>) => <div className={`atlas-label ${data.kind}`}>{data.text}</div>);
const nodeTypes = { act: ActNode, label: LabelNode };
