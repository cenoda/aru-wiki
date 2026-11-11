// Candidate nodes for a stage-2 lore theme (design.md §2). Lore and character pages are ranked by
// how often they share story units with the theme page in lore-links.json (Jaccard over units),
// no LLM. data/manual/theme-<id>.json holds the person-made choices: the theme page, pages to
// leave out (too general) and pages to add.
//
//   node scripts/theme/candidates.mjs khaenriah [--max 45]
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values: opt, positionals: [theme] } = parseArgs({ allowPositionals: true, options: { max: { type: 'string', default: '45' } } });
if (!theme) throw new Error('usage: candidates.mjs <theme id>');
const url = (p) => new URL(`../../data/${p}`, import.meta.url);
const read = async (p) => JSON.parse(await readFile(url(p), 'utf8'));
const [links, koNames, manual] = await Promise.all([
  read('generated/lore-links.json'), read('generated/ko-names.json'), read(`manual/theme-${theme}.json`),
]);
const home = new Set(links[manual.page]?.units ?? []);
if (!home.size) throw new Error(`no units link to ${manual.page}`);
const exclude = new Set(manual.exclude ?? []);
const rows = [];
for (const [page, v] of Object.entries(links)) {
  if (page === manual.page || exclude.has(page)) continue;
  const units = v.units ?? [];
  const shared = units.filter((u) => home.has(u)).length;
  if (shared < (manual.min_shared ?? 5)) continue;
  rows.push({ page, kind: v.kind, ko: koNames[page]?.ko ?? null, shared, units: units.length,
    jaccard: Number((shared / (units.length + home.size - shared)).toFixed(3)) });
}
rows.sort((a, b) => b.jaccard - a.jaccard || a.page.localeCompare(b.page));
const picked = rows.slice(0, Number(opt.max));
for (const page of manual.include ?? []) {
  if (!picked.some((r) => r.page === page)) picked.push({ page, kind: links[page]?.kind ?? null, ko: koNames[page]?.ko ?? null, added: true });
}
const out = { theme, page: manual.page, home_units: home.size, nodes: picked, pending: manual.pending ?? [], next: rows.slice(Number(opt.max), Number(opt.max) + 20).map((r) => r.page) };
await writeFile(url(`generated/theme-${theme}.json`), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${picked.length} nodes for ${manual.page} (${home.size} units link to it); no ko name: ${picked.filter((r) => !r.ko).map((r) => r.page).join(', ') || 'none'}`);
