import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createReportHandler } from '../report-server.mjs';
import { createSuggestHandler } from './server.mjs';
import { flagsOf, tidyText, validateSuggestion } from './shared.mjs';

const base = { kind: 'edit', page: "Khaenri'ah", v: '5.0', from: '4.7', section: '개요', orig: '켄리아는 지하의 나라다.', text: '켄리아는 신이 없는 지하의 나라다.', agree: true, own: true };

test('an edit needs both promises, a change and the paragraph it changes', () => {
  assert.deepEqual(validateSuggestion(base).record, { kind: 'edit', page: "Khaenri'ah", v: '5.0', from: '4.7', section: '개요', orig: base.orig, text: base.text, hint: { paste: false, ms: 0 } });
  assert.equal(validateSuggestion({ ...base, agree: false }).error, 'not_agreed');
  assert.equal(validateSuggestion({ ...base, own: 'yes' }).error, 'not_agreed');
  assert.equal(validateSuggestion({ ...base, text: `  ${base.orig} ` }).error, 'no_change');
  assert.equal(validateSuggestion({ ...base, orig: '' }).error, 'invalid_orig');
  assert.equal(validateSuggestion({ ...base, text: '가'.repeat(1501) }).error, 'text_too_long');
  assert.equal(validateSuggestion({ ...base, kind: 'delete' }).error, 'invalid_kind');
  assert.equal(validateSuggestion({ ...base, website: 'http://x' }).error, 'bot');
});

test('an edit is one paragraph; added text keeps its paragraphs', () => {
  assert.equal(validateSuggestion({ ...base, text: '첫 줄\n\n둘째   줄' }).record.text, '첫 줄 둘째 줄');
  const add = validateSuggestion({ kind: 'add', page: '켄리아', v: '5.0', section: '떡밥', text: ' 첫 문단 \n\n\n 둘째  문단\u0007 ', agree: true, own: true, nick: ' 별지기 ', evidence: '임무 「카리베르트」' });
  assert.equal(add.record.text, '첫 문단\n\n둘째 문단');
  assert.equal(add.record.nick, '별지기');
  assert.equal(add.record.orig, undefined);
  assert.equal(tidyText('a\r\nb'), 'a\n\nb');
  const page = validateSuggestion({ kind: 'page', page: '새 문서', v: '5.0', text: '첫 문단입니다.', agree: true, own: true });
  assert.equal('section' in page.record, false);
  assert.equal(validateSuggestion({ kind: 'page', page: '[[켄리아]]', v: '5.0', text: '첫 문단입니다.', agree: true, own: true }).error, 'invalid_page');
});

test('flags marks of pasted wiki text and fast pastes', () => {
  const f = (text, more = {}) => flagsOf({ text, evidence: '임무', ...more }).join('|');
  assert.match(f('[[켄리아]]는 지하의 나라다.[* 각주]'), /\[\[문서\]\] 링크 문법.*\[\* 각주\] 문법/);
  assert.match(f('멸망했다.[3] ~~사실 살아 있다~~'), /취소선.*각주 번호/);
  assert.match(f('가'.repeat(300), { hint: { paste: true, ms: 4000 } }), /붙여넣기: 300자를 4초에 냄/);
  assert.match(f('유출된 7.5 내용에 따르면'), /유출/);
  assert.equal(f('데인슬레이프는 켄리아의 궁정 친위대였다.'), '');
  assert.deepEqual(flagsOf({ text: '짧은 글' }), ['근거를 적지 않음']);
});

const listen = (handler) => new Promise((ok) => { const s = createServer(handler); s.listen(0, '127.0.0.1', () => ok({ s, url: `http://127.0.0.1:${s.address().port}` })); });
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('the receiver saves a suggestion without the address and limits the rate', async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'aru-suggest-')), 'q', 'suggestions.jsonl');
  const { s, url } = await listen(createSuggestHandler({ file, rateMax: 2, webhookUrl: '' }));
  try {
    const r = await post(`${url}/api/suggest`, { ...base, hint: { paste: true, ms: 1234 } });
    const data = await r.json();
    assert.equal(r.status, 200);
    assert.match(data.id, /^[0-9a-f]{12}$/);
    assert.equal((await post(`${url}/api/suggest`, { ...base, agree: false })).status, 400);
    assert.equal((await post(`${url}/api/suggest`, base)).status, 429);
    const lines = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(lines.length, 1);
    assert.equal(lines[0].id, data.id);
    assert.deepEqual(Object.keys(lines[0]).sort(), ['from', 'hint', 'id', 'kind', 'orig', 'page', 'section', 'text', 'ts', 'v']);
    assert.doesNotMatch(readFileSync(file, 'utf8'), /127\.0\.0\.1/);
  } finally { s.close(); }
});

test('a bot that fills the hidden field is told ok and nothing is saved; the day has a ceiling', async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'aru-suggest-')), 'suggestions.jsonl');
  const { s, url } = await listen(createSuggestHandler({ file, rateMax: 50, dayMax: 1, webhookUrl: '' }));
  try {
    const bot = await post(`${url}/api/suggest`, { ...base, website: 'spam' });
    assert.equal(bot.status, 200);
    assert.equal((await post(`${url}/api/suggest`, base)).status, 200);
    assert.equal((await post(`${url}/api/suggest`, base)).status, 503);
    assert.equal(readFileSync(file, 'utf8').trim().split('\n').length, 1);
  } finally { s.close(); }
});

test('error reports accept page names with spaces and apostrophes', async () => {
  const reportFile = join(mkdtempSync(join(tmpdir(), 'aru-report-')), 'reports.jsonl');
  const { s, url } = await listen(createReportHandler({ reportFile, webhookUrl: '' }));
  try {
    for (const nodeId of ["Five Sinners of Khaenri'ah", 'Nahida/Storyline', 'act:prologue-1']) {
      assert.equal((await post(`${url}/api/report`, { nodeId, version: '5.0', category: 'other' })).status, 200, nodeId);
    }
    assert.equal((await post(`${url}/api/report`, { nodeId: '<script>', version: '5.0', category: 'other' })).status, 400);
  } finally { s.close(); }
});
