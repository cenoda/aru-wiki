// An article page for one page of the lore theme, laid out like an encyclopedia article: title,
// unreviewed notice, infobox, lead, contents, the body by reader questions (with interpretation
// marks and quote boxes), the timeline of what was revealed when, related pages, footnotes and
// sources. Opened from the 3D chart's card ("자세히 보기"); the chart stays mounted behind it, so
// going back returns to the same view (WikiGraph3D keeps the URL in step).
// Everything follows the chosen version: later articles, timeline entries and pages are not shown,
// and a page not yet revealed shows only that (design.md 6절: no title or metadata before its version).
import { type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { versions } from './data';
import { type Linker, useLinker } from './Linked';
import {
  type ArtPara, type ArtSource, articleAt, idOf, KIND_LABEL, loadPageData, nameOf, type PageData, type PageNode, pageUrl, revisionUrl,
  snapshotAt, type Snapshots, type Theme, withParticle,
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
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

interface Footnote { n: number; group: string; groupHref?: string; label: string; href?: string; tip: string }
const keyOf = (s: ArtSource) => (s.kind === 'wiki' ? `w|${s.page}|${s.revision}` : s.kind === 'quest' ? `q|${s.quest}` : `u|${s.url}`);
function noteOf(s: ArtSource, n: number): Footnote {
  if (s.kind === 'wiki') return { n, group: s.page, groupHref: pageUrl(s.page), label: s.date, href: revisionUrl(s.page, s.revision), tip: `Fandom 「${s.page}」${s.section ? ` ${s.section} 절` : ''}, ${s.date} 판` };
  if (s.kind === 'quest') return { n, group: '게임 대사', label: `「${s.quest_ko ?? s.quest}」 (${s.version})`, tip: `임무 「${s.quest_ko ?? s.quest}」의 대사 (${s.version})` };
  return { n, group: host(s.url), groupHref: `https://${host(s.url)}`, label: `${s.title}${s.published ? `, ${s.published}` : ''}`, href: s.url,
    tip: `웹: ${s.title}${s.published ? ` (${s.published})` : ''}${s.checked ? `, ${s.checked} 확인` : ''}` };
}
/** Footnotes numbered in reading order, one per wiki revision, quest or web page; listed by group. */
function useFootnotes(order: ArtSource[]) {
  return useMemo(() => {
    const list: Footnote[] = [];
    const num = new Map<string, number>();
    const cite = (s: ArtSource | undefined) => {
      if (!s) return null;
      const key = keyOf(s);
      let n = num.get(key);
      if (n === undefined) { n = list.length + 1; num.set(key, n); list.push(noteOf(s, n)); }
      return list[n - 1];
    };
    for (const s of order) cite(s);
    const groups = new Map<string, Footnote[]>();
    for (const f of list) (groups.get(f.group) ?? groups.set(f.group, []).get(f.group)!).push(f);
    return { list, groups: [...groups], cite };
  }, [order]);
}

/** **bold** marks and links in one piece of text */
function rich(text: string, link: Linker, seen: Set<string>): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{link(part, seen)}</b> : <span key={i}>{link(part, seen)}</span>));
}

