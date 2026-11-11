// Human edits on top of recommended-edges.json (run after edges.mjs; running it twice changes nothing).
//   data/manual/edge-reviews.json  verdicts keyed source->target:
//     틀림         the edge is removed
//     맞음         review becomes `verified`
//     애매 + tier  the tier is lowered to it (LLM tier kept as llm_tier), review becomes `verified`
//     애매         stays `unreviewed`; the verdict is still recorded
//   data/manual/reason-fixes.json  exact text replacements in reason_ko, keyed source->target, for
//     notation the judge got wrong in one place (doubled names, nested brackets). Names it gets
//     wrong everywhere belong in ko-misspellings.json, which edges.mjs applies.
import { readFile, writeFile } from 'node:fs/promises';

const url = (p) => new URL(`../../data/${p}`, import.meta.url);
const read = async (p) => JSON.parse(await readFile(url(p), 'utf8'));
const entries = (o) => Object.entries(o).filter(([k]) => !k.startsWith('$'));
const [edges, reviews, fixes] = await Promise.all([
  read('generated/recommended-edges.json'), read('manual/edge-reviews.json'), read('manual/reason-fixes.json'),
]);
const TIERS = new Set(['strong', 'medium', 'light']);
const keyOf = (e) => `${e.source}->${e.target}`;
const byKey = new Map(edges.map((e) => [keyOf(e), e]));
const problems = [];

for (const [key, r] of entries(reviews)) {
  if (!['맞음', '틀림', '애매'].includes(r.verdict)) throw new Error(`edge-reviews.json ${key}: verdict ${r.verdict}`);
  if (r.tier && !TIERS.has(r.tier)) throw new Error(`edge-reviews.json ${key}: tier ${r.tier}`);
  if (!byKey.has(key) && r.verdict !== '틀림') problems.push(`review for missing edge ${key}`);
}

for (const [key, list] of entries(fixes)) {
  const e = byKey.get(key);
  if (!e) { problems.push(`reason fix for missing edge ${key}`); continue; }
  for (const { from, to } of list) {
    if (e.reason_ko.includes(from)) e.reason_ko = e.reason_ko.split(from).join(to);
    else if (!e.reason_ko.includes(to)) problems.push(`${key}: "${from}" not in reason_ko`);
  }
}

let removed = 0;
const out = [];
for (const e of edges) {
  const r = reviews[keyOf(e)];
  if (r?.verdict === '틀림') { removed++; continue; }
  if (r) {
    const llm = e.llm_tier ?? e.tier;
    delete e.llm_tier;
    const tier = r.tier ?? llm;
    // keep key order stable: tier, llm_tier next to each other
    const next = {};
    for (const [k, v] of Object.entries(e)) {
      if (k === 'tier') { next.tier = tier; if (tier !== llm) next.llm_tier = llm; continue; }
      if (k === 'human_review') continue;
      next[k] = v;
      if (k === 'review') next.human_review = r;
    }
    next.review = r.verdict === '맞음' || (r.verdict === '애매' && r.tier) ? 'verified' : 'unreviewed';
    out.push(next);
  } else out.push(e);
}

await writeFile(url('generated/recommended-edges.json'), `${JSON.stringify(out, null, 1)}\n`);
for (const p of problems) console.log(`warning: ${p}`);
const n = (f) => out.filter(f).length;
console.log(`${removed} removed (틀림), ${n((e) => e.review === 'verified')} verified, ${n((e) => e.llm_tier)} tier lowered; `
  + `${out.length} edges: ${n((e) => e.tier === 'strong')} strong, ${n((e) => e.tier === 'medium')} medium, ${n((e) => e.tier === 'light')} light`);
