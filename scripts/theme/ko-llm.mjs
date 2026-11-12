// Work files for LLM translation of English left in snapshot points, and their import
// (data/manual/ko-names-llm.json, data/manual/ko-context.json; see ko-extra.mjs).
// This script calls no LLM: the agents read .cache/ko-llm/<step>-<i>.json and README-<step>.md,
// and write <step>-<i>.out.json.
//
//   node scripts/theme/ko-llm.mjs tasks names [--parts 3] [--theme khaenriah]
//   node scripts/theme/ko-llm.mjs import names
//   node scripts/theme/snapshots.mjs khaenriah --write --only none      (apply the names)
//   node scripts/theme/ko-llm.mjs tasks context [--parts 3]            (what is still English, per sentence)
//   node scripts/theme/ko-llm.mjs import context
//   node scripts/theme/snapshots.mjs khaenriah --write --only none
//   node scripts/theme/ko-llm.mjs tasks rewrite [--parts 3]            (sentences still not clean Korean)
//   node scripts/theme/ko-llm.mjs import rewrite
//   node scripts/theme/snapshots.mjs khaenriah --write --only none
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { CONTEXT, LLM_NAMES, REWRITE, isContextDependent, missingKorean, pointKey } from './ko-extra.mjs';
import { namesLeft, shownRecords } from './names-left.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const WORK = join(ROOT, '.cache/ko-llm');
const BY = 'claude';

const RULES_COMMON = `
- 원신 한국어판의 표기 관습을 따른다. 공식 이름이 덤프 후보(exact, history)에 있으면 그것을 쓴다.
- 이미 쓰는 이름과 맞춘다: ${join(ROOT, 'data/generated/ko-names.json')} (영어 → { ko }), ${join(ROOT, 'data/manual/ko-names.json')}. 필요하면 grep으로 찾는다.
- 인터넷은 쓰지 않는다(웹 검색·웹 페이지 읽기 금지). 위 파일과 작업 파일만 읽는다.
- 이름의 정체를 드러내지 않는다. 적힌 호칭을 옮길 뿐, 그 호칭이 가리키는 인물의 본명으로 바꾸지 않는다(Gold → 황금, 라인도티르 아님; Ruler of Life → 생명의 집정관, 나베리우스 아님).
- 한국어에는 조사를 붙이지 않는다(조사는 스크립트가 맞춘다). 영어 글자를 남기지 않는다.
- Archon은 문맥마다 다르다. 마신: 그 자체로 강하지만 그냥 강한 존재(마신 전쟁의 마신들). 집정관: 마신 중 마신 전쟁에서 이겨 일곱 개의 신의 심장을 차지한 자들(7명의 집정관).
`;

const README = {
  names: `# 이름 번역 (names)

입력: 같은 폴더의 names-<i>.json. 항목마다 영어 이름(name), 나온 횟수(n), 그 이름이 영어로 남은 한국어 문장(examples.ko)과 그 근거 영어 인용(examples.quote), 로컬 Fandom 덤프의 후보 행(candidates)이 있다.

출력: names-<i>.out.json, JSON 배열. 입력의 모든 이름에 한 항목씩.
  { "name": "<입력 그대로>", "kind": "name" | "context" | "keep", "ko": "<kind가 name일 때만>", "note": "<짧은 근거, 선택>" }

- name: 어느 문장에서나 같은 한국어로 옮길 수 있는 이름. ko에 한국어.
- context: 문장에 따라 한국어가 달라지는 말(Archon, Abyssal, Moon처럼 형용사·일반어로도 쓰이는 말). ko 없음. 다음 단계에서 문장마다 고른다.
- keep: 영어로 두는 편이 맞는 것(드묾). note에 이유.
- 단수·복수, The 유무가 다른 형태는 같은 한국어로 맞춘다.
${RULES_COMMON}`,
  context: `# 문장별 번역 (context)

입력: 같은 폴더의 context-<i>.json. 항목마다 문장 id(key), 지금의 한국어 문장(text), 근거 영어 인용(quote), 문장에 영어로 남은 말(words)이 있다.

출력: context-<i>.out.json, JSON 객체. { "<key>": { "<words의 말 그대로>": "<한국어>" | null } }
- words의 말마다 그 문장에서 맞는 한국어를 적는다. 영어로 두어야 하면 null.
- 같은 이름은 문장이 달라도 같은 한국어로 쓴다(문맥에 따라 뜻이 달라지는 말만 다르게).
- 바꾼 뒤 문장이 자연스러워야 한다. 조사는 스크립트가 맞춘다.
${RULES_COMMON}`,
};

