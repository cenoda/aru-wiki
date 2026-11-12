#!/usr/bin/env node
// The operator's tool for reader suggestions. Nothing a reader sends is public until approved here.
//
//   node scripts/suggest/review.mjs pull                 서버의 대기열을 받아 온다 (.cache/suggest/inbox.jsonl)
//   node scripts/suggest/review.mjs list                 아직 정하지 않은 제안
//   node scripts/suggest/review.mjs show <id>            제안 하나를 자세히 (원문과 고친 글, 살펴볼 점)
//   node scripts/suggest/review.mjs approve <id> [--v 5.0] [--text "고쳐서 싣기"]
//   node scripts/suggest/review.mjs reject <id> [--note "사유(쓴 사람에게 보임)"]
//   node scripts/suggest/review.mjs remove <id> [--note "사유"]   실었던 글을 내린다 (삭제 요청 등)
//   node scripts/suggest/review.mjs stale                실었지만 지금 문서에 붙을 자리가 없는 글
//
// 승인·거절은 data/manual/reader-edits.json에 적힌다. 커밋하고 배포해야 사이트에 반영된다.
// 쓴 사람의 브라우저는 배포된 그 파일에서 자기 제안의 결과를 안다(서버에 상태를 묻지 않는다).
// Options: --inbox <file> (다른 대기열 파일), --host user@host, --key <ssh key>, --remote <path>
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flagsOf, titleKey } from './shared.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').startsWith('--'));
const [cmd, id] = positional;

const INBOX = resolve(root, opt('inbox', '.cache/suggest/inbox.jsonl'));
const EDITS = resolve(root, opt('edits', 'data/manual/reader-edits.json'));
const today = () => new Date().toISOString().slice(0, 10);
const KO = { edit: '문단 고치기', add: '문단 추가', page: '새 문서' };

const readInbox = () => (existsSync(INBOX) ? readFileSync(INBOX, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }) : []);
const readEdits = () => (existsSync(EDITS) ? JSON.parse(readFileSync(EDITS, 'utf8')) : { edits: [], rejected: [] });
const writeEdits = (d) => writeFileSync(EDITS, `${JSON.stringify(d, null, 2)}\n`);
const decided = (d) => new Set([...d.edits.map((e) => e.id), ...d.rejected.map((e) => e.id)]);
const find = (list, key) => {
  const hits = list.filter((r) => r.id === key || r.id.startsWith(key ?? '\0'));
  if (hits.length !== 1) { console.error(hits.length ? `"${key}"로 시작하는 제안이 ${hits.length}개입니다.` : `"${key}" 제안이 없습니다.`); process.exit(1); }
  return hits[0];
};

// ---------- where a suggestion attaches in the built site data ----------
const articleSlug = (page) => page.replace(/[^A-Za-z0-9]+/g, '_'); // src/lore.ts articleSlug
const versionsOrder = () => {
  const f = resolve(root, 'data/generated/versions.json');
  if (!existsSync(f)) return null;
  const d = JSON.parse(readFileSync(f, 'utf8'));
  const list = Array.isArray(d) ? d : d.versions ?? [];
  return new Map(list.map((v, i) => [v.id, v.order ?? i]));
};
const flat = (t) => (t ?? '').replace(/\s+/g, ' ').trim();
const paraText = (p) => flat(p.s.map((x) => x.t).join(' '));
/** null when the built data is missing (cannot tell), else whether the suggestion has a place */
function attaches(rec) {
  if (rec.kind === 'page') return true;
  const f = resolve(root, 'data/runtime/articles', `${articleSlug(rec.page)}.json`);
  if (!existsSync(f)) return existsSync(resolve(root, 'data/runtime/articles')) ? (rec.kind === 'add' ? true : false) : null;
  const order = versionsOrder();
  const { articles } = JSON.parse(readFileSync(f, 'utf8'));
  if (rec.kind === 'add') return true; // an added paragraph falls back to the readers' section
  const art = articles.find((a) => order && a.from === order.get(rec.from));
  if (!art) return false;
  const paras = [art.lead, ...art.sections.flatMap((s) => s.p)].filter(Boolean);
  return paras.some((p) => paraText(p) === flat(rec.orig));
}

