// Korean names of quest characters (the page names in quest-characters.json and
// character-aliases.json); see ko-names.mjs for how a name is read from Fandom.
//
// Usage: node scripts/fandom/build-characters.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { generatedFile } from './paths.mjs';
import { FandomClient } from './client.mjs';
import { koNames, report } from './ko-names.mjs';

const file = generatedFile;
const read = async (f) => JSON.parse(await readFile(file(f), 'utf8'));
const client = new FandomClient({ refresh: process.argv.includes('--refresh') });
const log = (...a) => console.error('[characters]', ...a);

/** Page names of every quest character. */
export async function characterNames() {
  const [questChars, aliases] = await Promise.all([read('quest-characters.json'), read('character-aliases.json')]);
  return [...new Set([...Object.values(questChars).flat(), ...Object.keys(aliases)])].sort();
}

async function main() {
  const names = await characterNames();
  log(`characters: ${names.length}`);
  const result = await koNames(client, names);
  await writeFile(file('characters.json'), `${JSON.stringify(result.out, null, 1)}\n`);
  log(`fandom requests: ${client.requests}`);
  report(names.length, result);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
