import assert from 'node:assert/strict';
import { test } from 'node:test';
import { infobox, linkTargets, normalizeTitle, plainText, sectionListLinks, slug } from './wikitext.mjs';

const ACT = `{{Act Infobox
|type           = Archon
|prev           = Autumn Winds, Scarlet Leaves
|archonQuestReq = [[Chapter I]]: Act I - [[Of the Land Amidst Monoliths]]
|storyQuestReq  = {{Quest|Omnipresence Over Mortals|showType=0}}
|empty          =
|note           = <!-- comment only -->
}}
'''Text''' with {{Other|x}}.

==Quests==
# [[Setting Sail]]
# [[Confessions of an Outlander|Confessions]]
#* [[Not A Quest Line]]

==Summary==
# [[Ignored]]`;

test('infobox reads named fields, skips empty and comment-only values', () => {
  const f = infobox(ACT, 'Act Infobox');
  assert.equal(f.type, 'Archon');
  assert.equal(f.prev, 'Autumn Winds, Scarlet Leaves');
  assert.equal(f.empty, undefined);
  assert.equal(f.note, undefined);
  assert.equal(f.storyQuestReq, '{{Quest|Omnipresence Over Mortals|showType=0}}');
});

test('infobox returns null when the template is missing', () => {
  assert.equal(infobox('no template here', 'Quest Infobox'), null);
});

test('linkTargets reads [[links]], labels, anchors and {{Quest|A;B}}', () => {
  assert.deepEqual(linkTargets('[[Chapter I]]: Act I - [[Of the Land Amidst Monoliths]]'),
    ['Chapter I', 'Of the Land Amidst Monoliths']);
  assert.deepEqual(linkTargets("Complete ''[[Farewell, Archaic Lord|FAL]]''"), ['Farewell, Archaic Lord']);
  assert.deepEqual(linkTargets('[[Page#Section]]'), ['Page']);
  assert.deepEqual(linkTargets('{{Quest|Masquerade of the Guilty;Umbrabilis Orchis Chapter|display=bullet}}'),
    ['Masquerade of the Guilty', 'Umbrabilis Orchis Chapter']);
});

test('sectionListLinks takes the first link of top-level numbered items only', () => {
  assert.deepEqual(sectionListLinks(ACT, 'Quests'), ['Setting Sail', 'Confessions of an Outlander']);
});

test('plainText strips markup', () => {
  assert.equal(plainText("이도 '''탈출''' [[계획|계획]]{{Ref|x}} <!-- c -->"), '이도 탈출 계획');
});

test('slug is ascii and stable', () => {
  assert.equal(slug('"Eye of Watatsumi"'), 'eye_of_watatsumi');
  assert.equal(slug('Bird\'s Eye View'), 'bird_s_eye_view');
});

test('tooltip templates keep their visible text', () => {
  assert.equal(plainText('{{tt|왕생|往生}}'), '왕생');
});

test('numeric Adventure Rank entries are not quest links', () => {
  assert.deepEqual(linkTargets('{{Quest|40;Melting Moonlight in the Morning Mist|display=bullet}}'),
    ['Melting Moonlight in the Morning Mist']);
});

test('titles decode HTML entities', () => {
  assert.equal(normalizeTitle('Floating Spirits &mdash; The Investigation Ends'), 'Floating Spirits — The Investigation Ends');
});
