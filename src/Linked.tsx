// Inline links to other articles inside written text, the way wiki articles link a name where it
// first appears. Names are matched as written (the Korean name, or the English one when a page has
// none). Only pages already revealed at the chosen version are linked, so a link never names a page
// the reader should not see yet. Each page is linked once per `seen` set: the caller decides the
// scope (one set per card, or per article section).
// Red links (Wikipedia's links to pages not written yet): names that `red` lists, each from the version
// of its first story, open the empty page where its first paragraph is written. `written` titles (pages
// only readers wrote) link like any page.
import { type MouseEvent, type ReactNode, useMemo, useRef } from 'react';
import { nameOf, type PageNode, type RedName } from './lore';

export interface Linker {
  /** text with the first mention of each page linked; `seen` is updated with the pages linked */
  (text: string, seen: Set<string>): ReactNode;
}

const WORD_CHAR = /[가-힣A-Za-z0-9]/;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A linker for the pages revealed at `vIdx`, except `self` (a page does not link to itself).
 * `hrefOf` gives the address (for new-tab clicks); a plain click calls `onOpen`.
 * `red` names revealed at `vIdx` become red links; `written` titles (shown at `vIdx`) ordinary links.
 */
export function useLinker(nodes: PageNode[] | undefined, vIdx: number, self: string | null,
  hrefOf: (page: string) => string, onOpen: (page: string) => void,
  red?: readonly RedName[] | null, written?: readonly string[]): Linker {
  // the callbacks change on every render of the caller; the links read the latest through refs
  const cb = useRef({ hrefOf, onOpen });
  cb.current = { hrefOf, onOpen };
  return useMemo(() => {
    const names = new Map<string, string>();
    for (const n of nodes ?? []) {
      if (n.revealed > vIdx || n.id === self) continue;
      const name = nameOf(n);
      // two letters at least: a one-letter name would match inside ordinary words
      if (name.length >= 2 && !names.has(name)) names.set(name, n.id);
      // "켄리아의 「오대 죄인」" is usually written just 「오대 죄인」
      const quoted = name.match(/「[^」]+」/)?.[0];
      if (quoted && quoted !== name && !names.has(quoted)) names.set(quoted, n.id);
    }
    const isRed = new Set<string>();
    // a name a page already uses (revealed or not) is never red: it is that page's, hidden or linked above
    const taken = new Set((nodes ?? []).flatMap((n) => (n.ko ? [n.ko, n.id] : [n.id])));
    if (self !== null) taken.add(self);
    for (const t of written ?? []) if (t.length >= 2 && !taken.has(t) && !names.has(t)) names.set(t, t);
    for (const [name, at] of red ?? []) {
      if (at > vIdx || taken.has(name) || names.has(name)) continue;
      names.set(name, name);
      isRed.add(name);
    }
    if (!names.size) return (text: string) => text;
    // longest first, so 심연 교단 wins over 심연
    const re = new RegExp([...names.keys()].sort((a, b) => b.length - a.length).map(escape).join('|'), 'g');
    const click = (id: string) => (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      cb.current.onOpen(id);
    };
    return (text: string, seen: Set<string>) => {
      const out: ReactNode[] = [];
      let at = 0;
      for (const m of text.matchAll(re)) {
        const id = names.get(m[0])!;
        const i = m.index;
        // a whole word at its start: not the tail of a longer word (particles after it are fine)
        if (seen.has(id) || (i > 0 && WORD_CHAR.test(text[i - 1]))) continue;
        seen.add(id);
        if (i > at) out.push(text.slice(at, i));
        out.push(isRed.has(id)
          ? <a key={i} className="wl wl-red" href={cb.current.hrefOf(id)} onClick={click(id)} title={`「${id}」 문서는 아직 없습니다. 눌러서 첫 문단을 써 주세요.`}>{m[0]}</a>
          : <a key={i} className="wl" href={cb.current.hrefOf(id)} onClick={click(id)}>{m[0]}</a>);
        at = i + m[0].length;
      }
      if (!out.length) return text;
      if (at < text.length) out.push(text.slice(at));
      return out;
    };
  }, [nodes, vIdx, self, red, written]);
}
