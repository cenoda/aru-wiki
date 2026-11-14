// The site's data, split by version (scripts/split/build.mjs, design.md 6절). Every data file is
// /assets/d/<hash>.json; this module knows which hashes hold the versions up to v. Nothing here
// fetches anything revealed after the version asked for.
import index from '../data/runtime/split-index.json';
import { coverOf } from '../scripts/split/blocks.mjs';

export interface SplitIndex {
  n: number;
  versions: { id: string; number: string; order: number; released: string }[];
  chart: {
    hub: string; total: number; layoutVersion: number | null; lastOrder: number;
    /** the whole chart's scale (scripts/split/build.mjs), so stars look the same whatever is loaded */
    maxShared: number; topUnits: number; namedMinUnits: number;
    /** the whole chart's camera frame: 90th-percentile radius and sample places [x, y, z, …] of linked stars */
    frame: Record<'portrait' | 'landscape', { r90: number; pts: number[] } | null> | null;
  };
  quests: (string | null)[];
  lang: Record<string, { wiki: (string | null)[]; search: (string | null)[]; names: string }>;
}
export const split = index as SplitIndex;
/** the site's language (an English site would pick `en` here) */
export const LANG = 'ko';
export const langData = () => split.lang[LANG];

const cache = new Map<string, Promise<unknown>>();
/** One data file by its hash, fetched once (a failed fetch is tried again next time). */
export function fetchData<T>(hash: string): Promise<T> {
  let p = cache.get(hash);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}assets/d/${hash}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`data ${hash}: HTTP ${r.status}`))));
    p.catch(() => cache.delete(hash));
    cache.set(hash, p);
  }
  return p as Promise<T>;
}

/** The blocks of one family (by block number - 1) that hold versions 0..v, fetched. */
export async function fetchCover<T>(blocks: (string | null)[], v: number): Promise<T[]> {
  const hashes = coverOf(Math.max(0, Math.min(v, split.n - 1))).map((i) => blocks[i - 1]).filter((h): h is string => !!h);
  return Promise.all(hashes.map((h) => fetchData<T>(h)));
}

/** The version order the address asks for (`?v=`), or null. */
export function versionFromUrl(): number | null {
  const v = new URLSearchParams(location.search).get('v');
  const hit = v ? split.versions.find((x) => x.id === v) : undefined;
  return hit ? hit.order : null;
}
/** The version a view opens at: the address's, else the latest. */
export const startVersion = () => versionFromUrl() ?? split.n - 1;
