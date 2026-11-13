import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRecent, diffStates, mergeState, readerRows, signature } from './changes.mjs';

const art = (node, from_version, input_hash, shown = true) => ({
  node, from_version, input_hash,
  paragraphs: [{ status: shown ? 'accepted' : 'rejected', sentences: [{ t: 'x' }] }],
});

test('signature keeps only articles the site shows', () => {
  assert.deepEqual(signature([art('A', '5.0', 'h1'), art('A', '5.3', 'h2'), art('B', '5.0', 'h3', false)]), { A: { '5.0': 'h1', '5.3': 'h2' } });
});

test('theme articles win over whole-wiki ones', () => {
  assert.deepEqual(mergeState({ A: { '5.0': 't' } }, { A: { '4.0': 'w' }, B: { '5.0': 'w' } }), { A: { '5.0': 't' }, B: { '5.0': 'w' } });
});

test('diffStates: new page, added version, rewrite; unchanged pages give nothing', () => {
  const prev = { A: { '5.0': 'h1' }, B: { '5.0': 'h2' }, C: { '5.0': 'h3' } };
  const next = { A: { '5.0': 'h1', '5.3': 'h4' }, B: { '5.0': 'hX' }, C: { '5.0': 'h3' }, D: { '4.0': 'h5' } };
  assert.deepEqual(diffStates(prev, next, 'T'), [
    { t: 'T', page: 'A', k: 'more', v: ['5.3'] },
    { t: 'T', page: 'B', k: 'redo', v: ['5.0'] },
    { t: 'T', page: 'D', k: 'new', v: ['4.0'] },
  ]);
});

test('readerRows carries no fields beyond what the article shows', () => {
  const rows = readerRows([
    { id: 'a1', kind: 'edit', page: 'A', v: '5.0', section: '역사', text: '고친 글', nick: '닉', evidence: 'e', orig: 'o', approved: '2026-11-12' },
    { id: 'a2', kind: 'add', page: 'A', v: '5.0', text: 'x', approved: '2026-11-13', approved_at: '2026-11-13T01:02:03.000Z' },
  ]);
  assert.deepEqual(rows, [
    { t: '2026-11-12', page: 'A', k: 'edit', v: ['5.0'], sec: '역사', s: '고친 글', nick: '닉' },
    { t: '2026-11-13T01:02:03.000Z', page: 'A', k: 'add', v: ['5.0'], s: 'x' },
  ]);
});

test('buildRecent: newest first, gate is the later of page reveal and version, unknown pages dropped', () => {
  const order = new Map([['4.0', 10], ['5.0', 20], ['5.3', 23]]);
  const revealed = new Map([['A', 15], ['B', 0]]);
  const out = buildRecent([
    { t: '2026-11-10T00:00:00.000Z', page: 'A', k: 'new', v: ['5.0', '4.0'] },
    { t: '2026-11-12T00:00:00.000Z', page: 'B', k: 'more', v: ['5.3'] },
    { t: '2026-11-11T00:00:00.000Z', page: 'Gone', k: 'new', v: ['5.0'] },
    { t: '2026-11-11', page: '독자 문서', k: 'page', v: ['5.0'], s: 'x' },
    { t: '2026-11-11', page: 'Gone', k: 'edit', v: ['5.0'], s: 'x' },
  ], { order, revealedOf: (p) => revealed.get(p) });
  assert.deepEqual(out.map((r) => [r.page, r.g, r.v]), [['B', 23, [23]], ['독자 문서', 20, [20]], ['A', 15, [10, 20]]]);
});
