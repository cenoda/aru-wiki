// Shared by the lore theme's 3D chart (WikiGraph3D) and its article pages (WikiArticle).

/** One line of a snapshot and the footnote (index into the snapshot's sources) behind it. */
export interface SnapLine { t: string; r: number }
/** A page as the wiki described it at a version (scripts/theme/snapshots.mjs), unreviewed. */
export interface Snapshot {
  /** version order the snapshot was written for */
  from: number;
  summary: SnapLine | null;
  bullets: SnapLine[];
  sources: { page: string; revision: number; section: string | null; date: string }[];
}
export type Snapshots = Record<string, Snapshot[]>;

export interface PageNode {
  id: string; ko: string | null; kind: 'character' | 'lore'; hub: boolean; units: number; theme_units: number; revealed: number;
  x?: number; y?: number; z?: number; fx?: number; fy?: number; fz?: number;
}
export interface PageLink { source: string | PageNode; target: string | PageNode; shared: number; revealed: number }
export interface Theme { page: string; nodes: PageNode[]; links: PageLink[] }

export const idOf = (end: string | PageNode) => (typeof end === 'string' ? end : end.id);
export const nameOf = (n: PageNode) => n.ko ?? n.id;
export const KIND_LABEL = { character: '인물', lore: '로어' } as const;
export const pageUrl = (page: string) => `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(page.replace(/ /g, '_'))}`;
export const revisionUrl = (page: string, revision: number) => `${pageUrl(page)}?oldid=${revision}`;
/** 와/과 by whether the last Hangul syllable has a final consonant. */
export const withParticle = (word: string) => {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return c >= 0 && c < 11172 && c % 28 !== 0 ? '과' : '와';
};
/** The latest snapshot written for the version (order) or before it. */
export const snapshotAt = (list: Snapshot[] | undefined, order: number) => (list ?? []).filter((s) => s.from <= order).at(-1) ?? null;

/** A paragraph of an article and its footnotes (indexes into the article's sources). */
export interface ArtPara { t: string; r: number[] }
/** A full article body as the wiki described the page at a version (scripts/theme/articles.mjs), unreviewed. */
export interface Article {
  from: number;
  lead: ArtPara | null;
  sections: { h: string; p: ArtPara[] }[];
  sources: Snapshot['sources'];
}
/** The file name of a page's articles; scripts/build-runtime-data.mjs articleSlug must match. */
export const articleSlug = (page: string) => page.replace(/[^A-Za-z0-9]+/g, '_');
// one file per page, fetched when its article opens
const articleFiles = import.meta.glob('../data/runtime/articles/*.json', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;
/** The page's articles in version order; [] when it has none. */
export async function loadArticles(page: string): Promise<Article[]> {
  const file = articleFiles[`../data/runtime/articles/${articleSlug(page)}.json`];
  if (!file) return [];
  const r = await fetch(await file());
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
/** The latest article written for the version (order) or before it. */
export const articleAt = (list: Article[] | undefined, order: number) => (list ?? []).filter((a) => a.from <= order).at(-1) ?? null;
