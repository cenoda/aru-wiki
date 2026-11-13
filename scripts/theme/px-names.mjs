// Parallel Task API: official Korean (in-game) form of English Genshin names, with citations.
//   node scripts/theme/px-names.mjs <names.json> <out.json> [processor=lite]   (PX_LIMIT=30 at a time; resumable)
// names.json: the items of `ko-llm.mjs tasks names` (name, examples). Decided 2026-11-13, docs/ko-names-plan.md.
// Key from ~/.config/aru/parallel.env, read here only, never printed.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
const key = readFileSync(`${homedir()}/.config/aru/parallel.env`, 'utf8').match(/^\s*PARALLEL_API_KEY\s*=\s*['"]?([^'"\s]+)/m)?.[1];
if (!key) throw new Error('no PARALLEL_API_KEY');
const [inFile, outFile, processor = 'lite'] = process.argv.slice(2);
const items = JSON.parse(readFileSync(inFile, 'utf8'));
const out = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
const BANNED = ['namu.moe', 'fandom.com', 'hoyolab.com', 'genshindb.com', 'honeyhunterworld.com', 'ambr.top', 'hakush.in', 'yatta.moe', 'paimon.moe', 'genshin.dev', 'enka.network', 'dcinside.com', 'arca.live', 'reddit.com'];
const schema = { type: 'object', additionalProperties: false, required: ['kind', 'ko', 'confidence', 'evidence'],
  properties: {
    kind: { type: 'string', enum: ['name', 'context', 'keep'], description: 'name: one Korean form fits every sentence. context: an ordinary word or adjective whose Korean depends on the sentence (Gate, Siege, Reckless). keep: should stay English (a fragment of an English quote, an abbreviation like NPC).' },
    ko: { type: 'string', description: 'Official Korean (Korean client) form when kind is name, without particles and without Latin letters; empty string otherwise.' },
    confidence: { type: 'string', enum: ['official', 'namu-only', 'guess'], description: 'official: seen in an official or reliable non-wiki source; namu-only: only namu.wiki shows it; guess: not found, translated by convention.' },
    evidence: { type: 'string', description: 'One short line: where the Korean form was seen.' } } };
const ask = (it) => `Genshin Impact (원신), Korean client. English term: "${it.name}".
How it appears in our Korean text (English left in place): ${it.examples.slice(0, 2).map((e) => `「${e.ko.slice(0, 300)}」`).join(' / ')}
Find the official Korean form used in the Korean version of the game (in-game text, official site, official notices or videos). Translate the title exactly as written; never replace a title with the real name it hides. namu.wiki may be a hint only: if only namu.wiki shows the form, set confidence to namu-only. Do not use leaks, datamined data or game-data databases.`;
async function api(path, body) {
  for (let t = 0; t < 5; t++) {
    const r = await fetch(`https://api.parallel.ai${path}`, { method: body ? 'POST' : 'GET', headers: { 'x-api-key': key, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 5000 * (t + 1))); continue; }
    const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 300)}`); return j;
  }
  throw new Error(`gave up on ${path}`);
}
const todo = items.filter((it) => !out[it.name]);
const LIMIT = Number(process.env.PX_LIMIT ?? 30);
let next = 0;
await Promise.all(Array.from({ length: LIMIT }, async () => { while (next < todo.length) { const it = todo[next++];
  try {
    const run = await api('/v1/tasks/runs', { input: ask(it), processor, source_policy: { exclude_domains: BANNED }, task_spec: { output_schema: { type: 'json', json_schema: schema } } });
    let res;
    for (;;) { try { res = await api(`/v1/tasks/runs/${run.run_id}/result?timeout=600`); break; } catch (e) { if (!/408|timeout/i.test(e.message)) throw e; } }
    const o = res.output ?? {};
    out[it.name] = { ...o.content, sources: [...new Set((o.basis ?? []).flatMap((b) => (b.citations ?? []).map((c) => c.url)))], processor };
    console.log(it.name, '→', JSON.stringify(o.content));
  } catch (e) { console.log(it.name, 'ERROR', e.message); }
  writeFileSync(outFile, `${JSON.stringify(out, null, 1)}\n`);
} }));
