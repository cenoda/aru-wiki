// Full-text search in article bodies: the rules shared by the index builder (build-index.mjs, run
// by build-runtime-data.mjs) and the site (src/bodySearch.ts). Both sides must cut text the same
// way, so they import this one file.
//
// Text is folded (lower case, NFKC, everything but letters and digits dropped, so spaces and
// punctuation never matter) and cut into character bigrams. A query matches a document when the
// document has every bigram of the folded query; the site then checks the exact folded string in
// the fetched article (bigrams alone can match out of order) and cuts the snippet.

const KEEP = /[\p{L}\p{N}]/u;

/**
 * The folded text and, for each folded character, the index of the original character it came
 * from (to cut and highlight a snippet in the original text).
 * @param {string} s
 * @returns {{ folded: string, map: number[] }}
 */
export function foldMap(s) {
  let folded = '';
  const map = [];
  let i = 0;
  for (const ch of s) {
    if (KEEP.test(ch)) {
      for (const c of ch.normalize('NFKC').toLowerCase()) {
        if (!KEEP.test(c)) continue;
        folded += c;
        map.push(i);
      }
    }
    i += ch.length;
  }
  return { folded, map };
}

/** @param {string} s */
export const foldText = (s) => foldMap(s).folded;

/**
 * The distinct bigrams of folded text (a one-character text has none: too short to search).
 * @param {string} folded
 * @returns {string[]}
 */
export function bigrams(folded) {
  const cs = [...folded];
  const out = new Set();
  for (let i = 0; i + 1 < cs.length; i++) out.add(cs[i] + cs[i + 1]);
  return [...out];
}

/**
 * Which shard file holds a bigram's postings.
 * @param {string} gram
 * @param {number} shards
 */
export function shardOf(gram, shards) {
  let h = 2166136261;
  for (const c of gram) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % shards;
}

/**
 * The searchable pieces of an article as the site shows it (src/lore.ts Article): section
 * headings, the dialogue line of a section, and each paragraph's sentences (without `**`).
 * @param {{ lead: { s: { t: string }[] } | null, sections: { h: string, q?: { t: string }, p: { s: { t: string }[] }[] }[] }} a
 * @returns {string[]}
 */
export function articlePieces(a) {
  // **bold** marks (WikiArticle renders them) are dropped, so a snippet shows plain text
  const para = (p) => p.s.map((x) => x.t).join(' ').replace(/\*\*/g, '');
  const out = [];
  if (a.lead) out.push(para(a.lead));
  for (const s of a.sections) {
    out.push(s.h);
    if (s.q) out.push(s.q.t);
    for (const p of s.p) out.push(para(p));
  }
  return out;
}

// Posting lists: sorted document numbers, each stored as (gap from the previous << 1 | many), where
// many means the bigram occurs at least MANY times in the document. Each number is written in
// base 32 digits, low digits first, in a 64-letter alphabet: the second half marks "more digits".
export const MANY = 3;
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * @param {[number, boolean][]} list document numbers ascending, with the "many" flag
 * @returns {string}
 */
export function encodePostings(list) {
  let out = '';
  let prev = -1;
  for (const [doc, many] of list) {
    let v = ((doc - prev - 1) << 1) | (many ? 1 : 0);
    prev = doc;
    while (v >= 32) { out += ALPHA[32 + (v & 31)]; v >>>= 5; }
    out += ALPHA[v];
  }
  return out;
}

/**
 * @param {string} s
 * @returns {[number, boolean][]}
 */
export function decodePostings(s) {
  const out = [];
  let prev = -1;
  let v = 0;
  let shift = 0;
  for (const ch of s) {
    const d = ALPHA.indexOf(ch);
    if (d < 0) throw new Error(`bad posting character ${ch}`);
    v += (d & 31) * 2 ** shift;
    if (d >= 32) { shift += 5; continue; }
    const doc = prev + 1 + Math.floor(v / 2);
    out.push([doc, v % 2 === 1]);
    prev = doc;
    v = 0;
    shift = 0;
  }
  return out;
}
