// Story units for quests outside acts, and where each one hangs off the act map.
//   series  a Fandom world quest chapter (quest-series.json), e.g. Golden Slumber
//   event   quests of one event (`event_name`)
//   chain   quests linked by `prev` that are in neither
//   single  a quest on its own
// Each unit is attached to acts: the acts its quests require (Fandom requirement fields), or
// else its region's entry act, the Archon act that the region's world quests most often require.
//
// Reads quests.json, quest-edges.json, quest-series.json, versions.json and, for event names in
// Korean, ko-names.json (build-ko-names.mjs); writes quest-units.json.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { slug } from './wikitext.mjs';

const file = (f) => new URL(`../../data/generated/${f}`, import.meta.url);
const read = async (f) => JSON.parse(await readFile(file(f), 'utf8'));
const [quests, edges, series, versions] = await Promise.all(
  ['quests.json', 'quest-edges.json', 'quest-series.json', 'versions.json'].map(read));
const koNames = existsSync(file('ko-names.json')) ? await read('ko-names.json') : {};
const byId = new Map(quests.map((q) => [q.id, q]));
const vOrder = new Map(versions.map((v) => [v.id, v.order]));
const actOf = (id) => { const q = byId.get(id); return q?.level === 'ACT' ? q.id : q?.act ?? null; };
const loose = quests.filter((q) => q.level === 'QUEST' && !q.act);
const looseIds = new Set(loose.map((q) => q.id));

// ---------- group loose quests ----------
const unitOf = new Map();
const units = [];
const add = (kind, id, names, members, extra = {}) => {
  const u = { id, kind, names, members, ...extra };
  for (const m of members) unitOf.set(m, u);
  units.push(u);
};
for (const s of series) {
  const members = s.members.filter((m) => looseIds.has(m) && !unitOf.has(m));
  if (members.length) add('series', s.id, s.names, members, { next: s.next, major: s.major });
}
const byEvent = Map.groupBy(loose.filter((q) => q.event && !unitOf.has(q.id)), (q) => q.event);
for (const [event, qs] of byEvent) {
  const ko = koNames[event]?.ko;
  add('event', `event_${slug(event)}`, ko ? { en: event, ko } : { en: event }, qs.map((q) => q.id));
}

// prev chains among what is left
const prevEdges = edges.filter((e) => e.basis === 'prev' && looseIds.has(e.source) && looseIds.has(e.target));
const adj = new Map();
for (const e of prevEdges) {
  for (const [a, b] of [[e.source, e.target], [e.target, e.source]]) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a).push(b);
  }
}
for (const q of loose) {
  if (unitOf.has(q.id)) continue;
  const comp = [], stack = [q.id], seen = new Set();
  while (stack.length) {
    const v = stack.pop();
    if (seen.has(v) || unitOf.has(v)) continue;
    seen.add(v); comp.push(v);
    stack.push(...(adj.get(v) ?? []));
  }
  const first = comp.map((id) => byId.get(id)).sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id))[0];
  add(comp.length > 1 ? 'chain' : 'single', `${comp.length > 1 ? 'chain' : 'single'}_${slug(first.names.en)}`, first.names, comp);
}
function order(q) { return vOrder.get(q.first_version) ?? 1e9; }

// ---------- play order inside a unit, and unit facts ----------
const prevOf = new Map();
for (const e of prevEdges) { if (!prevOf.has(e.target)) prevOf.set(e.target, []); prevOf.get(e.target).push(e.source); }
for (const u of units) {
  const ids = new Set(u.members), done = new Set(), out = [];
  const visit = (id) => {
    if (done.has(id)) return;
    done.add(id);
    for (const p of prevOf.get(id) ?? []) if (ids.has(p)) visit(p);
    out.push(id);
  };
  u.members.slice().sort((a, b) => order(byId.get(a)) - order(byId.get(b)) || a.localeCompare(b)).forEach(visit);
  u.members = out;
  const qs = out.map((id) => byId.get(id));
  u.quest_type = majority(qs.map((q) => q.quest_type));
  const region = majority(qs.map((q) => q.region).filter(Boolean));
  if (region) u.region = region;
  const character = majority(qs.map((q) => q.character).filter(Boolean));
  if (character) u.character = character;
  const chapter = majority(qs.map((q) => q.chapter).filter(Boolean));
  if (chapter) u.chapter = chapter;
  const group = majority(qs.map((q) => q.group).filter(Boolean));
  if (group) u.group = group;
  u.first_version = qs.map((q) => q.first_version).filter(Boolean).sort((a, b) => vOrder.get(a) - vOrder.get(b))[0] ?? null;
  u.replayable = qs.every((q) => q.replayable);
}
function majority(list) {
  const c = new Map();
  for (const x of list) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// ---------- attach to acts ----------
// acts any member requires (an act edge, or a quest edge lifted to its act)
const required = new Map(units.map((u) => [u.id, new Set()]));
for (const e of edges) {
  if (e.relation !== 'PREREQUISITE') continue;
  const u = unitOf.get(e.target);
  const a = actOf(e.source);
  if (u && a) required.get(u.id).add(a);
}
// Region entry act: among the Archon acts set in the region, the one its world quests most
// often require; with no votes, the region's first Archon act. Many world quests only require
// the prologue (Fontaine's can be done before reaching Fontaine), which says nothing about
// where they sit in the story, so only acts set in the region count. This placement is
// narrative ("after arriving"), not a game requirement, and is labelled as such.
const regionArchon = Map.groupBy(quests.filter((q) => q.level === 'ACT' && q.quest_type === 'ARCHON' && q.region)
  .sort((a, b) => order(a) - order(b)), (q) => q.region);
const votes = new Map();
for (const u of units) {
  if (!u.region || u.quest_type !== 'WORLD') continue;
  for (const a of required.get(u.id)) {
    if (byId.get(a).quest_type !== 'ARCHON' || byId.get(a).region !== u.region) continue;
    const m = votes.get(u.region) ?? new Map();
    m.set(a, (m.get(a) ?? 0) + 1);
    votes.set(u.region, m);
  }
}
const entry = {};
for (const [r, acts] of regionArchon) {
  const m = votes.get(r);
  entry[r] = m ? [...m].sort((a, b) => b[1] - a[1] || order(byId.get(a[0])) - order(byId.get(b[0])))[0][0] : acts[0].id;
}
for (const u of units) {
  const req = [...required.get(u.id)];
  if (req.length) u.attach = { acts: req.sort(), basis: 'requirement' };
  else if (u.region && entry[u.region] && u.quest_type === 'WORLD') u.attach = { acts: [entry[u.region]], basis: 'region' };
  else u.attach = { acts: [], basis: 'none' };
}

units.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(file('quest-units.json'), `${JSON.stringify({ region_entry: entry, units }, null, 1)}\n`);
const count = (f) => units.filter(f).length;
console.log(`${units.length} units: series ${count((u) => u.kind === 'series')}, event ${count((u) => u.kind === 'event')}, chain ${count((u) => u.kind === 'chain')}, single ${count((u) => u.kind === 'single')}`);
console.log(`attached by requirement ${count((u) => u.attach.basis === 'requirement')}, by region ${count((u) => u.attach.basis === 'region')}, none ${count((u) => u.attach.basis === 'none')}`);
console.log('region entry acts:', Object.fromEntries(Object.entries(entry).map(([r, a]) => [r, `${byId.get(a).first_version} ${byId.get(a).names.en}`])));
