// Writes data/runtime/graph.json: only the fields the site reads, from data/generated.
// The site fetches this file at start instead of bundling the full generated JSON into the JS,
// so the first download is smaller and the data stays out of the JS parse.
// Run by `npm run dev` / `npm run build` (predev/prebuild); the output is not committed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (f) => JSON.parse(await readFile(new URL(`data/generated/${f}`, root), 'utf8'));
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

const [quests, edges, versions, units, recommended, figures, imageFiles] = await Promise.all([
  read('quests.json'), read('quest-edges.json'), read('versions.json'), read('quest-units.json'), read('recommended-edges.json'),
  read('card-figures.json'), read('image-files.json'),
]);

const graph = {
  versions,
  quests: quests.map((q) => ({
    ...pick(q, ['id', 'level', 'quest_type', 'act', 'names', 'first_version', 'replayable', 'event', 'region']),
    // the detail panel credits the first source page at the revision the data was read from (LICENSE-CONTENT.md 1절)
    sources: (q.sources ?? []).slice(0, 1).map((s) => pick(s, ['url', 'revision'])),
  })),
  questEdges: edges.map((e) => pick(e, ['source', 'target', 'relation', 'basis', 'revealed_version'])),
  units: {
    region_entry: units.region_entry,
    units: units.units.map((u) => pick(u, [
      'id', 'kind', 'names', 'members', 'quest_type', 'region', 'first_version', 'replayable', 'attach', 'next', 'major',
    ])),
  },
  recommended: recommended
    .filter((e) => !e.already_required) // the game enforces this order already; the site drops them too
    .map((e) => ({
      ...pick(e, ['source', 'target', 'tier', 'reason_ko', 'gist_ko', 'links', 'revealed_version', 'review']),
      // the wiki pages (and revisions) the reason was written from, credited under it
      sources: (e.sources ?? []).map((s) => pick(s, ['url', 'revision'])),
    })),
  // card figures and their icon files (docs/image-policy.md)
  figures: { acts: figures.acts, characters: Object.fromEntries(Object.entries(figures.characters).map(([k, v]) => [k, { ko: v.ko ?? null }])) },
  imageFiles: imageFiles.files.map((f) => pick(f, ['file', 'character', 'source_url', 'fetched', 'release_version'])),
};

const outDir = new URL('data/runtime/', root);
await mkdir(outDir, { recursive: true });
const write = async (name, data) => {
  const text = JSON.stringify(data);
  await writeFile(new URL(name, outDir), text);
  console.log(`data/runtime/${name} ${(text.length / 1024).toFixed(0)} KB`);
};
await write('graph.json', graph);

// ---------- the 3D chart: every page with an article (the whole wiki) ----------
// Nodes: the Khaenri'ah theme's pages (scripts/theme/candidates.mjs) and every page the whole-wiki
// run (articles.mjs all) wrote an article for, so the chart grows as articles are written. Teyvat
// is the chart's centre when it is in. Links: pages that share story units (see the constellation
// rule below). A page or link appears from the version of the earliest story unit behind it, so
// the version picker hides what comes later.
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { LAYOUT_VERSION, layoutChart } from '../src/chartLayout.js';
/**
 * Where every star sits, for portrait and landscape screens (src/chartLayout.js), so the browser does
 * not run the layout itself (seconds on a phone at ~1,400 stars). Kept in .cache/ by the chart's
 * content, so a rebuild with the same stars and lines skips it.
 */
