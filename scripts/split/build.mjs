// The site's data, split by version (design.md 1절 3번, 6절): the browser downloads only what was
// revealed at or before the version the reader chose, whatever they do on screen or in the
// developer tools. Reads data/runtime/ (scripts/build-runtime-data.mjs: the full data, used by the
// build and the search-engine pages, never fetched by the site) and writes
//
//   public/assets/d/<hash>.json   every file the site fetches, named by a hash of its content, so a
//                                 name says nothing about the page inside (and /assets/* is cached
//                                 for a year by the server: a changed file gets a new name)
//   data/runtime/split-index.json bundled into the JS: the block hashes, version ids, layout facts
//
// Lists (stars, lines, names, quests, videos, recent changes, where each page's texts are) go in
// version blocks (scripts/split/blocks.mjs): block i holds what was revealed at orders lo..hi, and
// the site fetches the few blocks that cover 0..v. Texts (article bodies, snapshots, timelines) are
// one file per page and version; their hashes are listed only in the block of the version they are
// revealed at. Body search has its own index per block. A thing is revealed at the later of its own
// version and its page's (an article written from a 1.0 wiki page about something met in 4.0 is 4.0).
//
// Language: texts sit under `lang.<code>` in the index (only `ko` now), so an English site can add
// its own blocks next to them without changing the paths. Quest data carries both names and is shared.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { buildSearchIndex } from '../search/build-index.mjs';
import { articlePieces } from '../search/text.mjs';
import { blockRange, blocksWith } from './blocks.mjs';
import { nameKey } from './names.mjs';
import { REGIONS } from './regions.mjs';

const root = new URL('../../', import.meta.url);
const runtime = new URL('data/runtime/', root);
const outDir = new URL('public/assets/d/', root);
const read = async (f) => JSON.parse(await readFile(new URL(f, runtime), 'utf8'));

const [graph, chart, snapshots, extraPages, recent, videos, red] = await Promise.all([
  read('graph.json'), read('chart.json'), read('snapshots-khaenriah.json'), read('pages.json'),
  read('recent.json'), read('videos.json'), read('redlinks.json'),
]);
const N = graph.versions.length;
const LAST = N - 1;
const vOrder = new Map(graph.versions.map((v) => [v.id, v.order]));

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
let files = 0, bytes = 0;
const written = new Set();
/** write a JSON file named by its content; returns the name (without .json) */
async function put(data) {
  const text = JSON.stringify(data);
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 16);
  if (!written.has(hash)) {
    written.add(hash);
    await writeFile(new URL(`${hash}.json`, outDir), text);
    files++; bytes += Buffer.byteLength(text);
  }
  return hash;
}

/** n empty blocks; add(o, key, value) puts the value in every block that holds order o */
function blockSet(make) {
  const blocks = Array.from({ length: N }, make);
  return {
    blocks,
    add(o, key, value) {
      if (!(o >= 0 && o <= LAST)) throw new Error(`order ${o} out of range for ${key}`);
      for (const i of blocksWith(o, N)) blocks[i - 1][key].push(value);
    },
  };
}
/** drop empty arrays, write each non-empty block; [hash | null] by block number - 1 */
async function writeBlocks(blocks) {
  const out = [];
  for (const b of blocks) {
    const kept = Object.fromEntries(Object.entries(b).filter(([, v]) => !Array.isArray(v) || v.length));
    out.push(Object.keys(kept).length ? await put(kept) : null);
  }
  return out;
}