export function WikiArticle({ page, theme, byId, snapshots, vIdx, hrefOf, onOpen }: WikiArticleProps) {
  const root = useRef<HTMLElement>(null);
  const node = byId.get(page);
  const revealed = !!node && node.revealed <= vIdx;
  const current = snapshotAt(snapshots?.[page], vIdx);
  // the article body and timeline, fetched per page
  const [data, setData] = useState<{ page: string; d: PageData } | null>(null);
  useEffect(() => {
    let live = true;
    loadPageData(page).then((d) => live && setData({ page, d }), () => live && setData({ page, d: { articles: [], timeline: [] } }));
    return () => { live = false; };
  }, [page]);
  const loading = data?.page !== page;
  const art = loading ? null : articleAt(data.d.articles, vIdx);
  const timeline = loading ? [] : data.d.timeline.filter((t) => t.v <= vIdx);
  const snapSrc = (r: number): ArtSource | undefined => { const s = current?.sources[r]; return s && { kind: 'wiki', ...s }; };

  // every citation in reading order, so footnote numbers run down the page
  const cites = useMemo(() => {
    const out: (ArtSource | undefined)[] = [];
    if (art) {
      for (const p of art.lead ? [art.lead] : []) p.r.forEach((r) => out.push(art.sources[r]));
      for (const x of art.sections) { if (x.q) out.push(art.sources[x.q.r]); for (const p of x.p) p.r.forEach((r) => out.push(art.sources[r])); }
    }
    if (!art?.lead && current?.summary) out.push(snapSrc(current.summary.r));
    if (!art && current) current.bullets.forEach((b) => out.push(snapSrc(b.r)));
    for (const t of timeline) for (const it of t.items) out.push({ kind: 'wiki', page: it.page, revision: it.revision, section: null, date: it.date });
    return out.filter((x): x is ArtSource => !!x);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art, current, timeline.length, vIdx]);
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
  /** footnote markers, one per source */
  const refs = (sources: (ArtSource | undefined)[]) => {
    const seen = new Set<number>();
    return sources.map((s, i) => {
      const f = notes.cite(s);
      if (!f || seen.has(f.n)) return null;
      seen.add(f.n);
      return <sup key={i} className="wa-ref"><a href={`#cite-${f.n}`} title={f.tip} onClick={jump(`cite-${f.n}`)}>[{f.n}]</a></sup>;
    });
  };
  const para = (p: ArtPara, sources: ArtSource[], seen: Set<string>) => (
    <>
      {p.s.map((x, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {x.i ? <span className="wa-interp" title="해석: 위키·대사의 사실을 엮어 쓴 해석입니다. 사실로 단정하지 않습니다.">{rich(x.t, link, seen)}<span className="wa-interp-tag">해석</span></span>
            : rich(x.t, link, seen)}
        </span>
      ))}
      {refs(p.r.map((r) => sources[r]))}
    </>
  );

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
  const sections = [
    ...(art ? art.sections.map((x, i) => ({ id: `s${i + 1}`, label: x.h })) : []),
    !art && current && { id: 'overview', label: '개요' },
    timeline.length > 0 && { id: 'timeline', label: '버전별 공개 연표' },
    related.length > 0 && { id: 'related', label: '관련 문서' },
    notes.list.length > 0 && { id: 'notes', label: '각주' },
    { id: 'license', label: '출처와 라이선스' },
  ].filter((x): x is { id: string; label: string } => !!x);
  const basis = art ?? current;
  const chars = art ? [art.lead, ...art.sections.flatMap((x) => x.p)].reduce((n, p) => n + (p?.s.reduce((m, x) => m + x.t.length, 0) ?? 0), 0) : 0;
  const hasWeb = art?.sources.some((s) => s.kind === 'web');

  return (
    <main className="wa" ref={root}>
      <article className="wa-body">
        <h1 className="wa-title">{name}</h1>
        <p className="wa-sub">aru.wiki · {themeName} 테마 · {versions[vIdx]?.id}까지 공개된 내용</p>

        <div className="wa-notice" role="note">
          <span className="tag neutral">미검수</span>
          <p>이 문서는 Fandom 원신 위키의 글{hasWeb ? ', 공식 사이트·위키백과의 사실' : ''}과 게임 대사를 바탕으로 기계가 쓰고, 다른 회사의 모델이 문장마다 근거와 대조해 근거 없는 문장을 뺀 것입니다. <span className="wa-interp-tag">해석</span> 표시가 붙은 문장은 사실을 엮은 해석입니다. 사람은 아직 확인하지 않았습니다. 틀린 곳은 아래 <a href="#report" onClick={jump('report')}>오류 신고</a>로 알려 주세요.</p>
        </div>

        <aside className="wa-infobox" aria-label="정보 상자">
          <p className="wa-ib-title">{name}</p>
          <dl>
            {node.ko && <><dt>영어 이름</dt><dd lang="en">{node.id}</dd></>}
            <dt>분류</dt><dd>{node.hub ? '테마' : KIND_LABEL[node.kind]}</dd>
            <dt>처음 나온 버전</dt><dd>{versionLabel(node.revealed)}</dd>
            {!node.hub && <><dt>{themeName}{withParticle(themeName)} 함께 나오는 이야기</dt><dd>{node.theme_units}개</dd></>}
            <dt>나오는 이야기</dt><dd>{node.units}개</dd>
            {basis && <><dt>서술 기준</dt><dd>{versions[basis.from]?.id} 때의 자료</dd></>}
            {chars > 0 && <><dt>본문</dt><dd>{chars.toLocaleString()}자</dd></>}
            <dt>원문</dt><dd><a href={pageUrl(node.id)} target="_blank" rel="noreferrer">Fandom 문서</a></dd>
          </dl>
        </aside>

        {(() => {
          const seen = new Set<string>();
          if (loading && snapshots === null) return <p className="wa-lead wa-muted">불러오는 중…</p>;
          if (art?.lead) return <p className="wa-lead">{para(art.lead, art.sources, seen)}</p>;
          if (current?.summary) return <p className="wa-lead">{link(current.summary.t, seen)}{refs([snapSrc(current.summary.r)])}</p>;
          return <p className="wa-lead wa-muted">{current ? '이 버전의 한 줄 요약은 검증을 통과하지 못해 싣지 않았습니다.' : `${versions[vIdx]?.id}까지는 위키에 이 항목의 서술이 아직 없습니다.`}</p>;
        })()}

        {sections.length > 2 && (
          <nav className="wa-toc" aria-label="목차">
            <p className="wa-toc-title">목차</p>
            <ol>{sections.map((s) => <li key={s.id}><a href={`#${s.id}`} onClick={jump(s.id)}>{s.label}</a></li>)}</ol>
          </nav>
        )}

        {art && art.from < (current?.from ?? -1) && (
          <p className="wa-muted wa-small">본문은 {versionLabel(art.from)} 때의 자료 기준입니다. 그 뒤 버전의 본문은 아직 없습니다.</p>
        )}
        {art && art.sections.map((x, i) => {
          const seen = new Set<string>();
          return (
            <section key={i} id={`s${i + 1}`}>
              <h2>{x.h}</h2>
              {x.q && (
                <blockquote className="wa-quote" title={`원문(영어): ${x.q.en}`}>
                  <p>{x.q.t}</p>
                  <footer>— {x.q.by}{refs([art.sources[x.q.r]])} <span className="wa-muted">(영어 대사를 옮김)</span></footer>
                </blockquote>
              )}
              {x.p.map((p, j) => <p key={j}>{para(p, art.sources, seen)}</p>)}
            </section>
          );
        })}

        {!art && current && (() => {
          const seen = new Set<string>();
          return (
            <section id="overview">
              <h2>개요</h2>
              <p className="wa-muted wa-small">{versionLabel(current.from)} 때 위키에 적혀 있던 내용의 요점입니다.{loading ? '' : ' 이 버전의 본문은 아직 없습니다.'}</p>
              <ul>{current.bullets.map((b, i) => <li key={i}>{link(b.t, seen)}{refs([snapSrc(b.r)])}</li>)}</ul>
            </section>
          );
        })()}

        {timeline.length > 0 && (
          <section id="timeline">
            <h2>버전별 공개 연표</h2>
            <p className="wa-muted wa-small">버전마다 위키에 새로 적힌 이야기입니다. 위키는 늦게 고쳐지기도 하므로 게임에서 밝혀진 버전과 다를 수 있습니다.</p>
            <ol className="wa-timeline">
              {[...timeline].reverse().map((t) => {
                const seen = new Set<string>();
                return (
                  <li key={t.v}>
                    <span className="wa-tl-ver">{versionLabel(t.v)}{t.first && <span className="wa-muted"> · 첫 서술</span>}</span>
                    <ul>{t.items.map((it, i) => <li key={i}>{link(it.t, seen)}{refs([{ kind: 'wiki', page: it.page, revision: it.revision, section: null, date: it.date }])}</li>)}</ul>
                  </li>
                );
              })}
            </ol>
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
            <p className="wa-muted wa-small">Fandom 원신 위키 문서는 날짜를 누르면 그때의 판이 열립니다. 게임 대사는 그 임무의 대사이고, 웹 출처는 확인한 날짜의 내용입니다.</p>
            <ul className="wa-notes">
              {notes.groups.map(([group, list]) => (
                <li key={group}>
                  {list[0].groupHref ? <a className="wa-note-page" href={list[0].groupHref} target="_blank" rel="noreferrer">{group}</a> : <span className="wa-note-page">{group}</span>}
                  <span className="wa-note-revs">
                    {list.map((f) => (
                      <span key={f.n} id={`cite-${f.n}`} className="wa-note">
                        <b>{f.n}</b> {f.href ? <a href={f.href} target="_blank" rel="noreferrer">{f.label}</a> : f.label}
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
          <p className="wa-small">각주의 Fandom 원신 위키 글(CC BY-SA 3.0)을 번역·요약해 고쳐 썼고, 웹 출처에서는 사실만 가져와 직접 썼습니다. 이 문서의 글도 CC BY-SA로 쓸 수 있습니다. 게임 대사와 이미지의 권리는 HoYoverse에 있으며, 대사는 한 줄 이하로만 옮겨 실었습니다.</p>
        </section>

        <section id="report">
          <ReportBox key={page} nodeId={page} version={versions[vIdx]?.id ?? ''} />
        </section>
      </article>
    </main>
  );
}
