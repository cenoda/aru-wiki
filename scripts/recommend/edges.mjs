// Accepted verdicts -> RECOMMENDED act edges for the site (design.md §5).
// Only pairs the judge recommended, whose quotes matched the excerpts, and that the second
// vendor supported are published; they stay `unreviewed` until a person checks them.
import { readFile, writeFile } from 'node:fs/promises';

const file = (f) => new URL(`../../data/generated/${f}`, import.meta.url);
const read = async (f) => JSON.parse(await readFile(file(f), 'utf8'));
const [quests, versions, judgments] = await Promise.all(['quests.json', 'versions.json', 'recommended-judgments.json'].map(read));
const byId = new Map(quests.map((q) => [q.id, q]));
const vOrder = new Map(versions.map((v) => [v.id, v.order]));
// The judge reads English pages and names stories in 「English title」; show the Korean name.
const koByEn = new Map(quests.filter((q) => q.names.ko).map((q) => [q.names.en, q.names.ko]));
const localize = (text) => text.replace(/「([^」]+)」/g, (m, t) => `「${koByEn.get(t) ?? t}」`);
const later = (a, b) => (vOrder.get(a) >= vOrder.get(b) ? a : b);

const edges = judgments.filter((j) => j.status === 'accepted').map((j) => {
  const s = byId.get(j.source), t = byId.get(j.target);
  return {
    source: j.source, target: j.target, relation: 'RECOMMENDED', basis: 'llm',
    strength: j.judge.strength, characters: j.characters,
    reason_ko: localize(j.judge.reason_ko), quotes_source: j.judge.quotes_a, quotes_target: j.judge.quotes_b,
    revealed_version: later(s.first_version, t.first_version),
    review: 'unreviewed', judged_by: j.judge.tool, verified_by: j.verify.tool,
    sources: [...s.sources, ...t.sources],
  };
});
await writeFile(file('recommended-edges.json'), `${JSON.stringify(edges, null, 1)}\n`);
const count = (k) => edges.filter((e) => e.strength === k).length;
console.log(`${edges.length} RECOMMENDED edges (${count('strong')} strong, ${count('weak')} weak) from ${judgments.length} verdicts`);
