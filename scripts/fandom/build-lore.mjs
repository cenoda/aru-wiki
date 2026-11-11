// Lore anchors from wiki links (design.md §5 "2차 기준"). Fandom links lore words in dialogue
// and summaries to concept pages: "the skies of Teyvat are fake", "the border", "an eggshell"
// all link to [[False Sky]]. So a link to a lore page is a stable key for a thread, without an LLM.
//
// For every story unit (act, or act-less unit from quest-units.json) this records which lore
// pages it links to, and for each lore page the units in release order.
// Reads quests.json, quest-units.json, versions.json and the Fandom dump; writes lore-links.json.
import { readFile, writeFile } from 'node:fs/promises';
import { generatedFile } from './paths.mjs';
import { FandomClient } from './client.mjs';
import { linkTargets, normalizeTitle } from './wikitext.mjs';

const client = new FandomClient({ refresh: process.argv.includes('--refresh') });
const file = generatedFile;
const read = async (f) => JSON.parse(await readFile(file(f), 'utf8'));
const [quests, unitData, versions] = await Promise.all(['quests.json', 'quest-units.json', 'versions.json'].map(read));
const pages = await client.pageTexts();
const byId = new Map(quests.map((q) => [q.id, q]));
const vOrder = new Map(versions.map((v) => [v.id, v.order]));

// units: acts (their quests) and act-less units
const units = [];
const members = Map.groupBy(quests.filter((q) => q.level === 'QUEST' && q.act), (q) => q.act);
for (const a of quests.filter((q) => q.level === 'ACT')) {
  units.push({ id: a.id, version: a.first_version, pages: [a.names.en, ...(members.get(a.id) ?? []).map((q) => q.names.en)] });
}
for (const u of unitData.units) {
  units.push({ id: u.id, version: u.first_version, pages: [...(u.kind === 'series' ? [u.names.en] : []), ...u.members.map((id) => byId.get(id).names.en)] });
}

// links in the story text only: Summary and Dialogue sections, not infoboxes, rewards or trivia
const STORY = /^==\s*(Summary|Dialogue|Story)\s*==\s*$/i;
function storyLinks(content) {
  const out = [];
  let on = false;
  for (const line of content.split('\n')) {
    if (/^==[^=]/.test(line)) on = STORY.test(line.trim());
    else if (on) out.push(...linkTargets(line));
  }
  return out;
}
const linksOf = new Map();
const count = new Map();
for (const u of units) {
  const set = new Set();
  for (const t of u.pages) for (const l of storyLinks(pages.get(t)?.content ?? '')) set.add(normalizeTitle(l));
  linksOf.set(u.id, set);
  for (const l of set) count.set(l, (count.get(l) ?? 0) + 1);
}

// categories of targets linked from at least two units (a single mention cannot link two stories)
const targets = [...count].filter(([, n]) => n >= 2).map(([t]) => t);
const canonical = await client.resolve(targets);
const cats = new Map();
const unique = [...new Set(canonical.values())];
for (let i = 0; i < unique.length; i += 50) {
  const d = await client.get({ action: 'query', prop: 'categories', clshow: '!hidden', cllimit: 'max', titles: unique.slice(i, i + 50).join('|') });
  for (const p of d.query.pages) cats.set(p.title, (p.categories ?? []).map((c) => c.title.replace(/^Category:/, '')));
}

// Lore pages: concepts, places, factions, history. Characters are already covered by the
// infobox character lists; items, enemies and game systems say nothing about story order.
// (Every page has "Introduced in Version X", so version categories must not count either way.)
const LORE = /\b(Lore|Terminology|Cosmology|History|Historical Events|Nations|Regions|Areas|Locations|Ancient Civilizations|Civilizations|Factions|Organizations|Gods|Deities|Religions|Legends|Myths)\b/i;
const CHARACTER = /^(Characters|NPCs|Mentioned Characters|Quest-Exclusive NPCs)$/;
const NOT_STORY = /\b(Enemies|Bosses|Items|Weapons|Artifacts|Materials|Food|Furnishings|Achievements|Quest Chapters|Quest Acts|Gameplay|Mechanics|Domains|Commissions|Soundtracks|Wings|Namecards|Gadgets|Wildlife|Fish|Teapot|Shops|Waypoints|Teleport)\b/i;
const kindOf = (title) => {
  const c = (cats.get(title) ?? []).filter((x) => !/Version/.test(x));
  if (c.some((x) => NOT_STORY.test(x))) return null;
  if (c.some((x) => CHARACTER.test(x))) return 'character';
  return c.some((x) => LORE.test(x)) ? 'lore' : null;
};
const isLore = (title) => kindOf(title) !== null;

const loreUnits = {};
for (const u of units) {
  for (const l of linksOf.get(u.id)) {
    const t = canonical.get(l);
    if (t && isLore(t)) (loreUnits[t] ??= new Set()).add(u.id);
  }
}
const unitVersion = new Map(units.map((u) => [u.id, vOrder.get(u.version) ?? 1e9]));
const out = Object.fromEntries(Object.entries(loreUnits)
  .filter(([, s]) => s.size >= 2)
  .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
  .map(([t, s]) => [t, { kind: kindOf(t), categories: cats.get(t).filter((x) => !/Version/.test(x)), units: [...s].sort((a, b) => unitVersion.get(a) - unitVersion.get(b) || a.localeCompare(b)) }]));

await writeFile(file('lore-links.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${targets.length} link targets in 2+ units, ${Object.keys(out).length} lore pages`);
console.log(Object.entries(out).slice(0, 25).map(([t, v]) => `${t} (${v.units.length})`).join(', '));
console.log(`fandom requests: ${client.requests}, ${client.source} lookups: ${client.lookups}`);
