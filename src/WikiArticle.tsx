// An article page for one page of the lore theme, laid out like an encyclopedia article: title,
// unreviewed notice, infobox, lead, contents, overview, earlier descriptions by version, related
// pages, footnotes and sources. Opened from the 3D chart's card ("자세히 보기"); the chart stays
// mounted behind it, so going back returns to the same view (WikiGraph3D keeps the URL in step).
// Everything follows the chosen version: later snapshots and pages are not shown, and a page not
// yet revealed shows only that (design.md 6절: no title or metadata before its version).
import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { versions } from './data';
import { useLinker } from './Linked';
import {
  type Article, articleAt, idOf, KIND_LABEL, loadArticles, nameOf, type PageNode, pageUrl, revisionUrl, type Snapshot, snapshotAt,
  type Snapshots, type Theme, withParticle,
} from './lore';
import { ReportBox } from './ReportBox';
import './article.css';

export interface WikiArticleProps {
  page: string;
  theme: Theme;
  byId: Map<string, PageNode>;
  /** null while loading */
  snapshots: Snapshots | null;
  vIdx: number;
  /** the address of another article, for links that open in a new tab */
  hrefOf: (page: string) => string;
  onOpen: (page: string) => void;
}

const versionLabel = (order: number) => {
  const v = versions[order];
  return v ? (v.title_ko ? `${v.id} 「${v.title_ko}」` : v.id) : '';
};

interface Footnote { n: number; page: string; revision: number; date: string }
type Sources = Snapshot['sources'];
/**
 * Footnotes numbered in reading order, one per wiki revision (the section goes in the marker's
 * tooltip). The list groups them by wiki page, so a page cited at many versions takes one line.
 * `order` is every citation in the order the page reads, so the numbers run 1, 2, 3 down the page.
 */
function useFootnotes(order: [Sources, number][]) {
  return useMemo(() => {
    const list: Footnote[] = [];
    const num = new Map<string, number>();
    const cite = (sources: Sources, r: number) => {
      const src = sources[r];
      if (!src) return null;
      const key = `${src.page}|${src.revision}`;
      let n = num.get(key);
      if (n === undefined) { n = list.length + 1; num.set(key, n); list.push({ n, page: src.page, revision: src.revision, date: src.date }); }
      return { n, section: src.section };
    };
    for (const [sources, r] of order) cite(sources, r);
    const byPage = new Map<string, Footnote[]>();
    for (const f of list) (byPage.get(f.page) ?? byPage.set(f.page, []).get(f.page)!).push(f);
    return { list, byPage: [...byPage], cite };
  }, [order]);
}

