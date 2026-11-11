// One lookup of official Korean names for everything the UI and the recommendation reasons
// name: the lore pages of lore-links.json (places, factions, concepts, history, and the
// characters among them), every quest character, the areas each version opens and the events
// that group quests outside acts. See ko-names.mjs for how a name is read.
//
// Writes data/generated/ko-names.json: { "<Fandom page title>": { kind, ko, page, url, ... } },
// with kind "lore", "character" or "event". `ko` is null when no public source gives a Korean name.
//
// Usage: node scripts/fandom/build-ko-names.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { generatedFile } from './paths.mjs';
import { FandomClient } from './client.mjs';
import { koNames, report } from './ko-names.mjs';
import { characterNames } from './build-characters.mjs';

const file = generatedFile;
const client = new FandomClient({ refresh: process.argv.includes('--refresh') });
const log = (...a) => console.error('[ko-names]', ...a);

const lore = JSON.parse(await readFile(file('lore-links.json'), 'utf8'));
const versions = JSON.parse(await readFile(file('versions.json'), 'utf8'));
const units = JSON.parse(await readFile(file('quest-units.json'), 'utf8')).units;
const kind = new Map(Object.entries(lore).map(([t, v]) => [t, v.kind]));
for (const v of versions) for (const a of v.areas ?? []) if (!kind.has(a.en)) kind.set(a.en, 'lore');
for (const u of units) if (u.kind === 'event' && !kind.has(u.names.en)) kind.set(u.names.en, 'event');
for (const n of await characterNames()) if (!kind.has(n)) kind.set(n, 'character');
const titles = [...kind.keys()].sort();
log(`titles: ${titles.length} (lore-links ${Object.keys(lore).length})`);

const result = await koNames(client, titles);
const out = Object.fromEntries(titles.map((t) => [t, { kind: kind.get(t), ...result.out[t] }]));
await writeFile(file('ko-names.json'), `${JSON.stringify(out, null, 1)}\n`);
log(`fandom requests: ${client.requests}`);
report(titles.length, result);
const loreTitles = Object.keys(lore);
const loreMissing = loreTitles.filter((t) => !out[t].ko);
console.log(`\nlore-links pages: ${loreTitles.length}, with ko ${loreTitles.length - loreMissing.length}, missing ${loreMissing.length}`);
