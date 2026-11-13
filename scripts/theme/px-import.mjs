// Parallel answers (.cache/px/out-all-lite.json from px-names.mjs) → .cache/ko-llm/names-1.out.json for
// `ko-llm.mjs import names` (rules agreed with the user 2026-11-13). Needs /tmp/wl with an-array-of-english-words.
//  official: as given, but one common English word → context
//  namu-only: as given, note "나무위키에서만 확인"
//  guess: as given, note "추정"; a one-word name found as a part of a known name ("Zhorik Shesternin=조릭·셰스테닌") takes that part
//  ko with █, Latin letters or no Hangul → left out (stays English)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const R = '/home/ubuntu/projects/aru-wiki/';
const words = new Set(createRequire('/tmp/wl/')('an-array-of-english-words'));
const px = JSON.parse(readFileSync(R + '.cache/px/out-all-lite.json', 'utf8'));
const task = JSON.parse(readFileSync(R + '.cache/ko-llm/names-1.json', 'utf8'));
const gen = JSON.parse(readFileSync(R + 'data/generated/ko-names.json', 'utf8'));
const common = (n) => /^[A-Za-z]+$/.test(n) && [n.toLowerCase(), n.toLowerCase().replace(/ies$/, 'y'), n.toLowerCase().replace(/e?s$/, '')].some((w) => words.has(w));
function partOf(n) {
  if (!/^[A-Za-z'-]+$/.test(n)) return null;
  const seen = new Map();
  for (const [en, v] of Object.entries(gen)) {
    if (!v?.ko) continue;
    const e = en.split(' '), k = v.ko.split(/[·\s]/);
    if (e.length < 2 || e.length !== k.length) continue;
    const i = e.indexOf(n); if (i >= 0) seen.set(k[i], (seen.get(k[i]) ?? 0) + 1);
  }
  const best = [...seen].sort((a, b) => b[1] - a[1]);
  return best.length && (best.length === 1 || best[0][1] > best[1][1]) ? best[0][0] : null;
}
const out = [], tally = {};
const bump = (k) => (tally[k] = (tally[k] ?? 0) + 1);
for (const t of task) {
  const a = px[t.name]; if (!a) { bump('no answer'); continue; }
  const src = a.sources?.length ? ` 출처: ${a.sources.slice(0, 2).join(' ')}` : '';
  let { kind, ko = '' } = a; ko = ko.trim();
  let note = `${a.evidence}${src}`;
  if (kind === 'name' && (/█|[A-Za-z]/.test(ko) || !/[가-힣]/.test(ko))) { bump('left out (bad ko)'); continue; }
  if (kind === 'name' && common(t.name)) { kind = 'context'; ko = ''; bump('common word → context'); }
  else if (a.confidence === 'namu-only') { note = `나무위키에서만 확인. ${note}`; bump('namu-only'); }
  else if (a.confidence === 'guess') {
    const p = kind === 'name' && partOf(t.name);
    if (p) { ko = p; note = `기존 이름의 일부에서 맞춤. ${note}`; bump('guess → matched part'); } else { note = `추정. ${note}`; bump('guess'); }
  } else bump(a.confidence === 'official' ? 'official' : 'other');
  out.push({ name: t.name, kind, ...(kind === 'name' ? { ko } : {}), note: note.slice(0, 300), by: `parallel-task-${a.processor ?? 'lite'} (${a.confidence})` });
}
writeFileSync(R + '.cache/ko-llm/names-1.out.json', `${JSON.stringify(out, null, 1)}\n`);
console.log(out.length, 'answers', tally);
