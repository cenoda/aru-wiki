import { useEffect, useRef, useState } from 'react';
import { versions } from './data';

/** "N.N까지 공개" picker with previous/next steps. Shared by the 2D and 3D views. */
export function VersionPicker({ order, onChange }: { order: number; onChange: (order: number) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = versions.find((v) => v.order === order) ?? versions[versions.length - 1];
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (e.target instanceof globalThis.Node && !root.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    root.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const step = (next: number) => { onChange(next); setOpen(false); };
  return (
    <div className="version" ref={root}>
      <button type="button" className="band step" aria-label="이전 버전" disabled={order <= 0} onClick={() => step(order - 1)}>‹</button>
      <button type="button" className="band now" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((v) => !v)}>
        {current.id}까지 공개
      </button>
      <button type="button" className="band step" aria-label="다음 버전" disabled={order >= versions.length - 1} onClick={() => step(order + 1)}>›</button>
      {open && (
        <ul role="listbox" aria-label="공개 버전">
          {[...versions].reverse().map((x) => (
            <li key={x.id}>
              <button type="button" role="option" aria-selected={x.order === order} onClick={() => step(x.order)}>{x.id}까지 공개</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
