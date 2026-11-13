// Builds the article-body search index (rules in text.mjs): an inverted index from character
// bigram to the documents that contain it, split into shard files by bigram so a query downloads
// only the few shards its bigrams fall in. A document is one article version of a page (a page can
// have articles written for several versions; the site keeps only the one it would show at the
// chosen version, so text from later versions is never found).
import { bigrams, encodePostings, foldText, MANY, shardOf } from './text.mjs';

/**
 * @param {{ page: string, from: number, pieces: string[] }[]} docs
 * @param {{ shards?: number }} [opts]
 * @returns {{ meta: { shards: number, docs: [string, number][] }, shards: Record<string, string>[] }}
 */
export function buildSearchIndex(docs, { shards = 64 } = {}) {
  const sorted = [...docs].sort((a, b) => (a.page < b.page ? -1 : a.page > b.page ? 1 : a.from - b.from));
  /** bigram -> [doc, count][] in doc order */
  const postings = new Map();
  sorted.forEach((d, i) => {
    const count = new Map();
    for (const piece of d.pieces) {
      const cs = [...foldText(piece)];
      for (let j = 0; j + 1 < cs.length; j++) {
        const g = cs[j] + cs[j + 1];
        count.set(g, (count.get(g) ?? 0) + 1);
      }
    }
    for (const [g, n] of count) (postings.get(g) ?? postings.set(g, []).get(g)).push([i, n]);
  });
  const files = Array.from({ length: shards }, () => ({}));
  for (const g of [...postings.keys()].sort()) {
    files[shardOf(g, shards)][g] = encodePostings(postings.get(g).map(([i, n]) => [i, n >= MANY]));
  }
  return { meta: { shards, docs: sorted.map((d) => [d.page, d.from]) }, shards: files };
}

/**
 * Query the built index the way the site does (src/bodySearch.ts), for tests and checks: the
 * documents holding every bigram of the query.
 * @param {ReturnType<typeof buildSearchIndex>} index
 * @param {string} query
 * @param {(s: string) => [number, boolean][]} decode
 */
export function candidates(index, query, decode) {
  const grams = bigrams(foldText(query));
  if (!grams.length) return [];
  let docs = null;
  for (const g of grams) {
    const enc = index.shards[shardOf(g, index.meta.shards)][g];
    const set = new Set(enc ? decode(enc).map(([d]) => d) : []);
    docs = docs ? docs.filter((d) => set.has(d)) : [...set];
  }
  return docs.map((d) => index.meta.docs[d]);
}
