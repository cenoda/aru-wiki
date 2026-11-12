// The site's one search box: articles (Korean or English name) and quests (acts, series, events and
// the quests in them, questSearch.ts), as you type. Used in the 3D view's header, the quest map's
// header and, where the browser cannot draw 3D, as the whole front page (a search box in the middle,
// like an encyclopedia's portal). Nothing not revealed at the chosen version is found.
import { type FormEvent, Fragment, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { versions } from './data';
import { KIND_LABEL, nameOf, type PageNode, type Theme } from './lore';
import { focusUrl, questHits } from './questSearch';
import { loadPublished, type Published } from './readerEdits';
import themeUrl from '../data/runtime/theme-khaenriah.json?url';
import pagesUrl from '../data/runtime/pages.json?url';
import './search.css';

export interface SearchProps {
  nodes: PageNode[];
  vIdx: number;
  hrefOf: (page: string) => string;
  onOpen: (page: string) => void;
  /** open an act or unit on the quest map; without it a quest hit is a link to the quest map */
  onQuest?: (id: string) => void;
  /** the large centred box of the front page */
  big?: boolean;
  autoFocus?: boolean;
  /** the `＋ 새 문서` button beside the box (on unless false) */
  newPage?: boolean;
  className?: string;
}

/** Every page with an article, for a view that does not load the theme itself (the quest map). */
export async function loadSearchNodes(): Promise<PageNode[]> {
  const get = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  const [theme, extra] = await Promise.all([get(themeUrl) as Promise<Theme>, get(pagesUrl).catch(() => []) as Promise<PageNode[]>]);
  const ids = new Set(theme.nodes.map((n) => n.id));
  return [...theme.nodes, ...extra.filter((n) => !ids.has(n.id))];
}

const fold = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s·'’「」-]/g, '');
/** a plain left click (others open the link in a new tab or window as usual) */
const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** One row of the list: what it shows, where it links, what a plain click or Enter does. */
interface Row { key: string; href: string; go: () => void; body: ReactNode; className?: string; head?: string }

export function Search({ nodes, vIdx, hrefOf, onOpen, onQuest, big, autoFocus, newPage = true, className }: SearchProps) {
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
  const done = () => { setOpen(false); setQ(''); };

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
      .slice(0, 6)
      .map((x) => x.n);
  }, [q, nodes, vIdx]);
  const quests = useMemo(() => questHits(q, vIdx, hits.length ? 6 : 8), [q, vIdx, hits.length]);

  // articles first, then quests, then pages readers wrote, then the offer to write a new page
  const rows: Row[] = [
    ...hits.map((n): Row => ({
      key: n.id, href: hrefOf(n.id), go: () => { done(); onOpen(n.id); },
      body: <><b>{nameOf(n)}</b><span>{n.hub ? '테마' : KIND_LABEL[n.kind]}{n.ko && <> · <span lang="en">{n.id}</span></>}</span></>,
    })),
    ...quests.map((h, i): Row => ({
      key: `q:${h.key}`, href: `/${focusUrl(h.target)}`, head: i === 0 && hits.length ? '임무' : undefined,
      className: `quest ${h.cls}${h.unit ? ' unit' : ''}`,
      go: () => { done(); if (onQuest) onQuest(h.target); else location.assign(`/${focusUrl(h.target)}`); },
      body: <><i className="dot" /><b>{h.name}</b><span>{h.note}{h.version && <> · {h.version}</>}</span></>,
    })),
    ...written.map((t): Row => ({ key: `w:${t}`, href: hrefOf(t), go: () => { done(); onOpen(t); }, body: <><b>{t}</b><span>독자가 쓴 문서</span></> })),
    ...(canWrite && !hits.length ? [{
      key: 'new', href: hrefOf(title), go: () => { done(); onOpen(title); },
      body: <><b>「{title}」 문서 쓰기</b><span>아직 없는 문서입니다</span></>,
    }] : []),
  ];
  const sel = Math.min(at, rows.length - 1);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAt(Math.min(sel + 1, rows.length - 1)); setOpen(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setAt(Math.max(sel - 1, 0)); }
    else if (e.key === 'Enter' && rows[sel]) { e.preventDefault(); rows[sel].go(); }
    else if (e.key === 'Escape') { if (open && q) setOpen(false); else { setQ(''); (e.target as HTMLInputElement).blur(); } }
  };

  return (<>
    <div className={`search${big ? ' big' : ''}${className ? ` ${className}` : ''}`} role="search">
      <input type="search" value={q} placeholder={big ? '문서·임무 검색 (예: 켄리아, 데인슬레이프, 마신 임무)' : '문서·임무 검색'} aria-label="문서·임무 검색"
        role="combobox" aria-expanded={open && rows.length > 0} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && rows[sel] ? `${listId}-${sel}` : undefined}
        autoFocus={autoFocus} enterKeyHint="search"
        onChange={(e) => { setQ(e.target.value); setAt(0); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey} />
      {open && q && (
        <ul className="search-list" id={listId} role="listbox">
          {rows.length ? rows.map((r, i) => (<Fragment key={r.key}>
            {r.head && <li className="search-head" role="presentation">{r.head}</li>}
            <li id={`${listId}-${i}`} role="option" aria-selected={i === sel} className={r.className}>
              <a href={r.href} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setAt(i)}
                onClick={(e) => { if (!plain(e)) return; e.preventDefault(); r.go(); }}>{r.body}</a>
            </li>
          </Fragment>)) : <li className="search-none">찾는 문서나 임무가 없습니다.</li>}
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
