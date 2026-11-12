// Readers writing on article pages without an account: fix a paragraph, add one to a section, or
// propose a new page. What is sent waits for the operator (scripts/suggest/review.mjs); until then
// only the writer's own browser shows it, marked "검토 중" (src/readerEdits.ts).
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  type Draft, dropMine, type EditKind, type Human, loadPublished, mine, type Mine, type Published, savedNick, send, type SendResult, settleMine, titleKey,
} from './readerEdits';
import './suggest.css';

const MAX = 1500;
const KIND_KO: Record<EditKind, string> = { edit: '문단 고치기', add: '글 보태기', page: '새 문서' };

/** Published reader text and this browser's waiting suggestions. */
export function useReaderEdits(): { pub: Published | null; own: Mine[] } {
  const [pub, setPub] = useState<Published | null>(null);
  const own = useSyncExternalStore(mine.subscribe, mine.get);
  useEffect(() => { let live = true; loadPublished().then((p) => { if (live) { settleMine(p); setPub(p); } }); return () => { live = false; }; }, []);
  return { pub, own };
}

/** The mark after a paragraph a reader wrote or changed. */
export function HumanMark({ h }: { h: Human }) {
  if (h.pending) return <span className="sg-mark pending" title="보낸 제안입니다. 운영자가 확인하기 전까지 이 브라우저에서만 보입니다.">검토 중 · 나만 보임</span>;
  const who = h.nick ? `${h.nick} 님` : '독자';
  const tip = [`${who}이 ${h.kind === 'edit' ? '고친' : '쓴'} 글입니다. 운영자가 확인해 실었습니다.`, h.evidence && `근거: ${h.evidence}`, h.date && `${h.date}`].filter(Boolean).join(' · ');
  return <span className="sg-mark" title={tip}>{h.kind === 'edit' ? '독자 수정' : '독자 작성'}{h.nick ? ` · ${h.nick}` : ''}</span>;
}

export interface Target { kind: EditKind; page: string; v: string; from?: string; section?: string | null; orig?: string }

const RESULT: Record<Exclude<SendResult, 'sent'>, string> = {
  rate_limited: '짧은 시간에 여러 번 보냈습니다. 한 시간쯤 뒤에 다시 보내 주세요.',
  queue_full: '오늘은 제안이 많이 쌓여 더 받지 못합니다. 내일 다시 보내 주세요.',
  offline: '지금은 서버에 연결할 수 없습니다. 쓴 글은 그대로 두었으니 잠시 뒤 다시 보내 주세요.',
  rejected: '보낼 수 없는 글입니다. 글이 비었거나 너무 길지 않은지, 바뀐 곳이 있는지 확인해 주세요.',
};

/** The form: text, optional evidence and nickname, and the two promises (own writing, licence). */
export function SuggestForm({ target, onClose }: { target: Target; onClose: () => void }) {
  const [text, setText] = useState(target.kind === 'edit' ? target.orig ?? '' : '');
  const [evidence, setEvidence] = useState('');
  const [nick, setNick] = useState(savedNick);
  const [own, setOwn] = useState(false);
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | Exclude<SendResult, 'sent'>>('idle');
  const opened = useRef(Date.now());
  const pasted = useRef(false);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { area.current?.focus(); }, []);

  // what is sent is what will be published: one paragraph for an edit, blank-line paragraphs otherwise
  const tidy = target.kind === 'edit' ? text.replace(/\s+/g, ' ').trim() : text.split(/\n+/).map((p) => p.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n\n');
  const n = [...tidy].length;
  const unchanged = target.kind === 'edit' && tidy === (target.orig ?? '').replace(/\s+/g, ' ').trim();
  const ready = n >= 2 && n <= MAX && !unchanged && own && agree && state !== 'sending';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setState('sending');
    const d: Draft = { ...target, text: tidy, evidence, nick, website, hint: { paste: pasted.current, ms: Date.now() - opened.current } };
    const r = await send(d);
    if (r === 'sent') onClose(); else setState(r);
  };

  return (
    <form className="sg-form" onSubmit={submit}>
      <p className="sg-head"><b>{target.kind === 'page' ? `「${target.page}」 문서 쓰기` : target.kind === 'edit' ? '문단 고치기' : target.section ? `「${target.section}」에 글 보태기` : '글 보태기'}</b><span>{target.v}까지의 내용만</span></p>
      <textarea ref={area} value={text} rows={target.kind === 'edit' ? 6 : 5} maxLength={MAX * 2} aria-label="글"
        placeholder={target.kind === 'edit' ? '' : '해석, 떡밥, 여담도 좋습니다. 문단은 빈 줄로 나눕니다.'}
        onChange={(e) => setText(e.target.value)} onPaste={() => { pasted.current = true; }} />
      <p className={`sg-count${n > MAX ? ' over' : ''}`}>{n.toLocaleString()} / {MAX.toLocaleString()}자</p>
      <input type="text" value={evidence} maxLength={300} onChange={(e) => setEvidence(e.target.value)}
        placeholder="근거 (선택): 어느 임무·책·대사에서 나오나요? 적어 주면 빨리 실립니다" aria-label="근거 (선택)" />
      <input type="text" className="sg-nick" value={nick} maxLength={20} onChange={(e) => setNick(e.target.value)}
        placeholder="닉네임 (선택, 글 옆에 표시)" aria-label="닉네임 (선택)" autoComplete="off" />
      {/* only bots fill this */}
      <input type="text" className="sg-hp" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="sg-check"><input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
        <span>제가 직접 쓴 글입니다. 나무위키 등 다른 사이트의 문장이나 게임 원문을 옮겨 붙이지 않았습니다.</span></label>
      <label className="sg-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>이 글을 <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ko" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>으로 배포하는 데 동의합니다.</span></label>
      <p className="sg-note">운영자가 확인한 뒤에 다른 사람에게 보입니다. 그 전에는 이 브라우저에서만 보입니다. {target.v} 뒤에 나온 이야기(스포일러), 유출·미공개 내용, 개인정보는 쓰지 말아 주세요. 주소(IP)는 저장하지 않습니다.</p>
      {state !== 'idle' && state !== 'sending' && <p className="sg-msg warn" role="alert">{RESULT[state]}</p>}
      {unchanged && n > 0 && <p className="sg-msg">고칠 곳을 바꿔 주세요.</p>}
      <div className="sg-actions">
        <button type="button" className="secondary" onClick={onClose}>취소</button>
        <button type="submit" disabled={!ready}>{state === 'sending' ? '보내는 중…' : '보내기'}</button>
      </div>
    </form>
  );
}

