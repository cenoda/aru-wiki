// Apply data/manual/ko-rewrite.json to an articles file after the fact (publish-ready.sh), so a
// hand fix added while a chunk runs is not undone by that chunk's ready copy: the running
// articles.mjs read the rewrites when it started. Same rule as contextLocalizer(): a sentence
// changes only while its text before the polish step is still exactly `from`.
//   node scripts/theme/apply-rewrites.mjs data/generated/articles-all.json
import { readFile, writeFile } from 'node:fs/promises';
import { REWRITE, pointKey } from './ko-extra.mjs';

const file = process.argv[2];
const data = JSON.parse(await readFile(file, 'utf8'));
const rewrites = JSON.parse(await readFile(REWRITE, 'utf8'));
let n = 0;
for (const a of data.articles) for (const p of a.paragraphs) for (const s of p.sentences) {
  const r = rewrites[pointKey(s.t_raw)];
  if (!r || s.t === r.text) continue;
  if (s.t === r.from || s.polish?.from === r.from) { s.t = r.text; n++; }
}
if (n) await writeFile(file, `${JSON.stringify(data, null, 1)}\n`);
console.log(`${n} sentences rewritten`);
