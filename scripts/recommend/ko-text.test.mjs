import assert from 'node:assert/strict';
import test from 'node:test';
import { fitParticle, makeLocalizer } from './ko-text.mjs';

const localize = makeLocalizer([
  ['Aksinya', '악시냐'], ['Hvergelmir', '근원 연구소'], ['Ann', '안'], ['Mary-Ann', '마리안'],
  ['Mary-Ann Guillotin', '마리안 기요틴'], ['Ei', '라이덴 에이(影)'], ['Eye of Graeae', '「잿빛 눈동자」'],
  ['A Mirror That Reflects the Foe', '증오를 비추는 거울'], ['Liyue', '리월'],
]);

test('replaces names and re-chooses particles', () => {
  assert.equal(localize('Hvergelmir와 Aksinya가 처음 소개된다'), '근원 연구소와 악시냐가 처음 소개된다');
  assert.equal(localize('Ann을 만난다'), '안을 만난다');
  assert.equal(localize('Ann를 만난다'), '안을 만난다');
  assert.equal(localize('Liyue로 간다'), '리월로 간다');
  assert.equal(localize('Hvergelmir으로부터'), '근원 연구소로부터');
});

test('titles in brackets', () => {
  assert.equal(localize('「A Mirror That Reflects the Foe」는 이미'), '「증오를 비추는 거울」은 이미');
  assert.equal(localize('「모르는 제목」를 본다'), '「모르는 제목」을 본다');
});

test('longest name wins, whole words only', () => {
  assert.equal(localize('Mary-Ann Guillotin과 Mary-Ann, Ann'), '마리안 기요틴과 마리안, 안');
  assert.equal(localize('Annabelle and Eiko'), 'Annabelle and Eiko');
});

test('parenthetical and bracketed names', () => {
  assert.equal(localize('Ei가 돌아온다'), '라이덴 에이(影)가 돌아온다');
  assert.equal(localize('Eye of Graeae를 만든'), '「잿빛 눈동자」를 만든');
});

test('leaves words that only start like particles', () => {
  assert.deepEqual(fitParticle('악시냐', '이다'), { from: 0, to: '' });
  assert.deepEqual(fitParticle('안', '는데'), { from: 0, to: '' });
  assert.equal(localize('Aksinya이라는 광대'), '악시냐라는 광대');
});

test('quest titles: one word only in brackets, longer titles also bare', () => {
  const loc = makeLocalizer([['Ann', '안']], [['Paradise', '낙원'], ["Windblume's Breath", '바람꽃의 숨결']]);
  assert.equal(loc('Paradise와 「Paradise」를'), 'Paradise와 「낙원」을');
  assert.equal(loc("Windblume's Breath에서 Ann과"), '바람꽃의 숨결에서 안과');
});

test('own Hangul spellings and "The" names', () => {
  const loc = makeLocalizer([['Aksinya', '악시냐'], ['The Knave', '「하인」'], ['Hiisi Island', '히시섬']], [],
    [['아크신야', '악시냐'], ['히이시 섬', '히시섬'], ['시타리', '시틀라리']]);
  assert.equal(loc('아크신야를 "Court Jester"로, 아크신야가 Knave와'), '악시냐를 "Court Jester"로, 악시냐가 「하인」과');
  assert.equal(loc('히이시 섬에서'), '히시섬에서');
  assert.equal(loc('시타리아와 시타리의'), '시타리아와 시틀라리의');
});

test('no repeated name in parentheses', () => {
  const loc = makeLocalizer([['Avrelian', '아브렐리안'], ['Reed Miller', '리드 밀러']]);
  assert.equal(loc('아브렐리안(Avrelian, 일명 Reed Miller)과 아브렐리안(Avrelian)'), '아브렐리안(일명 리드 밀러)과 아브렐리안');
});
