// Second-pass RECOMMENDED candidates (design.md §5 "2차 기준"), from three kinds of evidence:
//   intro   unit B assumes X is known; A is the earliest earlier unit that introduces X
//   lore    A is among the first units to link a lore page (False Sky, Remuria, ...) that B links
//   thread  A seeds a lore thread that B develops or pays off (same thread key)
// A pair is kept only when A came out before B and the game does not already require A for B.
// Rare evidence weighs more than common evidence (a page linked from 5 units says more than
// one linked from 90). Each target keeps its best few sources; the LLM judges them as before.
//
// Reads unit facts (unit-facts-haiku.json, unit-facts.json), lore-links.json, quests.json,
// quest-edges.json, quest-units.json, versions.json; writes recommended-candidates-2.json.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

const file = (f) => new URL(`../../data/generated/${f}`, import.meta.url);
const read = async (f) => JSON.parse(await readFile(file(f), 'utf8'));
const [quests, edges, unitData, versions, lore] = await Promise.all(
  ['quests.json', 'quest-edges.json', 'quest-units.json', 'versions.json', 'lore-links.json'].map(read));
// facts from every extractor run, merged per unit (each item was quote-checked already)
const factFiles = ['unit-facts-haiku.json', 'unit-facts.json'].filter((f) => existsSync(file(f)));
const facts = new Map();
for (const f of factFiles) {
  for (const [id, x] of Object.entries(await read(f))) {
    if (!x.introduced) continue;
    const m = facts.get(id) ?? { introduced: [], assumed: [], threads: [] };
    for (const k of ['introduced', 'assumed', 'threads']) m[k].push(...x[k]);
    facts.set(id, m);
  }
}

const byId = new Map(quests.map((q) => [q.id, q]));
const vOrder = new Map(versions.map((v) => [v.id, v.order]));
const actOf = (id) => { const q = byId.get(id); return q?.level === 'ACT' ? q.id : q?.act ?? null; };

// ---------- units, release order, and what each one requires ----------
const units = new Map();
for (const a of quests.filter((q) => q.level === 'ACT')) units.set(a.id, { id: a.id, version: a.first_version, type: a.quest_type, replayable: a.replayable });
for (const u of unitData.units) units.set(u.id, { id: u.id, version: u.first_version, type: u.quest_type, replayable: u.replayable, attach: u.attach });

const actParents = new Map();
for (const e of edges) {
  if (e.relation !== 'PREREQUISITE') continue;
  const s = actOf(e.source), t = actOf(e.target);
  if (!s || !t || s === t) continue;
  if (!actParents.has(t)) actParents.set(t, new Set());
  actParents.get(t).add(s);
}
const memo = new Map();
function actAncestors(id, stack = new Set()) {
  if (memo.has(id)) return memo.get(id);
  const out = new Set();
  stack.add(id);
  for (const p of actParents.get(id) ?? []) {
    if (stack.has(p)) continue;
    out.add(p);
    for (const a of actAncestors(p, stack)) out.add(a);
  }
  stack.delete(id);
  memo.set(id, out);
  return out;
}
// acts the game requires before a unit (region placement is narrative, not a requirement)
function required(id) {
  const u = units.get(id);
  if (!u.attach) return actAncestors(id);
  const out = new Set();
  if (u.attach.basis === 'requirement') for (const a of u.attach.acts) { out.add(a); for (const x of actAncestors(a)) out.add(x); }
  return out;
}
const depth = (id) => required(id).size;
const order = [...units.values()].filter((u) => u.version)
  .sort((a, b) => vOrder.get(a.version) - vOrder.get(b.version) || depth(a.id) - depth(b.id) || a.id.localeCompare(b.id));
const rank = new Map(order.map((u, i) => [u.id, i]));
const before = (a, b) => rank.has(a) && rank.has(b) && rank.get(a) < rank.get(b);

