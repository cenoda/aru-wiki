import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isContextDependent, pointKey } from './ko-extra.mjs';
import { makeLocalizer } from '../recommend/ko-text.mjs';

test('Archon in any form depends on the sentence', () => {
  for (const n of ['Archon', 'Archons', 'The Archons']) assert.ok(isContextDependent(n));
  assert.ok(!isContextDependent('Anemo Archon'));
});

test('pointKey is stable and short', () => {
  assert.equal(pointKey('a'), pointKey('a'));
  assert.notEqual(pointKey('a'), pointKey('b'));
  assert.match(pointKey('x'), /^[0-9a-f]{12}$/);
});

test('a per-sentence choice re-fits the particle', () => {
  const l = makeLocalizer([['Archon', '집정관'], ['Abyssal', '심연']]);
  assert.equal(l('Archon들이 다스리는 세상'), '집정관들이 다스리는 세상');
  assert.equal(l('Abyssal의 침공과 Archon가'), '심연의 침공과 집정관이');
});

test('missingKorean allows changes only around English', async () => {
  const { missingKorean } = await import('./ko-extra.mjs');
  const from = '켄리아가 파괴된 뒤 순수하지 않은 주민은 hilichurls 같은 괴물이 되는 저주를 받았다.';
  assert.equal(missingKorean(from, '켄리아가 파괴된 뒤 순수하지 않은 주민은 츄츄족 같은 괴물이 되는 저주를 받았다.'), null);
  assert.ok(missingKorean(from, '켄리아가 멸망한 뒤 순수하지 않은 주민은 츄츄족 같은 괴물이 되는 저주를 받았다.'));
  assert.equal(missingKorean('도토레는 No. 2 집행관이다', '도토레는 제2위 집행관이다'), null);
});

test('tidy turns a leftover "제. N" into a rank', async () => {
  const { tidy } = await import('./ko-extra.mjs');
  assert.equal(tidy('11집행관 중 제. 5이다. 제. 3까지는'), '11집행관 중 제5위이다. 제3위까지는');
  assert.equal(tidy('제3위'), '제3위');
});

test('tidy writes an element Archon as "OO의 신", Gnosis untouched', async () => {
  const { tidy } = await import('./ko-extra.mjs');
  assert.equal(tidy('수메르의 풀 집정관이며'), '수메르의 풀의 신이며');
  assert.equal(tidy('얼음 집정관으로 올랐고'), '얼음의 신으로 올랐고');
  assert.equal(tidy('물 신 에게리아와 번개 신이'), '물의 신 에게리아와 번개의 신이');
  assert.equal(tidy('번개 신의 심장'), '번개 신의 심장');
  assert.equal(tidy('불의 신'), '불의 신');
});
