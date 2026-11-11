import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from './render.mjs';

const page = `{{Character Infobox
|name = Dainsleif
|relative = {{Relative Type|friend|Halfdan}}
}}
'''Dainsleif''' is a [[Khaenri'ah|Khaenri'ahn]] wanderer.<ref name="q1">{{Ref/Quest|Bough Keeper: Dainsleif}}</ref> He met the {{MC}} in {{w|Liyue|Liyue Harbor}}.<ref name="q1" />
{{Quote|Game text that stays out.|Someone}}

==Profile==
He calls himself the "Bough Keeper".<ref>{{Ref/Book|Some Book|3}} and {{Ref/VO|Dainsleif|About}}</ref>
[[File:Dain.png|thumb|A [[Khaenri'ah]] caption]]

===Members===
{| class="wikitable"
! Name !! Title
|-
| Pierro || The Jester
|}

==Trivia==
* Out.

==References==
{{Reflist}}
[[de:Dainsleif]]`;

test('paragraphs, refs and skipped sections', () => {
  const { paragraphs } = renderPage(page, { prefix: 'A' });
  assert.deepEqual(paragraphs.map((p) => p.text), [
    "Dainsleif is a Khaenri'ahn wanderer. He met the Traveler in Liyue Harbor.",
    'He calls himself the "Bough Keeper".',
    'Name · Title',
    'Pierro · The Jester',
  ]);
  assert.equal(paragraphs[0].id, 'A1');
  assert.deepEqual(paragraphs[0].refs, [{ type: 'quest', name: 'Bough Keeper: Dainsleif' }]);
  assert.deepEqual(paragraphs[1].refs, [{ type: 'book', name: 'Some Book' }, { type: 'vo', name: 'Dainsleif' }]);
  assert.equal(paragraphs[1].section, 'Profile');
  assert.equal(paragraphs[3].section, 'Profile > Members');
});