// ---------- evidence ----------
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const SKIP = new Set(['paimon', 'traveler', 'teyvat']);
// Nations and regions, open-world NPCs, sub-areas and points of interest are named everywhere
// and say nothing about which story to play first; they are not evidence, by link or by name.
const GENERIC = /^(Nations|Regions|Subareas|Points of Interest|Open-World NPCs|NPCs with Rewards|Exploration|Shops|Teleport Waypoints)$/;
for (const [title, v] of Object.entries(lore)) if (v.categories.some((c) => GENERIC.test(c))) SKIP.add(norm(title));
const LORE_MAX_UNITS = 30, NAME_MAX_UNITS = 60;
const pairs = new Map();
function add(a, b, kind, label, weight, extra = {}) {
  if (a === b || !before(a, b) || required(b).has(a)) return;
  const key = `${a}->${b}`;
  const p = pairs.get(key) ?? { source: a, target: b, score: 0, evidence: [] };
  if (p.evidence.some((e) => e.kind === kind && e.label === label)) return;
  p.evidence.push({ kind, label, weight: +weight.toFixed(2), ...extra });
  p.score += weight;
  pairs.set(key, p);
}
const idf = (n) => Math.log(1 + 200 / Math.max(1, n));

// intro: earliest introducer of each name
const introducers = new Map();
for (const [id, f] of facts) for (const x of f.introduced) {
  const n = norm(x.name);
  if (!n || SKIP.has(n)) continue;
  (introducers.get(n) ?? introducers.set(n, new Set()).get(n)).add(id);
}
const assumers = new Map();
for (const [id, f] of facts) for (const x of f.assumed) {
  const n = norm(x.name);
  if (n && !SKIP.has(n)) (assumers.get(n) ?? assumers.set(n, new Set()).get(n)).add(id);
}
for (const [n, bs] of assumers) {
  const intro = [...(introducers.get(n) ?? [])].filter((id) => rank.has(id)).sort((a, b) => rank.get(a) - rank.get(b));
  if (!intro.length || bs.size + intro.length > NAME_MAX_UNITS) continue;
  const w = idf(bs.size + intro.length) * 1.5;
  for (const b of bs) {
    const a = intro.find((x) => before(x, b));
    if (a) add(a, b, 'intro', n, w);
  }
}

// lore: the first two units linking a page, for every later unit that links it
for (const [title, { kind, units: list }] of Object.entries(lore)) {
  if (SKIP.has(norm(title)) || list.length > LORE_MAX_UNITS) continue;
  const inOrder = list.filter((id) => rank.has(id)).sort((a, b) => rank.get(a) - rank.get(b));
  const w = idf(inOrder.length) * (kind === 'lore' ? 1 : 0.7);
  const first = inOrder.slice(0, 2);
  for (const b of inOrder.slice(1)) for (const a of first) add(a, b, 'lore', title, w);
}

// thread: same key, seed before develop/payoff
const threads = new Map();
for (const [id, f] of facts) for (const t of f.threads) {
  const k = norm(t.key);
  if (k) (threads.get(k) ?? threads.set(k, []).get(k)).push({ id, role: t.role });
}
for (const [k, list] of threads) {
  const ids = new Set(list.map((x) => x.id));
  if (ids.size < 2 || ids.size > 40) continue;
  const seeds = list.filter((x) => x.role === 'seed').map((x) => x.id).filter((id) => rank.has(id)).sort((a, b) => rank.get(a) - rank.get(b));
  const w = idf(ids.size) * 1.2;
  for (const x of list) if (x.role !== 'seed') { const a = seeds.find((s) => before(s, x.id)); if (a) add(a, x.id, 'thread', k, w); }
}

// ---------- keep the strongest sources per target ----------
const PER_TARGET = 6, MIN_SCORE = 3;
const byTarget = Map.groupBy([...pairs.values()].filter((p) => p.score >= MIN_SCORE), (p) => p.target);
const out = [];
for (const [, list] of byTarget) {
  out.push(...list.sort((a, b) => b.score - a.score).slice(0, PER_TARGET)
    .map((p) => ({ ...p, score: +p.score.toFixed(2), evidence: p.evidence.sort((x, y) => y.weight - x.weight).slice(0, 8) })));
}
out.sort((a, b) => rank.get(a.target) - rank.get(b.target) || b.score - a.score);
await writeFile(file('recommended-candidates-2.json'), `${JSON.stringify(out, null, 1)}\n`);
const kinds = {};
for (const p of out) for (const e of p.evidence) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
console.log(`facts from ${factFiles.join(', ')}: ${facts.size} units`);
console.log(`${pairs.size} raw pairs, ${out.length} candidates for ${byTarget.size} targets; evidence ${JSON.stringify(kinds)}`);
