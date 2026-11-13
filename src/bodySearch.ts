// Full-text search in article bodies (index built by scripts/search/, rules in scripts/search/text.mjs).
// Nothing is downloaded until someone searches: then the small document list and the index shards of
// the query's bigrams, and finally the article files of the best candidates, to check the exact text
// and cut a snippet. Version gating is the article page's own: a page not revealed at the chosen
// version is never found, and only the article the page would show at that version (articleAt) is
// searched, so text written for a later version is not found either.
import { articlePieces, bigrams, decodePostings, foldMap, foldText, shardOf } from '../scripts/search/text.mjs';
import { articleAt, loadPageData, type PageNode } from './lore';

const files = import.meta.glob('../data/runtime/search/*.json', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
const cache = new Map<string, Promise<unknown>>();
function load<T>(name: string): Promise<T> {
  let p = cache.get(name);
  if (!p) {
    const file = files[`../data/runtime/search/${name}.json`];
    p = file ? file().then((u) => fetch(u)).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))) : Promise.resolve({});
    p.catch(() => cache.delete(name)); // try again on the next search
    cache.set(name, p);
  }
  return p as Promise<T>;
}

interface Meta { shards: number; docs: [string, number][] }
let byPage: Map<string, { doc: number; from: number }[]> | null = null;
const loadMeta = () => load<Meta>('meta').then((m) => {
  if (!byPage) {
    byPage = new Map();
    m.docs.forEach(([page, from], doc) => (byPage!.get(page) ?? byPage!.set(page, []).get(page)!).push({ doc, from }));
  }
  return m;
});

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
  const meta = await loadMeta();
  const shards = await Promise.all([...new Set(grams.map((g) => shardOf(g, meta.shards)))].map((s) => load<Record<string, string>>(String(s)).then((d) => [s, d] as const)));
  const shardMap = new Map(shards);
  // documents holding every bigram; score counts bigrams that occur often in the document
  let score: Map<number, number> | null = null;
  for (const g of grams) {
    const enc = shardMap.get(shardOf(g, meta.shards))?.[g];
    if (!enc) return [];
    const next = new Map<number, number>();
    for (const [doc, many] of decodePostings(enc)) {
      const before = score ? score.get(doc) : 0;
      if (before !== undefined) next.set(doc, before + (many ? 2 : 1));
    }
    score = next;
    if (!score.size) return [];
  }
  // version gating: the page is revealed, and the document is the article the page shows at vIdx
  const list = [...score!].filter(([doc]) => {
    const [page, from] = meta.docs[doc];
    const n = nodes.get(page);
    if (!n || n.revealed > vIdx || skip.has(page)) return false;
    const shown = byPage!.get(page)!.filter((d) => d.from <= vIdx).at(-1);
    return shown?.from === from;
  }).map(([doc, s]) => ({ page: meta.docs[doc][0], s, n: nodes.get(meta.docs[doc][0])! }))
    .sort((a, b) => b.s - a.s || Number(b.n.hub) - Number(a.n.hub) || b.n.units - a.n.units);
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
