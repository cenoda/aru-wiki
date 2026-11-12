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
    // the detail panel links the first source; revision ids are for the data pipeline
    sources: (q.sources ?? []).slice(0, 1).map((s) => ({ url: s.url })),
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
    .map((e) => pick(e, ['source', 'target', 'tier', 'reason_ko', 'gist_ko', 'links', 'revealed_version', 'review'])),
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

// ---------- lore theme graph (stage 2 preview: Khaenri'ah) ----------
// Nodes: the theme page and its candidates (scripts/theme/candidates.mjs). Links: pages that share
// story units (see the constellation rule below). A page or link appears from the
// version of the earliest story unit behind it, so the version picker hides what comes later.
const [theme, loreLinks, koNames] = await Promise.all([read('theme-khaenriah.json'), read('lore-links.json'), read('ko-names.json')]);
const unitVersion = new Map([...quests, ...units.units].map((x) => [x.id, x.first_version]));
const order = new Map(versions.map((v) => [v.id, v.order]));
const lastOrder = versions.length - 1;
const firstOrder = (unitIds) => Math.min(lastOrder, ...unitIds.map((u) => order.get(unitVersion.get(u)) ?? lastOrder));
// official Korean names (ko-names.json, Fandom {{Other Languages}}), never hand-transliterated
const pages = [{ page: theme.page, ko: koNames[theme.page]?.ko ?? null, kind: 'lore', hub: true }, ...theme.nodes];
const unitsOf = new Map(pages.map((p) => [p.page, new Set(loreLinks[p.page]?.units ?? [])]));
const pairs = [];
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const a = unitsOf.get(pages[i].page), b = unitsOf.get(pages[j].page);
    const shared = [...a].filter((u) => b.has(u));
    if (shared.length < 2) continue;
    pairs.push({ a: pages[i].page, b: pages[j].page, shared: shared.length,
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
for (const p of pages) {
  pairs.filter((e) => e.a === p.page || e.b === p.page).sort((x, y) => y.jaccard - x.jaccard)
    .slice(0, KEEP).forEach((e) => kept.add(e));
}
await write('theme-khaenriah.json', {
  page: theme.page,
  nodes: pages.map((p) => ({
    id: p.page, ko: p.ko ?? null, kind: p.kind ?? 'lore', hub: !!p.hub, units: unitsOf.get(p.page).size,
    // how much of the theme's story the page is part of: story units shared with the theme page
    theme_units: [...unitsOf.get(p.page)].filter((u) => unitsOf.get(theme.page).has(u)).length,
    revealed: unitsOf.get(p.page).size ? firstOrder([...unitsOf.get(p.page)]) : lastOrder,
  })),
  links: [...kept].map((e) => ({ source: e.a, target: e.b, shared: e.shared, revealed: e.revealed })),
});

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