async function chartLayouts(chart, lastOrder) {
  const key = createHash('sha256').update(JSON.stringify([LAYOUT_VERSION, lastOrder, chart.nodes.map((n) => [n.id, n.hub, n.revealed]), chart.links.map((l) => [l.source, l.target, l.shared])])).digest('hex');
  const cacheFile = new URL('.cache/chart-layout.json', root);
  try {
    const cached = JSON.parse(await readFile(cacheFile, 'utf8'));
    if (cached.key === key) return cached.layout;
  } catch { /* no cache yet */ }
  const layout = { version: LAYOUT_VERSION, lastOrder, portrait: layoutChart(chart, lastOrder, true), landscape: layoutChart(chart, lastOrder, false) };
  await mkdir(new URL('.cache/', root), { recursive: true });
  await writeFile(cacheFile, JSON.stringify({ key, layout }));
  return layout;
}
const [theme, loreLinks, koNames] = await Promise.all([read('theme-khaenriah.json'), read('lore-links.json'), read('ko-names.json')]);
const unitVersion = new Map([...quests, ...units.units].map((x) => [x.id, x.first_version]));
const order = new Map(versions.map((v) => [v.id, v.order]));
const lastOrder = versions.length - 1;
const firstOrder = (unitIds) => Math.min(lastOrder, ...unitIds.map((u) => order.get(unitVersion.get(u)) ?? lastOrder));
// one file per page (scripts/theme/article-store.mjs)
const allArticles = (await readArticles(articlesPath(new URL('data/generated/', root).pathname, 'all'), { articles: [] })).articles;
/** a whole-wiki article with at least one paragraph the site shows (the same test as the article files below) */
const showsSomething = (a) => a.paragraphs.some((p) => (p.status === 'accepted' || p.status === 'trimmed') && p.sentences.some((x) => !x.dropped));
const themePages = [{ page: theme.page, kind: 'lore' }, ...theme.nodes];
const chartIds = [...new Set([...themePages.map((p) => p.page), ...allArticles.filter(showsSomething).map((a) => a.node)])];
const HUB = chartIds.includes('Teyvat') ? 'Teyvat' : theme.page;
const kindOf = new Map(themePages.map((p) => [p.page, p.kind]));
// official Korean names (ko-names.json, Fandom {{Other Languages}}), never hand-transliterated
const pages = chartIds.map((id) => ({ page: id, ko: koNames[id]?.ko ?? null, kind: kindOf.get(id) ?? loreLinks[id]?.kind ?? 'lore', hub: id === HUB }));
const unitsOf = new Map(pages.map((p) => [p.page, new Set(loreLinks[p.page]?.units ?? [])]));
const pairs = [];
/** pairs that share a single story: used only for a page that has no stronger tie */
const single = [];
{
  // shared stories by a unit → pages index, not every pair of pages
  const byUnit = new Map();
  pages.forEach((p, i) => { for (const u of unitsOf.get(p.page)) (byUnit.get(u) ?? byUnit.set(u, []).get(u)).push(i); });
  const sharedOf = new Map();
  for (const [u, list] of byUnit) {
    for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
      const key = list[x] * 100000 + list[y];
      (sharedOf.get(key) ?? sharedOf.set(key, []).get(key)).push(u);
    }
  }
  for (const [key, shared] of sharedOf) {
    const i = Math.floor(key / 100000), j = key % 100000;
    const a = unitsOf.get(pages[i].page), b = unitsOf.get(pages[j].page);
    (shared.length < 2 ? single : pairs).push({ a: pages[i].page, b: pages[j].page, shared: shared.length,
      jaccard: shared.length / (a.size + b.size - shared.length), revealed: firstOrder(shared) });
  }
}
// Constellation lines, not a web: the maximum spanning tree by Jaccard (every page that shares any
// story stays connected by its strongest path) plus each page's two strongest ties.
const KEEP = 2;
const kept = new Set();
const parent = new Map(pages.map((p) => [p.page, p.page]));
const setOf = (x) => { while (parent.get(x) !== x) x = parent.get(x); return x; };
for (const e of [...pairs].sort((x, y) => y.jaccard - x.jaccard)) {
  const ra = setOf(e.a), rb = setOf(e.b);
  if (ra !== rb) { parent.set(ra, rb); kept.add(e); }
}
{
  const ofPage = new Map();
  for (const e of pairs) for (const p of [e.a, e.b]) (ofPage.get(p) ?? ofPage.set(p, []).get(p)).push(e);
  for (const list of ofPage.values()) list.sort((x, y) => y.jaccard - x.jaccard).slice(0, KEEP).forEach((e) => kept.add(e));
}
// A page met in a single story (Direidyth, one 5.7 act) shares only one with anything: it keeps that
// one tie (to the centre page when it can), so it is not left floating without a line.
const tied = new Set([...kept].flatMap((e) => [e.a, e.b]));
for (const p of pages) {
  if (tied.has(p.page)) continue;
  const best = single.filter((e) => e.a === p.page || e.b === p.page)
    .sort((x, y) => Number(y.a === HUB || y.b === HUB) - Number(x.a === HUB || x.b === HUB) || y.jaccard - x.jaccard)[0];
  if (best) { kept.add(best); tied.add(best.a); tied.add(best.b); }
}
// pages that mention another in their own prose (scripts/theme/refs.mjs), apart from the pairs
// already joined by a shared-story line: drawn as faint dotted lines around a picked star
const refsFile = new URL('data/generated/refs-khaenriah.json', root);
const linkedPair = new Set([...kept].map((e) => [e.a, e.b].sort().join('|')));
const refPairs = new Map();
if (existsSync(refsFile)) {
  for (const r of JSON.parse(await readFile(refsFile, 'utf8')).refs) {
    const key = [r.from, r.to].sort().join('|');
    if (linkedPair.has(key)) continue;
    const cur = refPairs.get(key);
    refPairs.set(key, cur ? { ...cur, both: cur.both || cur.from !== r.from } : { from: r.from, to: r.to, both: false });
  }
}
const chart = {
  page: HUB,
  nodes: pages.map((p) => ({
    id: p.page, ko: p.ko ?? null, kind: p.kind ?? 'lore', hub: !!p.hub, units: unitsOf.get(p.page).size,
    revealed: unitsOf.get(p.page).size ? firstOrder([...unitsOf.get(p.page)]) : lastOrder,
  })),
  links: [...kept].map((e) => ({ source: e.a, target: e.b, shared: e.shared, revealed: e.revealed })),
  // [from, to, 1 if both mention each other]
  refs: [...refPairs.values()].map((r) => [r.from, r.to, r.both ? 1 : 0]),
};
chart.layout = await chartLayouts(chart, lastOrder);
await write('chart.json', chart);

