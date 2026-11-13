// Where each star of the 3D chart sits. Shared by the browser (src/WikiGraph3D.tsx) and the data
// build (scripts/build-runtime-data.mjs), which lays the chart out ahead of time so a phone does not
// spend seconds on it: 500 steps of a force layout over ~1,400 stars is the slowest part of opening
// the chart. Plain JavaScript so Node can run it without a TypeScript step; types in chartLayout.d.ts.
//
// The forces are the ones 3d-force-graph used to run for the chart (three-forcegraph's defaults plus
// the chart's own), in the same order, so the layout is the same as before:
// - links pull pages that share stories together (closer when they share more),
// - every page pushes the others away (charge),
// - ecliptic: a strong pull to each page's height (its version on the time axis), a gentle one to
//   the middle in the plane; pages with no lines are pulled in harder instead of drifting to the rim,
// - the centre page sits on the plane (y = 0) but is not pinned in it.
import { forceCenter, forceLink, forceManyBody, forceSimulation, forceX, forceY, forceZ } from 'd3-force-3d';

/** steps of the layout before the chart is drawn (it does not move afterwards) */
export const LAYOUT_TICKS = 500;

/**
 * Length of the time axis. Landscape: 170. Portrait screens get a taller axis so the chart fills their
 * height; a bigger chart spreads wider on its plane (about with the root of its page count), and on a
 * portrait screen, fitted by its width, the axis grows with it so the chart does not end up a thin strip.
 */
export const timeSpan = (pageCount, portrait) => (portrait ? 330 * Math.max(1, Math.sqrt(pageCount / 64)) : 170);

/** height of a version on the time axis: earlier versions low, later high */
export const heightOf = (order, lastOrder, span) => ((order - lastOrder / 2) / lastOrder) * span;

const endId = (end) => (typeof end === 'string' ? end : end.id);

/**
 * Lay the chart out. Returns x, y, z for each node in `chart.nodes` order, as one flat array.
 * @param {{ nodes: { id: string, hub: boolean, revealed: number }[], links: { source: string | { id: string }, target: string | { id: string }, shared: number }[] }} chart
 * @param {number} lastOrder the last version's order (versions.length - 1)
 * @param {boolean} portrait
 */
export function layoutChart(chart, lastOrder, portrait) {
  const span = timeSpan(chart.nodes.length, portrait);
  const maxShared = Math.max(2, ...chart.links.map((l) => l.shared));
  const strength = (l) => Math.log(l.shared / 2 + 1) / Math.log(maxShared / 2 + 1);
  const linked = new Set(chart.links.flatMap((l) => [endId(l.source), endId(l.target)]));
  const nodes = chart.nodes.map((n) => (n.hub ? { id: n.id, hub: true, revealed: n.revealed, fy: 0 } : { id: n.id, hub: false, revealed: n.revealed }));
  const links = chart.links.map((l) => ({ source: endId(l.source), target: endId(l.target), shared: l.shared }));
  const pull = (n) => (linked.has(n.id) ? 0.03 : 0.25);
  // three-forcegraph's simulation: link, charge, centre; alpha decay 0.0228; charge -60 in 3D
  const sim = forceSimulation().force('link', forceLink()).force('charge', forceManyBody()).force('center', forceCenter()).stop();
  sim.alphaDecay(0.0228).velocityDecay(0.3);
  sim.force('y', forceY((n) => (n.hub ? 0 : heightOf(n.revealed, lastOrder, span))).strength(0.9))
    .force('x', forceX(0).strength(pull))
    .force('z', forceZ(0).strength(pull));
  sim.force('charge').strength(-90);
  sim.force('link').distance((l) => 18 + 30 * (1 - strength(l)));
  sim.alpha(1).numDimensions(3).nodes(nodes);
  sim.force('link').id((d) => d.id).links(links);
  for (let i = 0; i < LAYOUT_TICKS; i++) sim.tick();
  const out = new Array(nodes.length * 3);
  nodes.forEach((n, i) => {
    out[i * 3] = Math.round(n.x * 100) / 100;
    out[i * 3 + 1] = Math.round((n.y ?? 0) * 100) / 100;
    out[i * 3 + 2] = Math.round(n.z * 100) / 100;
  });
  return out;
}
