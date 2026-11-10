// Quest series (Fandom "chapters"): a named group of acts or quests with a region, a type and
// the series that follow it (`next`). World quest chains such as Golden Slumber are chapters
// whose quests belong to no act, so this is how those quests get a home on the map.
//
// Reads quests.json from build-stage1.mjs; writes quest-series.json.
// Usage: node scripts/fandom/build-series.mjs [--refresh]
import { readFile, writeFile } from 'node:fs/promises';
import { FandomClient, pageUrl } from './client.mjs';
import { decodeEntities, infobox, linkTargets, normalizeTitle, plainText, slug } from './wikitext.mjs';

const client = new FandomClient({ refresh: process.argv.includes('--refresh') });
const file = (f) => new URL(`../../data/generated/${f}`, import.meta.url);
const quests = JSON.parse(await readFile(file('quests.json'), 'utf8'));
const byTitle = new Map(quests.map((q) => [q.names.en, q]));
const TYPE = { archon: 'ARCHON', story: 'STORY', world: 'WORLD', event: 'EVENT', hangout: 'STORY' };

const titles = await client.categoryMembers('Category:Quest Chapters');
const pages = await client.latest(titles);

// chapter infobox `next` / `prev` hold bare names, several as next, next2, ...
const fieldNames = (fields, base) => Object.keys(fields)
  .filter((k) => k === base || new RegExp(`^${base}\\d+$`).test(k))
  .flatMap((k) => decodeEntities(plainText(fields[k])).split(/\s*;\s*/))
  .map(normalizeTitle).filter(Boolean);

// Every link on the list lines of a section. Lists nest acts and their quests with # or *
// (`* Chapter 1 — [[Paradise]]` / `** [[A Day the Grand Temple…]]`), so all levels count.
function listLinks(text, heading) {
  const m = new RegExp(`^==\\s*${heading}\\s*==\\s*$`, 'mi').exec(text);
  if (!m) return [];
  const rest = text.slice(m.index + m[0].length);
  const end = rest.search(/^==[^=]/m);
  return (end === -1 ? rest : rest.slice(0, end)).split('\n')
    .filter((l) => /^[#*]/.test(l)).flatMap((l) => linkTargets(l));
}

const raw = [];
for (const title of titles) {
  const page = pages.get(title);
  if (!page) continue;
  const box = infobox(page.content, 'Chapter Infobox');
  if (!box) continue;
  const listed = listLinks(page.content, 'List of Quests');
  raw.push({ page, box, listed, next: fieldNames(box, 'next') });
}

// list entries can be redirects to the quest or act page
const canonical = await client.resolve(raw.flatMap((r) => [...r.listed, ...r.next]));
const seriesTitle = new Set(raw.map((r) => r.page.title));
const idOf = (t) => `series_${slug(t)}`;
const report = { unmatched: {} };

const series = raw.map(({ page, box, listed, next }) => {
  const members = [];
  for (const t of listed) {
    const q = byTitle.get(canonical.get(t) ?? t);
    if (q) members.push(q.id);
    else (report.unmatched[page.title] ??= []).push(t);
  }
  const ko = plainText(infobox(page.content, 'Other Languages')?.ko);
  return {
    id: idOf(page.title),
    names: { en: page.title, ...(ko ? { ko } : {}) },
    quest_type: TYPE[(box.type ?? '').toLowerCase()] ?? null,
    major: /^yes$/i.test(box.major ?? ''),
    ...(box.region ? { region: plainText(box.region).split(/\s*[;,]\s*/)[0] } : {}),
    members: [...new Set(members)],
    next: next.map((t) => canonical.get(t) ?? t).filter((t) => seriesTitle.has(t)).map(idOf),
    sources: [{ wiki: 'fandom', url: pageUrl(page.title), revision: page.revid }],
  };
}).filter((s) => s.members.length).sort((a, b) => a.id.localeCompare(b.id));

await writeFile(file('quest-series.json'), `${JSON.stringify(series, null, 1)}\n`);
const inSeries = new Set(series.flatMap((s) => s.members));
const loose = quests.filter((q) => q.level === 'QUEST' && !q.act);
const count = (t) => series.filter((s) => s.quest_type === t).length;
console.log(`${series.length} series (archon ${count('ARCHON')}, story ${count('STORY')}, world ${count('WORLD')}, event ${count('EVENT')})`);
console.log(`act-less quests in a series: ${loose.filter((q) => inSeries.has(q.id)).length} / ${loose.length}`);
console.log(`series with unmatched list entries: ${Object.keys(report.unmatched).length}`);
console.log(`fandom requests: ${client.requests}`);