// ---------- version snapshots of the theme's pages (scripts/theme/snapshots.mjs) ----------
// Per page, the snapshots in version order. Only points that passed the quote check and the second
// model's check are kept. All are unreviewed (written from wiki prose; shown with that badge,
// decided 2026-11-11). Sources keep the page and revision for the CC BY-SA notice.
const snaps = (await read('snapshots-khaenriah.json')).snapshots;
const byPage = {};
for (const s of snaps) {
  const pts = s.points.filter((p) => p.status === 'accepted');
  const summary = pts.find((p) => p.role === 'summary');
  const bullets = pts.filter((p) => p.role === 'point');
  if (!bullets.length) continue;
  // footnotes: one per page, revision and section; each line points at its footnote
  const sources = [];
  const ref = (p) => {
    const key = `${p.source.page}|${p.source.revision}|${p.source.section ?? ''}`;
    let i = sources.findIndex((x) => x.key === key);
    if (i < 0) {
      const input = s.input.find((x) => x.revision === p.source.revision);
      i = sources.push({ key, page: p.source.page, revision: p.source.revision, section: p.source.section ?? null,
        date: (input?.timestamp ?? '').slice(0, 10) }) - 1;
    }
    return i;
  };
  (byPage[s.node] ??= []).push({
    from: order.get(s.from_version),
    summary: summary ? { t: summary.text, r: ref(summary) } : null,
    bullets: bullets.map((p) => ({ t: p.text, r: ref(p) })),
    sources: sources.map(({ key, ...x }) => x),
  });
}
for (const list of Object.values(byPage)) list.sort((a, b) => a.from - b.from);
await write('snapshots-khaenriah.json', byPage);

