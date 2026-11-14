// Full-text search in article bodies (index built by scripts/search/, rules in scripts/search/text.mjs).
// Nothing is downloaded until someone searches: then the small document list and the index shards of
// the query's bigrams, and finally the article files of the best candidates, to check the exact text
// and cut a snippet. Version gating is the article page's own: a page not revealed at the chosen
// version is never found, and only the article the page would show at that version (articleAt) is
// searched, so text written for a later version is not found either.
import { articlePieces, bigrams, decodePostings, foldMap, foldText, shardOf } from '../scripts/search/text.mjs';
import { articleAt, loadPageData, type PageNode } from './lore';
import { fetchCover, fetchData, langData } from './split';

// The index comes in version blocks (scripts/split/build.mjs): each block has its own document list
// and shards, and a search at version v reads only the blocks that cover 0..v, so neither the names
// nor the words of later articles are downloaded.
interface Block { shards: number; docs: [string, number][]; files: string[] }

/** a query this short (after folding) is not searched in the bodies */
export const MIN_BODY_QUERY = 2;
/** Is the query long enough for a body search? */
export const bodySearchable = (q: string) => [...foldText(q)].length >= MIN_BODY_QUERY;

export interface BodyHit {
  page: string;
  /** times the query occurs in the article */
  count: number;
  /** the first occurrence with some text around it; `pre`/`post` are cut at a word where they can be */
  snip: { pre: string; hit: string; post: string; cutStart: boolean; cutEnd: boolean };
}

const PRE = 24, POST = 48;

/** Where the folded query occurs in an article's pieces: how many times, and a snippet of the first. */
function findIn(pieces: string[], fq: string): Omit<BodyHit, 'page'> | null {
  let count = 0;
  let snip: BodyHit['snip'] | null = null;
  for (const piece of pieces) {
    const { folded, map } = foldMap(piece);
    let at = folded.indexOf(fq);
    if (at < 0) continue;
    if (!snip) {
      const start = map[at];
      const lastCh = map[at + fq.length - 1];
      const end = lastCh + (piece.codePointAt(lastCh)! > 0xffff ? 2 : 1);
      let a = Math.max(0, start - PRE), b = Math.min(piece.length, end + POST);
      if (a > 0) { const sp = piece.indexOf(' ', a); if (sp >= 0 && sp < start) a = sp + 1; }
      if (b < piece.length) { const sp = piece.lastIndexOf(' ', b); if (sp > end) b = sp; }
      snip = { pre: piece.slice(a, start), hit: piece.slice(start, end), post: piece.slice(end, b), cutStart: a > 0, cutEnd: b < piece.length };
    }
    while (at >= 0) { count++; at = folded.indexOf(fq, at + fq.length); }
  }
  return snip ? { count, snip } : null;
}

/**
 * Pages whose article (as shown at version vIdx) contains the query, best first.
 * @param nodes every page the search knows (revealed version, prominence)
 * @param skip pages already listed by name
 */
export async function searchBodies(query: string, vIdx: number, nodes: Map<string, PageNode>, skip: Set<string>, limit = 5): Promise<BodyHit[]> {
  const fq = foldText(query);
  const grams = bigrams(fq);
  if (grams.length === 0) return [];
  const blocks = await fetchCover<Block>(langData().search, vIdx);
  // the article each page shows at vIdx, across the blocks: its latest version at or before vIdx
  const shownFrom = new Map<string, number>();
  for (const b of blocks) for (const [page, from] of b.docs) if (from <= vIdx && from > (shownFrom.get(page) ?? -1)) shownFrom.set(page, from);
  const scored: { page: string; s: number; n: PageNode }[] = [];
  await Promise.all(blocks.map(async (b) => {
    const shardOfGram = (g: string) => shardOf(g, b.shards);
    const shardMap = new Map(await Promise.all([...new Set(grams.map(shardOfGram))].map((i) => fetchData<Record<string, string>>(b.files[i]).then((d) => [i, d] as const))));
    // documents holding every bigram; score counts bigrams that occur often in the document
    let score: Map<number, number> | null = null;
    for (const g of grams) {
      const enc = shardMap.get(shardOfGram(g))?.[g];
      if (!enc) return;
      const next = new Map<number, number>();
      for (const [doc, many] of decodePostings(enc)) {
        const before = score ? score.get(doc) : 0;
        if (before !== undefined) next.set(doc, before + (many ? 2 : 1));
      }
      score = next;
      if (!score.size) return;
    }
    // version gating: the page is revealed, and the document is the article the page shows at vIdx
    for (const [doc, sc] of score!) {
      const [page, from] = b.docs[doc];
      const n = nodes.get(page);
      if (!n || n.revealed > vIdx || skip.has(page) || shownFrom.get(page) !== from) continue;
      scored.push({ page, s: sc, n });
    }
  }));
  const list = scored.sort((a, b) => b.s - a.s || Number(b.n.hub) - Number(a.n.hub) || b.n.units - a.n.units);
  // check the exact text in the article files, a few at a time, until enough are found
  const found: BodyHit[] = [];
  const BATCH = 8, MAX_FETCH = 32;
  for (let i = 0; i < Math.min(list.length, MAX_FETCH) && found.length < limit; i += BATCH) {
    const batch = await Promise.all(list.slice(i, i + BATCH).map(async ({ page }) => {
      const art = articleAt((await loadPageData(page).catch(() => null))?.articles, vIdx);
      const at = art ? findIn(articlePieces(art), fq) : null;
      return at ? { page, ...at } : null;
    }));
    for (const h of batch) if (h) found.push(h);
  }
  return found.sort((a, b) => b.count - a.count).slice(0, limit);
}