/** A paragraph with its reader mark, a pencil to fix it, and the form when open. */
export function ParaBlock({ className, children, h, edit }: { className?: string; children: ReactNode; h?: Human; edit?: Target }) {
  const [open, setOpen] = useState(false);
  // a paragraph that is itself waiting, or was added (not tied to one article version), is not edited again
  const can = edit && (!h || (h.kind === 'edit' && !h.pending));
  return (
    <>
      <p className={`${className ?? ''}${h ? ` sg-human${h.pending ? ' pending' : ''}` : ''}`.trim() || undefined}>
        {children}
        {h && <HumanMark h={h} />}
        {can && !open && <button type="button" className="sg-pencil" onClick={() => setOpen(true)} title="이 문단 고치기" aria-label="이 문단 고치기">✎</button>}
      </p>
      {can && open && <SuggestForm target={edit} onClose={() => setOpen(false)} />}
    </>
  );
}

/** The line that opens the form for adding a paragraph or proposing a page. */
export function AddBlock({ target, label, big }: { target: Target; label: string; big?: boolean }) {
  const [open, setOpen] = useState(false);
  if (open) return <SuggestForm target={target} onClose={() => setOpen(false)} />;
  return <p className={`sg-add${big ? ' big' : ''}`}><button type="button" className={big ? undefined : 'link'} onClick={() => setOpen(true)}>{label}</button></p>;
}

/** This browser's suggestions for the page: waiting ones, and ones that were not taken (with the reason). */
export function MySuggestions({ page }: { page: string }) {
  const own = useSyncExternalStore(mine.subscribe, mine.get);
  const list = useMemo(() => own.filter((e) => titleKey(e.page) === titleKey(page)), [own, page]);
  if (!list.length) return null;
  return (
    <section className="sg-mine" aria-label="내가 보낸 제안">
      <h2>내가 보낸 제안</h2>
      <p className="wa-muted wa-small">이 브라우저에 저장된 기록입니다. 실리면 목록에서 사라지고 글 옆에 「독자 수정」·「독자 작성」 표시가 붙습니다.</p>
      <ul>
        {list.map((e) => (
          <li key={e.id}>
            <span className={`sg-state${e.settled ? ' no' : ''}`}>{e.settled ? '실리지 않음' : '검토 중'}</span>
            <span>{KIND_KO[e.kind]}{e.section ? ` · ${e.section}` : ''} · {e.sent.slice(0, 10)} · <code>{e.id}</code></span>
            {e.settled && <span className="wa-muted"> {e.note ? `사유: ${e.note}` : '사유가 적히지 않았습니다.'}</span>}
            {e.settled && <button type="button" className="link" onClick={() => dropMine(e.id)}>지우기</button>}
            <span className="sg-mine-text">{e.text.length > 120 ? `${e.text.slice(0, 120)}…` : e.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
