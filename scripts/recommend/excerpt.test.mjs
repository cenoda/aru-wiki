import assert from 'node:assert/strict';
import test from 'node:test';
import { dialogueLines, excerpt, normalize } from './excerpt.mjs';

const page = `{{Quest Infobox}}
==Dialogue==
{{Dialogue Start}}
:'''Paimon:''' Hello!
:{{DIcon}} Who are you?
:'''{{MC}}:''' It's me.
:'''Marionette:''' I'm back, as you can see.
:'''Paimon:''' Wow.
{{Dialogue End}}
==Trivia==
*Sandrone was dead before this.`;

test('dialogueLines keeps the Dialogue section only and marks the player', () => {
  assert.deepEqual(dialogueLines(page), [
    'Paimon: Hello!', 'Traveler: Who are you?', "Traveler: It's me.", "Marionette: I'm back, as you can see.", 'Paimon: Wow.',
  ]);
});

test('excerpt keeps matching lines with one line of context', () => {
  const lines = ['a', 'b', 'Sandrone here', 'c', 'd', 'e', 'Marionette there', 'f'];
  assert.equal(excerpt(lines, ['Sandrone', 'Marionette'], 1000), 'b\nSandrone here\nc\n…\ne\nMarionette there\nf');
  // from the end, the earlier match is the one that is cut
  assert.equal(excerpt(lines, ['Sandrone', 'Marionette'], 21, 'end'), 'e\nMarionette there\nf');
});

test('normalize ignores quote style, case and spacing', () => {
  assert.equal(normalize('“It’s  ME…”'), normalize('"it\'s me..."'));
});