export function WikiArticle({ page, theme, byId, snapshots, vIdx, hrefOf, onOpen }: WikiArticleProps) {
  const root = useRef<HTMLElement>(null);
  const node = byId.get(page);
  const revealed = !!node && node.revealed <= vIdx;
  const all = snapshots?.[page];
  const shown = useMemo(() => (all ?? []).filter((s) => s.from <= vIdx), [all, vIdx]);
  const current = snapshotAt(all, vIdx);
  const earlier = shown.slice(0, -1);
  // the full article body, fetched per page (undefined while loading)
  const [articles, setArticles] = useState<{ page: string; list: Article[] } | null>(null);
  useEffect(() => {
    let live = true;
    loadArticles(page).then((list) => live && setArticles({ page, list }), () => live && setArticles({ page, list: [] }));
    return () => { live = false; };
  }, [page]);
  const art = articles?.page === page ? articleAt(articles.list, vIdx) : null;
  const artLoading = articles?.page !== page;
  const cites = useMemo(() => {
    const out: [Sources, number][] = [];
    if (art) for (const p of [...(art.lead ? [art.lead] : []), ...art.sections.flatMap((x) => x.p)]) for (const r of p.r) out.push([art.sources, r]);
    if (!art?.lead && current?.summary) out.push([current.sources, current.summary.r]);
    // without an article the overview is the snapshot's points; the earlier versions follow, newest first
    for (const s of [...(art ? [] : current ? [current] : []), ...[...earlier].reverse()]) {
      if (s.summary && s !== current) out.push([s.sources, s.summary.r]);
      for (const b of s.bullets) out.push([s.sources, b.r]);
    }
    return out;
  }, [art, current, earlier]);
  const notes = useFootnotes(cites);
  const hub = byId.get(theme.page);
  const themeName = hub ? nameOf(hub) : '테마';
  const link = useLinker(theme.nodes, vIdx, page, hrefOf, onOpen);

  const related = useMemo(() => {
    if (!node) return [];
    return theme.links
      .filter((l) => l.revealed <= vIdx && (idOf(l.source) === page || idOf(l.target) === page))
      .map((l) => ({ n: byId.get(idOf(l.source) === page ? idOf(l.target) : idOf(l.source))!, shared: l.shared }))
      .filter((x) => x.n && x.n.revealed <= vIdx)
      .sort((a, b) => b.shared - a.shared || b.n.theme_units - a.n.theme_units);
  }, [node, theme, page, vIdx, byId]);

  // a new article starts at the top; the title follows it
  useEffect(() => { root.current?.scrollTo(0, 0); }, [page]);
  useEffect(() => {
    const before = document.title;
    document.title = revealed && node ? `${nameOf(node)} - aru.wiki` : 'aru.wiki';
    return () => { document.title = before; };
  }, [revealed, node]);

  /** In-page links: plain clicks stay in the app; modified clicks open the address as usual. */
  const go = (id: string) => (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(id);
  };
  const jump = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    root.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const ref = (sources: Sources, r: number) => {
    const c = notes.cite(sources, r);
    if (!c) return null;
    const src = notes.list[c.n - 1];
    const tip = `「${src.page}」${c.section ? ` ${c.section} 절` : ''}, ${src.date} 판`;
    return <sup key={`r${r}`} className="wa-ref"><a href={`#cite-${c.n}`} title={tip} onClick={jump(`cite-${c.n}`)}>[{c.n}]</a></sup>;
  };
  /** footnote markers for a paragraph, one per revision */
  const refs = (sources: Sources, rs: number[]) => {
    const seen = new Set<number>();
    const out: ReactNode[] = [];
    for (const r of rs) {
      const c = notes.cite(sources, r);
      if (!c || seen.has(c.n)) continue;
      seen.add(c.n);
      out.push(ref(sources, r));
    }
    return out;
  };

  if (!node || !revealed) {
    return (
      <main className="wa" ref={root}>
        <article className="wa-body">
          <h1 className="wa-title">공개되지 않은 항목</h1>
          <p className="wa-hidden">{node ? `이 항목은 ${versions[vIdx]?.id ?? ''}까지의 버전에서는 공개되지 않았습니다. 위에서 버전을 바꾸면 볼 수 있습니다.` : '이런 항목이 없습니다.'}</p>
        </article>
      </main>
    );
  }

  const name = nameOf(node);
  const artSections = art ? art.sections.map((x, i) => ({ id: `s${i + 1}`, label: x.h })) : [];
  const sections = [
    ...artSections,
    !art && current && { id: 'overview', label: '개요' },
    earlier.length > 0 && { id: 'history', label: '버전별 서술' },
    related.length > 0 && { id: 'related', label: '관련 문서' },
    notes.list.length > 0 && { id: 'notes', label: '각주' },
    { id: 'license', label: '출처와 라이선스' },
  ].filter((x): x is { id: string; label: string } => !!x);
  const basis = art ?? current;
  const chars = art ? art.sections.reduce((n, x) => n + x.p.reduce((m, p) => m + p.t.length, 0), art.lead?.t.length ?? 0) : 0;

  return (
    <main className="wa" ref={root}>
      <article className="wa-body">
        <h1 className="wa-title">{name}</h1>
        <p className="wa-sub">aru.wiki · {themeName} 테마 · {versions[vIdx]?.id}까지 공개된 내용</p>

        <div className="wa-notice" role="note">
          <span className="tag neutral">미검수</span>
          <p>이 문서는 Fandom 원신 위키의 글을 기계가 번역·정리하고, 다른 회사의 모델이 문장마다 근거 문단과 대조해 근거가 없는 문장을 뺀 것입니다. 사람은 아직 확인하지 않았습니다. 틀린 곳은 아래 <a href="#report" onClick={jump('report')}>오류 신고</a>로 알려 주세요.</p>
        </div>

        <aside className="wa-infobox" aria-label="정보 상자">
          <p className="wa-ib-title">{name}</p>
          <dl>
            {node.ko && <><dt>영어 이름</dt><dd lang="en">{node.id}</dd></>}
            <dt>분류</dt><dd>{node.hub ? '테마' : KIND_LABEL[node.kind]}</dd>
            <dt>처음 나온 버전</dt><dd>{versionLabel(node.revealed)}</dd>
            {!node.hub && <><dt>{themeName}{withParticle(themeName)} 함께 나오는 이야기</dt><dd>{node.theme_units}개</dd></>}
            <dt>나오는 이야기</dt><dd>{node.units}개</dd>
            {basis && <><dt>서술 기준</dt><dd>{versions[basis.from]?.id} 때의 위키</dd></>}
            {chars > 0 && <><dt>본문</dt><dd>{chars.toLocaleString()}자</dd></>}
            <dt>원문</dt><dd><a href={pageUrl(node.id)} target="_blank" rel="noreferrer">Fandom 문서</a></dd>
          </dl>
        </aside>

        {(() => {
          const seen = new Set<string>();
          if (snapshots === null && artLoading) return <p className="wa-lead wa-muted">불러오는 중…</p>;
          if (art?.lead) return <p className="wa-lead">{link(art.lead.t, seen)}{refs(art.sources, art.lead.r)}</p>;
          if (current?.summary) return <p className="wa-lead">{link(current.summary.t, seen)}{ref(current.sources, current.summary.r)}</p>;
          return <p className="wa-lead wa-muted">{current ? '이 버전의 한 줄 요약은 검증을 통과하지 못해 싣지 않았습니다.' : `${versions[vIdx]?.id}까지는 위키에 이 항목의 서술이 아직 없습니다.`}</p>;
        })()}

        {sections.length > 2 && (
          <nav className="wa-toc" aria-label="목차">
            <p className="wa-toc-title">목차</p>
            <ol>{sections.map((s) => <li key={s.id}><a href={`#${s.id}`} onClick={jump(s.id)}>{s.label}</a></li>)}</ol>
          </nav>
        )}

        {art && art.from < (current?.from ?? -1) && (
          <p className="wa-muted wa-small">본문은 {versionLabel(art.from)} 때의 위키 기준입니다. 그 뒤 버전의 본문은 아직 만들지 않았고, 아래 버전별 서술에 요점이 있습니다.</p>
        )}
        {art && art.sections.map((x, i) => {
          const seen = new Set<string>();
          return (
            <section key={i} id={`s${i + 1}`}>
              <h2>{x.h}</h2>
              {x.p.map((p, j) => <p key={j}>{link(p.t, seen)}{refs(art.sources, p.r)}</p>)}
            </section>
          );
        })}

        {!art && current && (() => {
          const seen = new Set<string>();
          return (
            <section id="overview">
              <h2>개요</h2>
              <p className="wa-muted wa-small">{versionLabel(current.from)} 때 위키에 적혀 있던 내용의 요점입니다.{artLoading ? '' : ' 이 버전의 본문은 아직 없습니다.'}</p>
              <ul>{current.bullets.map((b, i) => <li key={i}>{link(b.t, seen)}{ref(current.sources, b.r)}</li>)}</ul>
            </section>
          );
        })()}

        {earlier.length > 0 && (
          <section id="history">
            <h2>버전별 서술</h2>
            <p className="wa-muted wa-small">버전마다 위키의 서술이 어떻게 달라졌는지 봅니다. 새 내용이 많이 늘어난 버전만 있습니다.</p>
            {[...earlier].reverse().map((s) => (
              <details key={s.from} className="wa-ver">
                <summary><span className="wa-ver-id">{versionLabel(s.from)}</span>{s.summary && <span className="wa-ver-head">{s.summary.t}</span>}</summary>
                <ul>
                  {s.summary && <li className="wa-ver-sum">{s.summary.t}{ref(s.sources, s.summary.r)}</li>}
                  {s.bullets.map((b, i) => <li key={i}>{b.t}{ref(s.sources, b.r)}</li>)}
                </ul>
              </details>
            ))}
          </section>
        )}

        {related.length > 0 && (
          <section id="related">
            <h2>관련 문서</h2>
            <p className="wa-muted wa-small">같은 이야기에 함께 나오는 항목입니다. 많이 겹치는 순서입니다.</p>
            <ul className="wa-related">
              {related.map(({ n, shared }) => (
                <li key={n.id}>
                  <a href={hrefOf(n.id)} onClick={go(n.id)}>{nameOf(n)}</a>
                  <span className="wa-muted"> · {n.hub ? '테마' : KIND_LABEL[n.kind]} · 함께 나오는 이야기 {shared}개</span>
                </li>
              ))}
            </ul>
            {!node.hub && hub && !related.some((r) => r.n.id === hub.id) && (
              <p className="wa-small">테마 문서: <a href={hrefOf(hub.id)} onClick={go(hub.id)}>{themeName}</a></p>
            )}
          </section>
        )}

        {notes.list.length > 0 && (
          <section id="notes">
            <h2>각주</h2>
            <p className="wa-muted wa-small">모두 Fandom 원신 위키입니다. 날짜를 누르면 그때의 문서 판이 열립니다.</p>
            <ul className="wa-notes">
              {notes.byPage.map(([page, list]) => (
                <li key={page}>
                  <a className="wa-note-page" href={pageUrl(page)} target="_blank" rel="noreferrer" lang="en">{page}</a>
                  <span className="wa-note-revs">
                    {list.map((f) => (
                      <span key={f.n} id={`cite-${f.n}`} className="wa-note">
                        <b>{f.n}</b> <a href={revisionUrl(f.page, f.revision)} target="_blank" rel="noreferrer">{f.date}</a>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="license">
          <h2>출처와 라이선스</h2>
          <p className="wa-small">각주의 Fandom 원신 위키 글(CC BY-SA 3.0)을 번역·요약해 고쳐 썼습니다. 이 문서의 글도 같은 조건(CC BY-SA)으로 쓸 수 있습니다. 각주 링크는 그 버전 당시의 문서 판입니다. 게임 대사와 이미지의 권리는 HoYoverse에 있습니다.</p>
        </section>

        <section id="report">
          <ReportBox key={page} nodeId={page} version={versions[vIdx]?.id ?? ''} />
        </section>
      </article>
    </main>
  );
}