const head = (r) => `${r.id}  ${r.ts?.slice(0, 16).replace('T', ' ') ?? ''}  ${KO[r.kind]}  「${r.page}」 ${r.v}${r.section ? ` · ${r.section}` : ''}  ${[...r.text].length}자${r.nick ? `  (${r.nick})` : ''}`;
function show(r) {
  console.log(head(r));
  if (r.kind === 'edit') console.log(`\n── 지금 글 (${r.from} 본문)\n${r.orig}`);
  console.log(`\n── ${r.kind === 'edit' ? '고친 글' : '쓴 글'}\n${r.text}`);
  console.log(`\n── 근거: ${r.evidence ?? '(없음)'}`);
  const flags = flagsOf(r);
  const place = attaches(r);
  if (place === false) flags.push('붙을 자리가 없음: 그 문단이 지금 문서에 없다(문서가 다시 쓰였거나 이미 고쳐짐)');
  if (place === null) flags.push('붙을 자리를 확인하지 못함: data/runtime이 없다(npm run build 뒤에 다시)');
  console.log(`\n── 살펴볼 점${flags.length ? `\n${flags.map((f) => `  - ${f}`).join('\n')}` : ': 기계가 찾은 것은 없음(통과라는 뜻은 아님)'}`);
  console.log('\n확인: 다른 사이트 문장을 옮긴 글이 아닌가 · 고른 버전보다 뒤의 내용(스포일러)이 없는가 · 유출이 아닌가 · 실제 사람을 헐뜯지 않는가');
}

if (cmd === 'pull') {
  const host = opt('host', 'ubuntu@147.224.187.173');
  const key = opt('key', resolve(homedir(), '.ssh/aru-deploy'));
  // the service runs as a DynamicUser; its state directory is readable by root only
  const remote = opt('remote', '/var/lib/aru-report/suggestions.jsonl');
  const out = execFileSync('ssh', ['-i', key, host, `sudo cat ${remote} 2>/dev/null || true`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  mkdirSync(dirname(INBOX), { recursive: true });
  writeFileSync(INBOX, out);
  const all = readInbox();
  const done = decided(readEdits());
  console.log(`받음: ${all.length}개, 아직 정하지 않은 것 ${all.filter((r) => !done.has(r.id)).length}개 → ${INBOX}`);
} else if (cmd === 'list') {
  const done = decided(readEdits());
  const open = readInbox().filter((r) => !done.has(r.id));
  if (!open.length) console.log('정하지 않은 제안이 없습니다.');
  for (const r of open) {
    const flags = flagsOf(r).filter((f) => f !== '근거를 적지 않음');
    console.log(`${head(r)}${flags.length ? `\n    ! ${flags.join(' / ')}` : ''}`);
  }
} else if (cmd === 'show') {
  const d = readEdits();
  show(find([...readInbox(), ...d.edits.filter((e) => !readInbox().some((r) => r.id === e.id))], id));
} else if (cmd === 'approve') {
  const d = readEdits();
  const r = find(readInbox(), id);
  if (decided(d).has(r.id)) { console.error('이미 정한 제안입니다. 내리려면 remove.'); process.exit(1); }
  const v = opt('v', r.v);
  const order = versionsOrder();
  if (order && !order.has(v)) { console.error(`버전 "${v}"이 없습니다.`); process.exit(1); }
  if (r.kind === 'page' && d.edits.some((e) => e.kind === 'page' && titleKey(e.page) === titleKey(r.page))) {
    console.error(`「${r.page}」 문서는 이미 있습니다. 이어 쓰는 글이면 문단 추가로 받아야 합니다.`); process.exit(1);
  }
  const text = opt('text', r.text);
  const { hint, ts, ...pub } = r;
  d.edits.push({ ...pub, v, text, ...(text !== r.text ? { edited_by_operator: true } : {}), submitted: ts?.slice(0, 10) ?? null, approved: today() });
  writeEdits(d);
  const place = attaches({ ...r, v });
  console.log(`실음: ${head(r)}${place === false ? '\n  ! 붙을 자리가 없어 화면에는 나오지 않습니다(stale로 확인).' : ''}\n커밋하고 배포하면 사이트에 나옵니다.`);
} else if (cmd === 'reject' || cmd === 'remove') {
  const d = readEdits();
  const note = opt('note', '');
  if (cmd === 'reject') {
    const r = find(readInbox(), id);
    if (decided(d).has(r.id)) { console.error('이미 정한 제안입니다.'); process.exit(1); }
    d.rejected.push({ id: r.id, ...(note ? { note } : {}), date: today() });
    console.log(`싣지 않음: ${head(r)}`);
  } else {
    const r = find(d.edits, id);
    d.edits = d.edits.filter((e) => e.id !== r.id);
    d.rejected.push({ id: r.id, ...(note ? { note } : {}), date: today(), removed: true });
    console.log(`내림: ${head(r)}`);
  }
  writeEdits(d);
} else if (cmd === 'stale') {
  const lost = readEdits().edits.filter((e) => attaches(e) === false);
  if (!lost.length) console.log('붙을 자리를 잃은 글이 없습니다.');
  for (const e of lost) console.log(head(e));
} else {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(1, 14).map((l) => l.slice(3)).join('\n'));
  process.exit(cmd ? 1 : 0);
}