README.rewrite = `# 문장 다시 쓰기 (rewrite)

입력: 같은 폴더의 rewrite-<i>.json. 항목마다 문장 id(key), 지금의 한국어 문장(text), 근거 영어 인용(quote)이 있다. 영어가 남았거나("hilichurls", "심연의 power") 낱말만 바꿔 어색해진 곳("제. 3", "마신 임무 V", "막 V")이 있다.

출력: rewrite-<i>.out.json, JSON 객체. { "<key>": "<고친 한국어 문장 전체>" | null }
- 영어로 남은 부분과 그 바로 앞뒤의 조사·띄어쓰기만 고친다. 나머지 한국어는 한 글자도 바꾸지 않는다(스크립트가 검사해서 다른 데가 바뀌면 버린다).
- 영어 글자를 남기지 않는다. 고칠 수 없으면 null.
- 번호: "No. 3" → "제3위", "Chapter V" → "제5장", "Act III" → "제3막"처럼 한국어 관습대로.
- 일반어는 뜻대로 옮긴다(cataclysm → 대재앙, hilichurls → 츄츄족, power → 힘).
${RULES_COMMON}`;

const readJson = async (path, fallback = {}) => {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
};
const split = (items, parts) => {
  const size = Math.ceil(items.length / parts);
  return Array.from({ length: parts }, (_, i) => items.slice(i * size, (i + 1) * size)).filter((a) => a.length);
};
const hasLatin = (s) => /[A-Za-z]/.test(s);
const hasHangul = (s) => /[가-힣]/.test(s);
const today = () => new Date().toISOString().slice(0, 10);

async function writeTasks(step, parts) {
  await mkdir(WORK, { recursive: true });
  for (const f of await readdir(WORK)) if (f.startsWith(`${step}-`)) await rm(join(WORK, f));
  await writeFile(join(WORK, `README-${step}.md`), README[step]);
  for (const [i, items] of parts.entries()) await writeFile(join(WORK, `${step}-${i + 1}.json`), `${JSON.stringify(items, null, 1)}\n`);
  console.log(`${parts.reduce((a, p) => a + p.length, 0)} items in ${parts.length} files → ${WORK}/${step}-<i>.json (rules: README-${step}.md)`);
}

async function readOutputs(step) {
  const files = (await readdir(WORK)).filter((f) => new RegExp(`^${step}-\\d+\\.json$`).test(f));
  const out = [];
  for (const f of files) {
    const task = JSON.parse(await readFile(join(WORK, f), 'utf8'));
    const res = await readJson(join(WORK, f.replace('.json', '.out.json')), null);
    if (!res) throw new Error(`missing ${f.replace('.json', '.out.json')}`);
    out.push({ file: f, task, res });
  }
  return out;
}

const { values: opt, positionals: [cmd, step] } = parseArgs({ allowPositionals: true, options: {
  parts: { type: 'string', default: '3' }, theme: { type: 'string', default: 'khaenriah' },
} });
if (!['tasks', 'import'].includes(cmd) || !README[step]) {
  console.error('usage: ko-llm.mjs tasks|import names|context [--parts 3] [--theme khaenriah]');
  process.exit(2);
}
// for names, also article paragraphs and timeline items (names-left.mjs shownRecords)
const snaps = step === 'names' ? await shownRecords(opt.theme)
  : (await readJson(join(ROOT, `data/generated/snapshots-${opt.theme}.json`))).snapshots ?? [];
const llmNames = await readJson(LLM_NAMES);
const context = await readJson(CONTEXT);

if (cmd === 'tasks' && step === 'names') {
  const cand = new Map(((await readJson(join(ROOT, 'data/generated/ko-name-candidates.json'))).names ?? []).map((c) => [c.name, c]));
  const examples = new Map();
  for (const r of snaps) for (const p of r.points) {
    if (p.status !== 'accepted') continue;
    for (const n of new Set(p.latin_left)) {
      const list = examples.get(n) ?? examples.set(n, []).get(n);
      if (list.length < 3) list.push({ ko: p.text, quote: p.quote });
    }
  }
  const items = [...namesLeft(snaps)].filter(([n]) => !llmNames[n]).map(([name, e]) => {
    const c = cand.get(name);
    const row = (p) => ({ en: p.en, ko: p.ko, page: p.page, ...(p.timestamp ? { revision_date: p.timestamp.slice(0, 10) } : {}) });
    return { name, n: e.n, examples: examples.get(name) ?? [{ ko: e.example }],
      candidates: { exact: (c?.exact ?? []).map(row), history: (c?.history ?? []).map(row), contains: (c?.contains ?? []).slice(0, 6).map(row) } };
  });
  await writeTasks('names', split(items, Number(opt.parts)));
}

if (cmd === 'tasks' && step === 'context') {
  const keep = new Set(Object.entries(llmNames).filter(([, v]) => v.kind === 'keep').map(([n]) => n));
  const byKey = new Map();
  for (const r of snaps) for (const p of r.points) {
    if (p.status !== 'accepted') continue;
    const words = [...new Set(p.latin_left)].filter((w) => !keep.has(w));
    const key = pointKey(p.text_raw);
    if (!words.length || context[key] || byKey.has(key)) continue;
    byKey.set(key, { key, node: r.ko ?? r.node, text: p.text, quote: p.quote, words });
  }
  // keep a node's sentences together so one agent sees them side by side
  const items = [...byKey.values()].sort((a, b) => a.node.localeCompare(b.node));
  await writeTasks('context', split(items, Number(opt.parts)));
}

