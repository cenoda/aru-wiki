// In-game dialogue lines for a stage-2 lore theme's pages, for the quote boxes and as sources of
// articles (design.md 2절 항목 문서: 대사 상자는 한 줄 이하). From the Dialogue section of quest
// pages in the current dump: in-game text, so later wiki edits add no future story to it.
//
// Per page: lines spoken by it (a character page, with its aliases in character-aliases.json) and
// lines by others that name it, each with the quest and the quest's release version, so an article
// for version V only gets lines from quests released by V. Short lines only (one line on screen).
//
//   node scripts/theme/dialogue.mjs khaenriah   → .cache/theme/dialogue-<theme>.json
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dialogueLines, loadPages } from '../recommend/excerpt.mjs';

const theme = process.argv[2];
if (!theme) throw new Error('usage: dialogue.mjs <theme id>');
const ROOT = new URL('../../', import.meta.url).pathname;
const gen = (f) => join(ROOT, 'data/generated', f);
const read = async (f) => JSON.parse(await readFile(gen(f), 'utf8'));
const [themeData, quests, aliases, versions] = await Promise.all([read(`theme-${theme}.json`), read('quests.json'), read('character-aliases.json'), read('versions.json')]);
const order = new Map(versions.map((v) => [v.id, v.order]));

const nodes = [{ page: themeData.page, kind: 'lore' }, ...themeData.nodes];
const MAX_LEN = 140; // characters: one line on screen
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// how the dialogue names a page: its title without a qualifier, and a character's aliases
const namesOf = (n) => {
  const base = n.page.replace(/\/.*$/, '').replace(/ \(.*\)$/, '');
  return [...new Set([base, ...(n.kind === 'character' ? aliases[base] ?? [] : [])])].filter((x) => x.length >= 3);
};

console.error('reading the dump…');
const pages = await loadPages();
const questPages = quests.filter((q) => q.level === 'QUEST' && order.has(q.first_version) && pages.has(q.names.en));
// Every quest's lines parsed once, then one pass with a regex of all names (1,500+ pages in the
// whole-wiki theme: parsing per page and quest took over ten minutes).
const all = [];
for (const q of questPages) {
  for (const l of dialogueLines(pages.get(q.names.en).content)) {
    const m = l.match(/^([^:]{1,40}):\s*(.+)$/);
    if (!m || m[2].length > MAX_LEN || m[2].length < 12 || /^Traveler$/i.test(m[1])) continue;
    all.push({ speaker: m[1].trim(), text: m[2].trim(), quest: q.names.en, quest_ko: q.names.ko ?? null, version: q.first_version });
  }
}
const owners = new Map(); // lower-case name → nodes it names
// a hyphen separates words, as \b did: "Abyss-related" names the Abyss; "Mary-Ann" is looked up as "mary ann"
const key = (name) => name.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
for (const n of nodes) for (const name of namesOf(n)) (owners.get(key(name)) ?? owners.set(key(name), []).get(key(name))).push(n);
const maxWords = Math.max(...[...owners.keys()].map((k) => k.split(' ').length));
const linesOf = new Map(nodes.map((n) => [n.page, []]));
for (const l of all) {
  const hit = new Map(); // page → by_node
  for (const n of owners.get(key(l.speaker)) ?? []) if (n.kind === 'character') hit.set(n.page, true);
  // every run of 1..maxWords words is looked up, so a shorter name inside a longer one is found too
  // ("Dottore" in "Il Dottore"); words keep inner apostrophes (Khaenri'ah)
  const words = (l.text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’.][\p{L}\p{N}]+)*/gu) ?? []).map((w) => w.replace(/['’]s$/, '')); // Khaenri'ah's → khaenri'ah
  for (let i = 0; i < words.length; i++) {
    for (let k = 1; k <= maxWords && i + k <= words.length; k++) {
      for (const n of owners.get(words.slice(i, i + k).join(' ')) ?? []) if (!hit.has(n.page)) hit.set(n.page, false);
    }
  }
  for (const [page, by] of hit) linesOf.get(page).push({ ...l, by_node: by });
}
const out = {};
for (const n of nodes) {
  const lines = linesOf.get(n.page);
  // at most 6 lines per quest; articles pick from these by version (articles.mjs)
  const seen = new Set();
  const picked = [];
  for (const pass of [true, false]) {
    const perQuest = new Map();
    for (const l of lines.filter((x) => x.by_node === pass).sort((a, b) => order.get(a.version) - order.get(b.version))) {
      const k = l.text.toLowerCase();
      if (seen.has(k) || (perQuest.get(l.quest) ?? 0) >= 6) continue;
      seen.add(k);
      perQuest.set(l.quest, (perQuest.get(l.quest) ?? 0) + 1);
      picked.push(l);
    }
  }
  out[n.page] = picked;
  console.error(`${n.page}: ${lines.length} lines, kept ${picked.length}`);
}
await mkdir(join(ROOT, '.cache/theme'), { recursive: true });
await writeFile(join(ROOT, '.cache/theme', `dialogue-${theme}.json`), JSON.stringify(out, null, 1));
