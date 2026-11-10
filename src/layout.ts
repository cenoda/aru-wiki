import ELK from 'elkjs/lib/elk.bundled.js';
import type { ActEdge, Quest } from './data';
import { questById, versionOrder } from './data';

export type LayoutMode = 'depth' | 'version';
type Pos = { x: number; y: number };

export const NODE_W = 200;
export const NODE_H = 56;
const GAP = 120; // between the main graph and the small series below it

const elk = new ELK();

/**
 * Left-to-right layered layout of the act graph.
 * - The largest connected component (the Archon spine and everything hanging off it)
 *   is laid out first; small independent series are stacked in rows underneath.
 * - depth: columns follow prerequisite depth. version: columns follow release order.
 * - Archon→Archon edges get high straightness priority so the main story reads as a line.
 */
export async function layoutActs(acts: Quest[], edges: ActEdge[], mode: LayoutMode) {
  const comps = components(acts, edges).sort((a, b) => b.length - a.length);
  const [main, ...small] = comps;
  const out = new Map<string, Pos>();

  const mainBox = await layoutComponent(main, edges, mode, out, 0, 0);

  // Shelf-pack the small series below the main graph, rows as wide as the main graph.
  const rowWidth = Math.max(mainBox.w, 2400);
  let x = 0, y = mainBox.h + GAP, rowH = 0;
  for (const comp of small) {
    const box = await layoutComponent(comp, edges, mode, new Map(), 0, 0);
    if (x > 0 && x + box.w > rowWidth) { x = 0; y += rowH + 60; rowH = 0; }
    await layoutComponent(comp, edges, mode, out, x, y);
    x += box.w + 80;
    rowH = Math.max(rowH, box.h);
  }
  return out;
}

async function layoutComponent(ids: string[], allEdges: ActEdge[], mode: LayoutMode, out: Map<string, Pos>, ox: number, oy: number) {
  const set = new Set(ids);
  const edges = allEdges.filter((e) => set.has(e.source) && set.has(e.target));
  const isArchon = (id: string) => questById.get(id)?.quest_type === 'ARCHON';
  const res = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'SPLINES',
      'elk.layered.spacing.nodeNodeBetweenLayers': '70',
      'elk.spacing.nodeNode': '18',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      ...(mode === 'version' ? { 'elk.partitioning.activate': 'true' } : {}),
    },
    children: ids.map((id) => ({
      id, width: NODE_W, height: NODE_H,
      ...(mode === 'version'
        ? { layoutOptions: { 'elk.partitioning.partition': String(versionOrder.get(questById.get(id)?.first_version ?? '') ?? 0) } }
        : {}),
    })),
    edges: edges.map((e) => ({
      id: e.id, sources: [e.source], targets: [e.target],
      ...(isArchon(e.source) && isArchon(e.target)
        ? { layoutOptions: { 'elk.layered.priority.straightness': '20', 'elk.layered.priority.shortness': '10' } }
        : {}),
    })),
  });
  let w = 0, h = 0;
  for (const c of res.children ?? []) {
    out.set(c.id, { x: ox + (c.x ?? 0), y: oy + (c.y ?? 0) });
    w = Math.max(w, (c.x ?? 0) + NODE_W);
    h = Math.max(h, (c.y ?? 0) + NODE_H);
  }
  return { w, h };
}

function components(acts: Quest[], edges: ActEdge[]) {
  const adj = new Map(acts.map((a) => [a.id, [] as string[]]));
  for (const e of edges) { adj.get(e.source)?.push(e.target); adj.get(e.target)?.push(e.source); }
  const seen = new Set<string>();
  const out: string[][] = [];
  // Keep data order (release-sorted below) so ELK's model-order tie-breaking follows time.
  const ordered = [...acts].sort((a, b) =>
    (versionOrder.get(a.first_version ?? '') ?? 0) - (versionOrder.get(b.first_version ?? '') ?? 0));
  const rank = new Map(ordered.map((q, i) => [q.id, i]));
  for (const a of ordered) {
    if (seen.has(a.id)) continue;
    const comp: string[] = [];
    const stack = [a.id];
    while (stack.length) {
      const v = stack.pop()!;
      if (seen.has(v)) continue;
      seen.add(v); comp.push(v);
      stack.push(...(adj.get(v) ?? []));
    }
    out.push(comp.sort((x, y) => rank.get(x)! - rank.get(y)!));
  }
  return out;
}