// ---------- article bodies of the theme's pages (scripts/theme/articles.mjs) ----------
// One file per page (data/runtime/articles/<slug>.json), fetched when its article opens. Only
// sentences that passed the second model's check are kept; a paragraph that lost more than half is
// gone. Interpretation sentences keep their mark (i: 1). Each page's file also carries its
// timeline (scripts/theme/reveals.mjs): what the wiki newly said at each version snapshot.
import { rm } from 'node:fs/promises';
const ART = new URL('data/generated/articles-khaenriah.json', root);
const REV = new URL('data/generated/reveals-khaenriah.json', root);
const artDir = new URL('articles/', outDir);
await rm(artDir, { recursive: true, force: true });
await mkdir(artDir, { recursive: true });
const stamp = new Map(snaps.flatMap((s) => s.input.map((i) => [i.revision, (i.timestamp ?? '').slice(0, 10)])));
// the whole-wiki theme (articles.mjs all): pages outside this theme, with their revision dates from its plan
const PLAN_ALL = new URL('data/generated/snapshots-all-plan.json', root);
if (existsSync(PLAN_ALL)) for (const [rev, date] of Object.entries(JSON.parse(await readFile(PLAN_ALL, 'utf8')).revision_dates ?? {})) if (!stamp.has(Number(rev))) stamp.set(Number(rev), date);
const perPage = {};
const sourceTable = () => {
  const list = [];
  const ref = (s) => {
    const key = s.kind === 'wiki' ? `w|${s.page}|${s.revision}|${s.section ?? ''}` : s.kind === 'quest' ? `q|${s.quest}` : `u|${s.url}`;
    let i = list.findIndex((x) => x.key === key);
    if (i < 0) {
      i = list.push(s.kind === 'wiki' ? { key, kind: 'wiki', page: s.page, revision: s.revision, section: s.section ?? null, date: stamp.get(s.revision) ?? '' }
        : s.kind === 'quest' ? { key, kind: 'quest', quest: s.quest, quest_ko: s.quest_ko ?? null, version: s.version }
          : { key, kind: 'web', url: s.url, title: s.title, published: s.published ?? null, checked: s.checked ?? null }) - 1;
    }
    return i;
  };
  return { ref, done: () => list.map(({ key, ...x }) => x) };
};
const inTheme = new Set(themePages.map((p) => p.page));
const inChart = new Set(chartIds);
const articleList = [
  ...(existsSync(ART) ? JSON.parse(await readFile(ART, 'utf8')).articles : []),
  // a page of this theme keeps its theme article (written with the theme's other pages as context)
  ...allArticles.filter((a) => !inTheme.has(a.node)),
];
{
  for (const a of articleList) {
    const shown = a.paragraphs.filter((p) => (p.status === 'accepted' || p.status === 'trimmed') && p.sentences.some((x) => !x.dropped));
    if (!shown.length) continue;
    const src = sourceTable();
    const para = (p) => ({ s: p.sentences.filter((x) => !x.dropped).map((x) => (x.interp ? { t: x.t, i: 1 } : { t: x.t })), r: [...new Set(p.sources.map(src.ref))] });
    const usedLines = new Set(); // one dialogue line once per article (two sections may pick the same)
    const box = (h) => {
      const b = a.quote_boxes.find((x) => x.section === h && x.status === 'accepted' && !usedLines.has(x.en));
      if (b) usedLines.add(b.en);
      return b ? { t: b.t, en: b.en, by: b.speaker_ko ?? b.speaker, r: src.ref(b.source) } : undefined;
    };
    const lead = shown.find((p) => p.section === null);
    const sections = [];
    for (const p of shown) {
      if (p.section === null) continue;
      const last = sections.at(-1);
      if (last?.key === p.section) last.p.push(para(p)); else sections.push({ key: p.section, h: p.heading ?? p.section, q: box(p.section), p: [para(p)] });
    }
    (perPage[a.node] ??= { articles: [], timeline: [] }).articles.push({ from: order.get(a.from_version), lead: lead ? para(lead) : null, sections: sections.map(({ key, ...x }) => x), sources: src.done() });
  }
}
if (existsSync(REV)) {
  for (const r of JSON.parse(await readFile(REV, 'utf8')).reveals) {
    const items = r.items.filter((x) => x.status === 'accepted' && x.source);
    if (!items.length) continue;
    (perPage[r.node] ??= { articles: [], timeline: [] }).timeline.push({
      v: order.get(r.version), first: r.first || undefined,
      items: items.map((x) => ({ t: x.text, page: x.source.page, revision: x.source.revision, date: stamp.get(x.source.revision) ?? '' })),
    });
  }
}
const slugs = new Set();
let total = 0;
for (const [page, data] of Object.entries(perPage)) {
  data.articles.sort((a, b) => a.from - b.from);
  data.timeline.sort((a, b) => a.v - b.v);
  const slug = articleSlug(page);
  if (slugs.has(slug)) throw new Error(`article slug ${slug} used twice`);
  slugs.add(slug);
  const text = JSON.stringify(data);
  total += text.length;
  await writeFile(new URL(`${slug}.json`, artDir), text);
}
console.log(`data/runtime/articles/ ${slugs.size} pages, ${(total / 1024).toFixed(0)} KB`);

