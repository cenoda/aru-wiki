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
const out = {};
for (const n of nodes) {
  const names = namesOf(n);
  const said = new RegExp(`^(${names.map(escape).join('|')})\\s*:`, 'i');
  const named = new RegExp(`\\b(${names.map(escape).join('|')})\\b`, 'i');
  const lines = [];
  for (const q of questPages) {
    for (const l of dialogueLines(pages.get(q.names.en).content)) {
      const m = l.match(/^([^:]{1,40}):\s*(.+)$/);
      if (!m || m[2].length > MAX_LEN || m[2].length < 12 || /^Traveler$/i.test(m[1])) continue;
      const by = n.kind === 'character' && said.test(l);
      if (!by && !named.test(m[2])) continue;
      lines.push({ speaker: m[1].trim(), text: m[2].trim(), by_node: by, quest: q.names.en, quest_ko: q.names.ko ?? null, version: q.first_version });
    }
  }
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
