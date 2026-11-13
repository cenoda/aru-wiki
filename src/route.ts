// Addresses of article pages. The short form is `/wiki/<name>?v=<version>`, where the name is the
// page's official Korean name when it has one, else the (English) page name, spaces written as `_`
// like Wikipedia: `/wiki/켄리아?v=5.0`, `/wiki/Abyss_Order`. Old links `?page=<page>&v=` still open
// the same article. Any name a page answers to resolves: the Korean name or the English page name,
// with `_` or spaces, in any letter case. The server sends index.html for every /wiki/ path.
import { nameOf, type PageNode } from './lore';

const PREFIX = '/wiki/';

/** The site address for an article (`name` = the page's display name), or for the 3D chart (`null`). */
export function articleUrl(name: string | null, versionId: string): string {
  const q = new URLSearchParams();
  if (versionId) q.set('v', versionId);
  const s = q.toString();
  const qs = s ? `?${s}` : '';
  if (name === null) return `/${qs}`;
  // keep `/` readable (Nahida/Storyline); everything else percent-encoded
  return `${PREFIX}${encodeURIComponent(name.replace(/ /g, '_')).replace(/%2F/gi, '/')}${qs}`;
}

/** The article name the current address asks for (path `/wiki/<name>` or old `?page=`), or null. */
export function articleKeyFromUrl(): string | null {
  if (location.pathname.startsWith(PREFIX)) {
    let raw = location.pathname.slice(PREFIX.length);
    try { raw = decodeURIComponent(raw); } catch { /* malformed escapes: use as written */ }
    raw = raw.replace(/_/g, ' ').trim();
    return raw || null;
  }
  return new URLSearchParams(location.search).get('page');
}

/** Whether the current address is an article address (short or old form). */
export const isArticleUrl = () => location.pathname.startsWith(PREFIX) || new URLSearchParams(location.search).has('page');

/** The page id a name from the address means, or null when no page answers to it. */
export function resolvePage(key: string, nodes: readonly PageNode[]): string | null {
  const exact = nodes.find((n) => n.id === key) ?? nodes.find((n) => n.ko === key);
  if (exact) return exact.id;
  const norm = (s: string) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const k = norm(key);
  return nodes.find((n) => norm(n.id) === k || (n.ko !== null && norm(n.ko) === k))?.id ?? null;
}

/** The name an article's address uses: the page's display name, or the id as given when unknown. */
export const pathNameOf = (page: string, byId: ReadonlyMap<string, PageNode> | undefined) => {
  const n = byId?.get(page);
  return n ? nameOf(n) : page;
};

/** The recent-changes page's name in the address (`/wiki/특수:최근바뀜`, src/RecentChanges.tsx). */
export const RECENT_KEY = '특수:최근바뀜';
/** Whether an article name from the address means the recent-changes page (also with `_` or spaces). */
export const isRecentKey = (key: string | null) => !!key && key.replace(/[\s_]/g, '') === RECENT_KEY;