// ---------- full-text search in the article bodies (scripts/search/) ----------
// data/runtime/search/meta.json (the documents: [page, article version]) and one file per shard of
// the bigram index. The site fetches them only when someone types a search (src/bodySearch.ts).
import { buildSearchIndex } from './search/build-index.mjs';
import { articlePieces } from './search/text.mjs';
import { articlesPath, readArticles } from './theme/article-store.mjs';
import { dropBlockedVideos } from './images/takedown-list.mjs';
/** shard files of the search index; a query fetches one per distinct shard of its bigrams */
const SEARCH_SHARDS = 128;
{
  const searchDir = new URL('search/', outDir);
  await rm(searchDir, { recursive: true, force: true });
  await mkdir(searchDir, { recursive: true });
  const index = buildSearchIndex(Object.entries(perPage).flatMap(([page, d]) => d.articles.map((a) => ({ page, from: a.from, pieces: articlePieces(a) }))), { shards: SEARCH_SHARDS });
  let size = 0;
  for (const [i, shard] of index.shards.entries()) {
    const text = JSON.stringify(shard);
    size += Buffer.byteLength(text);
    await writeFile(new URL(`${i}.json`, searchDir), text);
  }
  const meta = JSON.stringify(index.meta);
  await writeFile(new URL('meta.json', searchDir), meta);
  console.log(`data/runtime/search/ ${index.meta.docs.length} documents, ${index.shards.length} shards ${(size / 1024).toFixed(0)} KB + meta ${(meta.length / 1024).toFixed(0)} KB`);
}
// Pages with an article that are not stars of the chart (none while every article is drawn): found by
// search and inline links, opened as article pages. Same fields as the chart's nodes (src/lore.ts PageNode).
await write('pages.json', Object.keys(perPage).filter((p) => !inChart.has(p)).sort().map((p) => {
  const u = loreLinks[p]?.units ?? [];
  return { id: p, ko: koNames[p]?.ko ?? null, kind: loreLinks[p]?.kind ?? 'lore', hub: false, units: u.length,
    revealed: u.length ? firstOrder(u) : lastOrder };
}));
/** the file name of a page's articles; scripts/seo/prerender.mjs and scripts/split/build.mjs read them by it */
function articleSlug(page) { return page.replace(/[^A-Za-z0-9]+/g, '_'); }

