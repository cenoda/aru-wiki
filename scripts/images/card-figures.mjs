// Who each act card shows (docs/image-policy.md, docs/log/2026-11-10-review.md 3.4).
//
//   STORY / WORLD acts with an infobox `character`  → that character
//   Archon Interlude and Traveler chapters          → the one playable character who appears in
//                                                     every quest of the act, if exactly one does
//   data/manual/card-figures.json                    → a person's pick, overrides the above
//   anything else                                    → no figure (the card shows a region emblem)
//
// For every figure, the Fandom dump's {{Character Infobox}} says whether the character is
// playable and when it was released; the release version is when its image may appear.
// No network access.
//
// Usage: node scripts/images/card-figures.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { FandomClient, pageUrl } from '../fandom/client.mjs';
import { infobox } from '../fandom/wikitext.mjs';
import { generatedFile } from '../fandom/paths.mjs';

const read = async (f) => JSON.parse(await readFile(f, 'utf8'));
const log = (...a) => console.error('[card-figures]', ...a);
const [quests, questChars, koNames, versions, manual] = await Promise.all([
  read(generatedFile('quests.json')), read(generatedFile('quest-characters.json')), read(generatedFile('characters.json')),
  read(generatedFile('versions.json')), read(new URL('../../data/manual/card-figures.json', import.meta.url)),
]);

const NOT_A_FIGURE = new Set(['Paimon', 'Traveler']);
const acts = quests.filter((q) => q.level === 'ACT');
const questsOf = Map.groupBy(quests.filter((q) => q.level === 'QUEST' && q.act), (q) => q.act);

/** Characters who appear in every quest of the act (quest-characters.json), most frequent first. */
function everywhere(actId) {
  const list = questsOf.get(actId) ?? [];
  if (!list.length) return [];
  const count = new Map();
  for (const q of list) for (const c of new Set(questChars[q.id] ?? [])) count.set(c, (count.get(c) ?? 0) + 1);
  return [...count].filter(([c, n]) => n === list.length && !NOT_A_FIGURE.has(c)).map(([c]) => c);
}

const client = new FandomClient();
const pageCache = new Map();
async function character(name) {
  if (!pageCache.has(name)) {
    const page = (await client.latest([name])).get(name);
    const ib = page?.content ? infobox(page.content, 'Character Infobox') : null;
    pageCache.set(name, ib ? { type: ib.type ?? null, releaseDate: ib.releaseDate ?? null, revision: page.revid } : null);
  }
  return pageCache.get(name);
}

/** The version whose release day is the latest one on or before the date. */
function versionAt(date) {
  const day = /^(\d{4}-\d{2}-\d{2})/.exec(date ?? '')?.[1];
  if (!day) return null;
  let hit = null;
  for (const v of versions) if (v.released && v.released <= day) hit = v;
  // a date past the last version in the data is not yet covered by it
  const last = versions.at(-1);
  const next = new Date(`${last.released}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 42);
  return day >= next.toISOString().slice(0, 10) ? null : hit?.id ?? null;
}

const out = { acts: {}, characters: {}, undecided: {} };
for (const a of acts) {
  const pick = manual.acts?.[a.id];
  let name = null, basis = null;
  if (pick) { name = pick.character; basis = 'manual'; }
  else if ((a.quest_type === 'STORY' || a.quest_type === 'WORLD') && a.character && !NOT_A_FIGURE.has(a.character)) {
    name = a.character; basis = 'infobox';
  } else if (a.quest_type === 'ARCHON' && (a.chapter === 'Interlude Chapter' || a.character === 'Traveler')) {
    const playable = [];
    for (const c of everywhere(a.id)) if ((await character(c))?.type === 'Playable') playable.push(c);
    if (playable.length === 1) { name = playable[0]; basis = 'every-quest'; }
    else out.undecided[a.id] = playable; // [] = no playable character in every quest (an NPC chapter)
  }
  if (!name) continue;
  out.acts[a.id] = { character: name, basis };
  if (!out.characters[name]) {
    const c = await character(name);
    out.characters[name] = {
      ko: koNames[name]?.ko ?? null, // official Korean name (Fandom Other Languages), never transliterated
      playable: c?.type === 'Playable',
      release_date: c?.releaseDate ?? null,
      release_version: c?.type === 'Playable' ? versionAt(c.releaseDate) : null,
      source: { url: pageUrl(name), revision: c?.revision ?? null },
    };
  }
}

await writeFile(generatedFile('card-figures.json'), `${JSON.stringify(out, null, 1)}\n`);
const chars = Object.values(out.characters);
log(`acts with a figure: ${Object.keys(out.acts).length}, characters: ${chars.length}`,
  `(playable with a release version: ${chars.filter((c) => c.release_version).length})`);
log('undecided:', JSON.stringify(out.undecided));
