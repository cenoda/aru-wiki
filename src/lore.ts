// Shared by the lore theme's 3D chart (WikiGraph3D) and its article pages (WikiArticle).
import { fetchData } from './split';
import { latestWiki } from './wikiData';

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
  id: string; ko: string | null; kind: 'character' | 'lore'; hub: boolean; units: number; revealed: number;
  /** no line in the whole chart (scripts/split/build.mjs): drawn with a dotted line to the centre star */
  lone?: 1;
  x?: number; y?: number; z?: number; fx?: number; fy?: number; fz?: number;
}
export interface PageLink { source: string | PageNode; target: string | PageNode; shared: number; revealed: number }
export interface Theme {
  page: string; nodes: PageNode[]; links: PageLink[];
  /** pages that mention another in their prose, not joined by a story line: [from, to, 1 if both ways] */
  refs?: [string, string, number][];
}

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

/** Where a sentence comes from: a wiki revision, an in-game quest's dialogue, or a web page. */
export type ArtSource =
  | { kind: 'wiki'; page: string; revision: number; section: string | null; date: string }
  | { kind: 'quest'; quest: string; quest_ko: string | null; version: string }
  | { kind: 'web'; url: string; title: string; published: string | null; checked: string | null };
/** One sentence; i marks an interpretation (해석) that ties facts together. */
export interface ArtSentence { t: string; i?: 1 }
export interface ArtPara { s: ArtSentence[]; r: number[] }
/** A full article body as of a version (scripts/theme/articles.mjs), unreviewed. */
export interface Article {
  from: number;
  lead: ArtPara | null;
  /** q: a translated dialogue line for the section */
  sections: { h: string; q?: { t: string; en: string; by: string; r: number }; p: ArtPara[] }[];
  sources: ArtSource[];
}
/** What the wiki newly said at a version snapshot (scripts/theme/reveals.mjs). */
export interface TimelineEntry { v: number; first?: boolean; items: { t: string; page: string; revision: number; date: string }[] }
export interface PageData { articles: Article[]; timeline: TimelineEntry[]; snapshots: Snapshot[] }
/**
 * The page's articles, snapshots and timeline as far as the loaded versions go (src/wikiData.ts):
 * one file per article and per version of snapshots and timeline, named by hash. Empty when it has none.
 */
export async function loadPageData(page: string): Promise<PageData> {
  const t = (await latestWiki()).texts.get(page);
  if (!t) return { articles: [], timeline: [], snapshots: [] };
  const [articles, history] = await Promise.all([
    Promise.all(t.a.map((h) => fetchData<Article>(h))),
    Promise.all(t.h.map((h) => fetchData<{ s?: Snapshot[]; t?: TimelineEntry[] }>(h))),
  ]);
  return {
    articles: [...articles].sort((a, b) => a.from - b.from),
    timeline: history.flatMap((x) => x.t ?? []).sort((a, b) => a.v - b.v),
    snapshots: history.flatMap((x) => x.s ?? []).sort((a, b) => a.from - b.from),
  };
}
/** The latest article written for the version (order) or before it. */
export const articleAt = (list: Article[] | undefined, order: number) => (list ?? []).filter((a) => a.from <= order).at(-1) ?? null;

/** A name with no article yet and the version (order) of its first story: [name, revealed]. */
export type RedName = readonly [name: string, revealed: number];
/** Names that become red links (scripts/build-runtime-data.mjs), as far as the loaded versions go. */
export const loadRedNames = (): Promise<RedName[]> => latestWiki().then((w) => w.red, () => []);

/** An official YouTube video for a page (scripts/youtube/): `v` is the version order it belongs to. */
export interface PageVideo { id: string; t?: string; main?: boolean; v: number }
/** Official videos by page, as far as the loaded versions go. */
export const loadVideos = (): Promise<Record<string, PageVideo[]>> => latestWiki().then((w) => w.videos, () => ({}));