// ---------- 최근 바뀜 (scripts/recent/changes.mjs): new and rewritten articles, approved reader edits ----------
// Fetched only by the recent-changes page. A row is named only at or after its version (field g).
{
  const { articleHistory, readerRows, buildRecent } = await import('./recent/changes.mjs');
  const rootPath = new URL('.', root).pathname.replace(/\/$/, '');
  const themeArticles = existsSync(ART) ? JSON.parse(await readFile(ART, 'utf8')).articles : [];
  const EDITS = new URL('data/manual/reader-edits.json', root);
  const readerEdits = existsSync(EDITS) ? JSON.parse(await readFile(EDITS, 'utf8')).edits : [];
  const revealed = new Map();
  for (const p of pages) { const u = [...unitsOf.get(p.page)]; revealed.set(p.page, u.length ? firstOrder(u) : lastOrder); }
  for (const p of Object.keys(perPage)) if (!revealed.has(p)) { const u = loreLinks[p]?.units ?? []; revealed.set(p, u.length ? firstOrder(u) : lastOrder); }
  const rows = [...articleHistory(rootPath, [themeArticles, allArticles]), ...readerRows(readerEdits)];
  await write('recent.json', buildRecent(rows, { order, revealedOf: (p) => revealed.get(p) }));
}

// ---------- red links: names that have no article yet ----------
// Pages the lore data knows (lore-links.json: a Fandom page met in some story) with an official Korean
// name (ko-names.json) but no article on this site. Article text marks their names as red links that
// open the new-page form (src/Linked.tsx). Each keeps the version of its first story, so a reader at an
// earlier version never sees a red link naming something not revealed yet. Korean names only: the
// articles are Korean, and an English-only name would rarely match. [name, revealed order]
{
  const BAD_TITLE = /[<>[\]{}|#/?%]/; // src/Search.tsx NewPage: titles that would break the address
  const hasPage = new Set([...chartIds, ...Object.keys(perPage)]);
  const taken = new Set();
  for (const id of hasPage) { taken.add(id); const ko = koNames[id]?.ko; if (ko) taken.add(ko); }
  // game mechanics and menus (에너지, 스태미나, 감전, 튜토리얼) are words of the game, not topics of a lore article
  const MECHANIC = /^(Game Systems|Combat|Combat Talents|Attributes|Menus|Tutorials|Elemental Reactions|Elemental Bursts|Elemental Skills|Progression|Location Types|Quest Terminology|Exploration|Currency|Items|Gadgets)$/;
  const red = new Map();
  for (const [id, l] of Object.entries(loreLinks)) {
    const ko = koNames[id]?.ko?.trim();
    // three letters at least: two-letter names (유리, 왕자, 생각, 지역) are mostly ordinary words too;
    // a sub-page (Wanderer/Storyline) is part of another page, not a page of its own
    if (hasPage.has(id) || id.includes('/') || !ko || ko.length < 3 || taken.has(ko) || BAD_TITLE.test(ko) || !l.units?.length) continue;
    if ((l.categories ?? []).some((c) => MECHANIC.test(c))) continue;
    const at = firstOrder(l.units);
    if (!red.has(ko) || red.get(ko) > at) red.set(ko, at);
  }
  // official YouTube videos per page (scripts/youtube/judge.mjs): id, main/extra, the version order it belongs to
  {
    const vf = new URL('data/generated/videos.json', root);
    // a takedown (data/manual/takedown.json videos) never reaches the site, whatever videos.json holds
    const { pages: vids, dropped } = dropBlockedVideos(existsSync(vf) ? JSON.parse(await readFile(vf, 'utf8')).pages : {});
    if (dropped.length) console.log(`videos: ${dropped.length} blocked by takedown.json left out`);
    const out = {};
    for (const [page, list] of Object.entries(vids)) {
      out[page] = list.map((x) => ({ id: x.id, t: x.title, main: x.role === 'main' || undefined, v: order.get(x.version) ?? lastOrder }))
        .sort((a, b) => Number(!!b.main) - Number(!!a.main) || a.v - b.v);
    }
    await write('videos.json', out);
  }
  await write('redlinks.json', [...red].sort((a, b) => a[0].localeCompare(b[0], 'ko')));
}
