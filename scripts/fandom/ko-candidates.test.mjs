import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidatesFor, groupForms, pairsFromPage } from './ko-candidates.mjs';
import { accept, evidence, parseSpec } from './ko-accept.mjs';

test('pairsFromPage reads own rows, page title as default en', () => {
  const page = '{{Other Languages\n|en = Archon Quest\n|ko = {{tt|마신|魔神}} {{tt|임무|任務}}\n|2_en = Gold<!-- x -->\n|2_ko = _UNAVAILABLE\n}}';
  assert.deepEqual(pairsFromPage('Archon Quest', page), [{ en: 'Archon Quest', ko: '마신 임무', page: 'Archon Quest' }]);
  assert.deepEqual(pairsFromPage('X', '{{Other Languages\n|ko = 엑스\n}}'), [{ en: 'X', ko: '엑스', page: 'X' }]);
  assert.deepEqual(pairsFromPage('Y', 'no table'), []);
});

const pairs = [
  { en: 'The Chasm', ko: '층암거연', page: 'The Chasm (Area)' },
  { en: 'Archon Quest', ko: '마신 임무', page: 'Archon Quest' },
  { en: 'Archon War', ko: '마신 전쟁', page: 'Archon War' },
  { en: 'The Seven Archons', ko: '7명의 집정관', page: 'The Seven' },
  { en: 'Archonless', ko: '무신', page: 'Z' },
];

test('candidatesFor: exact up to The/plural, contains as whole word', () => {
  assert.equal(candidatesFor('Chasm', pairs).exact[0].ko, '층암거연');
  const c = candidatesFor('Archon', pairs);
  assert.deepEqual(c.exact, []);
  assert.deepEqual(c.contains.map((p) => p.en), ['Archon War', 'Archon Quest', 'The Seven Archons']);
  assert.deepEqual(c.words[0], ['마신', 2]);
});

test('candidatesFor: rows only in older revisions, newest first', () => {
  const old = [
    { en: 'God of the Woods', ko: '초목의 신', page: 'G', revid: 1, timestamp: '2022-03-15T00:00:00Z' },
    { en: 'God of the Woods', ko: '초목을 관장하던 신', page: 'G', revid: 2, timestamp: '2022-07-29T00:00:00Z' },
    { en: 'Other', ko: '다른', page: 'O', revid: 3, timestamp: '2023-01-01T00:00:00Z' },
  ];
  assert.deepEqual(candidatesFor('God of the Woods', pairs, old).history.map((p) => p.revid), [2, 1]);
});

test('groupForms merges singular/plural and The', () => {
  const row = (id, name, n) => ({ id, name, n, nodes: [], pages: [], example: '', ...candidatesFor(name, pairs) });
  const g = groupForms([row(1, 'Archon', 5), row(2, 'Chasm', 2), row(3, 'Archons', 1), row(4, 'The Chasm', 9)]);
  assert.deepEqual(g.map((r) => [r.forms, r.n]), [[['Chasm', 'The Chasm'], 11], [['Archon', 'Archons'], 6]]);
});

const cands = { theme: 't', names: [
  { name: 'Makoto', exact: [], history: [{ en: 'Makoto', ko: '라이덴 마코토', url: 'https://x/Makoto?oldid=1' }], contains: [] },
  { name: 'Archon', exact: [], contains: [
    { en: 'Archon Quest', ko: '마신 임무', url: 'https://x/Archon_Quest' },
    { en: 'The Seven Archons', ko: '7명의 집정관', url: 'https://x/The_Seven' }] },
] };

test('parseSpec', () => {
  assert.deepEqual(parseSpec('Harbinger|Harbingers=집행관'), { forms: ['Harbinger', 'Harbingers'], ko: '집행관' });
  assert.throws(() => parseSpec('Archon'));
  assert.throws(() => parseSpec('Archon=Archon'));
});

test('evidence only cites rows that contain the chosen Korean', () => {
  assert.deepEqual(evidence(cands, ['Archon'], '마신').map((p) => p.url), ['https://x/Archon_Quest']);
  assert.deepEqual(evidence(cands, ['Archon'], '신령'), []);
  assert.deepEqual(evidence(cands, ['Makoto'], '라이덴 마코토').map((p) => p.kind), ['history']);
});

test('accept: sources, refusal without source, no silent overwrite', () => {
  assert.throws(() => accept({}, cands, ['Archon|Archons=집정관']), /depends on the sentence/);
  const { data, added } = accept({}, cands, ['Archon|Archons=집정관'], { force: true });
  assert.deepEqual(added, ['Archon=집정관', 'Archons=집정관']);
  assert.deepEqual(data.Archon.sources, [{ url: 'https://x/The_Seven', site: 'fandom' }]);
  assert.match(data.Archon.note, /The Seven Archons/);
  assert.throws(() => accept({}, cands, ['Il Dottore=도토레']), /--play/);
  const played = accept({}, cands, ['Il Dottore=도토레'], { play: 'maintainer', note: '3장 4막' }).data['Il Dottore'];
  assert.deepEqual(played, { ko: '도토레', status: 'confirmed', sources: [{ site: 'play', by: 'maintainer' }], note: '3장 4막' });
  assert.deepEqual(accept({}, cands, ['Natlanese=나타 사람'], { maintainer: 'm' }).data.Natlanese.sources, [{ site: 'maintainer', by: 'm' }]);
  assert.throws(() => accept({ Makoto: { ko: '마코토' } }, cands, ['Makoto=라이덴 마코토']), /--force/);
  assert.equal(accept({ Makoto: { ko: '마코토' } }, cands, ['Makoto=라이덴 마코토'], { force: true }).data.Makoto.ko, '라이덴 마코토');
});
