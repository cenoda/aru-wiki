import { type FormEvent, useEffect, useState } from 'react';

export type ReportCategory = 'order' | 'spoiler' | 'name' | 'other';

export interface ReportBoxProps {
  nodeId: string;
  version: string;
  edgeId?: string;
}

const CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: 'order', label: '순서 오류' },
  { id: 'spoiler', label: '스포일러(버전) 오류' },
  { id: 'name', label: '명칭 오류' },
  { id: 'other', label: '기타' },
];

type SubmitState = 'idle' | 'sending' | 'sent' | 'rate_limited' | 'offline';

const CSS = `
.site .report-box { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line); font-size: .82rem; }
.site .report-box.inline-edge { margin-top: 6px; padding-top: 0; border-top: 0; }
.site .report-trigger { margin: 0; padding: 0; background: none; border: 0; box-shadow: none; color: var(--muted);
  font: inherit; font-size: .78rem; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.site .report-trigger:hover { color: var(--text); }
.site .report-form { display: flex; flex-direction: column; gap: 8px; padding: 10px; background: var(--bg);
  border: 1px solid var(--line); border-radius: 2px; }
.site .report-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; color: var(--muted); font-size: .76rem; }
.site .report-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.site .report-chip { padding: 3px 8px; font: inherit; font-size: .76rem; font-weight: 500; color: var(--text);
  background: var(--card); border: 1px solid var(--line); border-radius: 2px; cursor: pointer; box-shadow: none; }
.site .report-chip:hover { border-color: var(--gold); }
.site .report-chip[aria-pressed="true"] { border-color: var(--gold); background: var(--gold-soft); font-weight: 600; }
.site .report-input { width: 100%; padding: 5px 8px; font: inherit; font-size: .8rem; color: var(--text);
  background: var(--card); border: 1px solid var(--line); border-radius: 2px; box-sizing: border-box; }
.site .report-input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }
.site .report-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.site .report-actions button { padding: 4px 10px; font-size: .78rem; border-radius: 2px; }
.site .report-actions button.cancel { background: var(--card); color: var(--muted); box-shadow: inset 0 0 0 1px var(--line); }
.site .report-actions button.cancel:hover { color: var(--text); }
.site .report-msg { margin: 0; font-size: .78rem; color: var(--good); }
.site .report-msg.warn { color: var(--warn); }
`;

export function ReportBox({ nodeId, version, edgeId }: ReportBoxProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>('order');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<SubmitState>('idle');

  useEffect(() => {
    setOpen(false);
    setCategory('order');
    setComment('');
    setState('idle');
  }, [nodeId, edgeId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    const payload = {
      nodeId,
      ...(edgeId ? { edgeId } : {}),
      version,
      category,
      ...(comment.trim() ? { comment: comment.trim().slice(0, 200) } : {}),
    };
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        setState('rate_limited');
        return;
      }
      if (!res.ok) {
        setState('offline');
        return;
      }
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!data?.ok) {
        setState('offline');
        return;
      }
      setState('sent');
      setOpen(false);
      setComment('');
    } catch {
      setState('offline');
    }
  };

  return (
    <div className={`report-box${edgeId ? ' inline-edge' : ''}`}>
      <style>{CSS}</style>
      {state === 'sent' ? (
        <p className="report-msg" role="status">
          알려 주셔서 감사합니다. 익명으로 접수되었습니다.
        </p>
      ) : !open ? (
        <button type="button" className="report-trigger" onClick={() => { setOpen(true); setState('idle'); }}>
          틀린 곳 알려 주기
        </button>
      ) : (
        <form className="report-form" onSubmit={submit}>
          <div className="report-head">
            <span>익명 오류 제보</span>
            <span>{version} 기준</span>
          </div>
          <div className="report-chips" role="group" aria-label="오류 유형">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="report-chip"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="report-input"
            maxLength={200}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="간단한 설명 (선택, 개인정보 입력 불필요)"
            aria-label="오류 설명 (선택)"
          />
          {state === 'rate_limited' && (
            <p className="report-msg warn" role="alert">
              단시간에 많은 제보가 접수되었습니다. 잠시 후 다시 시도해 주세요.
            </p>
          )}
          {state === 'offline' && (
            <p className="report-msg warn" role="alert">
              지금은 제보 서버에 연결할 수 없습니다. (로컬 개발 환경이거나 점검 중입니다)
            </p>
          )}
          <div className="report-actions">
            <button type="button" className="cancel" onClick={() => { setOpen(false); setState('idle'); }}>
              취소
            </button>
            <button type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? '보내는 중…' : '보내기'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ReportBox;