// ---------- quests (the quest map, and quest names in the search box) ----------
// Units (series, events…) list their quests, the acts they hang on and the series after them; each of
// those links is revealed with the later of its two ends, so a 1.0 series does not name its 4.0 quest.
// a quest whose version the wiki does not give comes with the latest version only (two Nod-Krai
// quests; the site used to show them from 1.0, naming their region early)
const questOrder = new Map(graph.quests.map((q) => [q.id, vOrder.get(q.first_version) ?? LAST]));
const unitOrder = new Map(graph.units.units.map((u) => [u.id, vOrder.get(u.first_version) ?? LAST]));
const orderOf = (id) => questOrder.get(id) ?? unitOrder.get(id) ?? LAST;
const Q = blockSet(() => ({ versions: [], quests: [], questEdges: [], units: [], members: [], attach: [], next: [], regionEntry: [], regions: [], recommended: [], figureActs: [], figureNames: [], imageFiles: [] }));
for (const v of graph.versions) {
  const { id, number, order, released, ...detail } = v; // id, number, order and date are in the index
  Q.add(order, 'versions', { order, ...detail });
}
for (const q of graph.quests) Q.add(questOrder.get(q.id), 'quests', q);
for (const e of graph.questEdges) Q.add(Math.max(vOrder.get(e.revealed_version) ?? 0, orderOf(e.source), orderOf(e.target)), 'questEdges', e);
for (const u of graph.units.units) {
  const { members, attach, next, ...rest } = u;
  const o = unitOrder.get(u.id);
  Q.add(o, 'units', { ...rest, attach: { basis: attach.basis } });
  members.forEach((m, i) => Q.add(Math.max(o, orderOf(m)), 'members', [u.id, m, i]));
  attach.acts.forEach((a, i) => Q.add(Math.max(o, orderOf(a)), 'attach', [u.id, a, i]));
  (next ?? []).forEach((n, i) => Q.add(Math.max(o, orderOf(n)), 'next', [u.id, n, i]));
}
for (const [region, act] of Object.entries(graph.units.region_entry)) Q.add(orderOf(act), 'regionEntry', [region, act]);
// a region's name and emblem arrive with its first quest (or the act that enters it)
{
  const first = new Map();
  for (const x of [...graph.quests, ...graph.units.units]) if (x.region) first.set(x.region, Math.min(first.get(x.region) ?? LAST, orderOf(x.id)));
  for (const [region, act] of Object.entries(graph.units.region_entry)) first.set(region, Math.min(first.get(region) ?? LAST, orderOf(act)));
  for (const [region, o] of first) if (REGIONS[region]) Q.add(o, 'regions', [region, REGIONS[region].ko ?? null, REGIONS[region].emblem]);
}
for (const e of graph.recommended) Q.add(Math.max(vOrder.get(e.revealed_version) ?? 0, orderOf(e.source), orderOf(e.target)), 'recommended', e);
for (const [act, { character }] of Object.entries(graph.figures.acts)) {
  Q.add(orderOf(act), 'figureActs', [act, character]);
  Q.add(orderOf(act), 'figureNames', [character, graph.figures.characters[character]?.ko ?? null]);
}
for (const f of graph.imageFiles) Q.add(vOrder.get(f.release_version) ?? LAST, 'imageFiles', f);
const questBlocks = await writeBlocks(Q.blocks);

// ---------- the wiki: stars, lines, page texts, names, videos, recent changes ----------
const revealedOf = new Map([...chart.nodes, ...extraPages].map((n) => [n.id, n.revealed]));
const pageAt = (p) => revealedOf.get(p) ?? LAST;
const at = (p, o) => Math.max(o, pageAt(p));
const layout = chart.layout;
const W = blockSet(() => ({ nodes: [], extra: [], links: [], refs: [], red: [], videos: [], recent: [], texts: [] }));
// a star with no line in the whole chart gets a dotted line to the centre star (src/WikiGraph3D.tsx);
// one whose lines all come at later versions does not, as before the split
const hasLine = new Set(chart.links.flatMap((l) => [l.source, l.target]));
chart.nodes.forEach((n, i) => {
  // the star's place from the data build's layout: portrait x y z, landscape x y z (rounded to 0.1)
  const p = layout ? [...layout.portrait.slice(i * 3, i * 3 + 3), ...layout.landscape.slice(i * 3, i * 3 + 3)].map((x) => Math.round(x * 10) / 10) : undefined;
  W.add(n.revealed, 'nodes', { ...n, ...(p ? { p } : {}), ...(hasLine.has(n.id) || n.hub ? {} : { lone: 1 }) });
});
for (const n of extraPages) W.add(n.revealed, 'extra', n);
for (const l of chart.links) W.add(Math.max(l.revealed, pageAt(l.source), pageAt(l.target)), 'links', l);
for (const r of chart.refs ?? []) W.add(Math.max(pageAt(r[0]), pageAt(r[1])), 'refs', r);
for (const r of red) W.add(r[1], 'red', r);
for (const [page, list] of Object.entries(videos)) for (const v of list) W.add(at(page, v.v), 'videos', [page, v]);
for (const r of recent) W.add(Math.min(LAST, r.g), 'recent', r);

// page texts: an article per version, and the snapshots and timeline entries of each version together
const slugOf = (page) => page.replace(/[^A-Za-z0-9]+/g, '_'); // = build-runtime-data.mjs articleSlug
const pagesWithText = [...new Set([...chart.nodes.map((n) => n.id), ...extraPages.map((n) => n.id), ...Object.keys(snapshots)])];
const searchDocs = [];
for (const page of pagesWithText) {
  const file = new URL(`articles/${slugOf(page)}.json`, runtime);
  const data = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : { articles: [], timeline: [] };
  for (const a of data.articles) {
    const o = at(page, a.from);
    W.add(o, 'texts', [page, 'a', await put(a)]);
    searchDocs.push({ page, from: a.from, o, pieces: articlePieces(a) });
  }
  const history = new Map();
  const slot = (o) => history.get(o) ?? history.set(o, { s: [], t: [] }).get(o);
  for (const s of snapshots[page] ?? []) slot(at(page, s.from)).s.push(s);
  for (const t of data.timeline) slot(at(page, t.v)).t.push(t);
  for (const [o, h] of history) W.add(o, 'texts', [page, 'h', await put(h)]);
}
const wikiBlocks = await writeBlocks(W.blocks);

