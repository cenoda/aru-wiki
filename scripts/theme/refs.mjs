// Which pages of a theme mention another in their own prose: page A's wiki text (its page and its
// /Profile and /Storyline subpages) links [[B]] outside templates, infoboxes and list sections.
// One-sided ties: the chart draws them as faint dotted lines, apart from shared-story lines.
// Reads data/generated/theme-<id>.json and the Fandom dump; writes data/generated/refs-<id>.json.
// usage: node scripts/theme/refs.mjs khaenriah
import { readFile, writeFile } from 'node:fs/promises';
import { generatedFile } from '../fandom/paths.mjs';
import { FandomClient } from '../fandom/client.mjs';
import { linkTargets, normalizeTitle } from '../fandom/wikitext.mjs';

const id = process.argv[2] ?? 'khaenriah';
const theme = JSON.parse(await readFile(generatedFile(`theme-${id}.json`), 'utf8'));
const client = new FandomClient({});
const pages = await client.pageTexts();
const nodes = [theme.page, ...theme.nodes.map((n) => n.page)];
const base = (p) => p.replace(/\/(Storyline|Profile)$/, '');

// prose only: drop templates (nested), comments, refs and the sections that are lists or metadata
const SKIP = /^(Trivia|Gallery|References|Notes|See also|Navigation|Other Languages|Change History|Etymology|Quests?( and Events)?|Appearances|Mentions|Media|Videos?)$/i;
function prose(text) {
  let s = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<ref[^>/]*\/>|<ref[\s\S]*?<\/ref>/g, '');
  for (let i = 0; i < 8 && /\{\{/.test(s); i++) s = s.replace(/\{\{[^{}]*\}\}/g, '');
  const out = [];
  let on = true;
  for (const line of s.split('\n')) {
    const h = line.match(/^==+\s*(.*?)\s*==+\s*$/);
    if (h) { if (/^==[^=]/.test(line)) on = !SKIP.test(h[1]); continue; }
    if (on) out.push(line);
  }
  return out.join('\n');
}

const targets = new Map(); // normalized title -> node
const raw = new Set();
const linksOf = new Map();
for (const n of nodes) {
  const set = new Set();
  for (const t of new Set([n, base(n), `${base(n)}/Profile`, `${base(n)}/Storyline`])) {
    for (const l of linkTargets(prose(pages.get(t)?.content ?? ''))) set.add(normalizeTitle(l.split('#')[0]));
  }
  linksOf.set(n, set);
  set.forEach((x) => raw.add(x));
}
const canonical = await client.resolve([...raw]);
for (const n of nodes) targets.set(normalizeTitle(n), n), targets.set(normalizeTitle(base(n)), n);
const refs = [];
for (const a of nodes) {
  const hit = new Set();
  for (const l of linksOf.get(a)) {
    const b = targets.get(normalizeTitle(canonical.get(l) ?? l)) ?? targets.get(l);
    if (b && b !== a && base(b) !== base(a)) hit.add(b);
  }
  for (const b of hit) refs.push({ from: a, to: b });
}
await writeFile(generatedFile(`refs-${id}.json`), `${JSON.stringify({ theme: id, refs }, null, 1)}\n`);
const pairs = new Set(refs.map((r) => [r.from, r.to].sort().join('|')));
console.log(`${refs.length} references, ${pairs.size} pairs`);