if (cmd === 'tasks' && step === 'rewrite') {
  const rewrites = await readJson(REWRITE);
  const byKey = new Map();
  for (const r of snaps) for (const p of r.points) {
    if (p.status !== 'accepted' || !/[A-Za-z]|제\.\s?\d/.test(p.text)) continue;
    const key = pointKey(p.text_raw);
    if (rewrites[key]?.from === p.text || byKey.has(key)) continue;
    byKey.set(key, { key, node: r.ko ?? r.node, text: p.text, quote: p.quote });
  }
  const items = [...byKey.values()].sort((a, b) => a.node.localeCompare(b.node));
  await writeTasks('rewrite', split(items, Number(opt.parts)));
}

if (cmd === 'import' && step === 'rewrite') {
  const errors = [];
  let added = 0;
  const data = { $comment: 'Whole sentences rewritten by an LLM where word swaps could not make clean Korean (see ko-extra.mjs). Applied only while the sentence is still exactly `from`.', ...(await readJson(REWRITE)) };
  for (const { file, task, res } of await readOutputs('rewrite')) {
    const byKey = new Map(task.map((t) => [t.key, t]));
    for (const [key, text] of Object.entries(res ?? {})) {
      const t = byKey.get(key);
      if (!t) { errors.push(`${file}: ${key}: not in the task`); continue; }
      if (text == null) continue;
      const lost = missingKorean(t.text, text);
      if (lost) { errors.push(`${file}: ${key}: changed Korean outside the English parts ("${lost}")`); continue; }
      if (hasLatin(text)) { errors.push(`${file}: ${key}: still has English: ${text}`); continue; }
      data[key] = { from: t.text, text: text.trim() };
      added++;
    }
  }
  await writeFile(REWRITE, `${JSON.stringify(data, null, 1)}\n`);
  console.log(`${added} sentences → data/manual/ko-rewrite.json`);
  if (errors.length) { console.error(`${errors.length} problems:\n${errors.slice(0, 50).join('\n')}`); process.exitCode = 1; }
}

if (cmd === 'import' && step === 'names') {
  const errors = [];
  let added = 0;
  const data = { $comment: 'Korean written by an LLM where no source gives one (user decision 2026-11-12, docs/ko-names-plan.md). Not confirmed: a name in ko-names.json always wins. kind: name (one Korean everywhere), context (chosen per sentence in ko-context.json), keep (stays English).', ...llmNames };
  for (const { file, task, res } of await readOutputs('names')) {
    const asked = new Set(task.map((t) => t.name));
    for (const r of Array.isArray(res) ? res : []) {
      const where = `${file}: ${r.name}`;
      if (!asked.has(r.name)) { errors.push(`${where}: not in the task`); continue; }
      if (!['name', 'context', 'keep'].includes(r.kind)) { errors.push(`${where}: kind ${r.kind}`); continue; }
      if (r.kind === 'name' && (!r.ko || !hasHangul(r.ko) || hasLatin(r.ko))) { errors.push(`${where}: ko "${r.ko}"`); continue; }
      const kind = isContextDependent(r.name) ? 'context' : r.kind;
      data[r.name] = { ...(kind === 'name' ? { ko: r.ko.trim() } : {}), kind, by: BY, date: today(), ...(r.note ? { note: r.note } : {}) };
      asked.delete(r.name);
      added++;
    }
    for (const n of asked) errors.push(`${file}: ${n}: no answer`);
  }
  await writeFile(LLM_NAMES, `${JSON.stringify(data, null, 1)}\n`);
  console.log(`${added} names → data/manual/ko-names-llm.json`);
  if (errors.length) { console.error(`${errors.length} problems:\n${errors.join('\n')}`); process.exitCode = 1; }
}

if (cmd === 'import' && step === 'context') {
  const errors = [];
  let added = 0;
  const data = { $comment: 'Per-sentence Korean for English left in snapshot points, written by an LLM (see ko-extra.mjs). Key: pointKey(text_raw).', ...context };
  for (const { file, task, res } of await readOutputs('context')) {
    const asked = new Map(task.map((t) => [t.key, new Set(t.words)]));
    for (const [key, map] of Object.entries(res ?? {})) {
      const words = asked.get(key);
      if (!words) { errors.push(`${file}: ${key}: not in the task`); continue; }
      const ok = {};
      for (const [w, ko] of Object.entries(map ?? {})) {
        if (!words.has(w)) { errors.push(`${file}: ${key}: "${w}" not in words`); continue; }
        if (ko == null) continue;
        if (!hasHangul(ko) || hasLatin(ko)) { errors.push(`${file}: ${key}: ${w} = "${ko}"`); continue; }
        ok[w] = ko.trim();
      }
      if (Object.keys(ok).length) { data[key] = ok; added++; }
      asked.delete(key);
    }
    if (asked.size) errors.push(`${file}: ${asked.size} sentences with no answer`);
  }
  await writeFile(CONTEXT, `${JSON.stringify(data, null, 1)}\n`);
  console.log(`${added} sentences → data/manual/ko-context.json`);
  if (errors.length) { console.error(`${errors.length} problems:\n${errors.slice(0, 50).join('\n')}`); process.exitCode = 1; }
}
