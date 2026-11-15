// Count the English left in shown article text (the "English left in shown text" number of
// articles.mjs: latinNames() over the sentences of accepted/trimmed paragraphs), in rough buckets.
// Reads only; calls no LLM.
//   node scripts/theme/english-left.mjs [all,khaenriah] [--top 40] [--json out.json]
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { articlesPath, readArticles } from './article-store.mjs';
import { latinNames } from '../recommend/ko-text.mjs';

const { values: opt, positionals } = parseArgs({ allowPositionals: true, options: { top: { type: 'string', default: '40' }, json: { type: 'string' } } });
const themes = (positionals[0] ?? 'all,khaenriah').split(',');
const pathOf = (t) => (t.includes('/') ? t : articlesPath(gen, t));
const gen = new URL('../../data/generated/', import.meta.url).pathname;

const ABBR = /^(?:[A-Z]{2,}s?|[A-Z]-?Rank|Lv|Mr|Dr|Mrs|Ms|St|Vol|No)$/;
// English quote fragments: a run that starts with a function word or an interjection
const QUOTE_START = /^(?:This|That|These|Those|Indeed|But|How|Ah|Oh|All|In|The|Is|Are|Was|Let|May|Hail|Behold|Peace|Hear|Greetings|Take|Have|What|Why|Who|When|Where|We|You|Your|My|Our|It|If|And|Or|So|Do|Don't|I|I'm|Come|Go|Be|For|To|With|No|Yes|Well|Now|Then|Thank|Thanks|Please|Look|Not|One|Every|Here|There|They|He|She|His|Her|A|An|On|At|By|From|Of|As|Just|Even|Only|Never|Ever|Long|Glory|Farewell|Welcome|Good|Very|Such|Rise|Stand|Keep|Know|Hold|Remember|Listen|Wait|Stop|See)$/;
const bucket = (w) => {
  if (ABBR.test(w) || /^[A-Z][A-Z0-9-]+$/.test(w)) return 'abbr';
  if (/^Mt\.?$|^Mt /.test(w) || w === 'Mt') return 'mt';
  if (/\b(?:Teaser|Trailer|Forged|Collected|Miscellany|Overture|Demo|Event|Version)\b/.test(w)) return 'title';
  if (QUOTE_START.test(w.split(' ')[0])) return 'quote';
  return 'name';
};

const out = {};
for (const theme of themes) {
  const data = await readArticles(pathOf(theme), { articles: [] });
  const words = new Map();
  let total = 0, sentences = 0;
  for (const a of data.articles) for (const p of a.paragraphs) {
    if (!['accepted', 'trimmed'].includes(p.status)) continue;
    for (const s of p.sentences) {
      if (s.dropped) continue;
      const ns = latinNames(s.t);
      if (ns.length) sentences++;
      for (const n of ns) { total++; const e = words.get(n) ?? words.set(n, { n: 0, nodes: new Set() }).get(n); e.n++; e.nodes.add(a.node); }
    }
  }
  const buckets = {};
  for (const [w, e] of words) { const b = bucket(w); buckets[b] = (buckets[b] ?? 0) + e.n; }
  const sorted = [...words].sort((a, b) => b[1].n - a[1].n);
  console.log(`${theme}: ${total} English runs in ${sentences} sentences, ${words.size} distinct; buckets ${JSON.stringify(buckets)}`);
  for (const b of ['name', 'quote', 'title', 'mt', 'abbr']) {
    const top = sorted.filter(([w]) => bucket(w) === b).slice(0, Number(opt.top));
    console.log(`  ${b}: ${top.map(([w, e]) => `${w}×${e.n}`).join(', ')}`);
  }
  out[theme] = { total, sentences, buckets, words: Object.fromEntries(sorted.map(([w, e]) => [w, { n: e.n, bucket: bucket(w), nodes: [...e.nodes].slice(0, 5) }])) };
}
if (opt.json) await writeFile(join(process.cwd(), opt.json), `${JSON.stringify(out, null, 1)}\n`);
