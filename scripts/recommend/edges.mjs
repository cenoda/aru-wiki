// Accepted verdicts -> RECOMMENDED edges for the site (design.md §5).
// Only pairs the judge recommended, whose quotes matched the excerpts, and that a second vendor
// supported are published; they stay `unreviewed` until a person checks them. Three tiers:
//   strong  B spoils or depends on a major event of A (first or second pass)
//   medium  weak verdict rated 4 ("B relies on who someone is or what happened, told in A")
//   light   weak verdict rated 3 with rare shared evidence (candidate score >= LIGHT_MIN_SCORE);
//           drawn fainter than medium
// Other weak verdicts stay in the judgment files only.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { latinNames, makeLocalizer } from './ko-text.mjs';
import { makeRequires } from './prereq.mjs';

const LIGHT_MIN_SCORE = 10;
const file = (f) => new URL(`../../data/generated/${f}`, import.meta.url);
const read = async (f) => JSON.parse(await readFile(file(f), 'utf8'));
const opt = async (f, empty) => (existsSync(file(f)) ? read(f) : empty);
const [quests, versions, unitData, koNames, pass1, pass2, ratings, cands2, questEdges] = await Promise.all([
  read('quests.json'), read('versions.json'), read('quest-units.json'), read('ko-names.json'), read('recommended-judgments.json'),
  opt('recommended-judgments-2.json', []), opt('recommended-ratings.json', {}), opt('recommended-candidates-2.json', []),
  read('quest-edges.json'),
]);
const requires = makeRequires(quests, unitData, questEdges);
const byId = new Map(quests.map((q) => [q.id, q]));
const units = new Map(unitData.units.map((u) => [u.id, u]));
const vOrder = new Map(versions.map((v) => [v.id, v.order]));
const score = new Map(cands2.map((p) => [`${p.source}->${p.target}`, p.score]));

const node = (id) => {
  const q = byId.get(id);
  if (q) return { names: q.names, version: q.first_version, sources: q.sources };
  const u = units.get(id);
  return { names: u.names, version: u.first_version, sources: byId.get(u.members[0])?.sources ?? [] };
};
// The judge reads English pages: show official Korean names for stories (「English title」) and for
// characters, places and lore it left in English, with particles fitted to the Korean name.
// data/manual/ko-misspellings.json: Hangul spellings the judge made up -> page title in ko-names.json.
const misspelled = JSON.parse(await readFile(new URL('../../data/manual/ko-misspellings.json', import.meta.url), 'utf8'));
const localize = makeLocalizer(
  Object.entries(koNames).map(([en, v]) => [en, v.ko]),
  [...quests, ...unitData.units].map((x) => [x.names.en, x.names.ko]),
  Object.entries(misspelled).filter(([w]) => !w.startsWith('$')).map(([w, en]) => {
    if (!koNames[en]?.ko) throw new Error(`ko-misspellings.json: no Korean name for ${en}`);
    return [w, koNames[en].ko];
  }),
);
const later = (a, b) => (vOrder.get(a) >= vOrder.get(b) ? a : b);

const RANK = { strong: 3, medium: 2, light: 1 };
function tierOf(j) {
  if (j.status !== 'accepted') return null;
  if (j.judge.strength === 'strong') return 'strong';
  const key = `${j.source}->${j.target}`;
  const r = ratings[key]?.confusion;
  if (r >= 4) return 'medium';
  if (r === 3 && (score.get(key) ?? 0) >= LIGHT_MIN_SCORE) return 'light';
  return null;
}

const edges = new Map();
let reversed = 0;
for (const j of [...pass1, ...pass2]) {
  const tier = tierOf(j);
  if (!tier) continue;
  const key = `${j.source}->${j.target}`;
  // the game makes B come first, so "do A before B" cannot be followed
  if (requires(j.target, j.source)) { reversed++; continue; }
  if (edges.has(key) && RANK[edges.get(key).tier] >= RANK[tier]) continue;
  const s = node(j.source), t = node(j.target);
  edges.set(key, {
    source: j.source, target: j.target, relation: 'RECOMMENDED', basis: 'llm', tier,
    rating: ratings[key]?.confusion ?? null,
    links: j.characters ?? (j.evidence ?? []).map((e) => e.label),
    reason_ko: localize(j.judge.reason_ko), quotes_source: j.judge.quotes_a, quotes_target: j.judge.quotes_b,
    revealed_version: later(s.version, t.version),
    ...(requires(j.source, j.target) && { already_required: true }), // the game enforces it already
    review: 'unreviewed', judged_by: j.judge.tool, verified_by: j.verify.tool,
    sources: [...s.sources, ...t.sources],
  });
}
const list = [...edges.values()].sort((a, b) => `${a.target}|${a.source}`.localeCompare(`${b.target}|${b.source}`));
await writeFile(file('recommended-edges.json'), `${JSON.stringify(list, null, 1)}\n`);
const left = new Map();
for (const e of list) for (const n of latinNames(e.reason_ko)) left.set(n, (left.get(n) ?? 0) + 1);
if (left.size) console.log(`English names left (no official Korean name): ${[...left].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}×${c}`).join(', ')}`);
const count = (k) => list.filter((e) => e.tier === k).length;
const isAct = (id) => byId.get(id)?.level === 'ACT';
console.log(`dropped ${reversed} reversed (B required before A); ${list.filter((e) => e.already_required).length} already required`);
console.log(`${list.length} RECOMMENDED edges: ${count('strong')} strong, ${count('medium')} medium, ${count('light')} light; ${list.filter((e) => isAct(e.source) && isAct(e.target)).length} between acts`);
