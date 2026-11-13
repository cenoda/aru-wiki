import {
  Background, Controls, type Edge, Handle, MarkerType, MiniMap, type Node, type NodeProps, Position,
  ReactFlow, ReactFlowProvider, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo, useEffect, useMemo, useState } from 'react';
import { actGraph, displayName, type Quest, questById, quests, TYPE_LABEL, versionOrder, versions } from './data';
import { BY_SA_3, Lic, LicensePageLink } from './license';
import { type LayoutMode, layoutActs, NODE_H, NODE_W } from './layout';

type ActData = { quest: Quest; dim: boolean; selected: boolean };
type ActNode = Node<ActData, 'act'>;

const ActNodeView = memo(({ data }: NodeProps<ActNode>) => {
  const q = data.quest;
  return (
    <div className={`act act-${q.quest_type.toLowerCase()}${data.dim ? ' dim' : ''}${data.selected ? ' sel' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="act-name" title={q.names.en}>{displayName(q)}</div>
      <div className="act-meta">
        <span className="chip">{TYPE_LABEL[q.quest_type]}</span>
        <span>{q.first_version ?? '?'}</span>
        {!q.replayable && <span className="gone">다시 플레이 불가</span>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

const nodeTypes = { act: ActNodeView };
const START_ACT = 'act_the_outlander_who_caught_the_wind';
const TYPE_COLOR: Record<string, string> = { ARCHON: '#c08a1e', STORY: '#7b5cc4', WORLD: '#2a8f84', EVENT: '#c4612f' };
const { acts, edges: actEdges } = actGraph();
const questsByAct = Map.groupBy(quests.filter((q) => q.level === 'QUEST' && q.act), (q) => q.act!);

function Graph() {
  const params = new URLSearchParams(location.search);
  const [mode, setMode] = useState<LayoutMode>((params.get('mode') as LayoutMode) ?? 'depth');
  const [vIdx, setVIdx] = useState(() => {
    const v = params.get('v');
    return v && versionOrder.has(v) ? versionOrder.get(v)! : versions.length - 1;
  });
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const flow = useReactFlow();

  useEffect(() => {
    let live = true;
    setPositions(null);
    layoutActs(acts, actEdges, mode).then((p) => { if (live) setPositions(p); });
    return () => { live = false; };
  }, [mode]);

  // First view: the start of the Archon story at reading zoom; `?fit` shows everything.
  useEffect(() => {
    if (!positions) return;
    requestAnimationFrame(() => {
      const start = positions.get(START_ACT);
      if (params.has('fit') || !start) { flow.fitView({ padding: 0.05 }); return; }
      const zoom = Number(params.get('zoom') ?? 0.8);
      const h = document.querySelector('main')?.clientHeight ?? 800;
      flow.setViewport({ x: 40 - start.x * zoom, y: h / 2 - start.y * zoom, zoom });
    });
  }, [positions, flow]);

  const neighbors = useMemo(() => {
    if (!selected) return null;
    const s = new Set([selected]);
    for (const e of actEdges) {
      if (e.source === selected) s.add(e.target);
      if (e.target === selected) s.add(e.source);
    }
    return s;
  }, [selected]);

  const visible = (q: Quest) => (versionOrder.get(q.first_version ?? '') ?? 0) <= vIdx;

  const nodes: ActNode[] = useMemo(() => {
    if (!positions) return [];
    return acts.filter(visible).map((q) => ({
      id: q.id,
      type: 'act',
      width: NODE_W, height: NODE_H,
      position: positions.get(q.id) ?? { x: 0, y: 0 },
      data: { quest: q, dim: !!neighbors && !neighbors.has(q.id), selected: q.id === selected },
    }));
  }, [positions, vIdx, neighbors, selected]);

  const edges: Edge[] = useMemo(() => actEdges
    .filter((e) => e.revealed <= vIdx && visible(questById.get(e.source)!) && visible(questById.get(e.target)!))
    .map((e) => {
      const hot = !!selected && (e.source === selected || e.target === selected);
      return {
        id: e.id, source: e.source, target: e.target, type: 'default',
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        className: hot ? 'hot' : neighbors ? 'cold' : '',
      };
    }), [vIdx, selected, neighbors]);

  const sel = selected ? questById.get(selected) : null;
  const v = versions[vIdx];

  return (
    <div className="app">
      <header>
        <h1>원신 임무 그래프 <small>1단계 프로토타입 · 막 {nodes.length}개 · 선 {edges.length}개</small></h1>
        <div className="tools">
          <label>배치
            <select value={mode} onChange={(e) => setMode(e.target.value as LayoutMode)}>
              <option value="depth">선행 깊이</option>
              <option value="version">버전 축</option>
            </select>
          </label>
          <label className="slider">버전 <b>{v.id}</b>{v.number !== v.id && <small> ({v.number})</small>}
            <input type="range" min={0} max={versions.length - 1} value={vIdx} onChange={(e) => setVIdx(+e.target.value)} />
            <small>{v.released}</small>
          </label>
        </div>
      </header>
      <main>
        {!positions && <div className="loading">배치 계산 중…</div>}
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelected(n.id === selected ? null : n.id)}
          onPaneClick={() => setSelected(null)}
          nodesDraggable={false} nodesConnectable={false} minZoom={0.05} maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable nodeColor={(n) => TYPE_COLOR[(n.data as ActData).quest.quest_type]} />
        </ReactFlow>
        {sel && (
          <aside>
            <h2>{displayName(sel)}</h2>
            <p className="en">{sel.names.en}</p>
            <p>{TYPE_LABEL[sel.quest_type]} · {sel.first_version}{sel.event ? ` · ${sel.event}` : ''}</p>
            <h3>소속 임무</h3>
            <ol>{(questsByAct.get(sel.id) ?? []).filter(visible).map((q) => <li key={q.id}>{displayName(q)}</li>)}</ol>
            <p className="src"><a href={sel.sources[0].revision ? `${sel.sources[0].url}?oldid=${sel.sources[0].revision}` : sel.sources[0].url} target="_blank" rel="noreferrer">Fandom 출처</a> (<a href={`${sel.sources[0].url}?action=history`} target="_blank" rel="noreferrer">기여자</a>, <Lic l={BY_SA_3} />) · <LicensePageLink>안내</LicensePageLink></p>
          </aside>
        )}
      </main>
    </div>
  );
}

export default function MapView() {
  return <ReactFlowProvider><Graph /></ReactFlowProvider>;
}
