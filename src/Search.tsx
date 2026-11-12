// Article search over the theme's pages: Korean or English name, as you type. Used in the 3D view's
// header and, where the browser cannot draw 3D, as the whole front page (a search box in the
// middle, like an encyclopedia's portal). Pages not revealed at the chosen version are not found.
import { type FormEvent, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { versions } from './data';
import { KIND_LABEL, nameOf, type PageNode } from './lore';
import { loadPublished, type Published } from './readerEdits';

export interface SearchProps {
  nodes: PageNode[];
  vIdx: number;
  hrefOf: (page: string) => string;
  onOpen: (page: string) => void;
  /** the large centred box of the front page */
  big?: boolean;
  autoFocus?: boolean;
  /** the `＋ 새 문서` button beside the box (on unless false) */
  newPage?: boolean;
}

const fold = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s·'’「」-]/g, '');

export function Search({ nodes, vIdx, hrefOf, onOpen, big, autoFocus, newPage = true }: SearchProps) {
  const [q, setQ] = useState('');
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState(false);
  const listId = useId();
  // pages readers wrote (readerEdits.ts) are found by title, from the version they were written at
  const [pub, setPub] = useState<Published | null>(null);
  useEffect(() => { let live = true; loadPublished().then((p) => live && setPub(p)); return () => { live = false; }; }, []);
  const written = useMemo(() => {
    const k = fold(q);
    if (!k || !pub) return [];
    return pub.edits
      .filter((e) => e.kind === 'page' && fold(e.page).includes(k) && versions.findIndex((v) => v.id === e.v) >= 0 && versions.findIndex((v) => v.id === e.v) <= vIdx)
      .slice(0, 3).map((e) => e.page);
  }, [q, pub, vIdx]);
  const title = q.trim().replace(/\s+/g, ' ');
  /** offer to write the page when nothing has this name (not while a hidden page may have it) */
  const canWrite = title.length >= 2 && title.length <= 60 && !BAD_TITLE.test(title)
    && !nodes.some((n) => fold(nameOf(n)) === fold(title) || fold(n.id) === fold(title)) && !written.some((t) => fold(t) === fold(title));
  const open2 = (t: string) => { setOpen(false); setQ(''); onOpen(t); };

  const hits = useMemo(() => {
    const k = fold(q);
    if (!k) return [];
    return nodes
      .filter((n) => n.revealed <= vIdx)
      .map((n) => {
        const ko = fold(nameOf(n)), en = fold(n.id);
        const rank = ko.startsWith(k) || en.startsWith(k) ? 0 : ko.includes(k) || en.includes(k) ? 1 : -1;
        return { n, rank };
      })
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || Number(b.n.hub) - Number(a.n.hub) || b.n.theme_units - a.n.theme_units)
      .slice(0, 8)
      .map((x) => x.n);
  }, [q, nodes, vIdx]);

  const go = (n: PageNode) => { setOpen(false); setQ(''); onOpen(n.id); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAt((i) => Math.min(i + 1, hits.length - 1)); setOpen(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAt((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && hits[at]) { e.preventDefault(); go(hits[at]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (<>
    <div className={`search${big ? ' big' : ''}`} role="search">
      <input type="search" value={q} placeholder={big ? '문서 검색 (예: 켄리아, 데인슬레이프)' : '문서 검색'} aria-label="문서 검색"
        role="combobox" aria-expanded={open && hits.length > 0} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && hits[at] ? `${listId}-${at}` : undefined}
        autoFocus={autoFocus} enterKeyHint="search"
        onChange={(e) => { setQ(e.target.value); setAt(0); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey} />
      {open && q && (
        <ul className="search-list" id={listId} role="listbox">
          {hits.length ? hits.map((n, i) => (
            <li key={n.id} id={`${listId}-${i}`} role="option" aria-selected={i === at}>
              <a href={hrefOf(n.id)} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setAt(i)}
                onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); go(n); }}>
                <b>{nameOf(n)}</b>
                <span>{n.hub ? '테마' : KIND_LABEL[n.kind]}{n.ko && <> · <span lang="en">{n.id}</span></>}</span>
              </a>
            </li>
          )) : !written.length && <li className="search-none">찾는 문서가 없습니다.</li>}
          {written.map((t) => (
            <li key={`w:${t}`} role="option" aria-selected={false}>
              <a href={hrefOf(t)} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); open2(t); }}>
                <b>{t}</b><span>독자가 쓴 문서</span>
              </a>
            </li>
          ))}
          {canWrite && !hits.length && (
            <li role="option" aria-selected={false}>
              <a href={hrefOf(title)} onMouseDown={(e) => e.preventDefault()} onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); open2(title); }}>
                <b>「{title}」 문서 쓰기</b><span>아직 없는 문서입니다</span>
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
    {newPage && <NewPage nodes={nodes} pub={pub} seed={title} big={big} onOpen={(t) => { setQ(''); onOpen(t); }} />}
  </>);
}

/** Bad title characters: they would break the page's address (`/wiki/<title>`) or look like wiki markup. */
const BAD_TITLE = /[<>[\]{}|#/?%]/;

/**
 * `＋ 새 문서`: a small box asking for the new page's title. An existing page (or one readers already
 * wrote) with that name opens instead; a new name opens the empty page, where the first paragraph is
 * written and sent for approval (WikiArticle → AddBlock, readerEdits.ts).
 */
function NewPage({ nodes, pub, seed, big, onOpen }: { nodes: PageNode[]; pub: Published | null; seed: string; big?: boolean; onOpen: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  const title = t.trim().replace(/\s+/g, ' ');
  const k = fold(title);
  // an existing page by either name, revealed or not (opening a hidden one says only that it is not revealed yet)
  const same = k ? nodes.find((n) => fold(nameOf(n)) === k || fold(n.id) === k) : undefined;
  const sameWritten = k && !same ? pub?.edits.find((e) => e.kind === 'page' && fold(e.page) === k)?.page : undefined;
  const problem = !title ? '' : title.length < 2 ? '두 글자 이상 써 주세요.' : title.length > 60 ? '60자까지 쓸 수 있습니다.'
    : BAD_TITLE.test(title) ? '제목에 < > [ ] { } | # / ? % 는 쓸 수 없습니다.' : '';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || problem) return;
    setOpen(false); setT('');
    onOpen(same ? same.id : sameWritten ?? title);
  };
  return (
    <div className={`newpage${big ? ' big' : ''}`} ref={box}>
      <button type="button" className="band" aria-expanded={open} onClick={() => { setOpen((o) => !o); setT(seed); }}>＋ 새 문서</button>
      {open && (
        <form className="newpage-box" onSubmit={submit}>
          <label>새 문서 제목
            <input type="text" value={t} autoFocus maxLength={80} placeholder="예: 몬드의 술 문화" onChange={(e) => setT(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }} />
          </label>
          <p className={`newpage-note${problem ? ' bad' : ''}`}>
            {problem || (same || sameWritten ? '이미 있는 문서입니다. 열어서 글을 보탤 수 있습니다.' : '제목을 정하면 첫 문단을 쓰는 화면이 열립니다. 보낸 글은 운영자가 확인한 뒤 공개됩니다.')}
          </p>
          <button type="submit" disabled={!title || !!problem}>{same || sameWritten ? '문서 열기' : '쓰기 시작'}</button>
        </form>
      )}
    </div>
  );
}
