// Dialogue excerpts that the judge reads. Only the Dialogue section of quest pages is used:
// it is the in-game text, so later wiki edits do not carry future story into it
// (summaries and trivia do). Lines mentioning the shared characters are kept with context.
import { FandomClient } from '../fandom/client.mjs';
import { decodeEntities, plainText } from '../fandom/wikitext.mjs';

/** title -> { revid, content } of every article in the official dump (docs/rights-risk.md) */
export async function loadPages(client = new FandomClient()) {
  return client.pageTexts();
}

/** Dialogue section as plain lines; player choices are marked "Traveler:". */
export function dialogueLines(content) {
  const start = content.search(/^==\s*Dialogue\s*==\s*$/m);
  if (start < 0) return [];
  const rest = content.slice(start).split('\n').slice(1);
  const end = rest.findIndex((l) => /^==[^=]/.test(l));
  return (end < 0 ? rest : rest.slice(0, end))
    .map((l) => {
      const choice = /\{\{\s*DIcon/i.test(l);
      const text = decodeEntities(plainText(l.replace(/^[:;*#]+/, ''))).trim();
      // {{MC}} (the player's name) renders as nothing and leaves a bare ": line"
      const line = text.replace(/^:\s*/, 'Traveler: ');
      return line && (choice ? `Traveler: ${line}` : line);
    })
    .filter((l) => l && !/^(Dialogue Start|Dialogue End)$/i.test(l));
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Lines that mention any of `names`, with one line of context either side, joined until
 * `limit` characters. `from: 'end'` keeps the last matches (how a story left a character),
 * `'start'` the first ones (what a story assumes about them).
 */
export function excerpt(lines, names, limit, from = 'start') {
  // names may come normalized ("al ahmar" for "Al-Ahmar"), so a space matches - ' or space
  const re = new RegExp(`\\b(${names.map((n) => escape(n).replace(/ /g, "[\\s\\-'’]+")).join('|')})\\b`, 'i');
  const keep = new Set();
  lines.forEach((l, i) => { if (re.test(l)) for (const j of [i - 1, i, i + 1]) if (lines[j]) keep.add(j); });
  let idx = [...keep].sort((a, b) => a - b);
  if (from === 'end') idx.reverse();
  const picked = [];
  let size = 0;
  for (const i of idx) {
    if (size + lines[i].length > limit) break;
    picked.push(i);
    size += lines[i].length + 1;
  }
  picked.sort((a, b) => a - b);
  return picked.map((i, k) => (k && picked[k - 1] !== i - 1 ? `…\n${lines[i]}` : lines[i])).join('\n');
}

/** Whitespace-, quote- and case-insensitive form used to check quotes against the excerpt. */
export const normalize = (s) => s.toLowerCase().replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"')
  .replace(/[…]/g, '...').replace(/\s+/g, ' ').trim();
