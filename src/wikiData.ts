// The wiki's lists by version (scripts/split/build.mjs): the chart's stars and lines, pages, red-link
// names, official videos, recent changes, and where each page's texts are. Built from the blocks
// that cover versions 0..v, so nothing revealed after v is downloaded. Asking for a later version
// fetches the blocks it adds and builds the state again; asking for an earlier one keeps what is
// loaded (the views filter by version themselves).
import type { RecentRow } from './RecentChanges';
import type { PageNode, PageLink, PageVideo, RedName, Theme } from './lore';
import { fetchCover, langData, split, startVersion } from './split';

interface WikiBlock {
  nodes?: (PageNode & { p?: number[] })[];
  extra?: PageNode[];
  links?: PageLink[];
  refs?: [string, string, number][];
  red?: [string, number][];
  videos?: [string, PageVideo][];
  recent?: RecentRow[];
  /** [page, 'a' (an article) | 'h' (snapshots and timeline of a version), file hash] */
  texts?: [string, 'a' | 'h', string][];
}

/** the chart as WikiGraph3D reads it, with the data build's layout for the stars it has */
export type Chart = Theme & { layout?: { version?: number | null; lastOrder: number; portrait: number[]; landscape: number[] } };

export interface WikiState {
  /** loaded up to this version order */
  upTo: number;
  chart: Chart;
  /** pages with an article that are not stars */
  extra: PageNode[];
  red: RedName[];
  videos: Record<string, PageVideo[]>;
  recent: RecentRow[];
  texts: Map<string, { a: string[]; h: string[] }>;
}

let pending: { v: number; p: Promise<WikiState> } | null = null;

/** The wiki state with everything revealed at or before version order v (or later, if already loaded). */
export function loadWiki(v: number): Promise<WikiState> {
  if (pending && pending.v >= v) return pending.p;
  const p = build(v);
  const mine = { v, p };
  pending = mine;
  p.catch(() => { if (pending === mine) pending = null; });
  return p;
}
/**
 * The state of the latest loadWiki call (WikiGraph3D and the quest map's search start one); before
 * any, the version the address asks for, never more.
 */
export const latestWiki = (): Promise<WikiState> => pending?.p ?? loadWiki(startVersion());

async function build(v: number): Promise<WikiState> {
  const blocks = await fetchCover<WikiBlock>(langData().wiki, v);
  const all = <K extends keyof WikiBlock>(k: K) => blocks.flatMap((b) => (b[k] ?? []) as unknown[]) as NonNullable<WikiBlock[K]>;
  const nodes = all('nodes');
  const placed = nodes.every((n) => n.p?.length === 6);
  const chart: Chart = {
    page: split.chart.hub,
    nodes: nodes.map(({ p: _p, ...n }) => n),
    links: all('links'),
    refs: all('refs'),
    layout: placed ? {
      version: split.chart.layoutVersion, lastOrder: split.chart.lastOrder,
      portrait: nodes.flatMap((n) => n.p!.slice(0, 3)), landscape: nodes.flatMap((n) => n.p!.slice(3, 6)),
    } : undefined,
  };
  const videos: Record<string, PageVideo[]> = {};
  for (const [page, x] of all('videos')) (videos[page] ??= []).push(x);
  for (const list of Object.values(videos)) list.sort((a, b) => Number(!!b.main) - Number(!!a.main) || a.v - b.v);
  const texts = new Map<string, { a: string[]; h: string[] }>();
  for (const [page, kind, hash] of all('texts')) (texts.get(page) ?? texts.set(page, { a: [], h: [] }).get(page)!)[kind].push(hash);
  return {
    upTo: v, chart, extra: all('extra'),
    red: all('red').sort((a, b) => a[0].localeCompare(b[0], 'ko')),
    videos,
    recent: all('recent').sort((a, b) => (a.t < b.t ? 1 : a.t > b.t ? -1 : 0)),
    texts,
  };
}
