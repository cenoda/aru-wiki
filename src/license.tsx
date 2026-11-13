// What every surface that shows text derived from the Fandom wiki says about where it came from and
// on what terms (LICENSE-CONTENT.md 1절): the source page and revision, the page's history (its
// authors), the licence names with links, that the text was changed, and a link to the site-wide
// licence page (public/license.html). Game dialogue, names and images stay HoYoverse's (2절).
import type { ReactNode } from 'react';
import { type ArtSource, pageUrl, revisionUrl } from './lore';

export const BY_SA_3 = { name: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/deed.ko' };
export const BY_SA_4 = { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.ko' };
/** The site-wide page on sources and licences (a static file, so it also opens without scripts). */
export const LICENSE_PAGE = '/license.html';
/** A wiki page's edit history: who wrote it. */
export const historyUrl = (page: string) => `${pageUrl(page)}?action=history`;

const out = { target: '_blank', rel: 'noreferrer' } as const;
export const Lic = ({ l }: { l: { name: string; url: string } }) => <a href={l.url} {...out} rel="license noreferrer">{l.name}</a>;
export const LicensePageLink = ({ children = '출처·라이선스 안내' }: { children?: ReactNode }) => <a href={LICENSE_PAGE}>{children}</a>;

/** One link per wiki page (to the cited revision, the latest one if several) and its history. */
export function wikiRevisions(sources: (ArtSource | undefined)[]) {
  const latest = new Map<string, { page: string; revision: number; date: string }>();
  for (const s of sources) {
    if (s?.kind !== 'wiki') continue;
    const had = latest.get(s.page);
    if (!had || s.revision > had.revision) latest.set(s.page, { page: s.page, revision: s.revision, date: s.date });
  }
  return [...latest.values()];
}

/**
 * The short credit under a card: "출처: Fandom 원신 위키 「A」(날짜 판, 기여자). 위키 글을 요약·번역했습니다. 원문 CC BY-SA 3.0,
 * 이 글 CC BY-SA 4.0 · 안내". `what` says how the text was changed, as the rest of the sentence ("요약·번역했습니다.").
 */
export function SourceCredit({ sources, what, extra, className }: { sources: (ArtSource | undefined)[]; what: string; extra?: ReactNode; className?: string }) {
  const pages = wikiRevisions(sources);
  return (
    <p className={className}>
      {pages.length > 0 && <>출처: Fandom 원신 위키 {pages.map((x, i) => (
        <span key={x.page}>{i > 0 && ', '}「<a href={pageUrl(x.page)} {...out}>{x.page}</a>」(<a href={revisionUrl(x.page, x.revision)} {...out}>{x.date} 판</a>, <a href={historyUrl(x.page)} {...out} title="이 문서를 쓴 위키 기여자 목록">기여자</a>)</span>
      ))}. </>}
      위키 글을 {what}{extra}
      {' '}원문 <Lic l={BY_SA_3} />, 이 글 <Lic l={BY_SA_4} /> · <LicensePageLink>안내</LicensePageLink>
    </p>
  );
}
