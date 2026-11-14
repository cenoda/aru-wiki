// 최근 바뀜 (`/wiki/특수:최근바뀜`): new and rewritten articles and approved reader edits, newest first,
// by day. The rows come in the wiki's version blocks (scripts/recent/changes.mjs → scripts/split/build.mjs,
// src/wikiData.ts), so a row about a later page is not even downloaded; a row is also shown only when
// the chosen version has reached it (g).
import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { versions } from './data';
import { nameOf, type PageNode } from './lore';
import { loadWiki } from './wikiData';
import './recent.css';

/** k: new | more | redo (generated articles), edit | add | page (reader edits); v: version orders; g: first order it may be named */
export interface RecentRow { t: string; page: string; k: 'new' | 'more' | 'redo' | 'edit' | 'add' | 'page'; v: number[]; g: number; sec?: string; s?: string; nick?: string }

const KIND: Record<RecentRow['k'], { label: string; cls: string }> = {
  new: { label: '새 문서', cls: 'new' },
  more: { label: '본문 추가', cls: 'more' },
  redo: { label: '본문 고침', cls: 'more' },
  edit: { label: '독자 수정', cls: 'reader' },
  add: { label: '독자 수정', cls: 'reader' },
  page: { label: '새 문서', cls: 'new' },
};
type Filter = 'all' | 'new' | 'body' | 'reader';
const FILTERS: [Filter, string][] = [['all', '전체'], ['new', '새 문서'], ['body', '본문'], ['reader', '독자']];
const passes = (r: RecentRow, f: Filter) => f === 'all' || (f === 'new' ? r.k === 'new' || r.k === 'page'
  : f === 'body' ? r.k === 'more' || r.k === 'redo' : r.k === 'edit' || r.k === 'add' || r.k === 'page');

const vName = (o: number) => versions[o]?.id ?? '';
function summary(r: RecentRow, vIdx: number): string {
  const vs = r.v.filter((o) => o <= vIdx).map(vName).join('·');
  const nick = r.nick ? ` (${r.nick})` : '';
  switch (r.k) {
    case 'new': return `${vs} 기준 본문${r.v.filter((o) => o <= vIdx).length > 1 ? ` ${r.v.filter((o) => o <= vIdx).length}개` : ''}`;
    case 'more': return `${vs} 기준 본문을 새로 씀`;
    case 'redo': return `${vs} 기준 본문을 새 자료로 다시 씀`;
    case 'edit': return `${r.sec ? `「${r.sec}」` : '첫'} 문단 고침${nick}: ${r.s ?? ''}`;
    case 'add': return `${r.sec ? `「${r.sec}」 절에` : '문서에'} 글 보탬${nick}: ${r.s ?? ''}`;
    case 'page': return `독자가 쓴 문서${nick}: ${r.s ?? ''}`;
  }
}

const dayOf = (t: string) => {
  const d = t.length === 10 ? new Date(`${t}T00:00:00`) : new Date(t);
  return { key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, label: d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) };
};
const timeOf = (t: string) => (t.length === 10 ? '' : new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));

const PAGE = 100;

export default function RecentChanges({ vIdx, byId, hrefOf, onOpen }: {
  vIdx: number; byId: ReadonlyMap<string, PageNode>; hrefOf: (page: string) => string; onOpen: (page: string) => void;
}) {
  const [rows, setRows] = useState<RecentRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => {
    let live = true;
    loadWiki(vIdx).then((w) => live && setRows(w.recent), () => live && setFailed(true));
    return () => { live = false; };
  }, [vIdx]);
  useEffect(() => {
    const before = document.title;
    document.title = '최근 바뀜 - aru.wiki';
    return () => { document.title = before; };
  }, []);

  const visible = useMemo(() => (rows ?? []).filter((r) => r.g <= vIdx), [rows, vIdx]);
  const hidden = (rows?.length ?? 0) - visible.length;
  const list = useMemo(() => visible.filter((r) => passes(r, filter)), [visible, filter]);
  const days = useMemo(() => {
    const out: { key: string; label: string; rows: RecentRow[] }[] = [];
    for (const r of list.slice(0, limit)) {
      const d = dayOf(r.t);
      if (out.at(-1)?.key === d.key) out.at(-1)!.rows.push(r); else out.push({ ...d, rows: [r] });
    }
    return out;
  }, [list, limit]);

  const go = (page: string) => (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpen(page);
  };
  const nameFor = (page: string) => { const n = byId.get(page); return n ? nameOf(n) : page; };

  return (
    <main className="wa rc">
      <article className="wa-body">
        <h1 className="wa-title">최근 바뀜</h1>
        <p className="wa-sub">aru.wiki · 새로 쓰거나 다시 쓴 문서와 승인된 독자 수정 · {vName(vIdx)}까지 공개된 문서만</p>
        <div className="rc-filter" role="group" aria-label="종류">
          {FILTERS.map(([f, label]) => (
            <button key={f} type="button" aria-pressed={filter === f} className={filter === f ? 'on' : undefined} onClick={() => { setFilter(f); setLimit(PAGE); }}>{label}</button>
          ))}
        </div>
        {failed ? <p className="wa-hidden">목록을 불러오지 못했습니다.</p>
          : !rows ? <p className="wa-hidden">불러오는 중…</p>
            : !list.length ? <p className="wa-hidden">이 버전까지 보여 줄 바뀜이 없습니다.</p>
              : days.map((d) => (
                <section key={d.key} className="rc-day">
                  <h2>{d.label}</h2>
                  <ul>
                    {d.rows.map((r, i) => (
                      <li key={i}>
                        <span className="rc-time">{timeOf(r.t)}</span>
                        <span className={`rc-kind ${KIND[r.k].cls}`}>{KIND[r.k].label}</span>
                        <a href={hrefOf(r.page)} onClick={go(r.page)}>{nameFor(r.page)}</a>
                        <span className="rc-sum">{summary(r, vIdx)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
        {list.length > limit && <p><button type="button" className="rc-more" onClick={() => setLimit((n) => n + PAGE)}>더 보기 ({list.length - limit}개 남음)</button></p>}
        {hidden > 0 && <p className="wa-small wa-muted">고른 버전({vName(vIdx)})보다 뒤에 공개되는 문서의 바뀜은 숨겼습니다. 위에서 버전을 바꾸면 보입니다.</p>}
        <p className="wa-small wa-muted">기계가 쓴 문서는 글이 바탕으로 삼은 자료가 바뀌었을 때만 「본문 고침」으로 나옵니다(이름 고치기 같은 작은 손질은 나오지 않음). 시간은 이 브라우저의 시간대 기준입니다.</p>
      </article>
    </main>
  );
}
