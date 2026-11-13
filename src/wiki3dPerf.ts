// Testing only: a bigger star chart made by copying the real one, to see how the 3D view copes with
// the ~1,400 stars the finished wiki will have. Used only in the dev server, or in a build made with
// VITE_PERF3D=1, and only when the address asks for it (`?stars=1400`). The copies carry no content
// of their own and are never part of a normal build (the flag is false there, so this file drops out).
import type { PageLink, PageNode, Theme } from './lore';

/** The star count asked for by `?stars=`, when this build allows it; otherwise null. */
export function perfStars(): number | null {
  if (!(import.meta.env.DEV || import.meta.env.VITE_PERF3D)) return null;
  const n = Number(new URLSearchParams(location.search).get('stars'));
  return Number.isFinite(n) && n > 0 ? Math.min(5000, Math.round(n)) : null;
}

/**
 * Copy the chart's pages until it has `target` stars. Copy k of a page gets the id `<id>~k` and a
 * name with k after it; lines and references are copied inside each copy, and a copy's lines to the
 * centre page stay on the one centre page, so every copy hangs off the same Teyvat.
 */
export function inflateChart(t: Theme, target: number): Theme {
  const hub = new Set(t.nodes.filter((n) => n.hub).map((n) => n.id));
  const base = t.nodes.filter((n) => !hub.has(n.id));
  const nodes: PageNode[] = [...t.nodes];
  const links: PageLink[] = [...t.links];
  const refs: [string, string, number][] = [...(t.refs ?? [])];
  const end = (id: string, k: number) => (hub.has(id) ? id : `${id}~${k}`);
  for (let k = 2; nodes.length < target && base.length; k++) {
    const have = new Set<string>(hub);
    for (const n of base) {
      if (nodes.length >= target) break;
      nodes.push({ ...n, id: `${n.id}~${k}`, ko: `${n.ko ?? n.id}${k}` });
      have.add(n.id);
    }
    for (const l of t.links) {
      const s = l.source as string, d = l.target as string;
      if (have.has(s) && have.has(d) && !(hub.has(s) && hub.has(d))) links.push({ ...l, source: end(s, k), target: end(d, k) });
    }
    for (const [a, b, both] of t.refs ?? []) if (have.has(a) && have.has(b)) refs.push([end(a, k), end(b, k), both]);
  }
  return { ...t, nodes, links, refs };
}
