// Article search over the theme's pages: Korean or English name, as you type. Used in the 3D view's
// header and, where the browser cannot draw 3D, as the whole front page (a search box in the
// middle, like an encyclopedia's portal). Pages not revealed at the chosen version are not found.
import { type KeyboardEvent, useId, useMemo, useState } from 'react';
import { KIND_LABEL, nameOf, type PageNode } from './lore';

export interface SearchProps {
  nodes: PageNode[];
  vIdx: number;
  hrefOf: (page: string) => string;
  onOpen: (page: string) => void;
  /** the large centred box of the front page */
  big?: boolean;
  autoFocus?: boolean;
}

const fold = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[\s·'’「」-]/g, '');

export function Search({ nodes, vIdx, hrefOf, onOpen, big, autoFocus }: SearchProps) {
  const [q, setQ] = useState('');
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState(false);
  const listId = useId();

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

  return (
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
          )) : <li className="search-none">찾는 문서가 없습니다.</li>}
        </ul>
      )}
    </div>
  );
}
