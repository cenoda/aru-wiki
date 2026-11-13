import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchIndex, candidates } from './build-index.mjs';
import { articlePieces, bigrams, decodePostings, encodePostings, foldMap, foldText, shardOf } from './text.mjs';

const art = (lead, sections = []) => ({ lead: { s: lead.map((t) => ({ t })) }, sections });

test('folding drops spaces and punctuation, lower-cases, and maps back to the original', () => {
  assert.equal(foldText('켄리아의 왕, Dainsleif!'), '켄리아의왕dainsleif');
  const { folded, map } = foldMap('a 켄·리');
  assert.equal(folded, 'a켄리');
  assert.deepEqual(map, [0, 2, 4]);
  assert.equal(foldText('ＡＢ'), 'ab'); // full-width letters (NFKC)
});

test('bigrams are distinct and need two characters', () => {
  assert.deepEqual(bigrams('켄리아켄리'), ['켄리', '리아', '아켄']);
  assert.deepEqual(bigrams('켄'), []);
  assert.deepEqual(bigrams(''), []);
});

test('posting lists round-trip, including large gaps', () => {
  const list = [[0, false], [1, true], [2, false], [40, true], [1500, false], [70000, true]];
  assert.deepEqual(decodePostings(encodePostings(list)), list);
  assert.equal(encodePostings([[0, false]]), 'A');
});

test('shards are stable and in range', () => {
  for (const g of ['켄리', 'ab', '아켄']) {
    const s = shardOf(g, 16);
    assert.ok(s >= 0 && s < 16);
    assert.equal(shardOf(g, 16), s);
  }
});

test('article pieces: lead, headings, dialogue line, paragraphs', () => {
  const a = { lead: { s: [{ t: '첫 **문장**.' }, { t: '둘째.' }] }, sections: [{ h: '역사', q: { t: '대사' }, p: [{ s: [{ t: '본문.' }] }] }] };
  assert.deepEqual(articlePieces(a), ['첫 문장. 둘째.', '역사', '대사', '본문.']);
});

test('index finds documents holding every bigram, per article version', () => {
  const docs = [
    { page: 'Khaenri\'ah', from: 51, pieces: articlePieces(art(['켄리아는 신이 없는 나라였다.'], [{ h: '멸망', p: [{ s: [{ t: '오백 년 전 재앙으로 멸망했다.' }] }] }])) },
    { page: 'Dainsleif', from: 10, pieces: articlePieces(art(['데인슬레이프는 켄리아의 근위대장이었다.'])) },
    { page: 'Dainsleif', from: 40, pieces: articlePieces(art(['데인슬레이프는 심연을 쫓는다.'])) },
    { page: 'Mondstadt', from: 0, pieces: articlePieces(art(['몬드는 바람의 나라다.'])) },
  ];
  const index = buildSearchIndex(docs, { shards: 8 });
  assert.equal(index.shards.length, 8);
  assert.deepEqual(index.meta.docs, [['Dainsleif', 10], ['Dainsleif', 40], ["Khaenri'ah", 51], ['Mondstadt', 0]]);
  assert.deepEqual(candidates(index, '켄리아', decodePostings), [['Dainsleif', 10], ["Khaenri'ah", 51]]);
  assert.deepEqual(candidates(index, '심연', decodePostings), [['Dainsleif', 40]]);
  assert.deepEqual(candidates(index, '나라', decodePostings), [["Khaenri'ah", 51], ['Mondstadt', 0]]);
  // spaces and punctuation in the query do not matter; headings are searched
  assert.deepEqual(candidates(index, '오백 년', decodePostings), [["Khaenri'ah", 51]]);
  assert.deepEqual(candidates(index, '멸망', decodePostings), [["Khaenri'ah", 51]]);
  assert.deepEqual(candidates(index, '리월', decodePostings), []);
  assert.deepEqual(candidates(index, '켄', decodePostings), []); // one character: not searched
  // bigrams never cross from one piece to the next
  assert.deepEqual(candidates(index, '다멸', decodePostings), []);
});

test('the many flag marks bigrams that occur often in a document', () => {
  const index = buildSearchIndex([
    { page: 'A', from: 0, pieces: ['신 신 신'] },
    { page: 'B', from: 0, pieces: ['신신신신'] },
  ], { shards: 1 });
  assert.deepEqual(decodePostings(index.shards[0]['신신']), [[0, false], [1, true]]);
});
