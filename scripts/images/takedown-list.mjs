// The takedown blocklist (data/manual/takedown.json, docs/takedown.md), read by the scripts that
// fetch or ship rights-holder material. One entry per request; each lists what it blocks:
//   characters  Fandom page names: no icon is fetched or shown for them (cards show the emblem)
//   files       paths under public/ ("img/characters/X.png"): never fetched, removed locally
//   acts        act ids: the card shows its region emblem instead of the icon
//   pages       Fandom page names whose text must not be shipped (articles, snapshots, theme)
//   videos      YouTube video IDs never shown on an article (data/generated/videos.json is filtered
//               by scripts/youtube/refresh.mjs and scripts/build-runtime-data.mjs)
// Written by scripts/takedown.mjs; a person may also edit it by hand.
import { existsSync, readFileSync } from 'node:fs';

export const TAKEDOWN_FILE = new URL('../../data/manual/takedown.json', import.meta.url);
export const KINDS = ['characters', 'files', 'acts', 'pages', 'videos'];

export function readTakedown() {
  return existsSync(TAKEDOWN_FILE) ? JSON.parse(readFileSync(TAKEDOWN_FILE, 'utf8')) : { entries: [] };
}

/** Everything blocked, merged over all entries: { characters, files, acts, pages, videos } as Sets. */
export function blocked(data = readTakedown()) {
  const out = Object.fromEntries(KINDS.map((k) => [k, new Set()]));
  for (const e of data.entries ?? []) for (const k of KINDS) for (const v of e[k] ?? []) out[k].add(v);
  return out;
}

/** True when an image-files.json record must not be fetched or shipped. */
export const recordBlocked = (b, rec) => b.files.has(rec.file) || b.characters.has(rec.character);

/**
 * videos.json `pages` ({ page: [{ id, role, ... }] }) without blocked video IDs: a copy, pages left
 * empty are dropped, and a page that lost its main video promotes its first remaining one.
 * Returns { pages, dropped } (dropped = the removed IDs).
 */
export function dropBlockedVideos(pages, b = blocked()) {
  const out = {};
  const dropped = new Set();
  for (const [page, list] of Object.entries(pages ?? {})) {
    const kept = list.filter((x) => (b.videos.has(x.id) ? (dropped.add(x.id), false) : true));
    if (!kept.length) continue;
    if (list.some((x) => x.role === 'main') && !kept.some((x) => x.role === 'main')) kept[0] = { ...kept[0], role: 'main' };
    out[page] = kept;
  }
  return { pages: out, dropped: [...dropped] };
}
