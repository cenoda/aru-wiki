// Candidate pairs for RECOMMENDED edges (design.md §5): act A is a candidate for act B when
// a character in B also appears in A, A came out earlier, and A sits after the last act
// featuring that character which B already requires. Events count: a character's story
// can move on in a time-limited event (Sandrone returns in Luna VIII events, before 7.0).
// `known` lists the latest acts B requires that feature those characters, so the judge can
// see what the player already knows (Sandrone dies in True Moon, which 7.0 requires).
// The LLM judges these pairs; it never adds new ones.
import { readFile, writeFile } from 'node:fs/promises';

const read = async (f) => JSON.parse(await readFile(new URL(`../../data/generated/${f}`, import.meta.url)));
const [quests, edges, versions, charsByQuest] = await Promise.all(
  ['quests.json', 'quest-edges.json', 'versions.json', 'quest-characters.json'].map(read));

// Everyone travels with these two; they say nothing about which story comes first.
const IGNORE = new Set(['Traveler', 'Paimon']);
const notable = (name) => !IGNORE.has(name) && !/^["?]/.test(name);
// Per character, at most this many acts between the last required one and B.
const WINDOW = 3;

const byId = new Map(quests.map((q) => [q.id, q]));
const vOrder = new Map(versions.map((v) => [v.id, v.order]));
const acts = quests.filter((q) => q.level === 'ACT' && q.first_version);
const actOf = (id) => { const q = byId.get(id); return q?.level === 'ACT' ? q.id : q?.act ?? null; };

// characters per act, with how many of its quests each one appears in
const cast = new Map(acts.map((a) => [a.id, new Map()]));
for (const [qid, names] of Object.entries(charsByQuest)) {
  const m = cast.get(actOf(qid));
  if (m) for (const n of names.filter(notable)) m.set(n, (m.get(n) ?? 0) + 1);
}

// required ancestors (full closure, not the reduced drawing)
const parents = new Map(acts.map((a) => [a.id, new Set()]));
for (const e of edges) {
  if (e.relation !== 'PREREQUISITE') continue;
  const s = actOf(e.source), t = actOf(e.target);
  if (s && t && s !== t && parents.has(t) && parents.has(s)) parents.get(t).add(s);
}
const ancestorsMemo = new Map();
const ancestors = (id, stack = new Set()) => {
  if (ancestorsMemo.has(id)) return ancestorsMemo.get(id);
  const result = new Set();
  stack.add(id);
  for (const p of parents.get(id)) {
    if (stack.has(p)) continue; // data cycle
    result.add(p);
    for (const a of ancestors(p, stack)) result.add(a);
  }
  stack.delete(id);
  ancestorsMemo.set(id, result);
  return result;
};

// release order; inside one version a required act comes before the act that needs it
const depth = (id) => ancestors(id).size;
const sorted = [...acts].sort((a, b) =>
  vOrder.get(a.first_version) - vOrder.get(b.first_version) || depth(a.id) - depth(b.id) || a.id.localeCompare(b.id));
const rank = new Map(sorted.map((a, i) => [a.id, i]));

const pairs = new Map();
for (const b of sorted) {
  const before = ancestors(b.id);
  for (const [name] of cast.get(b.id)) {
    // Walk back from B to the latest required act featuring this character: anything
    // featuring them in between is a part of their story B may assume you have seen.
    const found = [];
    let seen = null; // the latest required act with this character: what the player already knows
    for (let i = rank.get(b.id) - 1; i >= 0; i--) {
      const a = sorted[i];
      if (!cast.get(a.id).has(name)) continue;
      if (before.has(a.id)) { seen = a; break; }
      if (found.length >= WINDOW) continue;
      if (a.quest_type === 'WORLD' || ancestors(a.id).has(b.id)) continue;
      found.push(a);
    }
    for (const src of found) {
      const key = `${src.id}->${b.id}`;
      const p = pairs.get(key) ?? { source: src.id, target: b.id, characters: [], known: [] };
      p.characters.push(name);
      if (seen && !p.known.includes(seen.id)) p.known.push(seen.id);
      pairs.set(key, p);
    }
  }
}

const out = [...pairs.values()]
  .map((p) => ({ ...p, characters: p.characters.sort(), known: p.known.sort((x, y) => rank.get(y) - rank.get(x)) }))
  .sort((a, b) => rank.get(a.target) - rank.get(b.target) || rank.get(a.source) - rank.get(b.source));
await writeFile(new URL('../../data/generated/recommended-candidates.json', import.meta.url), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${out.length} candidate pairs from ${acts.length} acts`);