// ---------- body search: one bigram index per block (src/bodySearch.ts) ----------
// A shard is about this many bytes; a block's shard count is a power of two (scripts/search/text.mjs shardOf)
const SHARD_BYTES = 40_000;
const searchBlocks = [];
for (let i = 1; i <= N; i++) {
  const [lo, hi] = blockRange(i);
  const docs = searchDocs.filter((d) => d.o >= lo && d.o <= hi);
  if (!docs.length) { searchBlocks.push(null); continue; }
  const size = JSON.stringify(buildSearchIndex(docs, { shards: 1 }).shards[0]).length;
  const shards = 2 ** Math.max(0, Math.round(Math.log2(size / SHARD_BYTES)));
  const index = buildSearchIndex(docs, { shards });
  const shardFiles = [];
  for (const s of index.shards) shardFiles.push(await put(s));
  searchBlocks.push(await put({ ...index.meta, files: shardFiles }));
}

// ---------- every name a page answers to, at any version, as short hashes ----------
// Fetched only when an address names a page the chosen version does not know: it tells "revealed
// later" (keep the name hidden) from "no such page" (a new page), without listing the names. The
// names themselves are public already in the search-engine pages and sitemap.xml (design.md 6절).
const names = new Set();
for (const n of [...chart.nodes, ...extraPages]) for (const x of [n.id, n.ko]) if (x) names.add(nameKey(x));
const namesFile = await put([...names].sort());

// what the 3D chart scales by, from the whole chart, so a star looks the same whichever versions are
// loaded: the brightest line's shared stories, the biggest star's stories, and the stories a star
// needs to have its name always shown (the top NAMED by stories; src/WikiGraph3D.tsx NAMED)
const NAMED = 14;
const byStories = chart.nodes.filter((n) => !n.hub).map((n) => n.units).sort((a, b) => b - a);
const chartScale = {
  maxShared: Math.max(2, ...chart.links.map((l) => l.shared)),
  topUnits: Math.max(1, byStories[0] ?? 1),
  namedMinUnits: byStories[Math.min(byStories.length, NAMED) - 1] ?? 0,
};

// how the 3D chart frames the camera and sizes its version rings, from the whole chart, so the view is
// the same whichever versions are loaded: the 90th-percentile distance from the centre axis and up to
// FRAME_POINTS places of linked stars (coordinates only; which star is where is not said)
const FRAME_POINTS = 300;
const linkedIdx = [...new Set(chart.links.flatMap((l) => [l.source, l.target]))].map((id) => chart.nodes.findIndex((n) => n.id === id)).filter((i) => i >= 0).sort((a, b) => a - b);
const frameOf = (pos) => {
  if (!pos) return null;
  const radii = chart.nodes.map((_, i) => Math.hypot(pos[i * 3], pos[i * 3 + 2])).sort((a, b) => a - b);
  const step = Math.max(1, linkedIdx.length / FRAME_POINTS);
  const pts = [];
  for (let k = 0; k < linkedIdx.length; k += step) { const i = linkedIdx[Math.floor(k)]; pts.push(...[pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]].map(Math.round)); }
  return { r90: radii[Math.floor(radii.length * 0.9)], pts };
};
const frame = layout ? { portrait: frameOf(layout.portrait), landscape: frameOf(layout.landscape) } : null;

const index = {
  n: N,
  versions: graph.versions.map(({ id, number, order, released }) => ({ id, number, order, released })),
  chart: { hub: chart.page, total: chart.nodes.length, ...chartScale, frame, layoutVersion: layout?.version ?? null, lastOrder: layout?.lastOrder ?? LAST },
  quests: questBlocks,
  lang: { ko: { wiki: wikiBlocks, search: searchBlocks, names: namesFile } },
};
await writeFile(new URL('split-index.json', runtime), JSON.stringify(index));
console.log(`public/assets/d/ ${files} files ${(bytes / 1024).toFixed(0)} KB (quest blocks ${questBlocks.filter(Boolean).length}, wiki blocks ${wikiBlocks.filter(Boolean).length}, search blocks ${searchBlocks.filter(Boolean).length})`);
if (existsSync(outDir)) { const left = (await readdir(outDir)).length; if (left !== files) throw new Error(`expected ${files} files, found ${left}`); }
