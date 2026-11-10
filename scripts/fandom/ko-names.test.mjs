import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanKo } from './ko-names.mjs';

test('cleanKo keeps the displayed name', () => {
  assert.equal(cleanKo('{{tt|감우|甘雨}}'), '감우');
  assert.equal(cleanKo('{{tt|//종려//|鍾離}}'), '종려');
  assert.equal(cleanKo('//{{tt|혜흠|慧欣}}//'), '혜흠');
  assert.equal(cleanKo('{{tt|명준|明俊}}{{Sino|ko|zh}}'), '명준');
  assert.equal(cleanKo('라이덴 에이{{tt|(影)|Hanja provided in brackets in-game.}}'), '라이덴 에이(影)');
  assert.equal(cleanKo('숙녀<ref name=Naming />'), '숙녀');
});

test('cleanKo drops Module:Ko-rm markers', () => {
  assert.equal(cleanKo('당< >무적'), '당무적');
  assert.equal(cleanKo('밤<->의 신'), '밤의 신');
  assert.equal(cleanKo('리드<・: >밀러 <13:십삼><->세'), '리드·밀러 13세');
  assert.equal(cleanKo('페오판<·: >세르게예비치'), '페오판·세르게예비치');
  assert.equal(cleanKo('아냐・「마리」・안데르스도테르'), '아냐·「마리」·안데르스도테르');
});

test('cleanKo treats blank and unavailable as missing', () => {
  assert.equal(cleanKo(''), '');
  assert.equal(cleanKo(' _UNAVAILABLE '), '');
  assert.equal(cleanKo('<!-- todo -->'), '');
});
